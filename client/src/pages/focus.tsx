import { useState, useEffect, useMemo } from "react";
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
  Wind
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FOCUS_STORAGE_KEY = "orbit:focus_v1";
const ORBS_KEY = "orbit:orbs";

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

  // Stats state
  const [stats, setStats] = useState({ 
    totalFocusMinutes: 0, 
    distractionsResisted: 0,
    tasksCompleted: 0,
    physicalResets: 0
  });

  useEffect(() => {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStats(parsed.focusStats || { 
          totalFocusMinutes: 0, 
          distractionsResisted: 0,
          tasksCompleted: 0,
          physicalResets: 0
        });
      } catch (e) {
        console.error("Failed to parse focus stats", e);
      }
    }
  }, []);

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

  const handleStartSprint = () => setStep(1);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
      // Bonus countdown for physical tasks
      if (taskCategory === "physical") {
        setPhysicalCountdown(30);
      }
    }
  };

  const handleComplete = () => {
    const durationMin = Math.round((preset * 60 - timeLeft) / 60);
    const isCompleted = timeLeft === 0 || selectedActions.length >= 1;

    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { focusEvents: [], focusStats: { 
      distractionsResisted: 0, 
      totalFocusMinutes: 0, 
      tasksCompleted: 0,
      physicalResets: 0,
      lastFocusAtISO: "" 
    } };
    
    const event = {
      id: Math.random().toString(36).substring(7),
      dateISO: new Date().toISOString(),
      durationMin,
      distractionTypes: selectedDistractions,
      pullLevel: distractionPull[0],
      actionsDone: selectedActions,
      taskCategoryUsed: taskCategory,
      completed: isCompleted
    };

    data.focusEvents.push(event);
    if (isCompleted) {
      data.focusStats.distractionsResisted += 1;
      data.focusStats.totalFocusMinutes += durationMin;
      data.focusStats.tasksCompleted += selectedActions.length;
      if (taskCategory === "physical" && selectedActions.length > 0) {
        data.focusStats.physicalResets += 1;
      }
      data.focusStats.lastFocusAtISO = event.dateISO;
      
      const currentOrbs = Number(localStorage.getItem(ORBS_KEY) || 0);
      const reward = preset >= 45 ? 3 : preset >= 25 ? 2 : 1;
      localStorage.setItem(ORBS_KEY, String(currentOrbs + reward));
    }

    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(data));
    setStats(data.focusStats);
    setStep(2);
  };

  const canStartTimer = useMemo(() => {
    // If pull level > 7, force physical task first
    if (distractionPull[0] > 7) {
      return taskCategory === "physical" && selectedActions.length >= 1;
    }
    // Otherwise, allow if at least 1 task is done or if pull level is low (< 4)
    if (distractionPull[0] < 4) return true;
    return selectedActions.length >= 1;
  }, [distractionPull, selectedActions, taskCategory]);

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase mb-1">Focus Rescue</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="tracking-tight">Concentration Mode</span>
            </div>
          </div>
          <div className="w-10" />
        </header>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 flex-1 flex flex-col"
            >
              <div className="text-center pt-2">
                <h1 className="text-3xl font-bold text-white mb-2">Caught it. Good.</h1>
                <p className="text-sm text-white/50 px-8">Let's label the distraction and switch back to action.</p>
              </div>

              <Card className="glass bg-white/5 border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 text-center">Distraction Pull: {distractionPull[0]}/10</p>
                <Slider
                  value={distractionPull}
                  onValueChange={setDistractionPull}
                  max={10}
                  step={1}
                  className="mb-4"
                />
                <div className="flex justify-between text-[10px] text-white/20 font-bold">
                  <span>MILD</span>
                  <span>INTENSE</span>
                </div>
              </Card>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">What's pulling you away?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {DISTRACTION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedDistractions(prev => 
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      )}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                        selectedDistractions.includes(type)
                          ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto space-y-3 pb-4">
                <Button onClick={handleStartSprint} className="w-full h-14 rounded-2xl grad-pill text-white font-bold text-base">
                  Start Focus Rescue
                </Button>
                <button onClick={handleStartSprint} className="w-full py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  Skip to timer
                </button>
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
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Focus Sprint</h2>
                <div className="flex justify-center gap-2">
                  {[10, 25, 45].map(m => (
                    <Button
                      key={m}
                      variant={preset === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimerPreset(m)}
                      className={`rounded-full px-4 ${preset === m ? "bg-purple-600 border-purple-500" : "bg-white/5 border-white/10 text-white/40"}`}
                    >
                      {m}m
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="glass bg-white/5 border-white/10 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  <Target className="h-3 w-3" /> Break the Distraction
                </div>
                
                <Tabs value={taskCategory} onValueChange={setTaskCategory} className="w-full">
                  <TabsList className="grid grid-cols-3 bg-white/5 p-1 rounded-2xl mb-4">
                    {TASK_CATEGORIES.map(cat => (
                      <TabsTrigger key={cat.id} value={cat.id} className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white">
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
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] ${
                            selectedActions.includes(task)
                              ? "bg-purple-500/20 border-purple-400 text-purple-200 shadow-inner"
                              : "bg-white/5 border-white/10 text-white/60"
                          }`}
                        >
                          <span className="text-xs font-bold">{task}</span>
                          {selectedActions.includes(task) ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="pulse-glow">
                              <CheckCircle2 className="h-4 w-4 text-purple-400" />
                            </motion.div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-white/10" />
                          )}
                        </button>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
                
                {physicalCountdown !== null && taskCategory === "physical" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Stay with it</p>
                    <div className="text-lg font-black text-white">{physicalCountdown}s</div>
                  </motion.div>
                )}
              </Card>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full border-4 border-white/5 ${isActive ? 'animate-pulse' : ''}`} />
                  <div className="text-4xl font-black text-white font-mono tracking-tighter">
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button
                    size="lg"
                    disabled={!canStartTimer}
                    className={`rounded-full w-14 h-14 p-0 transition-all ${canStartTimer ? 'bg-white/10 hover:bg-white/20 border-white/10 text-white' : 'bg-white/5 text-white/10 opacity-50'}`}
                    onClick={() => setIsActive(!isActive)}
                  >
                    {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="rounded-full w-14 h-14 p-0 text-white/30"
                    onClick={() => { setTimeLeft(preset * 60); setIsActive(false); }}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
                {!canStartTimer && (
                  <p className="mt-4 text-[10px] text-rose-400 font-black uppercase tracking-widest text-center px-4">
                    {distractionPull[0] > 7 ? "Physical reset required to unlock timer" : "Complete 1 task to unlock timer"}
                  </p>
                )}
              </div>

              <div className="mt-auto pb-4">
                <Button
                  disabled={timeLeft > 0 && selectedActions.length < 1}
                  onClick={handleComplete}
                  className={`w-full h-14 rounded-2xl font-bold text-base transition-all ${
                    timeLeft === 0 || selectedActions.length >= 1 
                      ? "grad-pill text-white shadow-lg" 
                      : "bg-white/5 text-white/20 border-white/10"
                  }`}
                >
                  Complete Session
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
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-2xl">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Focus Achieved</h1>
                <p className="text-white/50 text-sm">Your discipline recovery session is logged.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Focus Minutes</div>
                  <div className="text-2xl font-bold text-white">{stats.totalFocusMinutes}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Tasks Done</div>
                  <div className="text-2xl font-bold text-white">{stats.tasksCompleted}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Physical Resets</div>
                  <div className="text-2xl font-bold text-white">{stats.physicalResets}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Resisted</div>
                  <div className="text-2xl font-bold text-white">{stats.distractionsResisted}</div>
                </div>
              </div>

              <div className="w-full space-y-3 pt-4">
                <Button onClick={() => { setStep(0); setTimeLeft(preset * 60); setIsActive(false); setSelectedActions([]); }} className="w-full h-14 rounded-2xl grad-pill text-white font-bold">
                  Start Another Sprint
                </Button>
                <Button variant="ghost" onClick={() => navigate("/home")} className="w-full h-14 rounded-2xl text-white/50 font-bold">
                  Back to Home
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
