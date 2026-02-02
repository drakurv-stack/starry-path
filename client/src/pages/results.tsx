import { useMemo } from "react";
import { useLocation } from "wouter";
import { Award, ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PROFILE_KEY = "orbit:profile";
const STREAK_KEY = "orbit:streak";
const ORBS_KEY = "orbit:orbs";
const FREE_SINCE_KEY = "orbit:freeSince";

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setDefaultsIfMissing(nameFallback: string) {
  const streak = localStorage.getItem(STREAK_KEY);
  const orbs = localStorage.getItem(ORBS_KEY);
  const freeSince = localStorage.getItem(FREE_SINCE_KEY);
  if (streak === null) localStorage.setItem(STREAK_KEY, "0");
  if (orbs === null) localStorage.setItem(ORBS_KEY, "0");
  if (freeSince === null) localStorage.setItem(FREE_SINCE_KEY, new Date().toISOString());
  if (!localStorage.getItem(PROFILE_KEY)) {
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ seedName: "Origin Seed", signaturePreview: "", name: nameFallback }),
    );
  }
}

function Timeline() {
  const points = [
    { day: 0, label: "Day 0", note: "Start" },
    { day: 30, label: "30", note: "Often reported: steadier mood" },
    { day: 60, label: "60", note: "Can improve: focus & energy" },
    { day: 90, label: "90", note: "Many report: more confidence" },
  ];

  return (
    <div className="mt-5" data-testid="timeline-recovery">
      <div className="relative rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs font-semibold tracking-[0.18em] text-white/60" data-testid="text-timeline-kicker">
          RECOVERY TIMELINE
        </div>
        <div className="mt-4 h-28 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0 p-3">
          <div className="relative h-full">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/10" />
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400/60 via-blue-400/55 to-violet-400/60" />

            {points.map((p, idx) => (
              <div
                key={p.day}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(idx / (points.length - 1)) * 100}%` }}
              >
                <div className="relative">
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 shadow-[0_0_30px_rgba(120,80,255,0.35)]" />
                  <div className="mt-2 -translate-x-1/2 whitespace-nowrap text-[11px] text-white/65" data-testid={`text-timeline-label-${p.day}`}>
                    <span className="font-semibold text-white/85">{p.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {points.slice(1).map((p) => (
            <div
              key={p.day}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              data-testid={`row-milestone-${p.day}`}
            >
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <CalendarDays className="h-5 w-5 text-white/75" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white" data-testid={`text-milestone-title-${p.day}`}>
                  Day {p.day}
                </div>
                <div className="text-xs text-white/70" data-testid={`text-milestone-note-${p.day}`}>
                  {p.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/55" data-testid="text-timeline-disclaimer">
          Cautious guidance only. Improvements vary; no medical guarantees.
        </p>
      </div>
    </div>
  );
}

function BenefitBadges() {
  const badges = [
    "Energy",
    "Focus",
    "Motivation",
    "Relationships",
    "Confidence",
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-2" data-testid="group-benefits">
      {badges.map((b) => (
        <div
          key={b}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/80"
          data-testid={`badge-benefit-${b.toLowerCase()}`}
        >
          <span className="inline-flex items-center gap-2">
            <Award className="h-4 w-4 text-cyan-400" />
            {b}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Results() {
  const [, navigate] = useLocation();

  const onboarding = useMemo(() => {
    try {
      const raw = localStorage.getItem("orbit:onboarding");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const name = (onboarding?.name as string) || "Friend";

  useMemo(() => {
    if (typeof window === "undefined") return;
    setDefaultsIfMissing(name);
  }, [name]);

  const profile = useMemo(() => loadProfile(), []);

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <Card className="glass glow overflow-hidden fade-up">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/60">
                <Sparkles className="h-4 w-4" />
                <span data-testid="text-results-kicker">RESULTS</span>
              </div>

              <h1 className="mt-3 font-[var(--font-serif)] text-[34px] leading-[1.05] text-white" data-testid="text-results-title">
                Your next 90 days, {name}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70" data-testid="text-results-body">
                Here\u2019s a gentle roadmap with milestones people often report. You can go at your own pace.
              </p>

              <Timeline />

              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4" data-testid="card-benefits">
                <div className="text-xs font-semibold tracking-[0.18em] text-white/60" data-testid="text-benefits-kicker">
                  BENEFITS (OFTEN REPORTED)
                </div>
                <div className="mt-1 text-sm font-semibold text-white" data-testid="text-benefits-title">
                  What may improve over time
                </div>
                <BenefitBadges />
                <p className="mt-3 text-[11px] leading-relaxed text-white/55" data-testid="text-benefits-note">
                  Everyone is different. This is not medical advice.
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  className="grad-pill shine w-full rounded-full px-6 py-5 text-base font-bold text-white transition-all btn-press min-tap"
                  onClick={() => navigate("/home")}
                  data-testid="button-results-go-home"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    Continue to Home
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </button>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4" data-testid="card-profile-preview">
                  <div className="text-xs font-semibold tracking-[0.18em] text-white/60" data-testid="text-profile-kicker">
                    PROFILE PREVIEW
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white" data-testid="text-profile-seed">
                    {profile?.seedName ?? "Origin Seed"}
                  </div>
                  <div className="mt-1 text-xs text-white/70" data-testid="text-profile-signature">
                    Signature: {profile?.signaturePreview ? "Saved" : "\u2014"}
                  </div>
                </div>
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-white/55" data-testid="text-results-disclaimer">
                Informational only. If you\u2019re struggling, consider reaching out to a qualified professional or trusted support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
