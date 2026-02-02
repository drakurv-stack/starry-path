import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  Calendar,
  History,
  TrendingUp,
  Sparkles,
  Zap,
  Leaf,
  TreeDeciduous,
  Sprout,
  Activity,
  Flame,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STREAK_KEY = "orbit:streak";
const ORBS_KEY = "orbit:orbs";
const PANIC_KEY = "orbit:panic_v1";

const STAGES = [
  { name: "Seed", threshold: 0, length: 7, icon: "🌱" },
  { name: "Sprout", threshold: 7, length: 23, icon: "🌿" },
  { name: "Plant", threshold: 30, length: 60, icon: "🪴" },
  { name: "Tree", threshold: 90, length: 365, icon: "🌳" }
];

const MILESTONES = [
  { day: 7, label: "Sprout Stage", desc: "Neurochemistry begins to stabilize." },
  { day: 30, label: "Plant Stage", desc: "Frontal cortex connectivity improves." },
  { day: 60, label: "Deep Roots", desc: "Significant reduction in craving intensity." },
  { day: 90, label: "Tree Stage", desc: "New default state established." }
];

const REFLECTIONS = [
  "Growth is invisible until it isn't.",
  "Consistency beats intensity.",
  "Today mattered.",
  "Your future self is thanking you.",
  "One day at a time, one orbit at a time.",
  "Be patient with your own progress."
];

function StarField() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Parallax Starfield Background */}
      <div 
        className="absolute inset-0"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.15),transparent)] animate-pulse" />
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.4 + 0.1,
              scale: Math.random() * 0.4 + 0.3
            }}
            animate={{ 
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: Math.random() * 4 + 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          />
        ))}
      </div>
    </div>
  );
}

