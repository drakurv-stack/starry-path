export const URGE_WATCH_KEY = "orbit:urge-watch:v1";

export type MotionLevel = "low" | "medium" | "high" | "unknown";
export type UrgeLabel = "urge" | "calm";

export interface RedSample {
  timeMs: number;
  red: number;
}

export interface UrgeReading {
  id: string;
  recordedAt: string;
  bpm: number;
  hrvMs: number;
  motionLevel: MotionLevel;
  motionIndex: number | null;
  sleepHours: number;
  sleepQuality: number;
  sampleCount: number;
}

export interface UrgeLabelEvent {
  id: string;
  recordedAt: string;
  label: UrgeLabel;
  readingId: string | null;
}

export interface UrgeDataset {
  readings: UrgeReading[];
  labels: UrgeLabelEvent[];
  supportNumber: string;
}

export interface SignalEstimate {
  bpm: number;
  hrvMs: number;
  quality: "good" | "noisy";
  reason: string;
}

export interface Baseline {
  count: number;
  bpmMean: number;
  bpmStd: number;
  hrvMean: number;
  hrvStd: number;
}

export interface RiskAssessment {
  stage: "rules" | "model" | "insufficient";
  level: "high" | "exercise" | "lower" | "insufficient";
  explanation: string;
  probability?: number;
  accuracy?: number;
  labelledCount: number;
  baselineCount: number;
  sleepAdjusted?: boolean;
}

const DEFAULT_DATASET: UrgeDataset = { readings: [], labels: [], supportNumber: "" };
const DAY_MS = 24 * 60 * 60 * 1000;

