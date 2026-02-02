import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const LESSONS = [
  {
    id: "dopamine",
    title: "Dopamine & the Habit Loop",
    subtitle: "Understanding the cue-craving cycle",
    time: "5 min",
    sections: [
      "Dopamine is the brain's 'reward' chemical, but it's more about anticipation than pleasure.",
      "The habit loop consists of a Cue (trigger), a Craving (desire), a Response (action), and a Reward (dopamine hit).",
      "By identifying your cues, you can begin to break the automatic nature of the cycle."
    ],
    tool: {
      title: "Identify Your Cues",
      prompt: "What are three common situations or feelings that trigger your urges?",
      placeholder: "e.g., late night browsing, stress at work..."
    },
    quiz: [
      {
        question: "What is the primary role of dopamine in a habit loop?",
        options: ["Pure pleasure", "Anticipation and motivation", "Feeling tired"],
        answer: 1,
        explanation: "Dopamine drives us to seek the reward, creating the craving."
      }
    ]
  },
  {
    id: "novelty",
    title: "The Novelty Trap",
    subtitle: "Why new stimuli hook the brain",
    time: "6 min",
    sections: [
      "The brain is hardwired to seek out new information and stimuli.",
      "Digital environments provide an endless stream of 'novelty', which can over-stimulate our reward system.",
      "Learning to find satisfaction in steady, slow progress is key to recovery."
    ],
    tool: {
      title: "Novelty Audit",
      prompt: "List two offline activities that make you feel calm and present.",
      placeholder: "e.g., reading a physical book, walking in nature..."
    },
    quiz: [
      {
        question: "Why does the brain love digital novelty?",
        options: ["It's boring", "It provides endless dopamine hits", "It helps us sleep"],
        answer: 1,
        explanation: "Infinite scrolling and new content exploit our biological search for novelty."
      }
    ]
  },
  {
    id: "urge-surfing",
    title: "Urge Surfing",
    subtitle: "Riding the wave of desire",
    time: "7 min",
    sections: [
      "An urge is like a wave: it grows, peaks, and then subsides.",
      "Urge surfing is the practice of observing the urge without acting on it or fighting it.",
      "You simply 'ride' the sensation until it naturally passes."
    ],
    tool: {
      title: "Sensation Mapping",
      prompt: "Where in your body do you feel an urge most strongly?",
      placeholder: "e.g., chest tightness, restless hands..."
    },
    quiz: [
      {
        question: "What happens if you don't 'feed' an urge?",
        options: ["It grows forever", "It eventually subsides on its own", "It becomes a habit"],
        answer: 1,
        explanation: "Like a wave, an urge has a natural limit and will peak then fade."
      }
    ]
  },
  {
    id: "delay-rule",
    title: "The 10-Minute Delay Rule",
    subtitle: "Creating space between urge and action",
    time: "5 min",
    sections: [
      "The most intense part of an urge is usually short-lived.",
      "By committing to a 10-minute delay, you allow the logical part of your brain to re-engage.",
      "Tell yourself: 'I can do it in 10 minutes, but for now, I wait.'"
    ],
    tool: {
      title: "Delay Plan",
      prompt: "What will you do during your 10-minute delay?",
      placeholder: "e.g., set a timer, drink water, do 20 pushups..."
    },
    quiz: [
      {
        question: "What is the goal of the 10-minute delay?",
        options: ["To suffer", "To let the urge peak and fade", "To forget the habit"],
        answer: 1,
        explanation: "Delaying creates a gap where the intensity of the craving can drop."
      }
    ]
  },
  {
    id: "environment",
    title: "Environment Design",
    subtitle: "Removing friction and adding support",
    time: "8 min",
    sections: [
      "Your environment often dictates your behavior more than willpower does.",
      "Successful recovery involves removing 'cues' from your immediate space.",
      "Add 'friction' to bad habits (e.g., leave phone in another room) and 'ease' to good ones."
    ],
    tool: {
      title: "Space Audit",
      prompt: "What is one change you can make to your bedroom to reduce triggers?",
      placeholder: "e.g., charging phone in the kitchen..."
    },
    quiz: [
      {
        question: "How can you make a habit harder to perform?",
        options: ["Using willpower", "Adding friction", "Thinking about it more"],
        answer: 1,
        explanation: "Friction makes the 'Response' phase of the loop more difficult."
      }
    ]
  },
  {
    id: "replacement",
    title: "Replacement Habits",
    subtitle: "Filling the void with healthier actions",
    time: "6 min",
    sections: [
      "You can't just 'stop' a habit; you must replace it.",
      "Find an action that provides a different kind of reward or stress relief.",
      "The best replacement habits are easy to start and immediately available."
    ],
    tool: {
      title: "The Swap List",
      prompt: "When I feel [Trigger], instead of [Old Habit], I will [New Action].",
      placeholder: "e.g., When I feel bored, I will pick up my guitar."
    },
    quiz: [
      {
        question: "Why is replacement better than just stopping?",
        options: ["It's more fun", "It fills the neurological gap", "It's faster"],
        answer: 1,
        explanation: "The brain needs a 'Response' to the 'Cue' to complete the loop."
      }
    ]
  },
  {
    id: "stress-sleep",
    title: "Stress & Sleep",
    subtitle: "The foundation of willpower",
    time: "7 min",
    sections: [
      "Willpower is a finite resource that is depleted by stress and lack of sleep.",
      "When you are tired, your 'Prefrontal Cortex' (logical brain) is less active.",
      "Prioritizing rest is a direct investment in your recovery."
    ],
    tool: {
      title: "Rest Ritual",
      prompt: "What is one thing you can do to improve your sleep tonight?",
      placeholder: "e.g., no screens 1 hour before bed..."
    },
    quiz: [
      {
        question: "What happens to willpower when you're exhausted?",
        options: ["It gets stronger", "It is significantly reduced", "It stays the same"],
        answer: 1,
        explanation: "Sleep deprivation impairs the brain's ability to regulate impulses."
      }
    ]
  },
  {
    id: "recovery-plan",
    title: "Relapse Recovery Plan",
    subtitle: "Moving forward without shame",
    time: "6 min",
    sections: [
      "A relapse is a setback, not a failure of character.",
      "Shame often leads to further relapses. Compassion leads to learning.",
      "Analyze what happened without judgment: what was the cue? How can we adapt?"
    ],
    tool: {
      title: "Learning Protocol",
      prompt: "If a slip happens, what is the first kind thing you will say to yourself?",
      placeholder: "e.g., 'I am still learning, and this is just one day.'"
    },
    quiz: [
      {
        question: "What is the most helpful reaction to a relapse?",
        options: ["Severe self-criticism", "Curiosity and learning", "Giving up entirely"],
        answer: 1,
        explanation: "Curiosity helps identify the breakdown in the habit loop for next time."
      }
    ]
  },
  {
    id: "focus-reset",
    title: "Focus Reset",
    subtitle: "Recovering your attention span",
    time: "5 min",
    sections: [
      "High-stimulus habits shrink our ability to focus on deep, meaningful work.",
      "Focus is a muscle that can be rebuilt through 'monotasking'.",
      "Start small: 10 minutes of undivided attention on one task."
    ],
    tool: {
      title: "Deep Work Session",
      prompt: "What is one project you want to focus on for 20 minutes today?",
      placeholder: "e.g., drawing, coding, cooking..."
    },
    quiz: [
      {
        question: "How do you rebuild focus?",
        options: ["Multitasking", "Gradual practice of single-tasking", "Drinking more coffee"],
        answer: 1,
        explanation: "Monotasking trains the brain to sustain attention without constant novelty."
      }
    ]
  },
  {
    id: "connections",
    title: "Relationships & Connection",
    subtitle: "Rebuilding real-world confidence",
    time: "7 min",
    sections: [
      "Isolation is both a cause and a consequence of addictive habits.",
      "True intimacy and connection require vulnerability and presence.",
      "Small, honest interactions with friends and family build a stronger support net."
    ],
    tool: {
      title: "Connection Goal",
      prompt: "Who is one person you can reach out to today just to say hi?",
      placeholder: "e.g., my brother, a high school friend..."
    },
    quiz: [
      {
        question: "Why is connection important in recovery?",
        options: ["It's a distraction", "It provides a healthy reward and support", "It's just polite"],
        answer: 1,
        explanation: "Positive social interaction releases oxytocin and reduces the need for artificial hits."
      }
    ]
  }
];