function SeedVisual({ stage }: { stage: string }) {
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
          filter: ["blur(60px)", "blur(80px)", "blur(60px)"]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-cyan-500/30 rounded-full"
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="relative z-10"
      >
        {stage === "Seed" && (
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-700 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.4)] border border-amber-300/30" />
        )}
        {stage === "Sprout" && (
          <div className="relative">
             <div className="w-12 h-20 bg-gradient-to-t from-green-800 to-green-500 rounded-full" />
             <motion.div 
               animate={{ rotate: [0, 10, 0] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute -top-4 -right-4 w-12 h-12 bg-green-400 rounded-tr-[50px] rounded-bl-[50px] border-l-4 border-green-600" 
             />
          </div>
        )}
        {stage === "Plant" && (
          <div className="relative">
             <div className="w-16 h-32 bg-gradient-to-t from-emerald-900 to-emerald-600 rounded-full" />
             <div className="absolute top-4 -left-8 w-14 h-14 bg-emerald-400 rounded-tl-[50px] rounded-br-[50px] border-r-4 border-emerald-600" />
             <div className="absolute top-12 -right-10 w-16 h-16 bg-emerald-500 rounded-tr-[50px] rounded-bl-[50px] border-l-4 border-emerald-700" />
          </div>
        )}
        {stage === "Tree" && (
          <div className="relative">
             <div className="w-8 h-40 bg-gradient-to-t from-amber-900 to-amber-800 rounded-t-lg" />
             <div className="absolute -top-12 -left-16 w-40 h-40 bg-gradient-to-br from-green-500 to-emerald-900 rounded-full blur-[2px] opacity-90 shadow-[0_0_40px_rgba(16,185,129,0.3)]" />
             <Sparkles className="absolute top-0 left-0 text-white/40 h-full w-full animate-pulse" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SeedGarden() {
  const [, navigate] = useLocation();
  const [streak, setStreak] = useState(0);
  const [panicStats, setPanicStats] = useState({ urgesResisted: 0 });
  const [reflection, setReflection] = useState("");

  const triggerHaptic = (type: "light" | "medium" | "success") => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      if (type === "light") window.navigator.vibrate(10);
      else if (type === "medium") window.navigator.vibrate(20);
      else if (type === "success") window.navigator.vibrate([30, 50, 30]);
    }
  };

  useEffect(() => {
    const s = Number(localStorage.getItem(STREAK_KEY) || 0);
    setStreak(s);
    try {
      const raw = localStorage.getItem(PANIC_KEY);
      if (raw) setPanicStats(JSON.parse(raw).stats);
    } catch {}

    // Daily reflection logic
    const lastReflectionDate = localStorage.getItem("orbit:last_reflection_date");
    const today = new Date().toDateString();
    
    if (lastReflectionDate === today) {
      setReflection(localStorage.getItem("orbit:current_reflection") || REFLECTIONS[0]);
    } else {
      const newRef = REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)];
      setReflection(newRef);
      localStorage.setItem("orbit:last_reflection_date", today);
      localStorage.setItem("orbit:current_reflection", newRef);
    }
  }, []);

  const currentStage = useMemo(() => {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (streak >= STAGES[i].threshold) return STAGES[i];
    }
    return STAGES[0];
  }, [streak]);

  // Haptic trigger for stage upgrade (simplified for MVP as streak changes)
  useEffect(() => {
    if (streak > 0) {
      const isMilestone = MILESTONES.some(m => m.day === streak);
      if (isMilestone) triggerHaptic("medium");
      
      const isStageThreshold = STAGES.some(s => s.threshold === streak);
      if (isStageThreshold) triggerHaptic("success");
    }
  }, [streak]);

  const progress = useMemo(() => {
    const daysIntoStage = streak - currentStage.threshold;
    return Math.min((daysIntoStage / currentStage.length) * 100, 100);
  }, [streak, currentStage]);

  useEffect(() => {
    if (progress > 0) triggerHaptic("light");
  }, [progress]);

  const daysToNext = useMemo(() => {
    return Math.max(currentStage.length - (streak - currentStage.threshold), 0);
  }, [streak, currentStage]);

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden">
      <StarField />

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70 active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase mb-1">Growth Garden</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Leaf className="h-4 w-4 text-green-400" />
              <span className="tracking-tight">Personal Evolution</span>
            </div>
          </div>
          <button 
            onClick={() => navigate("/timeline")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
          >
            <History className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center pt-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-2 tracking-tight">Your Garden</h1>
            <p className="text-sm text-white/40 leading-relaxed">Growth happens one day at a time.</p>
          </div>

          <SeedVisual stage={currentStage.name} />

          <div className="w-full mt-12 space-y-8">
            <Card className="glass glow bg-white/5 border-white/10 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Stage: {currentStage.name}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{daysToNext} days to next phase</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${progress}%`,
                    boxShadow: ["0 0 10px rgba(34,211,238,0.2)", "0 0 20px rgba(34,211,238,0.6)", "0 0 10px rgba(34,211,238,0.2)"]
                  }}
                  transition={{ 
                    width: { duration: 1.5, ease: "easeOut" },
                    boxShadow: { duration: 2, repeat: Infinity }
                  }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                />
              </div>
            </Card>

            <div className="grid grid-cols-4 gap-2">
              {MILESTONES.map((m) => {
                const isUnlocked = streak >= m.day;
                return (
                  <motion.button
                    key={m.day}
                    whileHover={isUnlocked ? { scale: 1.05 } : {}}
                    whileTap={isUnlocked ? { scale: 0.95 } : {}}
                    initial={isUnlocked ? { scale: 0.9, opacity: 0 } : {}}
                    animate={isUnlocked ? { 
                      scale: 1, 
                      opacity: 1,
                      boxShadow: ["0 0 0px rgba(34,197,94,0)", "0 0 15px rgba(34,197,94,0.2)", "0 0 0px rgba(34,197,94,0)"]
                    } : {}}
                    transition={{
                      scale: { type: "spring", damping: 15 },
                      boxShadow: { duration: 3, repeat: Infinity }
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      isUnlocked 
                        ? "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                        : "bg-white/5 border-white/10 text-white/20 opacity-50"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                      {isUnlocked ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{m.day}d</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Atmosphere</p>
                <div className="text-sm font-bold text-white/80 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-500/50" /> {panicStats.urgesResisted} Resisted
                </div>
              </Card>
              <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Vitality</p>
                <div className="text-sm font-bold text-white/80 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" /> {streak} Day Orbit
                </div>
              </Card>
            </div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-auto px-4"
        >
          <Card className="glass bg-white/5 border-white/10 p-5 rounded-[1.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Garden Reflection</p>
            <p className="text-[15px] text-white/70 italic leading-relaxed font-[var(--font-serif)]">
              "{reflection}"
            </p>
          </Card>
        </motion.div>

        <footer className="mt-8 text-center pb-4">
          <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-black">
            Organic Growth • Deep Systems
          </p>
        </footer>
      </div>
    </div>
  );
}
