import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Target,
  AlertCircle,
  Dumbbell,
  Brain,
  Wind,
  Zap,
  Lock,
  BarChart3,
  X,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  loadFocusGrowth, 
  saveFocusGrowth, 
  logDistraction, 
  addXP, 
  MILESTONES, 
  FocusGrowthData,
  getWeekKey
} from "@/lib/focus-growth";

const FOCUS_STORAGE_KEY = "orbit:focus_v1";
const ORBS_KEY = "orbit:orbs";

const COACH_MESSAGES = [
  "Resistance is training.",
  "Distraction loses when you stay.",
  "You're building focus identity.",
  "One session = more control.",
  "Your attention is your power.",
  "Stay with the discomfort.",
  "Focus is a muscle you're building."
];

const DISTRACTION_TYPES = [
  "Social media", "YouTube", "Browsing", "Chatting", "Gaming", "Notifications"
];

const TASK_CATEGORIES = [
  {
    id: "physical",
    label: "Physical Reset",
    icon: Dumbbell,
    tasks: ["15 push-ups", "20 squats", "30-second plank", "1-minute jumping jacks", "2-minute walk"]
  },
  {
    id: "mental",
    label: "Mental Snap",
    icon: Brain,
    tasks: ["Read 5 lines", "Solve 1 question", "Write 3 notes", "Rewrite today's goal", "Highlight 1 paragraph"]
  },
  {
    id: "environment",
    label: "Environment Reset",
    icon: Wind,
    tasks: ["Clean desk (2 min)", "Close all tabs", "Turn on DND", "Put phone face down"]
  }
];

