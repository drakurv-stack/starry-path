import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Send,
  Sparkles,
  Wind,
  Timer,
  Activity,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const MESSAGES_KEY = "orbit:coach_messages";
const ONBOARDING_KEY = "orbit:onboarding";
const STREAK_KEY = "orbit:streak";

type Role = "user" | "coach";
type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  tags?: string[];
  type?: "urge-plan" | "relapse-reflection" | "typing";
};

export default function CoachPage() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const name = useMemo(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      return raw ? JSON.parse(raw).name : "Friend";
    } catch {
      return "Friend";
    }
  }, []);

  const streak = Number(localStorage.getItem(STREAK_KEY) || 0);

  useEffect(() => {
    const saved = localStorage.getItem(MESSAGES_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const welcome = {
        id: "welcome",
        role: "coach" as Role,
        content: `Hi ${name}, I'm your Orbit Coach. I'm here to support you 24/7. How are you feeling right now?`,
        createdAt: new Date().toISOString(),
      };
      setMessages([welcome]);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify([welcome]));
    }
  }, [name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = (content: string, role: Role, type?: Message["type"], tags?: string[]) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      createdAt: new Date().toISOString(),
      type,
      tags,
    };
    const updated = [...messages, newMessage];
    setMessages(updated);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
    return newMessage;
  };

  const getCoachResponse = (userInput: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

      if (userInput.includes("urge")) {
        addMessage(
          "I hear you. Urges are like waves—they peak and then they pass. On a scale of 0–10, how strong is this urge right now?",
          "coach",
          "urge-plan"
        );
      } else if (userInput.includes("relapsed") || userInput.includes("slipped")) {
        addMessage(
          "I'm glad you're here. A slip is just a data point, not a destination. Let's breathe first. What was happening right before this? (Hungry, Angry, Lonely, Tired?)",
          "coach",
          "relapse-reflection"
        );
      } else if (userInput.includes("stressed")) {
        addMessage(
          "Stress is a common trigger. Let's try to ground ourselves. Can you name 3 things you can see right now?",
          "coach"
        );
      } else if (userInput.includes("bored") || userInput.includes("lonely")) {
        addMessage(
          "That feeling of emptiness can be tough. Could you try one small action: call a friend, walk for 5 minutes, or write down one thing you're curious about today?",
          "coach"
        );
      } else if (userInput.includes("can't sleep")) {
        addMessage(
          "Nighttime can be the hardest. Try a 'body scan': start at your toes and slowly relax every muscle up to your head. Focus only on the sensation of your breath.",
          "coach"
        );
      } else if (userInput.includes("well today")) {
        addMessage(
          `Outstanding work! Your streak is at ${streak} days. Each choice you make for your future self builds a stronger orbit. What was your biggest win today?`,
          "coach"
        );
      } else {
        addMessage(
          `Thanks for sharing. In this ${timeOfDay}, remember that you only need to navigate the next few minutes. What's one small thing you can do for yourself right now?`,
          "coach"
        );
      }
    }, 800 + Math.random() * 600);
  };

  const handleAction = (label: string, value: string) => {
    addMessage(label, "user");
    getCoachResponse(value);
  };

  const handleUrgeLevel = (level: number) => {
    addMessage(`Urge level: ${level}/10`, "user");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(
        "Got it. Let's ride this wave together. Here is our 3-step plan:\n1. 60s Breathing Exercise\n2. Set a 10-minute delay timer\n3. Choose an alternative action (Walk, Pushups, or Cold Water)",
        "coach",
        "urge-plan"
      );
    }, 1000);
  };

  const handleRestartStreak = () => {
    localStorage.setItem(STREAK_KEY, "0");
    addMessage("I'm restarting my streak. Fresh start.", "user");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage("Day 1 begins now. Your value hasn't changed, and your progress isn't lost—it's just shifting. Let's build a prevention plan for next time.", "coach");
    }, 1000);
  };

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col">
      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70"
            data-testid="button-coach-back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">Assistant</div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" /> Orbit Coach
            </div>
          </div>
          <div className="w-10" />
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide pr-1"
          style={{ scrollBehavior: "smooth" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                    msg.role === "user"
                      ? "bg-white/10 text-white border border-white/10 rounded-tr-sm"
                      : "glass bg-white/5 text-white/90 border border-white/10 rounded-tl-sm"
                  }`}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                  ))}

                  {msg.type === "urge-plan" && msg.role === "coach" && (
                    <div className="mt-4 grid gap-2">
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[1, 3, 5, 7, 9].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleUrgeLevel(lvl)}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs hover:bg-white/20 transition"
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button className="flex items-center gap-2 p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-semibold text-cyan-200">
                          <Wind className="h-3.5 w-3.5" /> Breathe
                        </button>
                        <button className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-[11px] font-semibold text-amber-200">
                          <Timer className="h-3.5 w-3.5" /> 10m Timer
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.type === "relapse-reflection" && msg.role === "coach" && (
                    <div className="mt-4 grid gap-2">
                      <button 
                        onClick={handleRestartStreak}
                        className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/10 text-[11px] font-semibold text-white hover:bg-white/20 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restart streak (Fresh start)
                      </button>
                      <button className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/10 text-[11px] font-semibold text-white hover:bg-white/20 transition">
                        <Activity className="h-3.5 w-3.5" /> Prevention plan
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="glass bg-white/5 p-3 rounded-2xl border border-white/10 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          {messages.length < 5 && !isTyping && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { label: "I feel an urge", val: "urge" },
                { label: "I'm stressed", val: "stressed" },
                { label: "I relapsed", val: "relapsed" },
                { label: "I did well", val: "well today" },
              ].map((act) => (
                <button
                  key={act.val}
                  onClick={() => handleAction(act.label, act.val)}
                  className="shrink-0 px-4 py-2 rounded-full glass bg-white/5 border border-white/10 text-xs font-medium text-white/80 whitespace-nowrap hover:bg-white/10 transition"
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && input.trim() && (handleAction(input, input), setInput(""))}
              placeholder="Talk to your coach..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition shadow-inner"
              data-testid="input-coach-chat"
            />
            <button
              onClick={() => input.trim() && (handleAction(input, input), setInput(""))}
              className="absolute right-2 top-2 p-2.5 rounded-full grad-pill text-white shadow-lg active:scale-95 transition"
              data-testid="button-coach-send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <footer className="text-center px-4">
            <p className="text-[10px] text-white/30 leading-tight">
              Orbit Coach is an AI-powered support tool. It does not provide medical advice. If you are in crisis, please contact local emergency services.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
