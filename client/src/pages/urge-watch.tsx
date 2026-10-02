import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Camera,
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  HeartPulse,
  Moon,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wind,
} from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { EstimatorComparisonCard } from "@/components/urge-watch/estimator-comparison";
import {
  assessReading,
  buildUrgeCsv,
  estimatePpgBetter,
  estimatePulse,
  estimateVitalLensPos,
  getBaseline,
  getLatestLabel,
  getVulnerabilityHours,
  readUrgeDataset,
  summarizeMotion,
  URGE_WATCH_KEY,
  writeUrgeDataset,
  type CaptureMode,
  type MotionLevel,
  type BrightnessSample,
  type EstimatorComparison,
  type RedSample,
  type RgbSample,
  type UrgeDataset,
  type UrgeLabel,
  type UrgeReading,
} from "@/lib/urge-watch";

const CAPTURE_SECONDS = 45;

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatHour(hour: string) {
  const [rawHour] = hour.split(":");
  const value = Number(rawHour);
  return `${value % 12 || 12} ${value < 12 ? "AM" : "PM"}`;
}

function localDayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDayKey(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: typeof HeartPulse;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{unit}</p>
    </div>
  );
}

function LineChart({
  title,
  values,
  unit,
}: {
  title: string;
  values: Array<{ label: string; value: number }>;
  unit: string;
}) {
  if (!values.length) {
    return (
      <div className="rounded-2xl border border-border bg-background p-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-4 text-sm text-muted-foreground">Your readings will appear here.</p>
      </div>
    );
  }
  const numbers = values.map((point) => point.value);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const spread = max - min || 1;
  const points = values.map((point, index) => ({
    ...point,
    x: values.length === 1 ? 150 : 14 + (index / (values.length - 1)) * 272,
    y: 88 - ((point.value - min) / spread) * 64,
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <svg
        className="mt-3 h-28 w-full overflow-visible"
        viewBox="0 0 300 110"
        role="img"
        aria-label={`${title} trend: ${points.map((point) => `${point.label} ${point.value} ${unit}`).join(", ")}`}
      >
        <line x1="10" y1="94" x2="290" y2="94" stroke="hsl(var(--border))" strokeWidth="1" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="3.5" fill="hsl(var(--primary))">
            <title>{`${point.label}: ${point.value} ${unit}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}

function BreathingGuide() {
  const phases = [
    { label: "Breathe in", seconds: 4, shape: "scale-110" },
    { label: "Hold gently", seconds: 7, shape: "scale-110" },
    { label: "Breathe out", seconds: 8, shape: "scale-90" },
  ];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [seconds, setSeconds] = useState(phases[0].seconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current > 1) return current - 1;
        setPhaseIndex((index) => (index + 1) % phases.length);
        return phases[(phaseIndex + 1) % phases.length].seconds;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phaseIndex, phases.length]);

  const phase = phases[phaseIndex];
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#d9b9aa] bg-card p-5">
      <div className="grid h-32 w-32 place-items-center">
        <div
          className={`grid h-24 w-24 place-items-center rounded-full border-2 border-[#9e5c49] bg-[#f7ebe6] text-[#442a23] transition-transform duration-1000 ease-in-out ${phase.shape}`}
        >
          <Wind className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
      <p className="text-sm font-semibold text-[#442a23]" aria-live="polite">{phase.label}</p>
      <p className="mt-1 text-xs text-[#69443a]">{seconds} seconds · 4–7–8 breathing</p>
    </div>
  );
}

export default function UrgeWatch() {
  const [, navigate] = useLocation();
  const [dataset, setDataset] = useState<UrgeDataset>(() => readUrgeDataset());
  const [sleepHours, setSleepHours] = useState("7");
  const [sleepQuality, setSleepQuality] = useState("3");
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeCaptureMode, setActiveCaptureMode] = useState<CaptureMode>("finger");
  const [remainingSeconds, setRemainingSeconds] = useState(CAPTURE_SECONDS);
  const [cameraError, setCameraError] = useState("");
  const [sensorNote, setSensorNote] = useState("");
  const [latestEstimate, setLatestEstimate] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isStartingCapture, setIsStartingCapture] = useState(false);
  const [labelSaved, setLabelSaved] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(10 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [supportDraft, setSupportDraft] = useState(() => readUrgeDataset().supportNumber);
  const [referenceDrafts, setReferenceDrafts] = useState<Record<string, string>>({});
  const [comparisonMessage, setComparisonMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const captureModeRef = useRef<CaptureMode>("finger");
  const activeRef = useRef(false);
  const samplesRef = useRef<RedSample[]>([]);
  const brightnessSamplesRef = useRef<BrightnessSample[]>([]);
  const rgbSamplesRef = useRef<RgbSample[]>([]);
  const motionDeltasRef = useRef<number[]>([]);
  const previousMotionRef = useRef<number | null>(null);
  const captureRunRef = useRef(0);
  const startPendingRef = useRef(false);
  const motionHandlerRef = useRef<(event: DeviceMotionEvent) => void>(() => {});
  const motionAttachedRef = useRef(false);

  const collectMotion = useCallback((event: DeviceMotionEvent) => {
    const acceleration = event.acceleration || event.accelerationIncludingGravity;
    if (acceleration?.x == null || acceleration.y == null || acceleration.z == null) return;
    let magnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
    if (magnitude < 4) magnitude *= 9.81;
    const previous = previousMotionRef.current;
    if (previous !== null) {
      motionDeltasRef.current.push(Math.abs(magnitude - previous));
      if (motionDeltasRef.current.length > 2000) motionDeltasRef.current.shift();
    }
    previousMotionRef.current = magnitude;
  }, []);
  motionHandlerRef.current = collectMotion;

  useEffect(() => {
    writeUrgeDataset(dataset);
  }, [dataset]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const releaseSensors = useCallback(() => {
    activeRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (countdownRef.current !== null) window.clearInterval(countdownRef.current);
    frameRef.current = null;
    countdownRef.current = null;
    if (motionAttachedRef.current) {
      window.removeEventListener("devicemotion", motionHandlerRef.current);
      motionAttachedRef.current = false;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const context = canvasRef.current?.getContext("2d");
    context?.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);
    samplesRef.current = [];
    brightnessSamplesRef.current = [];
    rgbSamplesRef.current = [];
    motionDeltasRef.current = [];
    previousMotionRef.current = null;
    lastVideoTimeRef.current = -1;
  }, []);

  useEffect(() => () => {
    captureRunRef.current++;
    startPendingRef.current = false;
    releaseSensors();
  }, [releaseSensors]);

  const readings = useMemo(
    () => [...dataset.readings].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt)),
    [dataset.readings],
  );
  const latestReading = readings[0];
  const baseline = useMemo(() => getBaseline(dataset.readings), [dataset.readings]);
  const assessment = useMemo(
    () => latestReading ? assessReading(latestReading, dataset.readings, dataset.labels) : null,
    [latestReading, dataset.readings, dataset.labels],
  );
  const vulnerabilityHours = useMemo(() => getVulnerabilityHours(dataset.labels), [dataset.labels]);
  const labelledReadings = useMemo(
    () => dataset.readings.filter((reading) => getLatestLabel(reading.id, dataset.labels)).length,
    [dataset.readings, dataset.labels],
  );

  const requestMotionPermission = useCallback(async () => {
    const motionConstructor = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<PermissionState>;
    };
    if (typeof motionConstructor.requestPermission === "function") {
      const permission = await motionConstructor.requestPermission();
      if (permission !== "granted") return false;
    }
    window.addEventListener("devicemotion", motionHandlerRef.current);
    motionAttachedRef.current = true;
    return true;
  }, []);

  const finishCapture = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    const capturedSamples = samplesRef.current;
    const capturedBrightnessSamples = brightnessSamplesRef.current;
    const capturedMotionDeltas = motionDeltasRef.current;
    samplesRef.current = [];
    brightnessSamplesRef.current = [];
    motionDeltasRef.current = [];
    const duration = (performance.now() - startedAtRef.current) / 1000;
    releaseSensors();
    setIsCapturing(false);
    setIsStartingCapture(false);
    setTorchEnabled(false);
    setRemainingSeconds(0);

    const orbitEstimate = estimatePulse(capturedSamples, duration);
    const ppgBetterEstimate = estimatePpgBetter(capturedBrightnessSamples);
    const recordedAt = new Date().toISOString();
    const comparison: EstimatorComparison = {
      id: newId(),
      recordedAt,
      orbitBpm: orbitEstimate.quality === "good" ? orbitEstimate.bpm : null,
      orbitQuality: orbitEstimate.quality,
      ppgBetterBpm: ppgBetterEstimate.bpm,
      ppgBetterPeakCount: ppgBetterEstimate.peakCount,
      ppgBetterReason: ppgBetterEstimate.reason,
      referenceBpm: null,
    };
    const difference = comparison.orbitBpm !== null && comparison.ppgBetterBpm !== null
      ? Math.abs(comparison.orbitBpm - comparison.ppgBetterBpm)
      : null;
    const resultText = `Same-capture comparison — Orbit: ${comparison.orbitBpm === null ? "no estimate" : `${comparison.orbitBpm} BPM`}; PPGbetter: ${comparison.ppgBetterBpm === null ? "no estimate" : `${comparison.ppgBetterBpm} BPM`}${difference === null ? "" : `; gap ${difference} BPM`}.`;
    const motionIndex = capturedMotionDeltas.length
      ? Math.sqrt(capturedMotionDeltas.reduce((sum, value) => sum + value ** 2, 0) / capturedMotionDeltas.length)
      : null;
    const motionLevel: MotionLevel = summarizeMotion(motionIndex);
    const reading: UrgeReading | null = orbitEstimate.quality === "good"
      ? {
          id: newId(),
          recordedAt,
          bpm: orbitEstimate.bpm,
          hrvMs: orbitEstimate.hrvMs,
          motionLevel,
          motionIndex: motionIndex === null ? null : Number(motionIndex.toFixed(2)),
          sleepHours: Number(sleepHours),
          sleepQuality: Number(sleepQuality),
          sampleCount: capturedSamples.length,
        }
      : null;
    setDataset((current) => ({
      ...current,
      comparisons: [comparison, ...current.comparisons],
      readings: reading ? [reading, ...current.readings] : current.readings,
    }));
    setLatestEstimate(resultText);
    setCameraError(orbitEstimate.quality !== "good" && ppgBetterEstimate.bpm === null
      ? `Neither method returned a pulse estimate. Orbit: ${orbitEstimate.reason} PPGbetter: ${ppgBetterEstimate.reason}`
      : "");
    setSensorNote(reading
      ? motionLevel === "unknown"
        ? "Orbit reading saved. Motion sensors were unavailable; this reading has no motion context."
        : `Orbit reading saved. Motion context: ${motionLevel}.`
      : "Comparison saved. Orbit did not add this capture to its baseline because its signal was noisy.");
    setLabelSaved("");
  }, [releaseSensors, sleepHours, sleepQuality]);

  const startCapture = useCallback(async () => {
    if (startPendingRef.current || activeRef.current) return;
    if (Number.isNaN(Number(sleepHours)) || Number(sleepHours) < 0 || Number(sleepHours) > 12) {
      setCameraError("Enter sleep between 0 and 12 hours before starting.");
      return;
    }
    if (Number.isNaN(Number(sleepQuality)) || Number(sleepQuality) < 1 || Number(sleepQuality) > 5) {
      setCameraError("Choose a sleep quality from 1 to 5 before starting.");
      return;
    }
    const captureRun = ++captureRunRef.current;
    startPendingRef.current = true;
    setIsStartingCapture(true);
    setCameraError("");
    setLatestEstimate("");
    setSensorNote("");
    setRemainingSeconds(CAPTURE_SECONDS);
    samplesRef.current = [];
    brightnessSamplesRef.current = [];
    motionDeltasRef.current = [];
    previousMotionRef.current = null;

    try {
      let motionGranted = false;
      try {
        motionGranted = await requestMotionPermission();
      } catch {
        motionGranted = false;
      }
      if (captureRun !== captureRunRef.current) {
        releaseSensors();
        return;
      }
      if (!motionGranted) {
        setSensorNote("Motion permission is unavailable. Pulse capture can continue without it.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access. Open Orbit over HTTPS on your phone.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      });
      if (captureRun !== captureRunRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        releaseSensors();
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      let hasTorch = false;
      try {
        const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        hasTorch = Boolean(capabilities.torch);
        if (hasTorch) {
          await track.applyConstraints({
            advanced: [{ torch: true } as MediaTrackConstraintSet],
          });
        }
      } catch {
        hasTorch = false;
      }
      if (captureRun !== captureRunRef.current) {
        releaseSensors();
        return;
      }
      setTorchEnabled(hasTorch);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (captureRun !== captureRunRef.current) {
        releaseSensors();
        return;
      }
      motionDeltasRef.current = [];
      previousMotionRef.current = null;
      startedAtRef.current = performance.now();
      activeRef.current = true;
      startPendingRef.current = false;
      setIsStartingCapture(false);
      setIsCapturing(true);
      if (!motionGranted) setSensorNote("Motion permission is unavailable. Pulse capture can continue without it.");

      const sampleFrame = () => {
        if (!activeRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { willReadFrequently: true });
        if (
          video &&
          canvas &&
          context &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.currentTime !== lastVideoTimeRef.current
        ) {
          lastVideoTimeRef.current = video.currentTime;
          canvas.width = 48;
          canvas.height = 36;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let redTotal = 0;
          let brightnessTotal = 0;
          const pixelCount = pixels.length / 4;
          for (let i = 0; i < pixels.length; i += 4) {
            redTotal += pixels[i];
            brightnessTotal += pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          }
          const timeMs = performance.now() - startedAtRef.current;
          samplesRef.current.push({
            timeMs,
            red: redTotal / pixelCount,
          });
          brightnessSamplesRef.current.push({
            timeMs,
            brightness: brightnessTotal / pixelCount,
          });
        }
        frameRef.current = requestAnimationFrame(sampleFrame);
      };
      frameRef.current = requestAnimationFrame(sampleFrame);
      countdownRef.current = window.setInterval(() => {
        const elapsed = (performance.now() - startedAtRef.current) / 1000;
        const remaining = Math.max(0, Math.ceil(CAPTURE_SECONDS - elapsed));
        setRemainingSeconds(remaining);
        if (elapsed >= CAPTURE_SECONDS) finishCapture();
      }, 200);
    } catch (error) {
      if (captureRun !== captureRunRef.current) {
        releaseSensors();
        return;
      }
      startPendingRef.current = false;
      setIsStartingCapture(false);
      releaseSensors();
      setIsCapturing(false);
      setTorchEnabled(false);
      const detail = error instanceof Error ? error.message : "Camera access was not available.";
      setCameraError(detail.includes("Permission") || detail.includes("NotAllowed")
        ? "Camera access was blocked. Allow camera access in your browser settings, then try again."
        : detail);
    }
  }, [finishCapture, releaseSensors, requestMotionPermission, sleepHours, sleepQuality]);

  const stopCapture = useCallback(() => {
    captureRunRef.current++;
    startPendingRef.current = false;
    releaseSensors();
    setIsCapturing(false);
    setIsStartingCapture(false);
    setTorchEnabled(false);
    setRemainingSeconds(CAPTURE_SECONDS);
  }, [releaseSensors]);

  const addLabel = useCallback((label: UrgeLabel) => {
    const event = {
      id: newId(),
      recordedAt: new Date().toISOString(),
      label,
      readingId: latestReading?.id || null,
    };
    setDataset((current) => ({ ...current, labels: [event, ...current.labels] }));
    setLabelSaved(label === "urge"
      ? "Urge noted. This is a moment of information, not a setback."
      : "Calm check-in saved. Thanks for adding the positive example.");
  }, [latestReading?.id]);

  const saveSupportNumber = useCallback(() => {
    setDataset((current) => ({ ...current, supportNumber: supportDraft.trim() }));
    setSensorNote("Your support contact is saved only on this device.");
  }, [supportDraft]);

  const downloadCsv = useCallback(() => {
    const blob = new Blob([buildUrgeCsv(dataset)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orbit-urge-watch-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [dataset]);

  const saveComparisonReference = useCallback((comparisonId: string) => {
    const value = Number(referenceDrafts[comparisonId]);
    if (!Number.isFinite(value) || value < 35 || value > 220) {
      setComparisonMessage("Enter a reference pulse between 35 and 220 BPM.");
      return;
    }
    setDataset((current) => ({
      ...current,
      comparisons: current.comparisons.map((comparison) => comparison.id === comparisonId
        ? { ...comparison, referenceBpm: Math.round(value) }
        : comparison),
    }));
    setComparisonMessage("Reference saved on this device.");
  }, [referenceDrafts]);

  const deleteData = useCallback(() => {
    if (!window.confirm("Delete all UrgeWatch readings, labels, estimator comparisons, reference pulse values, and the saved support number from this device? This cannot be undone.")) return;
    stopCapture();
    localStorage.removeItem(URGE_WATCH_KEY);
    const empty: UrgeDataset = { readings: [], labels: [], supportNumber: "", comparisons: [] };
    setDataset(empty);
    setSupportDraft("");
    setLabelSaved("");
    setReferenceDrafts({});
    setComparisonMessage("");
    setLatestEstimate("");
    setCameraError("");
    setTimerRunning(false);
    setTimerSeconds(10 * 60);
  }, [stopCapture]);

  const chartReadings = [...readings].slice(0, 14).reverse();
  const bpmPoints = chartReadings.map((reading) => ({
    label: new Date(reading.recordedAt).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
    value: reading.bpm,
  }));
  const hrvPoints = chartReadings.map((reading) => ({
    label: new Date(reading.recordedAt).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
    value: reading.hrvMs,
  }));
  const urgeCounts = dataset.labels.reduce((counts, event) => {
    const date = localDayKey(event.recordedAt);
    counts.set(date, { urge: counts.get(date)?.urge || 0, calm: counts.get(date)?.calm || 0 });
    const day = counts.get(date)!;
    day[event.label] += 1;
    return counts;
  }, new Map<string, { urge: number; calm: number }>());
  const urgeDays = Array.from(urgeCounts.entries()).slice(0, 7).reverse();
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  const latestLabel = latestReading ? getLatestLabel(latestReading.id, dataset.labels) : undefined;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-5 py-7 pb-36 sm:px-8">
        <header className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="min-tap -ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Orbit · self-awareness</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">UrgeWatch</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Notice body patterns alongside what you are feeling. This is a personal reflection tool, not a diagnosis or medical measurement.
            </p>
          </div>
          <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary sm:grid">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
        </header>

        <div className="mt-6 flex gap-3 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            Readings stay in this browser on this device. Camera pulse estimates can be inaccurate and should never guide medical decisions or replace support from a qualified professional.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <Card className="rounded-[26px] border-border bg-card shadow-sm">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Camera className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">45-second check-in</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">Camera pulse estimate</h2>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-[#222520]">
                <video
                  ref={videoRef}
                  className={`aspect-video max-h-60 w-full object-cover ${isCapturing ? "block" : "hidden"}`}
                  muted
                  playsInline
                  aria-label="Live rear camera preview for fingertip pulse capture"
                />
                {!isCapturing && (
                  <div className="grid aspect-[16/7] min-h-32 place-items-center px-6 text-center text-sm text-[#ffffff]">
                    <div>
                      <Camera className="mx-auto mb-2 h-6 w-6 text-white/70" aria-hidden="true" />
                    Rear camera stays off until you start a check-in.
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Sit still, cover the rear camera lens and flash with your fingertip, and keep gentle pressure for the full reading.
              </p>
              {torchEnabled && (
                <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary">
                  <Check className="h-4 w-4" aria-hidden="true" /> Camera light enabled
                </p>
              )}
              {isCapturing && !torchEnabled && (
                <p className="mt-2 text-xs text-muted-foreground" role="status">
                  This browser could not confirm the camera light is on. The reading may be too faint; you can cancel and try a supported phone browser.
                </p>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sleep-hours" className="mb-2 block text-sm font-medium">Hours slept last night</label>
                  <input
                    id="sleep-hours"
                    type="number"
                    disabled={isCapturing || isStartingCapture}
                    min="0"
                    max="12"
                    step="0.5"
                    inputMode="decimal"
                    value={sleepHours}
                    onChange={(event) => setSleepHours(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="sleep-quality" className="mb-2 block text-sm font-medium">Sleep quality · 1–5</label>
                  <select
                    id="sleep-quality"
                    disabled={isCapturing || isStartingCapture}
                    value={sleepQuality}
                    onChange={(event) => setSleepQuality(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="1">1 · Very poor</option>
                    <option value="2">2 · Poor</option>
                    <option value="3">3 · Okay</option>
                    <option value="4">4 · Good</option>
                    <option value="5">5 · Very good</option>
                  </select>
                </div>
              </div>

              {isCapturing ? (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Keep holding still</span>
                    <span className="font-semibold tabular-nums">{remainingSeconds}s remaining</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" aria-label={`${CAPTURE_SECONDS - remainingSeconds} of ${CAPTURE_SECONDS} seconds captured`}>
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200"
                      style={{ width: `${((CAPTURE_SECONDS - remainingSeconds) / CAPTURE_SECONDS) * 100}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={stopCapture}
                    className="min-tap mt-4 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Cancel reading
                  </button>
                </div>
              ) : isStartingCapture ? (
                <div className="mt-5 rounded-xl border border-border bg-secondary p-4">
                  <p className="text-sm font-medium" role="status">Waiting for camera access…</p>
                  <button
                    type="button"
                    onClick={stopCapture}
                    className="min-tap mt-3 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    Cancel camera request
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCapture}
                  className="min-tap mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:border-[#3f6250] hover:bg-[#3f6250]"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Start 45-second check-in
                </button>
              )}
              {cameraError && (
                <div className="mt-4 flex gap-2 rounded-xl border border-[#d9b9aa] bg-[#f7ebe6] p-3 text-sm text-[#69443a]" role="alert">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{cameraError}</span>
                </div>
              )}
              {sensorNote && <p className="mt-3 text-xs text-muted-foreground" role="status">{sensorNote}</p>}
              {latestEstimate && <p className="mt-3 text-xs text-primary" role="status">{latestEstimate}</p>}
            </CardContent>
          </Card>

          <div className="grid content-start gap-5">
            <Card className="rounded-[26px] border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest reading</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {latestReading ? formatDateTime(latestReading.recordedAt) : "No readings yet"}
                    </p>
                  </div>
                  <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                {latestReading ? (
                  <>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <StatCard label="Pulse" value={String(latestReading.bpm)} unit="estimated BPM" icon={HeartPulse} />
                      <StatCard label="HRV" value={String(latestReading.hrvMs)} unit="RMSSD · ms" icon={Activity} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                        <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                        Motion: {latestReading.motionLevel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                        Sleep: {latestReading.sleepHours}h · {latestReading.sleepQuality}/5
                      </span>
                    </div>
                    {assessment && (
                      <div className={`mt-5 rounded-2xl border p-4 ${
                        assessment.level === "high"
                          ? "border-[#d9b9aa] bg-[#f7ebe6] text-[#442a23]"
                          : "border-border bg-background text-foreground"
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {assessment.level === "high"
                              ? "Pause and check in"
                              : assessment.level === "exercise"
                                ? "Activity context"
                                : assessment.level === "insufficient"
                                  ? "Building your baseline"
                                  : "Personal pattern check"}
                          </p>
                          <span className="rounded-full bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                            {assessment.stage === "model" ? "Personal model" : assessment.stage === "rules" ? "Baseline rules" : "Learning"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{assessment.explanation}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {assessment.labelledCount}/30 labeled readings · {assessment.baselineCount} baseline readings
                          {assessment.accuracy !== undefined
                            ? ` · ${Math.round(assessment.accuracy * 100)}% cross-validation accuracy`
                            : ""}
                        </p>
                        {assessment.level === "high" && (
                          <button
                            type="button"
                            onClick={() => document.getElementById("urge-support")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                            className="min-tap mt-4 rounded-xl border border-[#9e5c49] bg-[#9e5c49] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#874c3c]"
                          >
                            Open a guided reset
                          </button>
                        )}
                        {assessment.level === "exercise" && (
                          <p className="mt-2 text-[11px] text-muted-foreground">This is an activity note, not an urge indicator.</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-4">
                    <p className="text-sm font-medium">Your first reading starts your personal baseline.</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Baseline comparisons need at least three check-ins. They describe patterns, not health or relapse risk.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[26px] border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Add context</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">How is this moment?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    These labels help compare your own patterns over time.
                  </p>
                </div>
                {latestReading && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Linked to latest check-in · {formatDateTime(latestReading.recordedAt)}
                    {latestLabel ? ` · latest label: ${latestLabel}` : ""}
                  </p>
                )}
                {!latestReading && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    No camera reading yet; your timestamped label will be saved without vitals.
                  </p>
                )}
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => addLabel("urge")}
                    className="min-tap rounded-xl border border-[#d9b9aa] bg-[#f7ebe6] px-4 py-3.5 text-sm font-semibold text-[#69443a] transition-colors hover:bg-[#f0dfd7]"
                  >
                    I have an urge
                  </button>
                  <button
                    type="button"
                    onClick={() => addLabel("calm")}
                    className="min-tap rounded-xl border border-[#cbd8cf] bg-[#eef3ef] px-4 py-3.5 text-sm font-semibold text-[#355340] transition-colors hover:bg-[#e4ede6]"
                  >
                    Check-in was calm
                  </button>
                </div>
                {labelSaved && <p className="mt-3 text-xs text-primary" role="status">{labelSaved}</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        {assessment?.level === "high" && (
          <section id="urge-support" className="mt-5 scroll-mt-6" aria-labelledby="support-title">
            <Card className="rounded-[26px] border-[#d9b9aa] bg-[#f7ebe6] shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ead3c8] text-[#9e5c49]">
                    <Wind className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a4a3c]">A gentle pause</p>
                    <h2 id="support-title" className="mt-1 text-xl font-semibold tracking-tight text-[#442a23]">
                      Let the urge pass without deciding right now
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#69443a]">
                      A pattern flag is not a prediction. Try one breathing cycle, wait with the feeling, or reach out to someone you trust.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <BreathingGuide />
                  <div className="rounded-2xl border border-[#d9b9aa] bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Urge-surfing timer</p>
                        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">
                          {minutes}:{seconds}
                        </p>
                      </div>
                      <Clock3 className="h-6 w-6 text-[#9e5c49]" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      Ten minutes is a suggestion, not a test. Pause or stop whenever you want.
                    </p>
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTimerRunning((running) => !running)}
                        disabled={timerSeconds === 0}
                        className="min-tap inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#9e5c49] bg-[#9e5c49] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#874c3c] disabled:opacity-60"
                      >
                        {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {timerRunning ? "Pause" : timerSeconds === 0 ? "Complete" : "Start"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTimerRunning(false); setTimerSeconds(10 * 60); }}
                        aria-label="Reset urge-surfing timer"
                        className="min-tap grid h-11 w-11 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-secondary"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-[#d9b9aa] bg-card p-5">
                  <label htmlFor="support-number" className="block text-sm font-semibold text-[#442a23]">
                    Support person’s phone number
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">Saved only on this device. Orbit will open your messaging app; it will not send a message automatically.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="support-number"
                      type="tel"
                      autoComplete="tel"
                      value={supportDraft}
                      onChange={(event) => setSupportDraft(event.target.value)}
                      placeholder="Add a number with country code"
                      className="min-h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={saveSupportNumber}
                      className="min-tap rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                    >
                      Save number
                    </button>
                    {dataset.supportNumber && (
                      <a
                        href={`sms:${encodeURIComponent(dataset.supportNumber)}`}
                        className="min-tap inline-flex items-center justify-center rounded-xl border border-[#9e5c49] bg-[#9e5c49] px-4 py-3 text-sm font-semibold text-white hover:bg-[#874c3c]"
                      >
                        Text support person
                      </a>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#69443a]">
                  If you may be in immediate danger, contact local emergency services or a trusted person now.
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="mt-8" aria-labelledby="patterns-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your data</p>
              <h2 id="patterns-title" className="mt-1 text-xl font-semibold tracking-tight">Patterns over time</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Personal 14-day baseline · {baseline.count} readings
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCsv}
                className="min-tap inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={deleteData}
                className="min-tap inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete my data
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatCard label="Baseline pulse" value={baseline.count ? baseline.bpmMean.toFixed(0) : "—"} unit={baseline.count ? `BPM · ±${baseline.bpmStd.toFixed(1)} recent variation` : "need more readings"} icon={HeartPulse} />
            <StatCard label="Baseline HRV" value={baseline.count ? baseline.hrvMean.toFixed(0) : "—"} unit={baseline.count ? `RMSSD ms · ±${baseline.hrvStd.toFixed(1)} recent variation` : "need more readings"} icon={Activity} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <LineChart title="Pulse" values={bpmPoints} unit="BPM" />
            <LineChart title="HRV (RMSSD)" values={hrvPoints} unit="ms" />
          </div>

          <Card className="mt-3 rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Urge labels by time of day</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Descriptive counts from the labels you entered; not a forecast.</p>
                  {vulnerabilityHours.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {vulnerabilityHours.map((item) => (
                        <li key={item.hour} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground">
                          {formatHour(item.hour)} · {item.count} {item.count === 1 ? "urge" : "urges"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <CircleHelp className="h-4 w-4" aria-hidden="true" />
                      Add an urge label to start noticing time patterns.
                    </p>
                  )}
                </div>
              </div>
              {urgeDays.length > 0 && (
                <div className="mt-5 flex min-h-24 items-end gap-2 border-t border-border pt-4">
                  {urgeDays.map(([day, counts]) => {
                    const total = counts.urge + counts.calm;
                    const maxTotal = Math.max(1, ...urgeDays.map(([, entry]) => entry.urge + entry.calm));
                    return (
                      <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${day}: ${counts.urge} urges, ${counts.calm} calm labels`}>
                        <div className="flex h-16 w-full items-end justify-center gap-1">
                          <div className="w-3 rounded-t bg-[#9e5c49]" style={{ height: `${Math.max(counts.urge ? 8 : 0, (counts.urge / maxTotal) * 56)}px` }} />
                          <div className="w-3 rounded-t bg-primary" style={{ height: `${Math.max(counts.calm ? 8 : 0, (counts.calm / maxTotal) * 56)}px` }} />
                        </div>
                        <span className="w-full truncate text-center text-[10px] text-muted-foreground">{formatDayKey(day)}</span>
                        <span className="sr-only">{total} total labels</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {urgeDays.length > 0 && (
                <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#9e5c49]" />Urge</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Calm</span>
                </div>
              )}
            </CardContent>
          </Card>

          <EstimatorComparisonCard
            comparisons={dataset.comparisons}
            referenceDrafts={referenceDrafts}
            message={comparisonMessage}
            onReferenceChange={(id, value) => setReferenceDrafts((current) => ({ ...current, [id]: value }))}
            onSaveReference={saveComparisonReference}
          />

          <Card className="mt-3 rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Personal pattern engine</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Starts with baseline rules. At 30 linked labels (including both urge and calm examples), a small in-browser random forest is used instead. Nothing is sent to a server.
                  </p>
                </div>
                <span className="mt-2 shrink-0 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground sm:mt-0">
                  {labelledReadings}/30 labeled
                </span>
              </div>
              {assessment?.accuracy !== undefined && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Five-fold cross-validation accuracy: {Math.round(assessment.accuracy * 100)}%. This estimate can vary with a small personal dataset.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-3 rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold">Recent urge and calm logs</h3>
              <p className="mt-1 text-xs text-muted-foreground">Each entry keeps its own timestamp, including labels made without a camera reading.</p>
              {dataset.labels.length ? (
                <ul className="mt-3 space-y-2">
                  {dataset.labels.slice(0, 8).map((event) => (
                    <li key={event.id} className="flex flex-col gap-1 rounded-xl border border-border bg-background px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-medium">{event.label === "urge" ? "I have an urge" : "Check-in was calm"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.recordedAt)} · {event.readingId ? "linked to a camera reading" : "no camera reading"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Your timestamped labels will appear here.</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-3 space-y-2">
            <h3 className="px-1 text-sm font-semibold">Recent check-ins</h3>
            {readings.length ? readings.slice(0, 8).map((reading) => {
              const label = getLatestLabel(reading.id, dataset.labels);
              return (
                <div key={reading.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatDateTime(reading.recordedAt)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reading.bpm} BPM · {reading.hrvMs} ms HRV · {reading.motionLevel} motion · {reading.sleepHours}h sleep
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    label === "urge"
                      ? "bg-[#f7ebe6] text-[#69443a]"
                      : label === "calm"
                        ? "bg-[#eef3ef] text-[#355340]"
                        : "bg-secondary text-muted-foreground"
                  }`}>
                    {label || "Not labeled"}
                  </span>
                </div>
              );
            }) : (
              <p className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                No readings yet. Start a 45-second camera check-in to begin.
              </p>
            )}
          </div>
        </section>

        <div className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            UrgeWatch stores readings, estimator comparisons, and any reference pulse values in this browser only. Clearing site data or changing devices removes access to these records. Export a CSV first if you want a separate copy.
          </p>
        </div>

      </div>
      <AppNav />
    </div>
  );
}