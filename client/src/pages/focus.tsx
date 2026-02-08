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
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const FOCUS_STORAGE_KEY = "orbit:focus_v1";
const ORBS_KEY = "orbit:orbs";

const DISTRACTION_TYPES = [
  "Social media", "YouTube", "Browsing", "Chatting", "Gaming", "Notifications"
];

const CHECKLIST_ACTIONS = [
  { id: "phone", label: "Phone face down" },
  { id: "tabs", label: "Close all tabs" },
  { id: "notes", label: "Open notes/book" },
  { id: "desk", label: "2-min desk reset" }
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

  // Stats state
  const [stats, setStats] = useState({ totalFocusMinutes: 0, distractionsResisted: 0 });

  useEffect(() => {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStats(parsed.focusStats || { totalFocusMinutes: 0, distractionsResisted: 0 });
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

  const handleComplete = () => {
    const durationMin = Math.round((preset * 60 - timeLeft) / 60);
    const isCompleted = timeLeft === 0 || selectedActions.length >= 2;

    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { focusEvents: [], focusStats: { distractionsResisted: 0, totalFocusMinutes: 0, lastFocusAtISO: "" } };
    
    const event = {
      id: Math.random().toString(36).substring(7),
      dateISO: new Date().toISOString(),
      durationMin,
      distractionTypes: selectedDistractions,
      pullLevel: distractionPull[0],
      completed: isCompleted
    };

    data.focusEvents.push(event);
    if (isCompleted) {
      data.focusStats.distractionsResisted += 1;
      data.focusStats.totalFocusMinutes += durationMin;
      data.focusStats.lastFocusAtISO = event.dateISO;
      
      // Reward Orbs
      const currentOrbs = Number(localStorage.getItem(ORBS_KEY) || 0);
      const reward = preset >= 45 ? 3 : preset >= 25 ? 2 : 1;
      localStorage.setItem(ORBS_KEY, String(currentOrbs + reward));
    }

    localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(data));
    setStats(data.focusStats);
    setStep(2);
  };

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden">
      {/* Background decoration */}
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
              className="space-y-6 flex-1 flex flex-col"
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

              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full border-4 border-white/5 ${isActive ? 'animate-pulse' : ''}`} />
                  <div className="text-6xl font-black text-white font-mono tracking-tighter">
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button
                    size="lg"
                    className="rounded-full w-14 h-14 p-0 bg-white/10 hover:bg-white/20 border-white/10 text-white"
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
              </div>

              <Card className="glass bg-white/5 border-white/10 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  <AlertCircle className="h-3 w-3" /> Anti-distraction micro-actions
                </div>
                <div className="space-y-3">
                  {CHECKLIST_ACTIONS.map(action => (
                    <div key={action.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={action.id}
                        checked={selectedActions.includes(action.id)}
                        onCheckedChange={(checked) => {
                          setSelectedActions(prev => checked ? [...prev, action.id] : prev.filter(id => id !== action.id));
                        }}
                        className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-400"
                      />
                      <label htmlFor={action.id} className="text-sm text-white/60 font-medium cursor-pointer">
                        {action.label}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="mt-auto pb-4">
                <Button
                  disabled={timeLeft > 0 && selectedActions.length < 2}
                  onClick={handleComplete}
                  className={`w-full h-14 rounded-2xl font-bold text-base transition-all ${
                    timeLeft === 0 || selectedActions.length >= 2 
                      ? "grad-pill text-white shadow-lg" 
                      : "bg-white/5 text-white/20 border-white/10"
                  }`}
                >
                  Complete Session
                </Button>
                <p className="text-center text-[10px] text-white/30 mt-3 font-bold uppercase tracking-widest">
                  {timeLeft === 0 ? "Timer done!" : "Finish timer OR 2 actions to win"}
                </p>
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
                <p className="text-white/50 text-sm">Your deep work session is logged.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Focus Minutes</div>
                  <div className="text-2xl font-bold text-white">{stats.totalFocusMinutes}</div>
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
