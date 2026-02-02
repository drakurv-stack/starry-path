import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Wind,
  Timer,
  Activity,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Zap,
  Play,
  Pause,
  Plus,
  Heart,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PANIC_STORAGE_KEY = "orbit:panic_v1";
const STREAK_KEY = "orbit:streak";
const ORBS_KEY = "orbit:orbs";

const TRIGGERS = [
  "Stress", "Boredom", "Loneliness", "Late night", "Social media", "Anxiety", "Tired", "Random"
];

const QUICK_ACTIONS = [
  "Walk 2 minutes",
  "Cold water / wash face",
  "20 push-ups / 1m plank",
  "Journal 3 lines",
  "Clean desk for 3m",
  "Message a friend"
];

const NEEDS = ["Rest", "Connection", "Achievement", "Comfort", "Relief"];

const NEED_SUGGESTIONS: Record<string, string> = {
  Rest: "Your mind is tired. Lie down for 5 minutes with eyes closed. No screens.",
  Connection: "Isolation feeds the urge. Call or text someone you trust right now.",
  Achievement: "You need a win. Complete one small task on your to-do list.",
  Comfort: "Try a warm drink or a soft blanket. Be gentle with yourself.",
  Relief: "The urge is a false promise of relief. Try 2 minutes of stretching instead."
};

