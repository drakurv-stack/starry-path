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
import { OrbitLogo } from "@/components/orbit-logo";

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: any;
  accent: "sage" | "terracotta";
};

function BreathingCircle({ accent }: { accent: Slide["accent"] }) {
  const accentColor = accent === "terracotta" ? "#C97B5C" : "#5B8A72";
  return (
    <div className="relative mx-auto mt-4 h-[148px] w-[148px]" data-testid="img-illustration-breathing-circle">
      <div
        className="breathing-circle__ring absolute inset-0 rounded-full border-2"
        style={{ borderColor: `${accentColor}66` }}
      />
      <div
        className="breathing-circle absolute inset-[18px] grid place-items-center rounded-full border-2 bg-card"
        style={{ borderColor: accentColor }}
      >
        <div className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <div>Inhale</div>
          <div className="mt-1 text-[9px] tracking-[0.12em]">Exhale</div>
        </div>
      </div>
      <div className="absolute inset-[70px] rounded-full" style={{ backgroundColor: accentColor }} />
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
      className="w-full rounded-xl bg-primary px-6 py-5 text-base font-bold tracking-tight text-primary-foreground elevation-1 transition-all btn-press min-tap"
      data-testid={testId}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {label}
        <ChevronRight className="h-5 w-5 opacity-90" />
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
        accent: "sage",
      },
      {
        key: "panic",
        title: "Take back control, instantly",
        body: "One tap opens a fast reset: breathing, grounding, and a short plan to ride the urge wave.",
        icon: ShieldAlert,
        accent: "terracotta",
      },
      {
        key: "progress",
        title: "See progress that feels real",
        body: "Track your streak, collect orbs, and notice the small wins that add up to momentum.",
        icon: Flame,
        accent: "sage",
      },
      {
        key: "coach",
        title: "Your coach, always by your side",
        body: "A friendly, non-judgmental guide that helps you choose your next right action \u2014 not perfection.",
        icon: Sparkles,
        accent: "terracotta",
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
              <OrbitLogo className="text-sm" testId="text-welcome-brand" />
              <div
                className="mt-1 text-sm text-muted-foreground"
                data-testid="text-welcome-tagline"
              >
                Recovery companion prototype
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground elevation-1 transition hover:bg-secondary"
              onClick={() => navigate("/home")}
              data-testid="button-skip-to-home"
            >
              Preview Home
            </button>
          </div>

          <Card className="mt-6 overflow-hidden fade-up elevation-1">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1
                    className="font-[var(--font-sans)] text-[34px] font-semibold leading-[1.05] text-foreground"
                    data-testid={`text-welcome-title-${active.key}`}
                  >
                    {active.title}
                  </h1>
                  <p
                    className="mt-3 text-[14px] leading-relaxed text-muted-foreground"
                    data-testid={`text-welcome-body-${active.key}`}
                  >
                    {active.body}
                  </p>
                </div>

                <div className="shrink-0">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-secondary"
                    data-testid={`icon-welcome-${active.key}`}
                  >
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
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
                    <div>
                      <BreathingCircle accent={active.accent} />
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span data-testid="text-welcome-progress">Step {index + 1} of 4</span>
                  <span data-testid="text-welcome-progress-percent">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" data-testid="progress-welcome" />
              </div>

              <div className="mt-6 flex gap-2 justify-center" data-testid="group-welcome-dots">
                {slides.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-2.5 w-8 rounded-full transition-all duration-300 ${
                      i === index
                        ? "bg-primary elevation-1"
                        : "bg-muted hover:bg-secondary"
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

                <div className="rounded-2xl border border-border bg-secondary p-4 elevation-1" data-testid="card-paywall-teaser">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold tracking-[0.18em] text-muted-foreground" data-testid="text-paywall-kicker">
                        PREMIUM TEASER
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground" data-testid="text-paywall-headline">
                        Loved by thousands
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground" data-testid="text-paywall-subcopy">
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
                      <div className="mt-1 text-sm font-semibold text-foreground" data-testid="text-rating">
                        4.8
                      </div>
                      <div className="text-[11px] text-muted-foreground" data-testid="text-rating-note">
                        Rated highly
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground" data-testid="text-welcome-disclaimer">
                This prototype is for support and self-improvement. It\u2019s not medical advice or a substitute for professional care.
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="w-full rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground elevation-1 transition hover:bg-secondary active:scale-[0.99]"
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
