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
  Sparkles,
  ArrowRight,
  Info
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
    <div className="min-h-dvh app-bg text-foreground flex flex-col overflow-hidden relative">
      {/* Background star effects similar to Coach */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] right-[5%] w-80 h-80 bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[10%] w-48 h-48 bg-purple-500/5 blur-[80px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70 active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.3em] text-rose-400 uppercase mb-1">Rescue Protocol</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" /> 
              <span className="tracking-tight">Emergency Reset</span>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center">
            <Info className="h-4 w-4 text-white/20" />
          </div>
        </header>

        {/* Stepper - more premium dots */}
        {step < 3 && (
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div 
                key={i}
                animate={{ 
                  scale: i === step ? 1.2 : 1,
                  opacity: i <= step ? 1 : 0.2
                }}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i <= step ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8 flex-1 flex flex-col"
              >
                <div className="text-center pt-2">
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-3 leading-tight tracking-tight">Pause. You're safe.</h1>
                  <p className="text-sm text-white/50 px-8 leading-relaxed">Let's ground your senses and take the power back from the urge.</p>
                </div>

                <Card className="glass glow bg-white/5 border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="text-center mb-8 relative">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Urge Intensity</p>
                    <div className="relative inline-block">
                      <motion.span 
                        key={urgeLevel}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-7xl font-black text-white block leading-none"
                      >
                        {urgeLevel}
                      </motion.span>
                      <div className="absolute -inset-4 bg-rose-500/10 blur-2xl rounded-full -z-10" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={urgeLevel}
                    onChange={(e) => setUrgeLevel(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-rose-500 mb-6"
                  />
                  <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
                    <span>Manageable</span>
                    <span>Peak Intensity</span>
                  </div>
                </Card>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] px-2 text-center">What triggered this?</p>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {TRIGGERS.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                        className={`px-5 py-2.5 rounded-2xl border text-[11px] font-bold transition-all active:scale-95 ${
                          selectedTriggers.includes(t)
                            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-4 pb-6">
                  <Button 
                    onClick={handleStartRescue}
                    className="w-full grad-pill h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(225,29,72,0.3)] transition-all active:scale-[0.98] border border-white/20 text-white"
                  >
                    Enter Rescue Plan
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <button 
                    onClick={() => setStep(1)}
                    className="w-full py-2 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-white/50 transition active:scale-95"
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
                <div className="text-center space-y-3">
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-black tracking-[0.3em] py-1 bg-cyan-500/5 px-4 mb-2">Step 01: The Reset</Badge>
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] tracking-tight">Breath Synchronization</h1>
                  <p className="text-sm text-white/40 px-10 leading-relaxed">
                    {urgeLevel >= 8 ? "Peak urge. Stay with the breath. You are in control." : 
                     urgeLevel >= 4 ? "Strong wave detected. Breathe through the peak." : 
                     "A passing wave. Let your breath carry it away."}
                  </p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-10 relative">
                  <div className="relative w-72 h-72 flex items-center justify-center">
                    {/* Multi-layered breathing rings */}
                    <AnimatePresence>
                      <motion.div 
                        key={`${breathPhase}-ring-1`}
                        animate={{ 
                          scale: breathPhase === "Inhale" ? 1.3 : breathPhase === "Hold" ? 1.3 : 0.7,
                          opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: breathPhase === "Inhale" ? 4 : breathPhase === "Hold" ? 2 : 6, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full border border-cyan-500/20"
                      />
                      <motion.div 
                        key={`${breathPhase}-ring-2`}
                        animate={{ 
                          scale: breathPhase === "Inhale" ? 1.15 : breathPhase === "Hold" ? 1.15 : 0.85,
                          opacity: [0.05, 0.15, 0.05]
                        }}
                        transition={{ duration: breathPhase === "Inhale" ? 4 : breathPhase === "Hold" ? 2 : 6, ease: "easeInOut", delay: 0.2 }}
                        className="absolute inset-[10%] rounded-full border border-cyan-400/10"
                      />
                    </AnimatePresence>
                    
                    <motion.div 
                      animate={{ 
                        scale: breathPhase === "Inhale" ? 1.2 : breathPhase === "Hold" ? 1.2 : 0.8,
                        boxShadow: breathPhase === "Inhale" ? "0 0 60px rgba(6,182,212,0.2)" : "0 0 30px rgba(6,182,212,0.1)"
                      }}
                      transition={{ duration: breathPhase === "Inhale" ? 4 : breathPhase === "Hold" ? 2 : 6, ease: "easeInOut" }}
                      className="w-52 h-52 rounded-full border border-white/10 flex flex-col items-center justify-center bg-white/5 backdrop-blur-3xl shadow-2xl z-10 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
                      <motion.span 
                        key={breathPhase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-black text-white mb-2 uppercase tracking-[0.3em]"
                      >
                        {breathPhase}
                      </motion.span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-cyan-400 font-mono tracking-tighter">{breathTimer}</span>
                        <span className="text-xs font-bold text-white/20 uppercase">sec</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="mt-auto space-y-4 pb-6">
                  <Button 
                    onClick={() => { setIsBreathing(false); setStep(2); }}
                    className={`w-full h-16 rounded-[1.5rem] font-black text-lg transition-all active:scale-[0.98] border border-white/10 ${
                      breathTimer === 0 ? "grad-pill text-white shadow-2xl" : "bg-white/5 text-white/30"
                    }`}
                  >
                    I'm calmer → Continue
                  </Button>
                  <button 
                    onClick={() => setBreathTimer(60)}
                    className="w-full py-2 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:text-white/40 transition active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" /> Still strong (Extend)
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
                className="space-y-6 flex-1 flex flex-col pb-6"
              >
                <div className="text-center space-y-2">
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-black tracking-[0.3em] py-1 bg-amber-500/5 px-4 mb-1">Step 02: The Delay</Badge>
                  <h1 className="text-2xl font-bold text-white font-[var(--font-serif)] tracking-tight">Override the Impulse</h1>
                  <p className="text-xs text-white/40">Urges last 15-30 mins. We only need to bridge the gap.</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-1 py-2">
                  {/* Card A: Timer */}
                  <Card className="glass bg-white/5 border-white/10 p-6 rounded-[2rem] relative overflow-hidden group shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-50 pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 relative">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                          <Timer className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Delay Timer</p>
                          <p className="text-xs text-amber-400/80 font-bold tracking-tight">Neuroplasticity in action</p>
                        </div>
                      </div>
                      <div className="text-4xl font-black text-white font-mono tracking-tighter shadow-sm">{formatTime(delayTimer)}</div>
                    </div>
                    <div className="flex gap-3 relative">
                      <Button 
                        size="lg" 
                        variant="secondary"
                        onClick={() => setDelayActive(!delayActive)}
                        className="flex-1 h-12 rounded-[1rem] font-black gap-2 bg-white/10 hover:bg-white/15 text-white border-none shadow-lg active:scale-95 transition-all"
                      >
                        {delayActive ? <><Pause className="h-4 w-4" /> Pause Delay</> : <><Play className="h-4 w-4" /> Start Delay</>}
                      </Button>
                      <Button 
                        size="lg" 
                        variant="ghost"
                        onClick={() => { setDelayTimer(600); setDelayActive(false); }}
                        className="h-12 w-12 p-0 rounded-[1rem] bg-white/5 border border-white/5 text-white/40 active:scale-95"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>

                  {/* Card B: Actions */}
                  <Card className="glass bg-white/5 border-white/10 p-6 rounded-[2rem] shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 grid place-items-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Quick Actions</p>
                        <p className="text-xs text-cyan-400/80 font-bold tracking-tight">Complete 2 to advance</p>
                      </div>
                    </div>
                    <div className="grid gap-2.5">
                      {QUICK_ACTIONS.map(act => (
                        <button
                          key={act}
                          onClick={() => setActionsDone(prev => prev.includes(act) ? prev.filter(x => x !== act) : [...prev, act])}
                          className={`w-full p-4 rounded-2xl border text-left text-[13px] font-bold transition-all flex items-center justify-between active:scale-[0.98] ${
                            actionsDone.includes(act) 
                              ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/8"
                          }`}
                        >
                          <span className="tracking-tight">{act}</span>
                          {actionsDone.includes(act) ? (
                            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                              <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                            </motion.div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border border-white/10" />
                          )}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Card C: Thought Break */}
                  <Card className="glass bg-white/5 border-white/10 p-6 rounded-[2rem] shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                        <Heart className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Thought Break</p>
                        <p className="text-xs text-purple-400/80 font-bold tracking-tight">What do you actually need?</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 mb-6 justify-center">
                      {NEEDS.map(n => (
                        <button
                          key={n}
                          onClick={() => setSelectedNeed(n)}
                          className={`px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                            selectedNeed === n 
                              ? "bg-purple-500/30 border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      {selectedNeed && (
                        <motion.div 
                          key={selectedNeed}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-[13px] text-white/80 leading-relaxed text-center italic shadow-inner"
                        >
                          "{NEED_SUGGESTIONS[selectedNeed]}"
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>

                <div className="pt-4 mt-auto">
                  <Button 
                    onClick={handleCompleteRescue}
                    className={`w-full h-16 rounded-[1.5rem] font-black text-lg transition-all active:scale-[0.98] border border-white/10 ${
                      (actionsDone.length >= 2 || delayTimer === 0) 
                        ? "grad-pill text-white shadow-[0_20px_40px_rgba(6,182,212,0.3)]" 
                        : "bg-white/5 text-white/20"
                    }`}
                  >
                    Complete Protocol
                    <ChevronRight className="ml-1 h-6 w-6 opacity-50" />
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
                <div className="relative mx-auto w-48 h-48 mb-6">
                  <div className="absolute inset-0 bg-cyan-500/40 blur-[80px] rounded-full animate-pulse" />
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="relative h-48 w-48 rounded-full border-4 border-cyan-500/30 grid place-items-center bg-black/40 backdrop-blur-3xl shadow-[0_0_60px_rgba(6,182,212,0.4)]"
                  >
                    <Sparkles className="h-24 w-24 text-cyan-400 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-black uppercase tracking-[0.4em] py-1.5 bg-cyan-500/10 px-6 mb-2">Cycle Broken</Badge>
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] tracking-tight">Urge Resisted.</h1>
                  <p className="text-sm text-white/50 px-12 leading-relaxed">
                    You just prioritized your future self over a temporary impulse. Every resisted urge weakens the habit loop forever.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 px-6">
                  <Card className="glass bg-white/5 border-white/10 p-5 rounded-3xl shadow-lg group hover:bg-white/8 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Reward</p>
                    <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                      <Zap className="h-5 w-5 text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform" /> 
                      <span>+1 Orb</span>
                    </div>
                  </Card>
                  <Card className="glass bg-white/5 border-white/10 p-5 rounded-3xl shadow-lg group hover:bg-white/8 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Resisted</p>
                    <div className="text-2xl font-black text-white group-hover:scale-110 transition-transform">
                      {JSON.parse(localStorage.getItem(PANIC_STORAGE_KEY) || "{}").stats?.urgesResisted || 0}
                    </div>
                  </Card>
                </div>

                <div className="mt-auto space-y-4 px-6 pb-6">
                  <Button 
                    onClick={() => navigate("/home")}
                    className="w-full bg-white text-black hover:bg-white/90 h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
                  >
                    Return to Orbit
                  </Button>
                  <button 
                    onClick={() => navigate("/daily")}
                    className="w-full py-2 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] hover:text-white/60 transition active:scale-95"
                  >
                    Log a quick check-in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-6 text-center pb-4 z-10">
          <p className="text-[9px] text-white/20 leading-relaxed uppercase tracking-[0.4em] font-black">
            Personal Recovery Tool • High Autonomy
          </p>
        </footer>
      </div>
    </div>
  );
}
