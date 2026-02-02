import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Lock,
  CheckCircle2,
  Trophy,
  Zap,
  Target,
  Sparkles,
  Mountain,
  Milestone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STREAK_KEY = "orbit:streak";

const TIMELINE_EVENTS = [
  { day: 1, title: "The Departure", icon: <Zap />, desc: "You've left the old atmosphere. The first day is the bravest." },
  { day: 3, title: "Initial Resistance", icon: <Mountain />, desc: "The urge is a wave. You are learning to surf it." },
  { day: 7, title: "Orbit Stability", icon: <Target />, desc: "Gravity is losing its grip. Momentum is building." },
  { day: 14, title: "Neurological Shift", icon: <Sparkles />, desc: "Dopamine receptors begin to reset. Focus returns." },
  { day: 30, title: "New Identity", icon: <Trophy />, desc: "You are no longer 'quitting'. You are a person who has evolved." },
  { day: 90, title: "Interstellar", icon: <Milestone />, desc: "The old default is gone. You are sailing in clear space." }
];

export default function GrowthTimeline() {
  const [, navigate] = useLocation();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(Number(localStorage.getItem(STREAK_KEY) || 0));
  }, []);

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/garden")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70 active:scale-95 transition-transform"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.3em] text-white/30 uppercase mb-1">Timeline</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Milestone className="h-4 w-4 text-purple-400" />
              <span className="tracking-tight">Growth Milestones</span>
            </div>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-2">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-cyan-500/50 to-transparent" />

            <div className="space-y-12">
              {TIMELINE_EVENTS.map((event, idx) => {
                const isUnlocked = streak >= event.day;
                return (
                  <motion.div 
                    key={event.day}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-14"
                  >
                    {/* Circle on line */}
                    <div className={`absolute left-[1.125rem] top-1 h-3.5 w-3.5 rounded-full border-2 transition-all duration-700 z-10 ${
                      isUnlocked ? "bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-black border-white/20"
                    }`} />

                    <Card className={`glass transition-all duration-500 rounded-[2rem] overflow-hidden ${
                      isUnlocked ? "bg-white/10 border-white/20 shadow-xl" : "bg-white/5 border-white/5 opacity-60"
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                            isUnlocked ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-white/20"
                          }`}>
                            {isUnlocked ? event.icon : <Lock className="h-4 w-4" />}
                          </div>
                          <div>
                            <Badge variant="outline" className={`text-[9px] font-black tracking-widest uppercase py-0.5 ${
                              isUnlocked ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/5" : "border-white/10 text-white/20"
                            }`}>
                              Day {event.day}
                            </Badge>
                            <h3 className={`text-[15px] font-bold tracking-tight ${isUnlocked ? "text-white" : "text-white/40"}`}>{event.title}</h3>
                          </div>
                        </div>
                        <p className={`text-xs leading-relaxed ${isUnlocked ? "text-white/60" : "text-white/20"}`}>
                          {event.desc}
                        </p>
                        {!isUnlocked && (
                          <div className="mt-4 text-[10px] font-bold text-cyan-400/40 uppercase tracking-widest">
                            {event.day - streak} days remaining
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center pb-4">
          <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-black">
            The Journey is the Destination
          </p>
        </footer>
      </div>
    </div>
  );
}
