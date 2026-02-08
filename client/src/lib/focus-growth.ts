
export type FocusStage = "spark" | "ember" | "flame" | "laser" | "zen" | "master";

export interface FocusGrowthData {
  xpTotal: number;
  level: number;
  stage: FocusStage;
  stageProgress: number;
  milestonesUnlocked: string[];
  weeklyFocusMinutes: { [weekKey: string]: number };
  weeklyDistractionsDefeated: { [weekKey: string]: number };
}

export const MILESTONES = [
  { id: "first_control", threshold: 10, title: "First Control", desc: "You resisted 10 distractions. Your focus is taking root." },
  { id: "resistance_up", threshold: 50, title: "Resistance Up", desc: "50 distractions defeated. Your mental shield is strengthening." },
  { id: "focus_identity", threshold: 100, title: "Focus Identity", desc: "100 distractions defeated. Focus is no longer a task, it's who you are." },
  { id: "deep_work", threshold: 250, title: "Deep Work", desc: "250 distractions defeated. You can now enter the flow state at will." },
  { id: "mastery", threshold: 500, title: "Mastery", desc: "500 distractions defeated. Absolute control over your attention." },
];

export const STAGES: { stage: FocusStage; minLevel: number; maxLevel: number }[] = [
  { stage: "spark", minLevel: 1, maxLevel: 1 },
  { stage: "ember", minLevel: 2, maxLevel: 3 },
  { stage: "flame", minLevel: 4, maxLevel: 6 },
  { stage: "laser", minLevel: 7, maxLevel: 10 },
  { stage: "zen", minLevel: 11, maxLevel: 15 },
  { stage: "master", minLevel: 16, maxLevel: 999 },
];

export const INITIAL_GROWTH: FocusGrowthData = {
  xpTotal: 0,
  level: 1,
  stage: "spark",
  stageProgress: 0,
  milestonesUnlocked: [],
  weeklyFocusMinutes: {},
  weeklyDistractionsDefeated: {},
};

export function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
}

export function calculateLevelData(xpTotal: number) {
  const level = Math.floor(xpTotal / 50) + 1;
  const xpInCurrentLevel = xpTotal % 50;
  
  const stageInfo = STAGES.find(s => level >= s.minLevel && level <= s.maxLevel) || STAGES[STAGES.length - 1];
  
  let stageProgress = 0;
  if (stageInfo.stage === "master") {
    stageProgress = 1;
  } else {
    const totalLevelsInStage = stageInfo.maxLevel - stageInfo.minLevel + 1;
    const currentLevelInStage = level - stageInfo.minLevel;
    stageProgress = (currentLevelInStage + (xpInCurrentLevel / 50)) / totalLevelsInStage;
  }

  return { level, stage: stageInfo.stage, stageProgress };
}

export function loadFocusGrowth(): FocusGrowthData {
  const raw = localStorage.getItem("focus_growth_v1");
  if (!raw) return INITIAL_GROWTH;
  try {
    return { ...INITIAL_GROWTH, ...JSON.parse(raw) };
  } catch {
    return INITIAL_GROWTH;
  }
}

export function saveFocusGrowth(data: FocusGrowthData) {
  localStorage.setItem("focus_growth_v1", JSON.stringify(data));
}

export function addXP(amount: number) {
  const data = loadFocusGrowth();
  const oldLevel = data.level;
  data.xpTotal += amount;
  
  const { level, stage, stageProgress } = calculateLevelData(data.xpTotal);
  data.level = level;
  data.stage = stage;
  data.stageProgress = stageProgress;
  
  saveFocusGrowth(data);
  return { data, leveledUp: level > oldLevel };
}

export function logDistraction() {
  const data = loadFocusGrowth();
  const weekKey = getWeekKey();
  data.weeklyDistractionsDefeated[weekKey] = (data.weeklyDistractionsDefeated[weekKey] || 0) + 1;
  
  const totalDistractions = Object.values(data.weeklyDistractionsDefeated).reduce((a, b) => a + b, 0);
  const newlyUnlocked: string[] = [];
  
  MILESTONES.forEach(m => {
    if (totalDistractions >= m.threshold && !data.milestonesUnlocked.includes(m.id)) {
      data.milestonesUnlocked.push(m.id);
      newlyUnlocked.push(m.id);
    }
  });
  
  saveFocusGrowth(data);
  const xpResult = addXP(1);
  return { ...xpResult, newlyUnlocked };
}