export default function FocusButton() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0); // 0: Capture, 1: Sprint, 2: Win
  const [lockMode, setLockMode] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [growth, setGrowth] = useState<FocusGrowthData>(loadFocusGrowth());
  const [levelUpModal, setLevelUpModal] = useState<{ show: boolean, level: number, stage: string } | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<typeof MILESTONES[0] | null>(null);
  const [coachMessage, setCoachMessage] = useState(COACH_MESSAGES[0]);
  
  // Capture state
  const [distractionPull, setDistractionPull] = useState([5]);
  const [selectedDistractions, setSelectedDistractions] = useState<string[]>([]);
  
  // Sprint state
  const [timeLeft, setTimeLeft] = useState(1500); // Default 25 min
  const [isActive, setIsActive] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [preset, setPreset] = useState(25);
  const [taskCategory, setTaskCategory] = useState("physical");
  const [physicalCountdown, setPhysicalCountdown] = useState<number | null>(null);

  // Stats for the end screen
  const [sessionResults, setSessionResults] = useState({ minutes: 0, distractions: 0, xp: 0 });

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCoachMessage(prev => {
          const totalDistractions = Object.values(growth.weeklyDistractionsDefeated).reduce((a, b) => a + b, 0);
          const nextMilestone = MILESTONES.find(m => !growth.milestonesUnlocked.includes(m.id));
          if (nextMilestone && nextMilestone.threshold - totalDistractions <= 5) {
            return `${nextMilestone.threshold - totalDistractions} away from ${nextMilestone.title}.`;
          }
          const filtered = COACH_MESSAGES.filter(m => m !== prev);
          return filtered[Math.floor(Math.random() * filtered.length)];
        });
      }, 35000);
      return () => clearInterval(interval);
    }
  }, [isActive, growth]);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    let interval: any;
    if (physicalCountdown !== null && physicalCountdown > 0) {
      interval = setInterval(() => {
        setPhysicalCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (physicalCountdown === 0) {
      setPhysicalCountdown(null);
    }
    return () => clearInterval(interval);
  }, [physicalCountdown]);

  const handleStartSprint = () => {
    setStep(1);
    setLockMode(true);
    const result = logDistraction();
    setGrowth(result.data);
    if (result.leveledUp) {
      setLevelUpModal({ show: true, level: result.data.level, stage: result.data.stage });
    }
  };

  const setTimerPreset = (mins: number) => {
    setPreset(mins);
    setTimeLeft(mins * 60);
    setIsActive(false);
  };

  const handleTaskToggle = (task: string) => {
    if (selectedActions.includes(task)) {
      setSelectedActions(prev => prev.filter(t => t !== task));
    } else {
      setSelectedActions(prev => [...prev, task]);
      if (taskCategory === "physical") {
        setPhysicalCountdown(30);
      }
    }
  };

  const handleComplete = () => {
    const durationMin = Math.round((preset * 60 - timeLeft) / 60);
    const isCompleted = timeLeft === 0 || selectedActions.length >= 1;

    let totalXP = 0;
    if (isCompleted) {
      if (taskCategory === "physical" && selectedActions.length > 0) {
        totalXP += 2;
      }
      const timerXP = Math.floor(durationMin / 10);
      totalXP += timerXP;

      if (totalXP > 0) {
        const result = addXP(totalXP);
        setGrowth(result.data);
        if (result.leveledUp) {
          setLevelUpModal({ show: true, level: result.data.level, stage: result.data.stage });
        }
      }

      setSessionResults({
        minutes: durationMin,
        distractions: 1,
        xp: totalXP
      });

      const currentOrbs = Number(localStorage.getItem(ORBS_KEY) || 0);
      const reward = preset >= 45 ? 3 : preset >= 25 ? 2 : 1;
      localStorage.setItem(ORBS_KEY, String(currentOrbs + reward));
    }

    setStep(2);
    setLockMode(false);
  };

  const canStartTimer = useMemo(() => {
    if (distractionPull[0] > 7) {
      return taskCategory === "physical" && selectedActions.length >= 1;
    }
    if (distractionPull[0] < 4) return true;
    return selectedActions.length >= 1;
  }, [distractionPull, selectedActions, taskCategory]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalDistractions = Object.values(growth.weeklyDistractionsDefeated).reduce((a, b) => a + b, 0);

  return (
    <div className={`min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden transition-all duration-500 ${lockMode ? 'z-[100]' : ''}`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        {!lockMode && (
          <header className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-all duration-300">
              <ChevronLeft className="h-5 w-5 text-white/70" />
            </Button>
            <div className="text-center">
              <div className="text-[10px] font-black tracking-[0.4em] text-purple-400/80 uppercase mb-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                {growth.stage.toUpperCase()} • LVL {growth.level}
              </div>
              <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                <Target className="h-4 w-4 text-purple-500 animate-pulse" />
                <span className="tracking-tight text-white/90">Deep Focus</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/focus-analytics")} className="rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-all duration-300">
              <BarChart3 className="h-4 w-4 text-white/50" />
            </Button>
          </header>
        )}

        {lockMode && (
          <header className="flex items-center justify-between mb-8 pt-4">
            <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400 gap-2 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20">
              <Lock className="h-3 w-3 animate-pulse" /> Locked In
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => setShowExitDialog(true)} className="rounded-full text-white/20 hover:text-white/40 hover:bg-white/5 transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </header>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 flex-1 flex flex-col"
            >
              <div className="text-center pt-2 space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">Caught it.</h1>
                <p className="text-sm text-white/40 font-medium px-8 leading-relaxed">Let's label the pull and reclaim your momentum.</p>
              </div>

              <Card className="glass glow bg-white/5 border-white/10 p-8 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Intensity</p>
                    <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">{distractionPull[0]}/10</span>
                  </div>
                  <Slider
                    value={distractionPull}
                    onValueChange={setDistractionPull}
                    max={10}
                    step={1}
                    className="mb-6"
                  />
                  <div className="flex justify-between text-[10px] text-white/20 font-black tracking-widest uppercase">
                    <span>Low Pull</span>
                    <span>Intense</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-center">Identifying the signal</p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  {DISTRACTION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedDistractions(prev => 
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      )}
                      className={`px-5 py-2.5 rounded-2xl border text-xs font-black transition-all duration-300 active:scale-95 ${
                        selectedDistractions.includes(type)
                          ? "bg-purple-600 border-purple-400/50 text-white shadow-[0_8px_25px_rgba(168,85,247,0.4)] ring-1 ring-white/20"
                          : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:border-white/10 hover:text-white/60"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Focus Milestones</h3>
                  <div className="text-[10px] font-bold text-purple-400/60">{totalDistractions} Defeated</div>
                </div>
                <div className="flex justify-between gap-2">
                  {MILESTONES.map((m) => {
                    const isUnlocked = growth.milestonesUnlocked.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMilestone(m)}
                        className={`flex-1 aspect-square rounded-xl flex items-center justify-center transition-all ${
                          isUnlocked 
                            ? "bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                            : "bg-white/5 border border-white/5 text-white/10 opacity-50"
                        }`}
                      >
                        {isUnlocked ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto space-y-4 pb-4">
                <Button onClick={handleStartSprint} className="w-full h-16 rounded-[1.5rem] grad-pill shine text-white font-black text-base tracking-tight shadow-[0_15px_30px_rgba(130,87,255,0.3)] border border-white/20 transition-all active:scale-95">
                  Initiate Focus Rescue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="sprint"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar"
            >
              <div className="text-center space-y-3">
                <div className="text-[10px] text-purple-400 font-black uppercase tracking-[0.4em] mb-1 animate-pulse h-4">{coachMessage}</div>
                {!lockMode && (
                  <div className="flex justify-center gap-3">
                    {[10, 25, 45].map(m => (
                      <Button
                        key={m}
                        variant={preset === m ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerPreset(m)}
                        className={`rounded-2xl px-5 h-9 font-black text-[10px] tracking-widest uppercase transition-all duration-300 ${
                          preset === m 
                          ? "bg-purple-600 border-purple-400 shadow-[0_8px_20px_rgba(168,85,247,0.3)]" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"}`}
                      >
                        {m}min
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/5"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray="753.98"
                      initial={{ strokeDashoffset: 753.98 }}
                      animate={{ strokeDashoffset: 753.98 * (1 - growth.stageProgress) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-purple-500/40 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="110"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      animate={{ 
                        scale: isActive ? [1, 1.05, 1] : 1,
                        opacity: isActive ? [0.2, 0.5, 0.2] : 0.2
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-blue-400"
                    />
                  </svg>
                  
                  <div className="relative flex flex-col items-center">
                    <div className="text-6xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Remaining</div>
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-8 whitespace-nowrap text-[8px] font-black text-purple-400 uppercase tracking-widest"
                      >
                        Focus ability improved
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex gap-6 mt-8">
                  <Button
                    size="lg"
                    disabled={!canStartTimer}
                    className={`rounded-full w-16 h-16 p-0 transition-all duration-500 shadow-xl ring-1 ${
                      canStartTimer 
                      ? 'bg-white/10 hover:bg-white/15 border-white/10 text-white ring-white/10' 
                      : 'bg-white/3 border-white/5 text-white/5 ring-transparent opacity-40'
                    }`}
                    onClick={() => setIsActive(!isActive)}
                  >
                    {isActive ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1 fill-white" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="rounded-full w-16 h-16 p-0 text-white/20 hover:text-white/40 hover:bg-white/5 transition-all duration-300"
                    onClick={() => { setTimeLeft(preset * 60); setIsActive(false); }}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <Card className="glass glow bg-white/5 border-white/10 p-6 rounded-[2rem] relative overflow-hidden mt-4">
                <Tabs value={taskCategory} onValueChange={setTaskCategory} className="w-full">
                  <TabsList className="grid grid-cols-3 bg-white/5 p-1 rounded-2xl mb-6 ring-1 ring-white/5">
                    {TASK_CATEGORIES.map(cat => (
                      <TabsTrigger key={cat.id} value={cat.id} className="rounded-xl h-10 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300">
                        <cat.icon className="h-4 w-4" />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {TASK_CATEGORIES.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="space-y-3">
                      {cat.tasks.map(task => (
                        <button
                          key={task}
                          onClick={() => handleTaskToggle(task)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                            selectedActions.includes(task)
                              ? "bg-purple-600/10 border-purple-500/40 text-purple-200"
                              : "bg-white/3 border-white/5 text-white/40"
                          }`}
                        >
                          <span className="text-xs font-bold">{task}</span>
                          {selectedActions.includes(task) && <CheckCircle2 className="h-4 w-4 text-purple-500" />}
                        </button>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>

              <div className="mt-auto pb-4 pt-4">
                <Button
                  disabled={timeLeft > 0 && selectedActions.length < 1}
                  onClick={handleComplete}
                  className="w-full h-16 rounded-[1.5rem] grad-pill shine text-white font-black text-base"
                >
                  Finalize Session
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="win"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full animate-pulse" />
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="relative h-32 w-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(168,85,247,0.4)] border border-white/30"
                >
                  <Trophy className="h-16 w-16 text-white" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter">Strength Gained.</h2>
                <p className="text-white/40 text-sm font-medium px-12 leading-relaxed">Your focus muscle is thickening. The urge lost this round.</p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full px-4">
                <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl group hover:bg-white/10 transition-colors">
                  <div className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{sessionResults.minutes}</div>
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Minutes</div>
                </Card>
                <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl group hover:bg-white/10 transition-colors">
                  <div className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{sessionResults.distractions}</div>
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">Defeated</div>
                </Card>
                <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl group hover:bg-white/10 transition-colors border-blue-500/30">
                  <div className="text-3xl font-black text-blue-400 tracking-tighter group-hover:scale-105 transition-transform origin-left">+{sessionResults.xp}</div>
                  <div className="text-[9px] font-black text-blue-400/40 uppercase tracking-[0.2em] mt-1">Focus XP</div>
                </Card>
              </div>

              <div className="w-full px-4 pt-4 space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-left">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Weekly Growth Summary</div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">Focus Time</span>
                    <span className="text-white font-bold">{growth.weeklyFocusMinutes[getWeekKey()] || 0}m</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Distractions Defeated</span>
                    <span className="text-white font-bold">{growth.weeklyDistractionsDefeated[getWeekKey()] || 0}</span>
                  </div>
                </div>

                <Button onClick={() => navigate("/home")} className="w-full h-16 rounded-[1.5rem] grad-pill shine text-white font-black text-base tracking-tight shadow-[0_15px_30px_rgba(130,87,247,0.3)] border border-white/20 transition-all active:scale-95">
                  Secure Growth
                </Button>
                <button onClick={() => setStep(0)} className="w-full py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white/40 transition-colors">
                  Return to Orbit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent className="glass border-white/10 bg-black/80 rounded-[2rem] max-w-[90%] w-full">
            <DialogHeader className="space-y-4">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <AlertCircle className="h-6 w-6 text-rose-500" />
              </div>
              <DialogTitle className="text-white text-center">Break Focus?</DialogTitle>
              <DialogDescription className="text-white/40 text-center text-xs leading-relaxed">
                If you leave now, the current signal might regain strength. Stay 5 more minutes?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1 rounded-2xl h-12 text-white/40 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest" onClick={() => navigate("/home")}>
                Exit Anyway
              </Button>
              <Button className="flex-1 rounded-2xl h-12 bg-white text-black hover:bg-white/90 font-black text-[10px] uppercase tracking-widest" onClick={() => setShowExitDialog(false)}>
                Stay Strong
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!levelUpModal} onOpenChange={() => setLevelUpModal(null)}>
          <DialogContent className="glass border-purple-500/20 bg-black/90 rounded-[2rem] max-w-[90%] w-full p-8 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/20 blur-[60px]" />
            </div>
            <div className="relative text-center space-y-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              >
                <Sparkles className="h-10 w-10 text-white" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-purple-400 font-bold uppercase tracking-widest text-[10px]">Focus Ability Increased</p>
                <h2 className="text-3xl font-black text-white tracking-tighter">Stage: {levelUpModal?.stage.toUpperCase()}</h2>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <div className="text-xs font-bold text-white/60 mb-1">Current Level</div>
                <div className="text-4xl font-black text-white">{levelUpModal?.level}</div>
              </div>
              <Button className="w-full h-14 rounded-2xl bg-white text-black font-bold" onClick={() => setLevelUpModal(null)}>
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedMilestone} onOpenChange={() => setSelectedMilestone(null)}>
          <DialogContent className="glass border-white/10 bg-black/90 rounded-[2rem] max-w-[90%] w-full p-8">
            {selectedMilestone && (
              <div className="text-center space-y-6">
                <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center ${
                  growth.milestonesUnlocked.includes(selectedMilestone.id) 
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" 
                    : "bg-white/5 text-white/10 border border-white/5"
                }`}>
                  {growth.milestonesUnlocked.includes(selectedMilestone.id) ? <Trophy className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tighter">{selectedMilestone.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed px-4">{selectedMilestone.desc}</p>
                </div>
                {!growth.milestonesUnlocked.includes(selectedMilestone.id) && (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Target</div>
                    <div className="text-sm font-bold text-white">
                      {selectedMilestone.threshold - totalDistractions} more distractions to defeat
                    </div>
                  </div>
                )}
                <Button className="w-full h-14 rounded-2xl bg-white text-black font-bold" onClick={() => setSelectedMilestone(null)}>
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
