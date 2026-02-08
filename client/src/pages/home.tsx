import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Sparkles,
  ShieldAlert,
  Flame,
  Gem,
  CalendarCheck,
  BookOpen,
  Users,
  User,
  RotateCcw,
  MessageCircle,
  Activity,
  Clock,
  TrendingUp,
  Leaf,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ONBOARDING_KEY = "orbit:onboarding";
const PROFILE_KEY = "orbit:profile";
const STREAK_KEY = "orbit:streak";
const ORBS_KEY = "orbit:orbs";
const FREE_SINCE_KEY = "orbit:freeSince";
const LAST_DONE_KEY = "orbit:lastDone";

function safeNumber(v: string | null, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [, navigate] = useLocation();

  const onboarding = useMemo(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const profile = useMemo(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const name = (onboarding?.name as string) || "Friend";
  const seedName = (profile?.seedName as string) || "Origin Seed";
  const signaturePreview = (profile?.signaturePreview as string) || "";

  const [streak, setStreak] = useState(0);
  const [orbs, setOrbs] = useState(0);
  const [freeSince, setFreeSince] = useState<string | null>(null);
  const [lastDone, setLastDone] = useState<string | null>(null);
  const [nextLesson, setNextLesson] = useState("Dopamine & the Habit Loop");
  const [panicStats, setPanicStats] = useState({ urgesResisted: 0 });
  const [focusStats, setFocusStats] = useState({ distractionsResisted: 0, totalFocusMinutes: 0 });
  const [focusProgress, setFocusProgress] = useState({ level: 1 });

  useEffect(() => {
    const s = safeNumber(localStorage.getItem(STREAK_KEY), 0);
    const o = safeNumber(localStorage.getItem(ORBS_KEY), 0);
    const fs = localStorage.getItem(FREE_SINCE_KEY);
    const ld = localStorage.getItem(LAST_DONE_KEY);

    // Panic stats
    try {
      const raw = localStorage.getItem("orbit:panic_v1");
      if (raw) setPanicStats(JSON.parse(raw).stats);
    } catch (e) {}

    // Focus stats
    try {
      const raw = localStorage.getItem("orbit:focus_v1");
      if (raw) setFocusStats(JSON.parse(raw).focusStats);
      
      const progressRaw = localStorage.getItem("orbit:focus_progress_v1");
      if (progressRaw) {
        const p = JSON.parse(progressRaw);
        setFocusProgress(p);
      }
    } catch (e) {}

    // Learn progress check for home card
    try {
      const learnRaw = localStorage.getItem("learn_v1");
      if (learnRaw) {
        const progress = JSON.parse(learnRaw);
        if (progress.completed && progress.completed.length > 0) {
          setNextLesson("Continue your journey");
        }
      }
    } catch (e) {}

    if (localStorage.getItem(STREAK_KEY) === null)
      localStorage.setItem(STREAK_KEY, "0");
    if (localStorage.getItem(ORBS_KEY) === null)
      localStorage.setItem(ORBS_KEY, "0");
    if (!fs) localStorage.setItem(FREE_SINCE_KEY, new Date().toISOString());

    setStreak(s);
    setOrbs(o);
    setFreeSince(localStorage.getItem(FREE_SINCE_KEY));
    setLastDone(ld);
  }, []);

  const doneToday = lastDone === todayKey();

  function markTodayComplete() {
    const tk = todayKey();
    if (lastDone === tk) return;

    const nextStreak = streak + 1;
    const nextOrbs = orbs + 3;

    setStreak(nextStreak);
    setOrbs(nextOrbs);
    setLastDone(tk);

    localStorage.setItem(STREAK_KEY, String(nextStreak));
    localStorage.setItem(ORBS_KEY, String(nextOrbs));
    localStorage.setItem(LAST_DONE_KEY, tk);

    if (!localStorage.getItem(FREE_SINCE_KEY)) {
      localStorage.setItem(FREE_SINCE_KEY, new Date().toISOString());
      setFreeSince(localStorage.getItem(FREE_SINCE_KEY));
    }
  }

  function relapseReset() {
    setStreak(0);
    const nextOrbs = Math.max(0, orbs - 5);
    setOrbs(nextOrbs);
    setLastDone(null);

    localStorage.setItem(STREAK_KEY, "0");
    localStorage.setItem(ORBS_KEY, String(nextOrbs));
    localStorage.removeItem(LAST_DONE_KEY);
    localStorage.setItem(FREE_SINCE_KEY, new Date().toISOString());
    setFreeSince(localStorage.getItem(FREE_SINCE_KEY));
  }

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-xs font-medium tracking-[0.22em] text-white/60"
                data-testid="text-home-brand"
              >
                ORBIT
              </div>
              <div
                className="mt-1 text-sm text-white/70"
                data-testid="text-home-hello"
              >
                Hi {name}
              </div>
            </div>

            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              onClick={() => navigate("/welcome")}
              data-testid="button-home-restart"
            >
              Restart intro
            </button>
          </div>

          <Card className="glass glow mt-6 overflow-hidden fade-up">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase"
                    data-testid="text-seed-kicker"
                  >
                    Your Journey
                  </div>
                  <div
                    className="mt-1 text-base font-bold text-white tracking-tight"
                    data-testid="text-seed-name"
                  >
                    {seedName}
                  </div>
                  <div
                    className="mt-2 text-xs text-white/60"
                    data-testid="text-free-since"
                  >
                    Free since {formatDate(freeSince)}
                  </div>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 shadow-lg pulse-glow">
                  <Sparkles
                    className="h-7 w-7 text-white"
                    strokeWidth={1.8}
                  />
                </div>
              </div>

              <div
                className="mt-5 grid grid-cols-3 gap-3"
                data-testid="grid-stats"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div
                    className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium"
                    data-testid="text-stat-streak-label"
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    Streak
                  </div>
                  <div
                    className="mt-2 text-2xl font-bold text-white tracking-tight"
                    data-testid="text-stat-streak-value"
                  >
                    {streak}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div
                    className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium"
                    data-testid="text-stat-orbs-label"
                  >
                    <Gem className="h-3.5 w-3.5 text-purple-400" />
                    Orbs
                  </div>
                  <div
                    className="mt-2 text-2xl font-bold text-white tracking-tight"
                    data-testid="text-stat-orbs-value"
                  >
                    {orbs}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div
                    className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium"
                    data-testid="text-stat-today-label"
                  >
                    <CalendarCheck className="h-3.5 w-3.5 text-cyan-400" />
                    Today
                  </div>
                  <div
                    className="mt-2 text-sm font-bold text-white"
                    data-testid="text-stat-today-value"
                  >
                    {doneToday ? "Done" : "Not yet"}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  className={`w-full rounded-full border px-6 py-5 text-base font-bold transition-all btn-press min-tap ${
                    doneToday
                      ? "border-white/10 bg-white/5 text-white/50"
                      : "grad-pill shine text-white"
                  }`}
                  onClick={markTodayComplete}
                  disabled={doneToday}
                  data-testid="button-mark-today-complete"
                >
                  {doneToday ? "Today complete" : "Mark today complete"}
                </button>

                <button
                  type="button"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-5 text-base font-semibold text-white/80 transition-all hover:bg-white/8 btn-press min-tap"
                  onClick={relapseReset}
                  data-testid="button-relapse-reset"
                >
                  I slipped — reset streak
                </button>

                <button
                  type="button"
                  className="w-full group relative rounded-full border border-rose-500/30 bg-rose-500/10 px-6 py-5 text-base font-black text-rose-400 transition-all hover:bg-rose-500/15 hover:border-rose-500/40 btn-press min-tap overflow-hidden"
                  onClick={() => navigate("/panic")}
                  data-testid="button-panic"
                >
                  <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                    Panic Button
                  </span>
                </button>

                <button
                  type="button"
                  className="w-full group relative rounded-full border border-purple-500/30 bg-purple-500/10 px-6 py-5 text-base font-black text-purple-400 transition-all hover:bg-purple-500/15 hover:border-purple-500/40 btn-press min-tap overflow-hidden"
                  onClick={() => navigate("/focus")}
                  data-testid="button-focus"
                >
                  <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Focus Button
                  </span>
                </button>
              </div>

              {(panicStats.urgesResisted > 0 || focusStats.totalFocusMinutes > 0) && (
                <div className="mt-5 space-y-2">
                  {panicStats.urgesResisted > 0 && (
                    <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-widest text-white/30">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-rose-500/50" />
                        Urges Resisted: <span className="text-white/60">{panicStats.urgesResisted}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Last Rescue: Today
                      </div>
                    </div>
                  )}
                  {focusStats.totalFocusMinutes > 0 && (
                    <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-widest text-white/30">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3 w-3 text-purple-500/50" />
                        Focus Time: <span className="text-white/60">{focusStats.totalFocusMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-purple-500/50" />
                        Resisted: <span className="text-white/60">{focusStats.distractionsResisted}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div
                className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4"
                data-testid="card-signature-preview"
              >
                <div
                  className="text-xs font-semibold tracking-[0.18em] text-white/60"
                  data-testid="text-signature-preview-kicker"
                >
                  SIGNATURE PREVIEW
                </div>
                <div
                  className="mt-2 min-h-[44px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-[var(--font-scribble)] text-[18px] text-white/80"
                  data-testid="text-signature-preview"
                >
                  {signaturePreview || "—"}
                </div>
              </div>

              <p
                className="mt-5 text-[11px] leading-relaxed text-white/55"
                data-testid="text-home-disclaimer"
              >
                Prototype only. This app provides support tools and habit
                tracking, not medical advice.
              </p>
            </CardContent>
          </Card>

          <div
            className="mt-5 grid grid-cols-2 gap-3"
            data-testid="grid-home-actions"
          >
            <button
              type="button"
              className="glass-card glass-card-hover relative flex flex-col items-center justify-center gap-3 overflow-hidden p-5 text-center btn-press min-tap"
              onClick={() => navigate("/garden")}
              data-testid="button-home-seed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/10 shadow-lg">
                <Leaf className="h-7 w-7 text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
              </div>
              <div className="relative space-y-1">
                <div className="text-sm font-bold text-white tracking-tight">Your Seed</div>
                <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  {streak >= 7 ? "Sprout" : "Seed"}
                </div>
              </div>
            </button>

            <button
              type="button"
              className="glass-card glass-card-hover relative p-5 text-left btn-press min-tap"
              onClick={() => navigate("/coach")}
              data-testid="button-coach"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <MessageCircle className="h-5 w-5 text-cyan-400" />
              </div>
              <div
                className="mt-3 text-sm font-bold text-white tracking-tight"
                data-testid="text-coach-title"
              >
                AI Coach
              </div>
              <div
                className="mt-1 text-xs text-white/60"
                data-testid="text-coach-body"
              >
                Always by your side
              </div>
              <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse" />
            </button>

            <button
              type="button"
              className="glass-card glass-card-hover p-5 text-left btn-press min-tap"
              onClick={() => navigate("/daily")}
              data-testid="button-daily-checkin"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <CalendarCheck className="h-5 w-5 text-amber-400" />
              </div>
              <div
                className="mt-3 text-sm font-bold text-white tracking-tight"
                data-testid="text-daily-checkin-title"
              >
                Daily Check-in
              </div>
              <div
                className="mt-1 text-xs text-white/60"
                data-testid="text-daily-checkin-body"
              >
                {doneToday ? "See summary" : "Reflect & reset"}
              </div>
            </button>

            <button
              type="button"
              className="glass-card glass-card-hover p-5 text-left btn-press min-tap"
              onClick={() => navigate("/learn")}
              data-testid="button-learn"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <BookOpen className="h-5 w-5 text-purple-400" />
              </div>
              <div
                className="mt-3 text-sm font-bold text-white tracking-tight"
                data-testid="text-learn-title"
              >
                Learn
              </div>
              <div
                className="mt-1 text-xs text-white/60 line-clamp-1"
                data-testid="text-learn-body"
              >
                {nextLesson}
              </div>
            </button>

            <button
              type="button"
              className="glass-card glass-card-hover p-5 text-left btn-press min-tap"
              onClick={() => navigate("/community")}
              data-testid="button-community"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div
                className="mt-3 text-sm font-bold text-white tracking-tight"
                data-testid="text-community-title-home"
              >
                Community
              </div>
              <div
                className="mt-1 text-xs text-white/60"
                data-testid="text-community-body-home"
              >
                1.2k online
              </div>
            </button>

            <button
              type="button"
              className="glass-card glass-card-hover p-5 text-left btn-press min-tap"
              onClick={() => alert("Profile UI only (prototype).")}
              data-testid="button-profile"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <User className="h-5 w-5 text-white/80" />
              </div>
              <div
                className="mt-3 text-sm font-bold text-white tracking-tight"
                data-testid="text-profile-title"
              >
                Profile (Lvl {focusProgress.level})
              </div>
              <div
                className="mt-1 text-xs text-white/60"
                data-testid="text-profile-body"
              >
                Settings
              </div>
            </button>
          </div>

          <div
            className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4"
            data-testid="card-reset"
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className="text-xs font-semibold tracking-[0.18em] text-white/60"
                  data-testid="text-reset-kicker"
                >
                  PROTOTYPE
                </div>
                <div
                  className="mt-1 text-xs text-white/70"
                  data-testid="text-reset-body"
                >
                  Reset all local data if you want to re-test onboarding.
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                onClick={() => {
                  localStorage.removeItem(ONBOARDING_KEY);
                  localStorage.removeItem(PROFILE_KEY);
                  localStorage.removeItem(STREAK_KEY);
                  localStorage.removeItem(ORBS_KEY);
                  localStorage.removeItem(FREE_SINCE_KEY);
                  localStorage.removeItem(LAST_DONE_KEY);
                  navigate("/welcome");
                }}
                data-testid="button-reset-all"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
