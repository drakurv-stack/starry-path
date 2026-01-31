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

  useEffect(() => {
    const s = safeNumber(localStorage.getItem(STREAK_KEY), 0);
    const o = safeNumber(localStorage.getItem(ORBS_KEY), 0);
    const fs = localStorage.getItem(FREE_SINCE_KEY);
    const ld = localStorage.getItem(LAST_DONE_KEY);

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

          <Card className="glass glow mt-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="text-xs font-semibold tracking-[0.18em] text-white/60"
                    data-testid="text-seed-kicker"
                  >
                    YOUR SEED
                  </div>
                  <div
                    className="mt-1 text-sm font-semibold text-white"
                    data-testid="text-seed-name"
                  >
                    {seedName}
                  </div>
                  <div
                    className="mt-2 text-xs text-white/70"
                    data-testid="text-free-since"
                  >
                    Free-since: {formatDate(freeSince)}
                  </div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Sparkles
                    className="h-6 w-6 text-white/85"
                    strokeWidth={1.8}
                  />
                </div>
              </div>

              <div
                className="mt-5 grid grid-cols-3 gap-3"
                data-testid="grid-stats"
              >
                <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
                  <div
                    className="flex items-center gap-2 text-[11px] text-white/60"
                    data-testid="text-stat-streak-label"
                  >
                    <Flame className="h-4 w-4" />
                    Streak
                  </div>
                  <div
                    className="mt-2 text-2xl font-semibold text-white"
                    data-testid="text-stat-streak-value"
                  >
                    {streak}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
                  <div
                    className="flex items-center gap-2 text-[11px] text-white/60"
                    data-testid="text-stat-orbs-label"
                  >
                    <Gem className="h-4 w-4" />
                    Orbs
                  </div>
                  <div
                    className="mt-2 text-2xl font-semibold text-white"
                    data-testid="text-stat-orbs-value"
                  >
                    {orbs}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
                  <div
                    className="flex items-center gap-2 text-[11px] text-white/60"
                    data-testid="text-stat-today-label"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Today
                  </div>
                  <div
                    className="mt-2 text-xs font-semibold text-white/85"
                    data-testid="text-stat-today-value"
                  >
                    {doneToday ? "Done" : "Not yet"}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  className={`w-full rounded-full border px-5 py-4 text-[15px] font-semibold transition active:scale-[0.99] ${
                    doneToday
                      ? "border-white/10 bg-white/5 text-white/60"
                      : "grad-pill shine text-white"
                  }`}
                  onClick={markTodayComplete}
                  disabled={doneToday}
                  data-testid="button-mark-today-complete"
                >
                  Mark today complete
                </button>

                <button
                  type="button"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 active:scale-[0.99]"
                  onClick={relapseReset}
                  data-testid="button-relapse-reset"
                >
                  I slipped — reset streak
                </button>

                <button
                  type="button"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-[15px] font-semibold text-white/90 transition hover:bg-white/10 active:scale-[0.99]"
                  onClick={() =>
                    alert(
                      "Panic Button UI only (prototype).\n\nTry: 4 slow breaths, look around, name 5 things you see, then choose one small next step.",
                    )
                  }
                  data-testid="button-panic"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Panic Button
                  </span>
                </button>
              </div>

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
              className="glass rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8"
              onClick={() => alert("Daily Check-in UI only (prototype).")}
              data-testid="button-daily-checkin"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <CalendarCheck className="h-5 w-5 text-white/80" />
              </div>
              <div
                className="mt-3 text-sm font-semibold text-white"
                data-testid="text-daily-checkin-title"
              >
                Daily Check-in
              </div>
              <div
                className="mt-1 text-xs text-white/70"
                data-testid="text-daily-checkin-body"
              >
                Reflect, reset, continue.
              </div>
            </button>

            <button
              type="button"
              className="glass rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8"
              onClick={() => alert("Learn modules UI only (prototype).")}
              data-testid="button-learn"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <BookOpen className="h-5 w-5 text-white/80" />
              </div>
              <div
                className="mt-3 text-sm font-semibold text-white"
                data-testid="text-learn-title"
              >
                Learn
              </div>
              <div
                className="mt-1 text-xs text-white/70"
                data-testid="text-learn-body"
              >
                Short lessons & tools.
              </div>
            </button>

            <button
              type="button"
              className="glass rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8"
              onClick={() => alert("Community UI only (prototype).")}
              data-testid="button-community"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <Users className="h-5 w-5 text-white/80" />
              </div>
              <div
                className="mt-3 text-sm font-semibold text-white"
                data-testid="text-community-title-home"
              >
                Community
              </div>
              <div
                className="mt-1 text-xs text-white/70"
                data-testid="text-community-body-home"
              >
                You’re not alone.
              </div>
            </button>

            <button
              type="button"
              className="glass rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8"
              onClick={() => alert("Profile UI only (prototype).")}
              data-testid="button-profile"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <User className="h-5 w-5 text-white/80" />
              </div>
              <div
                className="mt-3 text-sm font-semibold text-white"
                data-testid="text-profile-title"
              >
                Profile
              </div>
              <div
                className="mt-1 text-xs text-white/70"
                data-testid="text-profile-body"
              >
                Reset data, settings.
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
