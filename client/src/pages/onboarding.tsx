import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type OnboardingState = {
  motivations: string[];
  ageRange?: "Under 18" | "18–24" | "25–34" | "35–44" | "45+";
  name?: string;
};

const STORAGE_KEY = "orbit:onboarding";

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { motivations: [] };
    const parsed = JSON.parse(raw);
    return {
      motivations: Array.isArray(parsed.motivations) ? parsed.motivations : [],
      ageRange: parsed.ageRange,
      name: typeof parsed.name === "string" ? parsed.name : "",
    };
  } catch {
    return { motivations: [] };
  }
}

function saveState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function OptionButton({
  label,
  selected,
  onClick,
  testId,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border px-5 py-4 text-left text-[15px] font-semibold leading-snug transition-all btn-press min-tap ${
        selected
          ? "border-white/20 bg-white/12 text-white shadow-[0_0_0_1px_rgba(130,87,255,0.25),0_18px_60px_rgba(120,80,255,0.25)]"
          : "border-white/10 bg-white/5 text-white/90 hover:border-white/15 hover:bg-white/8"
      }`}
      data-testid={testId}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0">{label}</span>
        {selected ? (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 ring-1 ring-white/20 shadow-[0_0_20px_rgba(130,87,255,0.3)]">
            <Check className="h-4 w-4 text-white" />
          </span>
        ) : (
          <span className="h-7 w-7 rounded-full border border-white/10 bg-white/0 transition-colors" />
        )}
      </span>
    </button>
  );
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<OnboardingState>(() =>
    typeof window === "undefined" ? { motivations: [] } : loadState(),
  );
  const [step, setStep] = useState(0);
  const [blockedMinor, setBlockedMinor] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") saveState(state);
  }, [state]);

  const motivationOptions = useMemo(
    () => [
      "Regain control over my time",
      "Improve focus and energy",
      "Feel more confident",
      "Strengthen relationships",
      "Reduce shame and spirals",
      "Build better habits",
    ],
    [],
  );

  const ageOptions: NonNullable<OnboardingState["ageRange"]>[] = [
    "Under 18",
    "18–24",
    "25–34",
    "35–44",
    "45+",
  ];

  const steps = [
    {
      key: "age",
      title: "How old are you?",
      body: "Orbit is for adults 18 and older.",
      render: (
        <div className="mt-5 grid gap-3" data-testid="group-options-age">
          {ageOptions.map((age) => (
            <OptionButton
              key={age}
              label={age}
              selected={state.ageRange === age}
              onClick={() => {
                setState((current) => ({ ...current, ageRange: age }));
                if (age === "Under 18") {
                  setBlockedMinor(true);
                } else {
                  setStep(1);
                }
              }}
              testId={`button-age-${age.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
            />
          ))}
        </div>
      ),
    },
    {
      key: "motivations",
      title: "What brings you here?",
      body: "Choose anything that fits. We’ll use this to make your first steps more helpful.",
      render: (
        <div className="mt-5 grid gap-3" data-testid="group-options-motivations">
          {motivationOptions.map((motivation) => {
            const selected = state.motivations.includes(motivation);
            return (
              <OptionButton
                key={motivation}
                label={motivation}
                selected={selected}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    motivations: selected
                      ? current.motivations.filter((item) => item !== motivation)
                      : [...current.motivations, motivation],
                  }))
                }
                testId={`button-motivation-${motivation
                  .replace(/[^a-z0-9]+/gi, "-")
                  .toLowerCase()}`}
              />
            );
          })}
          <button
            type="button"
            className="grad-pill shine mt-1 w-full rounded-full px-6 py-5 text-base font-bold text-white transition-all btn-press min-tap disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => setStep(2)}
            disabled={state.motivations.length === 0}
            data-testid="button-onboarding-continue-motivations"
          >
            Continue
          </button>
        </div>
      ),
    },
    {
      key: "name",
      title: "What should we call you?",
      body: "A first name or nickname is perfect.",
      render: (
        <div className="mt-5 grid gap-3" data-testid="group-name">
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
            <Input
              value={state.name ?? ""}
              onChange={(event) =>
                setState((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. Alex"
              className="h-14 rounded-3xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/35"
              data-testid="input-name"
              autoComplete="given-name"
              autoFocus
            />
          </div>
          <button
            type="button"
            className="grad-pill shine w-full rounded-full px-6 py-5 text-base font-bold text-white transition-all btn-press min-tap disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => {
              const name = state.name?.trim() ?? "";
              const completedState = { ...state, name };
              saveState(completedState);
              navigate("/home");
            }}
            disabled={!state.name?.trim()}
            data-testid="button-onboarding-finish"
          >
            Enter Orbit
          </button>
        </div>
      ),
    },
  ] as const;

  if (blockedMinor) {
    return (
      <div className="min-h-dvh app-bg text-foreground">
        <div className="mx-auto w-full max-w-[420px] px-4 py-8">
          <Card className="glass glow page-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/60">
                <Sparkles className="h-4 w-4" />
                <span data-testid="text-agegate-kicker">AGE CHECK</span>
              </div>
              <h1
                className="mt-3 font-[var(--font-serif)] text-3xl leading-tight text-white"
                data-testid="text-agegate-title"
              >
                Orbit is for adults (18+)
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70" data-testid="text-agegate-body">
                Thanks for being honest. We can’t continue with onboarding. If you’re under 18, consider talking with a trusted adult or a qualified professional for support.
              </p>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                  onClick={() => {
                    setBlockedMinor(false);
                    setStep(0);
                    setState({ motivations: [] });
                    saveState({ motivations: [] });
                  }}
                  data-testid="button-agegate-restart"
                >
                  Restart
                </button>
                <button
                  type="button"
                  className="grad-pill shine w-full rounded-full px-5 py-4 text-[15px] font-semibold text-white transition active:scale-[0.99]"
                  onClick={() => navigate("/welcome")}
                  data-testid="button-agegate-back"
                >
                  Back to intro
                </button>
              </div>

              <p className="mt-5 text-[11px] leading-relaxed text-white/55" data-testid="text-agegate-disclaimer">
                Informational only. Not medical advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const current = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              onClick={() => {
                if (step === 0) navigate("/welcome");
                else setStep((value) => Math.max(0, value - 1));
              }}
              data-testid="button-onboarding-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <span className="text-xs font-semibold text-white/50" data-testid="text-onboarding-fast">
              A few quick steps
            </span>
          </div>

          <Card className="glass glow mt-5 overflow-hidden fade-up">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span data-testid="text-onboarding-step">
                    Step {step + 1} of {steps.length}
                  </span>
                  <span data-testid="text-onboarding-progress">{progress}%</span>
                </div>
                <Progress value={progress} data-testid="progress-onboarding" />
              </div>

              <h1
                className="font-[var(--font-serif)] text-[30px] leading-[1.08] text-white"
                data-testid={`text-onboarding-title-${current.key}`}
              >
                {current.title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70" data-testid={`text-onboarding-body-${current.key}`}>
                {current.body}
              </p>

              {current.render}

              <p className="mt-6 text-[11px] leading-relaxed text-white/55" data-testid="text-onboarding-disclaimer">
                Your answers are stored on this device (local storage) for this prototype. You can reset from Profile anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}