import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  CalendarCheck,
  Flame,
  Gem,
  CheckCircle2,
  Wind,
  Timer,
  Activity,
  ChevronRight,
  Smile,
  AlertCircle,
  TrendingUp,
  History,
  RotateCcw,
  Sparkles,
  Zap,
  Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const CHECKINS_KEY = "orbit:checkins_v1";
const STREAK_KEY = "orbit:streak";
const ORBS_KEY = "orbit:orbs";
const LAST_DONE_KEY = "orbit:lastDone";
const FREE_SINCE_KEY = "orbit:freeSince";

const TRIGGERS = [
  { id: "stress", label: "Stress", icon: "😰" },
  { id: "boredom", label: "Boredom", icon: "🥱" },
  { id: "loneliness", label: "Loneliness", icon: "🫂" },
  { id: "tiredness", label: "Tiredness", icon: "😴" },
  { id: "social", label: "Social Media", icon: "📱" },
  { id: "late-night", label: "Late Night", icon: "🌙" }
];

const WINS = [
  "Exercise", "Hydrated", "Cold Shower", "Journaled", "Read", "No Cues"
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DailyCheckin() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0); // 0: mood, 1: urge, 2: triggers, 3: wins/relapse, 4: summary
  const [mood, setMood] = useState<number | null>(null);
  const [urge, setUrge] = useState(0);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedWins, setSelectedWins] = useState<string[]>([]);
  const [relapsed, setRelapsed] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleTrigger = (id: string) => {
    setSelectedTriggers(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleToggleWin = (win: string) => {
    setSelectedWins(prev => prev.includes(win) ? prev.filter(w => w !== win) : [...prev, win]);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const checkin = {
        id: Math.random().toString(36).substring(7),
        dateISO: new Date().toISOString(),
        mood,
        urge,
        triggers: selectedTriggers,
        wins: selectedWins,
        relapseBool: relapsed,
        note
      };

      // Save checkin
      const raw = localStorage.getItem(CHECKINS_KEY);
      const allCheckins = raw ? JSON.parse(raw) : [];
      localStorage.setItem(CHECKINS_KEY, JSON.stringify([checkin, ...allCheckins]));

      // Update streak and orbs
      const streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      const orbs = Number(localStorage.getItem(ORBS_KEY) || 0);

      if (relapsed) {
        localStorage.setItem(STREAK_KEY, "0");
        localStorage.setItem(FREE_SINCE_KEY, new Date().toISOString());
      } else {
        const lastDone = localStorage.getItem(LAST_DONE_KEY);
        if (lastDone !== todayKey()) {
          localStorage.setItem(STREAK_KEY, String(streak + 1));
          localStorage.setItem(ORBS_KEY, String(orbs + 5));
          localStorage.setItem(LAST_DONE_KEY, todayKey());
        }
      }

      setIsSubmitting(false);
      setStep(4);
    }, 1200);
  };

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70 active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase mb-1">Daily Ritual</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <CalendarCheck className="h-4 w-4 text-cyan-400" />
              <span className="tracking-tight">Personal Inventory</span>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center">
             <Star className="h-4 w-4 text-white/10" />
          </div>
        </header>

        {step < 4 && (
          <div className="flex justify-center gap-2 mb-10 px-6">
            {[0, 1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                animate={{ 
                  scale: i === step ? 1.1 : 1,
                  opacity: i <= step ? 1 : 0.2
                }}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="mood"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="text-center pt-2">
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-3 tracking-tight">How are you feeling?</h1>
                  <p className="text-sm text-white/40 px-10 leading-relaxed">Honesty is the first step toward self-mastery. Scan your internal landscape.</p>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`aspect-square rounded-[1.25rem] border transition-all duration-300 flex flex-col items-center justify-center gap-2 relative overflow-hidden group active:scale-95 ${
                        mood === m 
                          ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className={`text-2xl transition-transform duration-300 ${mood === m ? 'scale-125' : 'group-hover:scale-110'}`}>
                        {["😔", "😕", "😐", "🙂", "✨"][m-1]}
                      </span>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter">{m}</span>
                      {mood === m && (
                        <motion.div 
                          layoutId="mood-glow"
                          className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" 
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <Button 
                    disabled={mood === null}
                    onClick={() => setStep(1)}
                    className="w-full grad-pill h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] border border-white/10 text-white"
                  >
                    Continue Ritual
                    <ChevronRight className="ml-1 h-5 w-5 opacity-50" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="urge"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="text-center pt-2">
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-3 tracking-tight">Urge Intensity</h1>
                  <p className="text-sm text-white/40 px-10 leading-relaxed">Observe the wave without being swept away. How strong is the pull today?</p>
                </div>

                <Card className="glass glow bg-white/5 border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                  <div className="text-center mb-10 relative">
                    <motion.span 
                      key={urge}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-8xl font-black block leading-none tracking-tighter ${urge > 7 ? 'text-rose-400' : urge > 4 ? 'text-amber-400' : 'text-cyan-400'}`}
                    >
                      {urge}
                    </motion.span>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mt-4">Intensity Scale</p>
                  </div>
                  
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={urge}
                      onChange={(e) => setUrge(Number(e.target.value))}
                      className="w-full accent-cyan-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer mb-6"
                    />
                    <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                      <span>Quiet</span>
                      <span>Peak Wave</span>
                    </div>
                  </div>
                </Card>

                <Button 
                  onClick={() => setStep(2)}
                  className="w-full grad-pill h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] border border-white/10 text-white"
                >
                  Document Patterns
                  <ChevronRight className="ml-1 h-5 w-5 opacity-50" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="triggers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center pt-2">
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-3 tracking-tight">External Factors</h1>
                  <p className="text-sm text-white/40 px-10 leading-relaxed">Identify the cues that attempt to hijack your attention.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TRIGGERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTrigger(t.id)}
                      className={`p-5 rounded-[1.5rem] border transition-all duration-300 text-left flex items-center gap-4 active:scale-[0.97] ${
                        selectedTriggers.includes(t.id)
                          ? "bg-white/15 border-white/30 shadow-lg shadow-white/5 ring-1 ring-white/10"
                          : "bg-white/5 border-white/10 text-white/40"
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className={`text-sm font-bold tracking-tight ${selectedTriggers.includes(t.id) ? 'text-white' : 'text-white/60'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 px-2">Inner Reflection</p>
                  <textarea
                    placeholder="Briefly observe your thoughts..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[15px] text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none shadow-inner"
                  />
                </div>

                <Button 
                  onClick={() => setStep(3)}
                  className="w-full grad-pill h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] border border-white/10 text-white"
                >
                  Finalize Log
                  <ChevronRight className="ml-1 h-5 w-5 opacity-50" />
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="final"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center pt-2">
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] mb-3 tracking-tight">Wins & State</h1>
                  <p className="text-sm text-white/40 px-10 leading-relaxed">Acknowledge your progress and maintain radical honesty.</p>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 px-2 text-center">Daily Victories</p>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {WINS.map(win => (
                      <button
                        key={win}
                        onClick={() => handleToggleWin(win)}
                        className={`px-5 py-2.5 rounded-2xl border text-[11px] font-bold transition-all duration-300 active:scale-95 ${
                          selectedWins.includes(win)
                            ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                            : "bg-white/5 border-white/10 text-white/50"
                        }`}
                      >
                        {win}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Card 
                    onClick={() => setRelapsed(!relapsed)}
                    className={`glass cursor-pointer rounded-[2rem] transition-all duration-500 active:scale-[0.98] border shadow-xl ${
                      relapsed ? 'bg-rose-500/10 border-rose-500/40 shadow-rose-500/5' : 'bg-white/5 border-white/10 hover:bg-white/8'
                    }`}
                  >
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${relapsed ? 'bg-rose-500/20' : 'bg-white/5'}`}>
                           <AlertCircle className={`h-6 w-6 ${relapsed ? 'text-rose-400' : 'text-white/20'}`} />
                        </div>
                        <div>
                          <h3 className={`text-[15px] font-black uppercase tracking-tight ${relapsed ? 'text-rose-400' : 'text-white'}`}>Report a slip</h3>
                          <p className="text-[11px] text-white/30 font-bold uppercase tracking-wider">Radical Honesty required</p>
                        </div>
                      </div>
                      <div className={`h-6 w-12 rounded-full relative transition-colors duration-500 ${relapsed ? 'bg-rose-500' : 'bg-white/10'}`}>
                        <motion.div 
                          animate={{ x: relapsed ? 24 : 4 }}
                          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-lg" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4">
                  <Button 
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="w-full grad-pill h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98] border border-white/20 text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-3">
                         <Activity className="h-5 w-5 animate-spin" /> Transmitting Log...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Complete Synchronization <CheckCircle2 className="h-6 w-6 opacity-50" />
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10 text-center py-8"
              >
                <div className="relative mx-auto w-44 h-44 mb-4">
                  <div className="absolute inset-0 bg-cyan-500/30 blur-[80px] rounded-full animate-pulse" />
                  <motion.div 
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="relative h-44 w-44 rounded-full border-4 border-cyan-500/30 grid place-items-center bg-black/40 backdrop-blur-3xl shadow-[0_0_60px_rgba(6,182,212,0.4)]"
                  >
                    <Sparkles className="h-20 w-20 text-cyan-400 filter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-black uppercase tracking-[0.4em] py-1.5 bg-cyan-500/10 px-6 mb-2">Protocol Verified</Badge>
                  <h1 className="text-4xl font-bold text-white font-[var(--font-serif)] tracking-tight">Check-in Complete</h1>
                  <p className="text-sm text-white/50 px-10 leading-relaxed">
                    {relapsed 
                      ? "A slip is merely a course correction. Your trajectory remains upward. Resetting orbit now."
                      : "The habit loop weakens. Your intentional presence is the ultimate weapon."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 px-2">
                  <Card className="glass bg-white/5 border-white/10 p-6 rounded-[2rem] shadow-xl group hover:bg-white/8 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Current Streak</p>
                    <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                      <Flame className="h-6 w-6 text-orange-500 fill-orange-500/20 group-hover:scale-110 transition-transform" /> {localStorage.getItem(STREAK_KEY) || 0}
                    </div>
                  </Card>
                  <Card className="glass bg-white/5 border-white/10 p-6 rounded-[2rem] shadow-xl group hover:bg-white/8 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Reward Earned</p>
                    <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                      <Zap className="h-6 w-6 text-cyan-400 fill-cyan-400/20 group-hover:scale-110 transition-transform" /> +5
                    </div>
                  </Card>
                </div>

                <div className="pt-6">
                  <Button 
                    onClick={() => navigate("/home")}
                    className="w-full bg-white text-black hover:bg-white/90 h-16 rounded-[1.5rem] font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
                  >
                    Return to Orbit
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-10 text-center px-4 pb-6">
          <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-[0.4em] font-black">
             Data Sovereignty • Non-Judgmental Space
          </p>
        </footer>
      </div>
    </div>
  );
}