export default function LearnLibrary() {
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState({ completed: [] });

  useEffect(() => {
    const raw = localStorage.getItem("learn_v1");
    if (raw) {
      try {
        setProgress(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse learn_v1", e);
      }
    }
  }, []);

  const completedCount = progress.completed?.length || 0;
  const totalCount = LESSONS.length;
  const percent = (completedCount / totalCount) * 100;

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <header className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/home")}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="text-center">
              <div className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">Academy</div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-cyan-400" /> Learn
              </div>
            </div>
            <div className="w-10" />
          </header>

          <Card className="glass glow mb-8 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Your Progress</h2>
                  <p className="text-sm text-white/60">{completedCount} of {totalCount} lessons completed</p>
                </div>
                <div className="text-2xl font-bold text-cyan-400">{Math.round(percent)}%</div>
              </div>
              <Progress value={percent} className="h-2" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {LESSONS.map((lesson) => {
              const isCompleted = progress.completed?.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  onClick={() => navigate(`/learn/${lesson.id}`)}
                  className="w-full text-left"
                >
                  <Card className={`glass hover-elevate transition-all border-white/10 ${isCompleted ? 'bg-white/10' : 'bg-white/5'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-sm">{lesson.title}</h3>
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                          </div>
                          <p className="text-xs text-white/60 line-clamp-1">{lesson.subtitle}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-1 text-[10px] text-white/40 font-medium">
                              <Clock className="h-3 w-3" /> {lesson.time}
                            </span>
                            {isCompleted ? (
                              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-200 border-none text-[9px] h-4">Completed</Badge>
                            ) : (
                              <Badge variant="outline" className="border-white/10 text-white/40 text-[9px] h-4">Not started</Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition">
                          <ArrowRight className="h-4 w-4 text-white/40" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          <footer className="mt-8 text-center px-4">
            <p className="text-[10px] text-white/30 leading-tight">
              Informational only. Not medical advice. Content is designed for support and education.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
