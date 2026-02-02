import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  Compass,
  Sparkles,
  Users,
  Timer,
  BarChart3,
  HeartPulse,
  ScrollText,
  PenLine,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ONBOARDING_KEY = "orbit:onboarding";
const PROFILE_KEY = "orbit:profile";

type ProfileState = {
  seedName: string;
  signaturePreview: string;
};

function loadOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfile(profile: ProfileState) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function OptionChip({
  label,
  selected,
  onClick,
  testId,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border px-5 py-4 text-left text-[14px] font-bold transition-all btn-press min-tap ${
        selected
          ? "border-white/20 bg-white/12 text-white shadow-[0_0_0_1px_rgba(130,87,255,0.25),0_18px_60px_rgba(120,80,255,0.25)]"
          : "border-white/10 bg-white/5 text-white/85 hover:bg-white/8 hover:border-white/15"
      }`}
      data-testid={testId}
    >
      <span className="inline-flex items-center gap-2">
        {selected ? <Check className="h-4 w-4" /> : null}
        {label}
      </span>
    </button>
  );
}

function StatCard({
  title,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  title: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <div className="glass rounded-3xl border border-white/10 bg-white/5 p-4">
      <div
        className="text-xs font-semibold tracking-[0.18em] text-white/60"
        data-testid="text-community-kicker"
      >
        COMMUNITY
      </div>
      <div
        className="mt-1 text-sm font-semibold text-white"
        data-testid="text-community-title"
      >
        {title}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div
            className="text-[11px] text-white/60"
            data-testid="text-community-left-label"
          >
            {leftLabel}
          </div>
          <div
            className="mt-1 text-lg font-semibold text-white"
            data-testid="text-community-left-value"
          >
            {leftValue}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div
            className="text-[11px] text-white/60"
            data-testid="text-community-right-label"
          >
            {rightLabel}
          </div>
          <div
            className="mt-1 text-lg font-semibold text-white"
            data-testid="text-community-right-value"
          >
            {rightValue}
          </div>
        </div>
      </div>
      <p
        className="mt-3 text-[11px] leading-relaxed text-white/55"
        data-testid="text-community-note"
      >
        Example stats for prototype only.
      </p>
    </div>
  );
}

function ComparisonBars({ you, avg }: { you: number; avg: number }) {
  const max = Math.max(you, avg, 1);
  return (
    <div className="mt-3 space-y-3" data-testid="chart-dependency">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-white/65">
          <span data-testid="text-you-label">You</span>
          <span data-testid="text-you-value">{you}/10</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400"
            style={{ width: `${Math.round((you / max) * 100)}%` }}
            data-testid="bar-you"
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-white/65">
          <span data-testid="text-avg-label">Average</span>
          <span data-testid="text-avg-value">{avg}/10</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
          <div
            className="h-full rounded-full bg-white/35"
            style={{ width: `${Math.round((avg / max) * 100)}%` }}
            data-testid="bar-avg"
          />
        </div>
      </div>
    </div>
  );
}

function ScribblePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="rounded-3xl border border-white/10 bg-white/5 p-4"
      data-testid="card-scribble"
    >
      <div className="flex items-center justify-between">
        <div
          className="text-xs font-semibold tracking-[0.18em] text-white/60"
          data-testid="text-signature-kicker"
        >
          SIGNATURE
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-white/60 underline-offset-4 transition hover:text-white/80 hover:underline"
          onClick={() => onChange("")}
          data-testid="button-signature-clear"
        >
          Clear
        </button>
      </div>
      <div
        className="scribble mt-3 min-h-[92px] w-full rounded-2xl border border-white/10 p-3"
        data-testid="pad-signature"
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Scribble your signature here (visual only)"
          className="h-[92px] w-full resize-none bg-transparent font-[var(--font-scribble)] text-[18px] text-white/85 placeholder:text-white/35 outline-none"
          data-testid="input-signature"
        />
      </div>
      <p
        className="mt-2 text-[11px] leading-relaxed text-white/55"
        data-testid="text-signature-note"
      >
        Visual-only signature for the prototype. Not legally binding.
      </p>
    </div>
  );
}

export default function Personalize() {
  const [, navigate] = useLocation();
  const onboarding = useMemo(
    () => (typeof window === "undefined" ? {} : loadOnboarding()),
    [],
  );
  const name = (onboarding?.name as string) || "Friend";

  const [screen, setScreen] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [signaturePreview, setSignaturePreview] = useState("");

  const screens = useMemo(
    () => [
      {
        key: "community",
        icon: Users,
        title: "You are not alone",
        body: "Many people are rebuilding their relationship with porn. You’re joining a real movement of change.",
        render: () => (
          <div className="mt-5">
            <StatCard
              title="This week’s momentum"
              leftLabel="Folded (reset)"
              leftValue="38%"
              rightLabel="Still going strong"
              rightValue="62%"
            />
          </div>
        ),
      },
      {
        key: "time",
        icon: Timer,
        title: "Time has a hidden cost",
        body: "If you’re watching ~12 minutes/day, that’s about 4,380 minutes per year.",
        render: () => (
          <div className="mt-5 grid gap-3" data-testid="card-time-impact">
            <div className="glass rounded-3xl border border-white/10 bg-white/5 p-4">
              <div
                className="text-[11px] font-semibold tracking-[0.18em] text-white/60"
                data-testid="text-time-kicker"
              >
                ESTIMATE
              </div>
              <div className="mt-2 grid gap-2">
                <div className="flex items-baseline justify-between">
                  <div
                    className="text-sm text-white/70"
                    data-testid="text-time-label"
                  >
                    Annual minutes
                  </div>
                  <div
                    className="text-2xl font-semibold text-white"
                    data-testid="text-time-minutes"
                  >
                    4,380
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div
                      className="text-[11px] text-white/60"
                      data-testid="text-equivalence-1-label"
                    >
                      That’s about
                    </div>
                    <div
                      className="mt-1 text-sm font-semibold text-white"
                      data-testid="text-equivalence-1"
                    >
                      73 hours
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div
                      className="text-[11px] text-white/60"
                      data-testid="text-equivalence-2-label"
                    >
                      Roughly
                    </div>
                    <div
                      className="mt-1 text-sm font-semibold text-white"
                      data-testid="text-equivalence-2"
                    >
                      1.8 work weeks
                    </div>
                  </div>
                </div>
              </div>
              <p
                className="mt-3 text-[11px] leading-relaxed text-white/55"
                data-testid="text-time-note"
              >
                Example calculation for prototype only. Adjust later.
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "score",
        icon: BarChart3,
        title: "A quick dependency snapshot",
        body: "This is informational only — not a medical diagnosis. It can help you track patterns over time.",
        render: () => (
          <div className="mt-5">
            <div
              className="glass rounded-3xl border border-white/10 bg-white/5 p-4"
              data-testid="card-dependency"
            >
              <div
                className="text-xs font-semibold tracking-[0.18em] text-white/60"
                data-testid="text-score-kicker"
              >
                COMPARISON
              </div>
              <div
                className="mt-1 text-sm font-semibold text-white"
                data-testid="text-score-title"
              >
                You vs Average
              </div>
              <ComparisonBars you={7} avg={4} />
              <p
                className="mt-3 text-[11px] leading-relaxed text-white/55"
                data-testid="text-score-note"
              >
                Informational only, not a medical diagnosis.
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "symptoms",
        icon: HeartPulse,
        title: "What symptoms show up for you?",
        body: "Select any that feel familiar. You can skip this.",
        render: () => {
          const options = [
            "Low motivation",
            "Brain fog",
            "Anxiety or restlessness",
            "Sleep issues",
            "Lower confidence",
            "Trouble focusing",
            "Social withdrawal",
          ];
          return (
            <div
              className="mt-5 grid grid-cols-1 gap-3"
              data-testid="group-options-symptoms"
            >
              {options.map((s) => {
                const selected = symptoms.includes(s);
                return (
                  <OptionChip
                    key={s}
                    label={s}
                    selected={selected}
                    onClick={() =>
                      setSymptoms((prev) =>
                        selected
                          ? prev.filter((x) => x !== s)
                          : [...prev, s],
                      )
                    }
                    testId={`button-symptom-${s
                      .replace(/[^a-z0-9]+/gi, "-")
                      .toLowerCase()}`}
                  />
                );
              })}
            </div>
          );
        },
      },
      {
        key: "hope",
        icon: Sparkles,
        title: "Good news.",
        body: "These symptoms can often improve as your brain rewires and you build new habits. We’ll take it one day at a time.",
        render: () => (
          <div className="mt-5">
            <div
              className="glass rounded-3xl border border-white/10 bg-white/5 p-4"
              data-testid="card-hope"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className="text-xs font-semibold tracking-[0.18em] text-white/60"
                    data-testid="text-hope-kicker"
                  >
                    HOPE
                  </div>
                  <div
                    className="mt-1 text-sm font-semibold text-white"
                    data-testid="text-hope-title"
                  >
                    Your nervous system can recover
                  </div>
                  <p
                    className="mt-2 text-sm text-white/70"
                    data-testid="text-hope-body"
                  >
                    Many people report better energy, focus, and mood after a
                    period of consistency. Your path is unique — no pressure, no
                    perfection.
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Sparkles className="h-5 w-5 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "commit",
        icon: ScrollText,
        title: `A small ritual, ${name}`,
        body: "Make a gentle commitment. It’s okay to stumble — we focus on returning.",
        render: () => {
          const checklist = [
            "I will protect my sleep",
            "I will practice a 60-second reset when urges spike",
            "I will ask for support instead of isolating",
          ];

          return (
            <div className="mt-5 grid gap-3" data-testid="screen-commitment">
              <div className="glass rounded-3xl border border-white/10 bg-white/5 p-4">
                <div
                  className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/60"
                  data-testid="text-ritual-kicker"
                >
                  COMMITMENT
                </div>
                <div className="mt-2 grid gap-2">
                  {checklist.map((c, idx) => (
                    <div
                      key={c}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                      data-testid={`row-checklist-${idx}`}
                    >
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                        <Check className="h-4 w-4 text-white/80" />
                      </div>
                      <div
                        className="text-sm font-semibold text-white/85"
                        data-testid={`text-checklist-${idx}`}
                      >
                        {c}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ScribblePad
                value={signaturePreview}
                onChange={setSignaturePreview}
              />

              <button
                type="button"
                className="grad-pill shine w-full rounded-full px-5 py-4 text-[15px] font-semibold text-white transition active:scale-[0.99]"
                onClick={() => {
                  saveProfile({ seedName: "Origin Seed", signaturePreview });
                  navigate("/results");
                }}
                data-testid="button-commit"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <PenLine className="h-4 w-4" />
                  I commit to myself
                </span>
              </button>

              <p
                className="text-[11px] leading-relaxed text-white/55"
                data-testid="text-commit-note"
              >
                This is a supportive ritual for the prototype. Not medical
                advice.
              </p>
            </div>
          );
        },
      },
    ],
    [name, symptoms, navigate, signaturePreview],
  );

  const total = screens.length;
  const progress = Math.round(((screen + 1) / total) * 100);
  const current = screens[Math.max(0, Math.min(screen, total - 1))];
  const Icon = current.icon;

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              onClick={() => {
                if (screen === 0) navigate("/onboarding");
                else setScreen((v) => Math.max(0, v - 1));
              }}
              data-testid="button-personalize-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              className="text-xs font-semibold text-white/60 underline-offset-4 transition hover:text-white/80 hover:underline"
              onClick={() => setScreen((v) => Math.min(total - 1, v + 1))}
              data-testid="link-personalize-skip"
            >
              Skip
            </button>
          </div>

          <Card className="glass glow mt-5 overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                  <span data-testid="text-personalize-step">
                    Personalization {screen + 1} of {total}
                  </span>
                  <span data-testid="text-personalize-progress">{progress}%</span>
                </div>
                <Progress value={progress} data-testid="progress-personalize" />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1
                    className="font-[var(--font-serif)] text-[30px] leading-[1.08] text-white"
                    data-testid={`text-personalize-title-${current.key}`}
                  >
                    {current.title}
                  </h1>
                  <p
                    className="mt-2 text-sm leading-relaxed text-white/70"
                    data-testid={`text-personalize-body-${current.key}`}
                  >
                    {current.body}
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-6 w-6 text-white/85" strokeWidth={1.8} />
                </div>
              </div>

              {current.render()}

              {current.key !== "commit" ? (
                <button
                  type="button"
                  className="grad-pill shine mt-6 w-full rounded-full px-5 py-4 text-[15px] font-semibold text-white transition active:scale-[0.99]"
                  onClick={() =>
                    setScreen((v) => Math.min(total - 1, v + 1))
                  }
                  data-testid="button-personalize-continue"
                >
                  Continue
                </button>
              ) : null}

              <p
                className="mt-6 text-[11px] leading-relaxed text-white/55"
                data-testid="text-personalize-disclaimer"
              >
                Informational and supportive only. Not a diagnosis and not a
                substitute for professional care.
              </p>
            </CardContent>
          </Card>

          <div
            className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4"
            data-testid="card-privacy"
          >
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/60">
              <Compass className="h-4 w-4" />
              <span data-testid="text-privacy-kicker">PRIVACY</span>
            </div>
            <p
              className="mt-2 text-[12px] leading-relaxed text-white/70"
              data-testid="text-privacy-body"
            >
              This prototype stores your choices on-device (local storage).
              There’s no account, no server, and no sharing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
