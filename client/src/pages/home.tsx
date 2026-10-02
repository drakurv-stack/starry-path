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
import { AppNav } from "@/components/app-nav";

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
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 pb-32 sm:px-8">
        <div className="page-in">
          <header className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-xs font-semibold tracking-[0.24em] text-muted-foreground"
                data-testid="text-home-brand"
              >
                ORBIT
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Your recovery dashboard
                </p>
                <h1
                  className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
                  data-testid="text-home-hello"
                >
                  Hi {name}
                </h1>
              </div>
            </div>

            <button
              type="button"
              className="min-tap rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
              onClick={() => navigate("/welcome")}
              data-testid="button-home-restart"
            >
              Restart intro
            </button>
          </header>

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <Card className="rounded-[26px] border-border bg-card shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                      data-testid="text-seed-kicker"
                    >
                      Your journey
                    </p>
                    <h2
                      className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
                      data-testid="text-seed-name"
                    >
                      {seedName}
                    </h2>
                    <p
                      className="mt-2 text-sm text-muted-foreground"
                      data-testid="text-free-since"
                    >
                      Free since {formatDate(freeSince)}
                    </p>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                    <Sparkles className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3" data-testid="grid-stats">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                      data-testid="text-stat-streak-label"
                    >
                      <Flame className="h-4 w-4 text-[#b87549]" aria-hidden="true" />
                      Streak
                    </div>
                    <div
                      className="mt-3 text-3xl font-semibold tracking-tight"
                      data-testid="text-stat-streak-value"
                    >
                      {streak}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">days</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                      data-testid="text-stat-orbs-label"
                    >
                      <Gem className="h-4 w-4 text-primary" aria-hidden="true" />
                      Orbs
                    </div>
                    <div
                      className="mt-3 text-3xl font-semibold tracking-tight"
                      data-testid="text-stat-orbs-value"
                    >
                      {orbs}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">collected</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                      data-testid="text-stat-today-label"
                    >
                      <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                      Today
                    </div>
                    <div
                      className={`mt-3 text-lg font-semibold tracking-tight ${doneToday ? "text-primary" : "text-foreground"}`}
                      data-testid="text-stat-today-value"
                    >
                      {doneToday ? "Done" : "Not yet"}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doneToday ? "Keep going" : "One small step"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className={`min-tap flex-1 rounded-xl border px-5 py-3.5 text-sm font-semibold transition-colors btn-press ${
                      doneToday
                        ? "border-border bg-secondary text-muted-foreground"
                        : "border-primary bg-primary text-primary-foreground hover:border-[#3f6250] hover:bg-[#3f6250]"
                    }`}
                    onClick={markTodayComplete}
                    disabled={doneToday}
                    data-testid="button-mark-today-complete"
                  >
                    {doneToday ? "Today complete" : "Mark today complete"}
                  </button>
                  <button
                    type="button"
                    className="min-tap rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground btn-press"
                    onClick={relapseReset}
                    data-testid="button-relapse-reset"
                  >
                    I slipped — reset streak
                  </button>
                </div>

                <div
                  className="mt-8 rounded-2xl border border-border bg-background p-4"
                  data-testid="card-signature-preview"
                >
                  <div
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                    data-testid="text-signature-preview-kicker"
                  >
                    Personal note
                  </div>
                  <div
                    className="mt-3 min-h-[44px] rounded-xl border border-border bg-card px-3 py-2 font-[var(--font-scribble)] text-lg text-foreground"
                    data-testid="text-signature-preview"
                  >
                    {signaturePreview || "Add a note during setup"}
                  </div>
                </div>

                <p
                  className="mt-6 text-xs leading-relaxed text-muted-foreground"
                  data-testid="text-home-disclaimer"
                >
                  Prototype only. Orbit provides support tools and habit tracking, not medical advice.
                </p>
              </CardContent>
            </Card>

            <div className="grid content-start gap-5">
              <Card className="rounded-[26px] border-[#d9b9aa] bg-[#f7ebe6] shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a4a3c]">
                        Need support now?
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#442a23]">
                        A calmer next step
                      </h2>
                    </div>
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ead3c8] text-[#9e5c49]">
                      <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#69443a]">
                    Open a short guided reset when an urge feels close. You do not have to work through it alone.
                  </p>
                  <button
                    type="button"
                    className="min-tap mt-5 w-full rounded-xl border border-[#9e5c49] bg-[#9e5c49] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#874c3c] btn-press"
                    onClick={() => navigate("/panic")}
                    data-testid="button-panic"
                  >
                    Open Panic Button
                  </button>
                  {panicStats.urgesResisted > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-[#d9b9aa] pt-4 text-xs text-[#69443a]">
                      <span className="inline-flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                        Urges resisted
                      </span>
                      <span className="font-semibold">{panicStats.urgesResisted}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[26px] border-[#cbd8cf] bg-[#eef3ef] shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9e7dc] text-primary">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#41604d]">
                        Premium preview
                      </p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#26382d]">
                        More room to grow
                      </h2>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#3e5747]">
                    Deeper patterns, guided plans, and more ways to make progress visible.
                  </p>
                  <button
                    type="button"
                    className="min-tap mt-5 inline-flex items-center gap-2 rounded-xl border border-[#9db2a2] bg-card px-4 py-3 text-sm font-semibold text-[#355340] transition-colors hover:bg-[#e4ede6] btn-press"
                    onClick={() => alert("Premium preview only (prototype).")}
                  >
                    See what is included
                    <span aria-hidden="true">→</span>
                  </button>
                </CardContent>
              </Card>

              {(focusStats.totalFocusMinutes > 0 || focusStats.distractionsResisted > 0) && (
                <Card className="rounded-[26px] border-border bg-card shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Focus practice
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {focusStats.totalFocusMinutes} minutes protected
                        </p>
                      </div>
                      <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {focusStats.distractionsResisted} distractions resisted
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <section className="mt-10" aria-labelledby="keep-building-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Continue at your pace
                </p>
                <h2 id="keep-building-title" className="mt-2 text-xl font-semibold tracking-tight">
                  Keep building
                </h2>
              </div>
              <button
                type="button"
                className="hidden text-sm font-semibold text-primary hover:underline sm:block"
                onClick={() => navigate("/focus")}
              >
                Open focus
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="grid-home-actions">
              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => navigate("/garden")}
                data-testid="button-home-seed"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5eee7] text-primary">
                  <Leaf className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight">Your Seed</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {streak >= 7 ? "Sprout" : "Seed"} · view your garden
                </div>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => navigate("/coach")}
                data-testid="button-coach"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight" data-testid="text-coach-title">
                  AI Coach
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-coach-body">
                  A supportive check-in
                </div>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => navigate("/daily")}
                data-testid="button-daily-checkin"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3eadc] text-[#9a6a33]">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight" data-testid="text-daily-checkin-title">
                  Daily Check-in
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-daily-checkin-body">
                  {doneToday ? "See your summary" : "Reflect and reset"}
                </div>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => navigate("/urge-watch")}
                data-testid="button-urge-watch"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3eadc] text-[#79522f]">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight">UrgeWatch</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Notice personal patterns
                </div>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => navigate("/learn")}
                data-testid="button-learn"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight" data-testid="text-learn-title">
                  Learn
                </div>
                <div className="mt-1 line-clamp-1 text-sm text-muted-foreground" data-testid="text-learn-body">
                  {nextLesson}
                </div>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => navigate("/community")}
                data-testid="button-community"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5eee7] text-primary">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight" data-testid="text-community-title-home">
                  Community
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-community-body-home">
                  1.2k people learning together
                </div>
              </button>

              <button
                type="button"
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary btn-press min-tap"
                onClick={() => alert("Profile UI only (prototype).")}
                data-testid="button-profile"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="mt-5 text-base font-semibold tracking-tight" data-testid="text-profile-title">
                  Profile (Lvl {focusProgress.level})
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-profile-body">
                  Settings and preferences
                </div>
              </button>
            </div>
          </section>

          <div className="mt-8 rounded-2xl border border-border bg-card p-4" data-testid="card-reset">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground" data-testid="text-reset-kicker">
                  Prototype tools
                </div>
                <div className="mt-1 text-sm text-muted-foreground" data-testid="text-reset-body">
                  Reset local data if you want to test onboarding again.
                </div>
              </div>
              <button
                type="button"
                className="inline-flex min-tap items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
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
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      <AppNav />
    </div>
  );
}
