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
  RotateCcw
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
    <div className="min-h-dvh app-bg text-foreground flex flex-col">
      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => step === 4 ? navigate("/home") : navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase mb-1">Ritual</div>
            <div className="text-sm font-semibold text-white flex items-center justify-center gap-2">
              <CalendarCheck className="h-4 w-4 text-cyan-400" /> Daily Check-in
            </div>
          </div>
          <div className="w-10" />
        </header>

        {step < 4 && (
          <div className="flex gap-1.5 mb-8 px-2">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "bg-white/10"
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] mb-2">How are you feeling?</h1>
                  <p className="text-sm text-white/40">Select your current emotional state</p>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                        mood === m 
                          ? "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-2xl">{["😔", "😕", "😐", "🙂", "✨"][m-1]}</span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{m}</span>
                    </button>
                  ))}
                </div>

                <Button 
                  disabled={mood === null}
                  onClick={() => setStep(1)}
                  className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl text-base mt-8"
                >
                  Continue <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="urge"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] mb-2">Urge Intensity</h1>
                  <p className="text-sm text-white/40">How strong are the cravings today?</p>
                </div>

                <Card className="glass glow bg-white/5 border-white/10 p-8">
                  <div className="text-center mb-6">
                    <span className={`text-6xl font-black ${urge > 7 ? 'text-rose-400' : urge > 4 ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {urge}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mt-2">Level 0 - 10</p>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={urge}
                    onChange={(e) => setUrge(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <span>None</span>
                    <span>Intense</span>
                  </div>
                </Card>

                <Button 
                  onClick={() => setStep(2)}
                  className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl text-base"
                >
                  Continue <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="triggers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] mb-2">Any Triggers?</h1>
                  <p className="text-sm text-white/40">What influenced your cravings today?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TRIGGERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTrigger(t.id)}
                      className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                        selectedTriggers.includes(t.id)
                          ? "bg-white/10 border-white/30 ring-1 ring-white/20"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-sm font-semibold text-white/80">{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Optional Note</p>
                  <textarea
                    placeholder="Write a brief reflection..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none resize-none"
                  />
                </div>

                <Button 
                  onClick={() => setStep(3)}
                  className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl text-base"
                >
                  Continue <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="final"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] mb-2">Wins & Status</h1>
                  <p className="text-sm text-white/40">Celebrate your growth</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Daily Wins</p>
                  <div className="flex flex-wrap gap-2">
                    {WINS.map(win => (
                      <button
                        key={win}
                        onClick={() => handleToggleWin(win)}
                        className={`px-4 py-2 rounded-full border text-xs font-bold transition ${
                          selectedWins.includes(win)
                            ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                            : "bg-white/5 border-white/10 text-white/60"
                        }`}
                      >
                        {win}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <Card className={`glass transition-all ${relapsed ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/10'}`}>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <h3 className={`text-sm font-bold ${relapsed ? 'text-rose-400' : 'text-white'}`}>I relapsed today</h3>
                        <p className="text-xs text-white/40">Honesty is the path to recovery</p>
                      </div>
                      <button 
                        onClick={() => setRelapsed(!relapsed)}
                        className={`h-6 w-12 rounded-full relative transition-colors ${relapsed ? 'bg-rose-500' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${relapsed ? 'left-7' : 'left-1'}`} />
                      </button>
                    </CardContent>
                  </Card>
                </div>

                <Button 
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl text-base mt-4"
                >
                  {isSubmitting ? "Saving Experience..." : "Complete Check-in"}
                </Button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-8"
              >
                <div className="relative mx-auto w-32 h-32 mb-8">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                  <div className="relative h-32 w-32 rounded-full border-2 border-cyan-500/30 grid place-items-center bg-black/40 backdrop-blur-md">
                    <CheckCircle2 className="h-16 w-16 text-cyan-400" />
                  </div>
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] mb-2">Check-in Complete</h1>
                  <p className="text-sm text-white/60 leading-relaxed px-8">
                    {relapsed 
                      ? "A slip is a lesson, not a failure. Tomorrow is a new start in your orbit."
                      : "Another day of intentional living. Your seed continues to grow stronger."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Card className="glass bg-white/5 border-white/10 p-4">
                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Streak</div>
                    <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                      <Flame className="h-5 w-5 text-orange-400" /> {localStorage.getItem(STREAK_KEY)}
                    </div>
                  </Card>
                  <Card className="glass bg-white/5 border-white/10 p-4">
                    <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Orbs</div>
                    <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                      <Gem className="h-5 w-5 text-cyan-400" /> {localStorage.getItem(ORBS_KEY)}
                    </div>
                  </Card>
                </div>

                <Button 
                  onClick={() => navigate("/home")}
                  className="w-full bg-white text-black hover:bg-white/90 h-14 rounded-2xl font-bold shadow-xl text-base"
                >
                  Return Home
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-8 text-center px-4 pb-4">
          <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-[0.15em] font-bold">
            Honest Tracking • Real Progress
          </p>
        </footer>
      </div>
    </div>
  );
}