export default function PanicButton() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0); // 0: Start, 1: Breathe, 2: Delay/Replace, 3: Success
  const [urgeLevel, setUrgeLevel] = useState(5);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  
  // Breathe state
  const [breathTimer, setBreathTimer] = useState(60);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");

  // Delay state
  const [delayTimer, setDelayTimer] = useState(600);
  const [delayActive, setDelayActive] = useState(false);
  const [actionsDone, setActionsDone] = useState<string[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Breathing Logic
  useEffect(() => {
    let interval: any;
    if (isBreathing && breathTimer > 0) {
      interval = setInterval(() => {
        setBreathTimer((prev) => prev - 1);
      }, 1000);
    } else if (breathTimer === 0) {
      setIsBreathing(false);
    }
    return () => clearInterval(interval);
  }, [isBreathing, breathTimer]);

  useEffect(() => {
    if (!isBreathing) return;
    const cycle = 12; // 4 + 2 + 6
    const interval = setInterval(() => {
      const elapsed = (60 - breathTimer) % cycle;
      if (elapsed < 4) setBreathPhase("Inhale");
      else if (elapsed < 6) setBreathPhase("Hold");
      else setBreathPhase("Exhale");
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreathing, breathTimer]);

  // Delay Logic
  useEffect(() => {
    let interval: any;
    if (delayActive && delayTimer > 0) {
      interval = setInterval(() => {
        setDelayTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [delayActive, delayTimer]);

  const handleStartRescue = () => {
    setStep(1);
    setIsBreathing(true);
  };

  const handleCompleteRescue = () => {
    // Save to storage
    const raw = localStorage.getItem(PANIC_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { urgeEvents: [], stats: { urgesResisted: 0, lastUrgeAtISO: "" } };
    
    const event = {
      id: Math.random().toString(36).substring(7),
      dateISO: new Date().toISOString(),
      urgeLevel,
      triggers: selectedTriggers,
      outcome: "resisted"
    };

    data.urgeEvents.push(event);
    data.stats.urgesResisted += 1;
    data.stats.lastUrgeAtISO = event.dateISO;

    localStorage.setItem(PANIC_STORAGE_KEY, JSON.stringify(data));

    // Rewards
    const orbs = Number(localStorage.getItem(ORBS_KEY) || 0);
    localStorage.setItem(ORBS_KEY, String(orbs + 1));

    setStep(3);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative">
        <header className="flex items-center justify-between mb-8 z-10">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-rose-400 uppercase mb-1">Rescue Mode</div>
            <div className="text-sm font-semibold text-white flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" /> Urgent Reset
            </div>
          </div>
          <div className="w-10" />
        </header>

        {/* Stepper */}
        {step < 3 && (
          <div className="flex gap-2 mb-8 px-4 z-10">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col z-10">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8 flex-1 flex flex-col"
              >
                <div className="text-center pt-4">
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-3 leading-tight">Pause. You're safe.</h1>
                  <p className="text-sm text-white/50 px-8">Let's name what's happening to take the power back.</p>
                </div>

                <Card className="glass glow bg-white/5 border-white/10 p-6">
                  <div className="text-center mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Urge Intensity</p>
                    <span className="text-5xl font-black text-white">{urgeLevel}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={urgeLevel}
                    onChange={(e) => setUrgeLevel(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-rose-500 mb-4"
                  />
                  <div className="flex justify-between text-[10px] font-black text-white/20 uppercase">
                    <span>Manageable</span>
                    <span>Peak Wave</span>
                  </div>
                </Card>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">Trigger Source</p>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                        className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
                          selectedTriggers.includes(t)
                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            : "bg-white/5 border-white/10 text-white/60"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-3 pb-4">
                  <Button 
                    onClick={handleStartRescue}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white h-16 rounded-3xl font-black text-lg shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-[0.98]"
                  >
                    Start Rescue Plan
                  </Button>
                  <button 
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-xs font-bold text-white/30 uppercase tracking-widest hover:text-white/50 transition"
                  >
                    Skip to breathing
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="breathe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1 flex flex-col justify-center py-8"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Step 1: Reset</h2>
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)]">Breath Synchronization</h1>
                  <p className="text-sm text-white/40">
                    {urgeLevel >= 8 ? "Peak urge. Stay with me for 60 seconds." : 
                     urgeLevel >= 4 ? "Strong wave. Breathe through the peak." : 
                     "Small wave. Let it pass."}
                  </p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Pulsing circles */}
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={breathPhase}
                        initial={{ scale: breathPhase === "Inhale" ? 0.8 : 1.2 }}
                        animate={{ 
                          scale: breathPhase === "Inhale" ? 1.2 : breathPhase === "Hold" ? 1.2 : 0.8,
                          opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{ duration: breathPhase === "Inhale" ? 4 : breathPhase === "Hold" ? 2 : 6, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl"
                      />
                    </AnimatePresence>
                    
                    <motion.div 
                      animate={{ 
                        scale: breathPhase === "Inhale" ? 1.2 : breathPhase === "Hold" ? 1.2 : 0.8
                      }}
                      transition={{ duration: breathPhase === "Inhale" ? 4 : breathPhase === "Hold" ? 2 : 6, ease: "easeInOut" }}
                      className="w-48 h-48 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl shadow-2xl z-10"
                    >
                      <span className="text-2xl font-black text-white mb-2 uppercase tracking-widest">{breathPhase}</span>
                      <span className="text-4xl font-black text-cyan-400 font-mono">{breathTimer}s</span>
                    </motion.div>
                  </div>
                </div>

                <div className="mt-auto space-y-3 pb-4">
                  <Button 
                    onClick={() => { setIsBreathing(false); setStep(2); }}
                    className={`w-full h-16 rounded-3xl font-black text-lg transition-all active:scale-[0.98] ${
                      breathTimer === 0 ? "grad-pill text-white shadow-xl" : "bg-white/5 border border-white/10 text-white/40"
                    }`}
                  >
                    I'm calmer → Continue
                  </Button>
                  <button 
                    onClick={() => setBreathTimer(60)}
                    className="w-full py-2 text-xs font-bold text-white/30 uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-3 w-3" /> Still strong (Extend 60s)
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="delay"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 flex-1 flex flex-col pb-4"
              >
                <div className="text-center">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-amber-400 mb-1">Step 2: Delay</h2>
                  <h1 className="text-2xl font-bold text-white font-[var(--font-serif)]">Override the Urge</h1>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                  {/* Card A: Timer */}
                  <Card className="glass bg-white/5 border-white/10 p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400">
                          <Timer className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-white/40">Delay Timer</p>
                          <p className="text-[10px] text-amber-400/80 font-bold">Weakening the loop...</p>
                        </div>
                      </div>
                      <div className="text-3xl font-black text-white font-mono">{formatTime(delayTimer)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => setDelayActive(!delayActive)}
                        className="flex-1 h-10 rounded-xl font-bold gap-2"
                      >
                        {delayActive ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start Delay</>}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setDelayTimer(600)}
                        className="h-10 w-10 p-0 rounded-xl border border-white/5"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>

                  {/* Card B: Actions */}
                  <Card className="glass bg-white/5 border-white/10 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 grid place-items-center text-cyan-400">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white/40">Quick Actions</p>
                        <p className="text-[10px] text-cyan-400/80 font-bold">Choose 2 to complete</p>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      {QUICK_ACTIONS.map(act => (
                        <button
                          key={act}
                          onClick={() => setActionsDone(prev => prev.includes(act) ? prev.filter(x => x !== act) : [...prev, act])}
                          className={`w-full p-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${
                            actionsDone.includes(act) 
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200" 
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {act}
                          {actionsDone.includes(act) && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Card C: Thought Break */}
                  <Card className="glass bg-white/5 border-white/10 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400">
                        <Heart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white/40">Thought Break</p>
                        <p className="text-[10px] text-purple-400/80 font-bold">What do you actually need?</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {NEEDS.map(n => (
                        <button
                          key={n}
                          onClick={() => setSelectedNeed(n)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                            selectedNeed === n 
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-200" 
                              : "bg-white/5 border-white/10 text-white/40"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {selectedNeed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 italic"
                        >
                          {NEED_SUGGESTIONS[selectedNeed]}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleCompleteRescue}
                    className={`w-full h-16 rounded-3xl font-black text-lg transition-all active:scale-[0.98] ${
                      (actionsDone.length >= 2 || delayTimer === 0) ? "grad-pill text-white shadow-xl" : "bg-white/5 border border-white/10 text-white/40"
                    }`}
                  >
                    Finish Rescue <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center flex-1 flex flex-col justify-center py-8"
              >
                <div className="relative mx-auto w-40 h-40 mb-4">
                  <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] rounded-full animate-pulse" />
                  <div className="relative h-40 w-40 rounded-full border-4 border-cyan-500/40 grid place-items-center bg-black/40 backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.3)]">
                    <Sparkles className="h-20 w-20 text-cyan-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-black uppercase tracking-widest bg-cyan-500/5 py-1">Mission Success</Badge>
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)]">Urge Resisted.</h1>
                  <p className="text-sm text-white/60 px-12 leading-relaxed">
                    You just weakened the habit loop and rewired your nervous system. Every victory counts.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 px-4">
                  <Card className="glass bg-white/5 border-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Reward</p>
                    <div className="text-xl font-black text-white flex items-center justify-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-400" /> +1 Orb
                    </div>
                  </Card>
                  <Card className="glass bg-white/5 border-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Resisted</p>
                    <div className="text-xl font-black text-white">
                      {JSON.parse(localStorage.getItem(PANIC_STORAGE_KEY) || "{}").stats?.urgesResisted || 0}
                    </div>
                  </Card>
                </div>

                <div className="mt-auto space-y-3 px-4 pb-4">
                  <Button 
                    onClick={() => navigate("/home")}
                    className="w-full bg-white text-black hover:bg-white/90 h-16 rounded-3xl font-black text-lg shadow-2xl"
                  >
                    Return Home
                  </Button>
                  <button 
                    onClick={() => navigate("/daily")}
                    className="w-full py-2 text-xs font-bold text-white/40 uppercase tracking-widest hover:text-white transition"
                  >
                    Log a quick check-in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-4 text-center pb-2 z-10">
          <p className="text-[9px] text-white/20 leading-relaxed uppercase tracking-widest font-bold">
            Rescue Tool • Not Medical Advice
          </p>
        </footer>
      </div>
    </div>
  );
}
