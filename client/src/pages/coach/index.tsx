import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, User, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  role: "coach" | "user";
  content: string;
  createdAt: number;
}

const QUICK_ACTIONS = [
  { label: "I feel an urge", trigger: "urge" },
  { label: "I'm stressed", trigger: "stressed" },
  { label: "I'm bored", trigger: "bored" },
  { label: "I'm lonely", trigger: "lonely" },
  { label: "I can't sleep", trigger: "sleep" },
  { label: "I relapsed", trigger: "relapse" },
  { label: "I did well today", trigger: "success" },
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("coach_messages");
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const welcome: Message = {
        id: "1",
        role: "coach",
        content: "Hello! I am your coach, always by your side. How are you feeling right now?",
        createdAt: Date.now(),
      };
      setMessages([welcome]);
      localStorage.setItem("coach_messages", JSON.stringify([welcome]));
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem("coach_messages", JSON.stringify(newMessages));
  };

  const handleSend = (text: string, role: "user" | "coach" = "user") => {
    if (!text.trim()) return;
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content: text,
      createdAt: Date.now(),
    };
    const updated = [...messages, newMessage];
    saveMessages(updated);

    if (role === "user") {
      setInput("");
      // Simple rule-based response
      setTimeout(() => {
        generateResponse(text);
      }, 800);
    }
  };

  const generateResponse = (text: string) => {
    let response = "I'm here to support you. Tell me more about that.";
    const t = text.toLowerCase();

    if (t.includes("urge")) {
      response = "I hear you. Urges are like waves—they peak and then subside. Let's try a 3-step plan: 1. Breathe deeply for 60s. 2. Delay for 10 minutes. 3. Try 10 pushups or splash cold water on your face. You've got this.";
    } else if (t.includes("stressed") || t.includes("bored") || t.includes("lonely")) {
      response = "It's completely normal to feel this way. These are common triggers. Instead of turning to old habits, could you try journaling for 5 minutes or calling a friend?";
    } else if (t.includes("relapsed")) {
      response = "It's okay. One slip doesn't erase all your progress. Take a deep breath. Why do you think it happened? Let's learn from this and restart together.";
    } else if (t.includes("well") || t.includes("good") || t.includes("success")) {
      response = "That's amazing! Celebrating small wins is key to long-term success. Keep that momentum going!";
    }

    handleSend(response, "coach");
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center p-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <Link href="/home">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold font-space">Your Coach</h1>
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl flex gap-3 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-white/5 backdrop-blur-md border border-white/10 rounded-tl-none"
                }`}
              >
                {m.role === "coach" && <Sparkles className="w-5 h-5 mt-1 shrink-0 opacity-50" />}
                <p className="text-sm leading-relaxed">{m.content}</p>
                {m.role === "user" && <User className="w-5 h-5 mt-1 shrink-0 opacity-50" />}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.trigger}
                variant="outline"
                size="sm"
                className="bg-white/5 hover:bg-white/10 border-white/10 text-xs rounded-full h-8"
                onClick={() => handleSend(action.label)}
              >
                {action.label}
              </Button>
            ))}
          </div>
          
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="bg-white/5 border-white/10 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" className="bg-gradient-to-r from-primary to-purple-600 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <p className="text-[10px] text-center text-muted-foreground opacity-50 pb-2">
            Support tool, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
