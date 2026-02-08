import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Calendar,
  BarChart3,
  Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FOCUS_STORAGE_KEY = "orbit:focus_v1";

export default function FocusAnalytics() {
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setEvents(parsed.focusEvents || []);
        setStats(parsed.focusStats || {});
      } catch (e) {
        console.error("Failed to parse focus stats", e);
      }
    }
  }, []);

  const weeklyStats = (() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekEvents = events.filter(e => new Date(e.dateISO) >= startOfWeek);
    
    const dayStats = [0, 0, 0, 0, 0, 0, 0].map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const dayStr = day.toISOString().split('T')[0];
      const dayEvents = thisWeekEvents.filter(e => e.dateISO.startsWith(dayStr));
      return {
        label: ["S", "M", "T", "W", "T", "F", "S"][i],
        value: dayEvents.reduce((acc, curr) => acc + (curr.durationMin || 0), 0)
      };
    });

    const totalMin = thisWeekEvents.reduce((acc, curr) => acc + (curr.durationMin || 0), 0);
    const totalDistractions = thisWeekEvents.reduce((acc, curr) => acc + (curr.completed ? 1 : 0), 0);
    const sessions = thisWeekEvents.length;
    
    const maxVal = Math.max(...dayStats.map(d => d.value), 1);
    const bestDayIdx = dayStats.reduce((maxI, el, i, arr) => (el.value > arr[maxI].value ? i : maxI), 0);
    const bestDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][bestDayIdx];

    return { dayStats, totalMin, totalDistractions, sessions, maxVal, bestDay };
  })();

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4 relative z-10">
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/focus")} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <div className="text-[10px] font-black tracking-[0.3em] text-purple-400 uppercase mb-1">Analytics</div>
            <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="tracking-tight">Focus Growth</span>
            </div>
          </div>
          <div className="w-10" />
        </header>

        <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-20">
          <div className="grid grid-cols-2 gap-4">
            <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl">
              <Clock className="h-4 w-4 text-purple-400 mb-2" />
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Focus Time</div>
              <div className="text-2xl font-bold text-white">{weeklyStats.totalMin}m</div>
              <div className="text-[10px] text-purple-400/60 font-bold mt-1">This Week</div>
            </Card>
            <Card className="glass bg-white/5 border-white/10 p-4 rounded-3xl">
              <Zap className="h-4 w-4 text-blue-400 mb-2" />
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Defeated</div>
              <div className="text-2xl font-bold text-white">{weeklyStats.totalDistractions}</div>
              <div className="text-[10px] text-blue-400/60 font-bold mt-1">Distractions</div>
            </Card>
          </div>

          <Card className="glass bg-white/5 border-white/10 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Weekly Distribution</div>
              <Calendar className="h-4 w-4 text-white/20" />
            </div>
            <div className="flex items-end justify-between h-32 gap-2 px-2">
              {weeklyStats.dayStats.map((day, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600/20 to-purple-400 rounded-t-sm transition-all duration-500"
                    style={{ height: `${(day.value / weeklyStats.maxVal) * 100}%`, minHeight: day.value > 0 ? '4px' : '0px' }}
                  />
                  <span className="text-[10px] font-bold text-white/20">{day.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Best Focus Day</div>
                <div className="text-sm font-bold text-white">{weeklyStats.bestDay}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Focus Momentum</div>
                <div className="text-sm font-bold text-white">+{Math.round((weeklyStats.totalMin / 100) * 5)}% this week</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sessions Completed</div>
                <div className="text-sm font-bold text-white">{weeklyStats.sessions} Sprints</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pb-4">
          <Button onClick={() => navigate("/focus")} className="w-full h-14 rounded-2xl grad-pill text-white font-bold">
            Back to Focus Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