export function readUrgeDataset(): UrgeDataset {
  try {
    const parsed = JSON.parse(localStorage.getItem(URGE_WATCH_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_DATASET };
    return {
      readings: Array.isArray(parsed.readings) ? parsed.readings : [],
      labels: Array.isArray(parsed.labels) ? parsed.labels : [],
      supportNumber: typeof parsed.supportNumber === "string" ? parsed.supportNumber : "",
    };
  } catch {
    return { ...DEFAULT_DATASET };
  }
}

export function writeUrgeDataset(dataset: UrgeDataset) {
  localStorage.setItem(URGE_WATCH_KEY, JSON.stringify(dataset));
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

function biquad(
  input: number[],
  sampleRate: number,
  kind: "lowpass" | "highpass",
  cutoff: number,
) {
  const omega = (2 * Math.PI * cutoff) / sampleRate;
  const cosine = Math.cos(omega);
  const alpha = Math.sin(omega) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b0 = kind === "lowpass" ? (1 - cosine) / 2 : (1 + cosine) / 2;
  const b1 = kind === "lowpass" ? 1 - cosine : -(1 + cosine);
  const b2 = b0;
  const a1 = (-2 * cosine) / a0;
  const a2 = (1 - alpha) / a0;
  const normalizedB0 = b0 / a0;
  const normalizedB1 = b1 / a0;
  const normalizedB2 = b2 / a0;
  let z1 = 0;
  let z2 = 0;

  return input.map((value) => {
    const output = normalizedB0 * value + z1;
    z1 = normalizedB1 * value - a1 * output + z2;
    z2 = normalizedB2 * value - a2 * output;
    return output;
  });
}

export function estimatePulse(samples: RedSample[], captureDurationSeconds: number): SignalEstimate {
  const ordered = [...samples].sort((a, b) => a.timeMs - b.timeMs);
  if (ordered.length < 150 || captureDurationSeconds < 40) {
    return { bpm: 0, hrvMs: 0, quality: "noisy", reason: "Too few camera frames were captured. Hold still and try again." };
  }

  const sampleRate = 20;
  const firstTime = ordered[0].timeMs;
  const lastTime = ordered[ordered.length - 1].timeMs;
  const count = Math.floor(((lastTime - firstTime) / 1000) * sampleRate);
  if (count < 700) {
    return { bpm: 0, hrvMs: 0, quality: "noisy", reason: "The camera signal was interrupted. Hold still and try again." };
  }

  const resampled: number[] = [];
  let sourceIndex = 0;
  for (let i = 0; i < count; i++) {
    const timeMs = firstTime + (i / sampleRate) * 1000;
    while (sourceIndex < ordered.length - 2 && ordered[sourceIndex + 1].timeMs < timeMs) {
      sourceIndex++;
    }
    const left = ordered[sourceIndex];
    const right = ordered[Math.min(sourceIndex + 1, ordered.length - 1)];
    const span = right.timeMs - left.timeMs;
    const fraction = span > 0 ? (timeMs - left.timeMs) / span : 0;
    resampled.push(left.red + (right.red - left.red) * fraction);
  }

  const centered = resampled.map((value) => value - average(resampled));
  const filtered = biquad(biquad(centered, sampleRate, "highpass", 0.7), sampleRate, "lowpass", 4);
  const amplitude = standardDeviation(filtered);
  if (!Number.isFinite(amplitude) || amplitude < 0.15) {
    return { bpm: 0, hrvMs: 0, quality: "noisy", reason: "The pulse signal was too faint. Cover the camera and flash fully, then retry." };
  }

  const threshold = amplitude * 0.2;
  const minimumGap = Math.floor(sampleRate * 0.34);
  const peaks: number[] = [];
  for (let i = 1; i < filtered.length - 1; i++) {
    if (
      filtered[i] > threshold &&
      filtered[i] >= filtered[i - 1] &&
      filtered[i] > filtered[i + 1] &&
      (!peaks.length || i - peaks[peaks.length - 1] >= minimumGap)
    ) {
      peaks.push(i);
    }
  }

  const intervals = peaks.slice(1).map((peak, i) => (peak - peaks[i]) / sampleRate);
  const plausible = intervals.filter((interval) => interval >= 0.35 && interval <= 1.7);
  const plausibleRatio = intervals.length ? plausible.length / intervals.length : 0;
  const intervalMean = average(plausible);
  const intervalCv = intervalMean ? standardDeviation(plausible) / intervalMean : Infinity;
  if (plausible.length < 8 || plausibleRatio < 0.8 || intervalCv > 0.3) {
    return {
      bpm: 0,
      hrvMs: 0,
      quality: "noisy",
      reason: "Movement or uneven light made this reading unreliable. Keep your hand still and retry.",
    };
  }

  const bpm = Math.round(60 / intervalMean);
  const successiveDifferences = plausible.slice(1).map((interval, i) => (interval - plausible[i]) * 1000);
  const hrvMs = Math.round(Math.sqrt(average(successiveDifferences.map((difference) => difference ** 2))));
  if (bpm < 35 || bpm > 170 || !Number.isFinite(hrvMs)) {
    return { bpm: 0, hrvMs: 0, quality: "noisy", reason: "The pulse estimate fell outside the reliable range. Rest briefly and try again." };
  }

  return { bpm, hrvMs, quality: "good", reason: "Reading captured. These camera estimates are for self-awareness only." };
}

export function summarizeMotion(index: number | null): MotionLevel {
  if (index === null || !Number.isFinite(index)) return "unknown";
  if (index < 1.2) return "low";
  if (index < 3.5) return "medium";
  return "high";
}

export function getLatestLabel(readingId: string, labels: UrgeLabelEvent[]) {
  return [...labels]
    .filter((event) => event.readingId === readingId)
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0]?.label;
}

export function getBaseline(readings: UrgeReading[], before?: string): Baseline {
  const cutoff = before ? Date.parse(before) : Date.now() + 1;
  const windowStart = cutoff - 14 * DAY_MS;
  const eligible = readings.filter((reading) => {
    const time = Date.parse(reading.recordedAt);
    return time < cutoff && time >= windowStart;
  });
  const bpms = eligible.map((reading) => reading.bpm);
  const hrvs = eligible.map((reading) => reading.hrvMs);
  return {
    count: eligible.length,
    bpmMean: average(bpms),
    bpmStd: standardDeviation(bpms),
    hrvMean: average(hrvs),
    hrvStd: standardDeviation(hrvs),
  };
}

function motionNumber(reading: UrgeReading) {
  if (reading.motionLevel === "low") return 0;
  if (reading.motionLevel === "high") return 2;
  if (reading.motionLevel === "unknown") return 1.5;
  return 1;
}

function featuresFor(reading: UrgeReading, readings: UrgeReading[]) {
  const baseline = getBaseline(readings, reading.recordedAt);
  const bpmSigma = Math.max(baseline.bpmStd, 4);
  const hrvSigma = Math.max(baseline.hrvStd, 8);
  const date = new Date(reading.recordedAt);
  const hour = date.getHours() + date.getMinutes() / 60;
  const angle = (2 * Math.PI * hour) / 24;
  return [
    reading.bpm,
    reading.hrvMs,
    motionNumber(reading),
    reading.sleepHours,
    Math.sin(angle),
    Math.cos(angle),
    (reading.bpm - baseline.bpmMean) / bpmSigma,
    (baseline.hrvMean - reading.hrvMs) / hrvSigma,
  ];
}

interface TrainingRow {
  features: number[];
  label: number;
}

interface TreeNode {
  probability: number;
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function gini(rows: TrainingRow[]) {
  if (!rows.length) return 0;
  const positive = rows.reduce((sum, row) => sum + row.label, 0) / rows.length;
  return 1 - positive ** 2 - (1 - positive) ** 2;
}

function trainTree(rows: TrainingRow[], depth: number, random: () => number): TreeNode {
  const probability = rows.reduce((sum, row) => sum + row.label, 0) / Math.max(rows.length, 1);
  const leaf: TreeNode = { probability };
  if (depth >= 4 || rows.length < 6 || probability === 0 || probability === 1) return leaf;

  const featureIds = rows[0].features.map((_, index) => index);
  for (let i = featureIds.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [featureIds[i], featureIds[j]] = [featureIds[j], featureIds[i]];
  }

  const parentGini = gini(rows);
  let bestGain = 0.015;
  let bestFeature = -1;
  let bestThreshold = 0;

  for (const feature of featureIds.slice(0, 3)) {
    const values = Array.from(new Set(rows.map((row) => row.features[feature]))).sort((a, b) => a - b);
    if (values.length < 2) continue;
    const candidateCount = Math.min(14, values.length - 1);
    const candidates = Array.from({ length: candidateCount }, (_, i) => {
      const position = Math.floor(((i + 1) * (values.length - 1)) / (candidateCount + 1));
      return (values[position] + values[position + 1]) / 2;
    });

    for (const threshold of candidates) {
      const left = rows.filter((row) => row.features[feature] <= threshold);
      const right = rows.length - left.length;
      if (left.length < 2 || right < 2) continue;
      const rightRows = rows.filter((row) => row.features[feature] > threshold);
      const gain = parentGini
        - (left.length / rows.length) * gini(left)
        - (rightRows.length / rows.length) * gini(rightRows);
      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = feature;
        bestThreshold = threshold;
      }
    }
  }

  if (bestFeature < 0) return leaf;
  return {
    probability,
    feature: bestFeature,
    threshold: bestThreshold,
    left: trainTree(rows.filter((row) => row.features[bestFeature] <= bestThreshold), depth + 1, random),
    right: trainTree(rows.filter((row) => row.features[bestFeature] > bestThreshold), depth + 1, random),
  };
}

function predictTree(tree: TreeNode, features: number[]): number {
  if (tree.feature === undefined || !tree.left || !tree.right || tree.threshold === undefined) {
    return tree.probability;
  }
  return predictTree(features[tree.feature] <= tree.threshold ? tree.left : tree.right, features);
}

function trainForest(rows: TrainingRow[], seed: number, treeCount = 11) {
  const random = makeRandom(seed);
  return Array.from({ length: treeCount }, () => {
    const bootstrap = Array.from({ length: rows.length }, () => rows[Math.floor(random() * rows.length)]);
    return trainTree(bootstrap, 0, random);
  });
}

function predictForest(forest: TreeNode[], features: number[]) {
  return average(forest.map((tree) => predictTree(tree, features)));
}

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function crossValidatedAccuracy(rows: TrainingRow[]) {
  const folds = 5;
  const shuffledRows = shuffled(rows, makeRandom(719));
  let correct = 0;
  let tested = 0;
  for (let fold = 0; fold < folds; fold++) {
    const test = shuffledRows.filter((_, index) => index % folds === fold);
    const train = shuffledRows.filter((_, index) => index % folds !== fold);
    if (new Set(train.map((row) => row.label)).size < 2) continue;
    const forest = trainForest(train, 203 + fold, 7);
    for (const row of test) {
      const predicted = predictForest(forest, row.features) >= 0.5 ? 1 : 0;
      if (predicted === row.label) correct++;
      tested++;
    }
  }
  return tested ? correct / tested : undefined;
}

function labeledRows(readings: UrgeReading[], labels: UrgeLabelEvent[]): TrainingRow[] {
  return readings.flatMap((reading) => {
    const label = getLatestLabel(reading.id, labels);
    if (!label) return [];
    return [{ features: featuresFor(reading, readings), label: label === "urge" ? 1 : 0 }];
  });
}

export function assessReading(
  reading: UrgeReading,
  readings: UrgeReading[],
  labels: UrgeLabelEvent[],
): RiskAssessment {
  const rows = labeledRows(readings, labels);
  const classes = new Set(rows.map((row) => row.label));
  const baseline = getBaseline(readings, reading.recordedAt);
  if (rows.length >= 30 && classes.size === 2) {
    const accuracy = crossValidatedAccuracy(rows);
    const forest = trainForest(rows, 851, 13);
    const probability = predictForest(forest, featuresFor(reading, readings));
    const level = probability >= 0.65 ? "high" : "lower";
    return {
      stage: "model",
      level,
      explanation: level === "high"
        ? "This reading resembles some of your past urge-labeled patterns."
        : "This reading is not strongly similar to your past urge-labeled patterns.",
      probability,
      accuracy,
      labelledCount: rows.length,
      baselineCount: baseline.count,
    };
  }

  if (baseline.count < 3) {
    return {
      stage: "insufficient",
      level: "insufficient",
      explanation: "Add a few more check-ins to build a personal 14-day baseline.",
      labelledCount: rows.length,
      baselineCount: baseline.count,
    };
  }

  const sleepAdjusted = reading.sleepHours < 6;
  const deviation = sleepAdjusted ? 0.75 : 1;
  const bpmThreshold = baseline.bpmMean + Math.max(baseline.bpmStd, 4) * deviation;
  const hrvThreshold = baseline.hrvMean - Math.max(baseline.hrvStd, 8) * deviation;

  if (reading.bpm > bpmThreshold && reading.motionLevel === "high") {
    return {
      stage: "rules",
      level: "exercise",
      explanation: "Higher pulse with higher motion can fit activity; it is not counted as an urge pattern.",
      labelledCount: rows.length,
      baselineCount: baseline.count,
      sleepAdjusted,
    };
  }

  if (
    reading.bpm > bpmThreshold &&
    reading.hrvMs < hrvThreshold &&
    reading.motionLevel === "low"
  ) {
    return {
      stage: "rules",
      level: "high",
      explanation: sleepAdjusted
        ? "This differs from your recent baseline. Short sleep slightly lowered the comparison thresholds."
        : "This differs from your recent baseline. Pause and check in with how you feel.",
      labelledCount: rows.length,
      baselineCount: baseline.count,
      sleepAdjusted,
    };
  }

  return {
    stage: "rules",
    level: "lower",
    explanation: "No strong change from your personal baseline was found in this reading.",
    labelledCount: rows.length,
    baselineCount: baseline.count,
    sleepAdjusted,
  };
}

export function getVulnerabilityHours(labels: UrgeLabelEvent[]) {
  const counts = new Map<number, number>();
  labels.filter((event) => event.label === "urge").forEach((event) => {
    const hour = new Date(event.recordedAt).getHours();
    counts.set(hour, (counts.get(hour) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));
}

export function buildUrgeCsv(dataset: UrgeDataset) {
  const quote = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const header = [
    "event",
    "timestamp",
    "reading_id",
    "label",
    "bpm",
    "hrv_rmssd_ms",
    "motion",
    "motion_index",
    "sleep_hours",
    "sleep_quality",
  ];
  const rows = dataset.labels.map((event) => {
    const reading = dataset.readings.find((item) => item.id === event.readingId);
    return [
      "label",
      event.recordedAt,
      event.readingId,
      event.label,
      reading?.bpm ?? null,
      reading?.hrvMs ?? null,
      reading?.motionLevel ?? null,
      reading?.motionIndex ?? null,
      reading?.sleepHours ?? null,
      reading?.sleepQuality ?? null,
    ].map(quote).join(",");
  });
  dataset.readings.forEach((reading) => {
    if (dataset.labels.some((event) => event.readingId === reading.id)) return;
    rows.push([
      "check-in",
      reading.recordedAt,
      reading.id,
      null,
      reading.bpm,
      reading.hrvMs,
      reading.motionLevel,
      reading.motionIndex,
      reading.sleepHours,
      reading.sleepQuality,
    ].map(quote).join(","));
  });
  return [header.map(quote).join(","), ...rows].join("\r\n");
}