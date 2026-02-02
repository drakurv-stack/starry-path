import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type Gender = "Male" | "Female" | "Non-binary";

type OnboardingState = {
  motivations: string[];
  gender?: Gender;
  ageRange?:
    | "Under 18"
    | "18\u201324"
    | "25\u201334"
    | "35\u201344"
    | "45+";
  startedWatching?:
    | "Recently"
    | "1\u20132 years ago"
    | "3\u20135 years ago"
    | "6\u201310 years ago"
    | "10+ years ago";
  usageIncreased?: "Yes" | "No" | "Not sure";
  moreExtreme?: "Yes" | "No" | "Not sure";
  spentMoney?: "Yes" | "No" | "Prefer not to say";
  religious?: "Yes" | "No" | "Prefer not to say";
  name?: string;
};

const STORAGE_KEY = "orbit:onboarding";

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { motivations: [] };
    const parsed = JSON.parse(raw);
    return { motivations: [], ...parsed };
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
          : "border-white/10 bg-white/5 text-white/90 hover:bg-white/8 hover:border-white/15"
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

function SkipLink({
  onClick,
  testId,
}: {
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold text-white/60 underline-offset-4 transition hover:text-white/80 hover:underline"
      data-testid={testId}
    >
      Skip
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
    if (typeof window === "undefined") return;
    saveState(state);
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

  const steps = useMemo(
    () =>
      [
        {
          key: "motivations",
          title: "What brings you here?",
          body: "Choose as many as you like. We\u2019ll tailor your plan around what matters most.",
          skip: false,
          render: () => (
            <div className="mt-5 grid gap-3" data-testid="group-options-motivations">
              {motivationOptions.map((m) => {
                const selected = state.motivations.includes(m);
                return (
                  <OptionButton
                    key={m}
                    label={m}
                    selected={selected}
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        motivations: selected
                          ? s.motivations.filter((x) => x !== m)
                          : [...s.motivations, m],
                      }));
                    }}
                    testId={`button-motivation-${m.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                );
              })}
              <button
                type="button"
                className="grad-pill shine mt-1 w-full rounded-full px-6 py-5 text-base font-bold text-white transition-all btn-press min-tap"
                onClick={() => setStep((v) => v + 1)}
                data-testid="button-onboarding-continue-motivations"
              >
                Continue
              </button>
            </div>
          ),
        },
        {
          key: "gender",
          title: "Which best describes you?",
          body: "This helps us personalize language and examples. You can skip this.",
          skip: true,
          render: () => {
            const options: Gender[] = ["Male", "Female", "Non-binary"];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-gender">
                {options.map((g) => (
                  <OptionButton
                    key={g}
                    label={g}
                    selected={state.gender === g}
                    onClick={() => {
                      setState((s) => ({ ...s, gender: g }));
                      setStep((v) => v + 1);
                    }}
                    testId={`button-gender-${g.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "age",
          title: "How old are you?",
          body: "You must be 18+ to use Orbit.",
          skip: false,
          render: () => {
            const options: NonNullable<OnboardingState["ageRange"]>[] = [
              "Under 18",
              "18\u201324",
              "25\u201334",
              "35\u201344",
              "45+",
            ];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-age">
                {options.map((a) => (
                  <OptionButton
                    key={a}
                    label={a}
                    selected={state.ageRange === a}
                    onClick={() => {
                      setState((s) => ({ ...s, ageRange: a }));
                      if (a === "Under 18") {
                        setBlockedMinor(true);
                      } else {
                        setStep((v) => v + 1);
                      }
                    }}
                    testId={`button-age-${a.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "started",
          title: "When did you start watching porn?",
          body: "Pick what feels closest. You can always update later.",
          skip: true,
          render: () => {
            const options: NonNullable<OnboardingState["startedWatching"]>[] = [
              "Recently",
              "1\u20132 years ago",
              "3\u20135 years ago",
              "6\u201310 years ago",
              "10+ years ago",
            ];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-started">
                {options.map((a) => (
                  <OptionButton
                    key={a}
                    label={a}
                    selected={state.startedWatching === a}
                    onClick={() => {
                      setState((s) => ({ ...s, startedWatching: a }));
                      setStep((v) => v + 1);
                    }}
                    testId={`button-started-${a.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "increase",
          title: "Has your usage increased over time?",
          body: "No judgment \u2014 this is common, and awareness is progress.",
          skip: true,
          render: () => {
            const options: NonNullable<OnboardingState["usageIncreased"]>[] = [
              "Yes",
              "No",
              "Not sure",
            ];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-increase">
                {options.map((a) => (
                  <OptionButton
                    key={a}
                    label={a}
                    selected={state.usageIncreased === a}
                    onClick={() => {
                      setState((s) => ({ ...s, usageIncreased: a }));
                      setStep((v) => v + 1);
                    }}
                    testId={`button-increase-${a.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "extreme",
          title: "Has the content changed over time?",
          body: "Some people notice they seek more novelty or intensity. Answer what feels true for you.",
          skip: true,
          render: () => {
            const options: NonNullable<OnboardingState["moreExtreme"]>[] = [
              "Yes",
              "No",
              "Not sure",
            ];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-extreme">
                {options.map((a) => (
                  <OptionButton
                    key={a}
                    label={a}
                    selected={state.moreExtreme === a}
                    onClick={() => {
                      setState((s) => ({ ...s, moreExtreme: a }));
                      setStep((v) => v + 1);
                    }}
                    testId={`button-extreme-${a.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "money",
          title: "Have you ever spent money on explicit content?",
          body: "This can help us understand patterns around friction and access.",
          skip: true,
          render: () => {
            const options: NonNullable<OnboardingState["spentMoney"]>[] = [
              "Yes",
              "No",
              "Prefer not to say",
            ];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-money">
                {options.map((a) => (
                  <OptionButton
                    key={a}
                    label={a}
                    selected={state.spentMoney === a}
                    onClick={() => {
                      setState((s) => ({ ...s, spentMoney: a }));
                      setStep((v) => v + 1);
                    }}
                    testId={`button-money-${a.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "religious",
          title: "Are you religious?",
          body: "Optional. This helps us frame support in a way that feels aligned for you.",
          skip: true,
          render: () => {
            const options: NonNullable<OnboardingState["religious"]>[] = [
              "Yes",
              "No",
              "Prefer not to say",
            ];
            return (
              <div className="mt-5 grid gap-3" data-testid="group-options-religious">
                {options.map((a) => (
                  <OptionButton
                    key={a}
                    label={a}
                    selected={state.religious === a}
                    onClick={() => {
                      setState((s) => ({ ...s, religious: a }));
                      setStep((v) => v + 1);
                    }}
                    testId={`button-religious-${a.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                  />
                ))}
              </div>
            );
          },
        },
        {
          key: "name",
          title: "What should we call you?",
          body: "A first name or nickname is perfect.",
          skip: true,
          render: () => (
            <div className="mt-5 grid gap-3" data-testid="group-name">
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                <Input
                  value={state.name ?? ""}
                  onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Alex"
                  className="h-14 rounded-3xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/35"
                  data-testid="input-name"
                />
              </div>
              <button
                type="button"
                className="grad-pill shine w-full rounded-full px-6 py-5 text-base font-bold text-white transition-all btn-press min-tap"
                onClick={() => navigate("/personalize")}
                data-testid="button-onboarding-finish"
              >
                Continue
              </button>
            </div>
          ),
        },
      ] as const,
    [motivationOptions, navigate, state.gender, state.motivations, state.name, state.ageRange, state.moreExtreme, state.religious, state.spentMoney, state.startedWatching, state.usageIncreased],
  );

  const total = steps.length;
  const progress = Math.round(((step + 1) / total) * 100);

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
                Thanks for being honest. We can\u2019t continue with onboarding. If you\u2019re under 18, consider talking with a trusted adult or a qualified professional for support.
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

  const current = steps[Math.max(0, Math.min(step, total - 1))];

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
                else setStep((v) => Math.max(0, v - 1));
              }}
              data-testid="button-onboarding-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {current.skip ? (
              <SkipLink
                onClick={() => setStep((v) => v + 1)}
                testId="link-onboarding-skip"
              />
            ) : (
              <span className="text-xs text-white/50" data-testid="text-onboarding-noskip">
                \u00a0
              </span>
            )}
          </div>

          <Card className="glass glow mt-5 overflow-hidden fade-up">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span data-testid="text-onboarding-step">Question {step + 1} of {total}</span>
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

              {current.render()}

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
