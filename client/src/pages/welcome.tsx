import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  ShieldAlert,
  Flame,
  Sparkles,
  Star,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: any;
  accent: "violet" | "cyan" | "pink" | "indigo";
};

function OrbIllustration({ accent }: { accent: Slide["accent"] }) {
  const palette = {
    violet: "from-violet-400/35 via-fuchsia-400/25 to-cyan-400/20",
    cyan: "from-cyan-400/35 via-blue-400/25 to-violet-400/20",
    pink: "from-fuchsia-400/30 via-pink-400/25 to-violet-400/25",
    indigo: "from-blue-400/30 via-indigo-400/25 to-violet-400/25",
  }[accent];

  return (
    <div className="relative mx-auto mt-4 h-[148px] w-[148px]" data-testid="img-illustration-orb">
      <div
        className={`absolute inset-0 rounded-[44px] bg-gradient-to-br ${palette} blur-2xl`}
      />
      <div className="absolute inset-0 rounded-[44px] bg-white/5 ring-1 ring-white/10 shadow-[0_0_0_1px_rgba(130,87,255,0.12),0_18px_80px_rgba(120,80,255,0.35)]" />
      <div className="absolute inset-[10px] rounded-[36px] bg-gradient-to-br from-white/10 to-white/0 ring-1 ring-white/10" />
      <div className="absolute inset-[20px] rounded-[28px] bg-black/15 ring-1 ring-white/10" />
      <div className="absolute left-[40px] top-[44px] h-3 w-3 rounded-full bg-white/80 blur-[0.2px]" />
      <div className="absolute left-[58px] top-[34px] h-2 w-2 rounded-full bg-white/50" />
      <div className="absolute right-[38px] bottom-[40px] h-2 w-2 rounded-full bg-cyan-300/60" />
    </div>
  );
}

function PillButton({
  label,
  onClick,
  testId,
}: {
  label: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grad-pill shine w-full rounded-full px-5 py-4 text-[15px] font-semibold tracking-tight text-white transition active:scale-[0.99]"
      data-testid={testId}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {label}
        <ChevronRight className="h-4 w-4 opacity-90" />
      </span>
    </button>
  );
}

export default function Welcome() {
  const [, navigate] = useLocation();
  const slides: Slide[] = useMemo(
    () => [
      {
        key: "community",
        title: "You\u2019re not alone",
        body: "A calm space that reminds you: relapse doesn\u2019t mean failure. Support is part of the plan.",
        icon: Users,
        accent: "violet",
      },
      {
        key: "panic",
        title: "Take back control, instantly",
        body: "One tap opens a fast reset: breathing, grounding, and a short plan to ride the urge wave.",
        icon: ShieldAlert,
        accent: "cyan",
      },
      {
        key: "progress",
        title: "See progress that feels real",
        body: "Track your streak, collect orbs, and notice the small wins that add up to momentum.",
        icon: Flame,
        accent: "indigo",
      },
      {
        key: "coach",
        title: "Your coach, always by your side",
        body: "A friendly, non-judgmental guide that helps you choose your next right action \u2014 not perfection.",
        icon: Sparkles,
        accent: "pink",
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const active = slides[index];
  const Icon = active.icon;

  const progress = ((index + 1) / slides.length) * 100;

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-xs font-medium tracking-[0.22em] text-white/60"
                data-testid="text-welcome-brand"
              >
                ORBIT
              </div>
              <div
                className="mt-1 text-sm text-white/70"
                data-testid="text-welcome-tagline"
              >
                Recovery companion prototype
              </div>
            </div>

            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              onClick={() => navigate("/home")}
              data-testid="button-skip-to-home"
            >
              Preview Home
            </button>
          </div>

          <Card className="glass glow mt-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1
                    className="font-[var(--font-serif)] text-[34px] leading-[1.05] text-white"
                    data-testid={`text-welcome-title-${active.key}`}
                  >
                    {active.title}
                  </h1>
                  <p
                    className="mt-3 text-[14px] leading-relaxed text-white/70"
                    data-testid={`text-welcome-body-${active.key}`}
                  >
                    {active.body}
                  </p>
                </div>

                <div className="shrink-0">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10"
                    data-testid={`icon-welcome-${active.key}`}
                  >
                    <Icon className="h-6 w-6 text-white/85" strokeWidth={1.8} />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.9, 0.2, 1] }}
                >
                  <div className="floaty">
                    <OrbIllustration accent={active.accent} />
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between text-xs text-white/60">
                  <span data-testid="text-welcome-progress">Step {index + 1} of 4</span>
                  <span data-testid="text-welcome-progress-percent">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} data-testid="progress-welcome" />
              </div>

              <div className="mt-6 flex gap-2" data-testid="group-welcome-dots">
                {slides.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-2.5 flex-1 rounded-full transition ${
                      i === index
                        ? "bg-white/70"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    data-testid={`button-welcome-dot-${s.key}`}
                    aria-label={`Go to ${s.key}`}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                {index < slides.length - 1 ? (
                  <PillButton
                    label="Continue"
                    onClick={() => setIndex((v) => Math.min(v + 1, slides.length - 1))}
                    testId="button-welcome-continue"
                  />
                ) : (
                  <PillButton
                    label="Start your plan"
                    onClick={() => navigate("/onboarding")}
                    testId="button-welcome-start"
                  />
                )}

                <div className="glass rounded-3xl border border-white/10 bg-white/5 p-4" data-testid="card-paywall-teaser">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold tracking-[0.18em] text-white/60" data-testid="text-paywall-kicker">
                        PREMIUM TEASER
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white" data-testid="text-paywall-headline">
                        Loved by thousands
                      </div>
                      <div className="mt-1 text-xs text-white/70" data-testid="text-paywall-subcopy">
                        Unlock deeper insights, guided resets, and personalized routines.\n                        (UI only \u2014 no payments yet.)
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1" data-testid="group-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 4 ? "text-amber-300" : "text-amber-200/50"}`}
                            fill={i < 4 ? "currentColor" : "none"}
                            strokeWidth={1.4}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white" data-testid="text-rating">
                        4.8
                      </div>
                      <div className="text-[11px] text-white/60" data-testid="text-rating-note">
                        Rated highly
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-white/55" data-testid="text-welcome-disclaimer">
                This prototype is for support and self-improvement. It\u2019s not medical advice or a substitute for professional care.
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/85 transition hover:bg-white/10 active:scale-[0.99]"
              data-testid="button-welcome-skip"
            >
              Skip intro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
