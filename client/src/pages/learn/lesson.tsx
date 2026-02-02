import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Wand2,
  Sparkles,
  ArrowLeft,
  Check,
  Send,
  BookOpen
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LESSONS } from "./index";

export default function LessonDetail() {
  const [, navigate] = useLocation();
  const { lessonId } = useParams();
  const [step, setStep] = useState(0); // 0: content, 1: tool, 2: quiz
  const [toolValue, setToolValue] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const lesson = useMemo(() => LESSONS.find(l => l.id === lessonId), [lessonId]);

  useEffect(() => {
    if (!lesson) navigate("/learn");
  }, [lesson, navigate]);

  if (!lesson) return null;

  const handleComplete = () => {
    const raw = localStorage.getItem("learn_v1");
    let progress: { completed: string[]; toolResponses: Record<string, string>; quizScores: Record<string, string> } = { 
      completed: [], 
      toolResponses: {}, 
      quizScores: {} 
    };
    if (raw) {
      try {
        progress = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse learn progress", e);
      }
    }
    
    if (!progress.completed.includes(lesson.id)) {
      progress.completed.push(lesson.id);
      // Award orbs
      const orbs = Number(localStorage.getItem("orbit:orbs") || 0);
      localStorage.setItem("orbit:orbs", String(orbs + 2));
    }
    
    progress.toolResponses[lesson.id] = toolValue;
    
    const correctCount = quizAnswers.filter((ans, i) => ans === lesson.quiz[i].answer).length;
    progress.quizScores[lesson.id] = `${correctCount}/${lesson.quiz.length}`;
    
    localStorage.setItem("learn_v1", JSON.stringify(progress));
    navigate("/learn");
  };

  const currentModuleIndex = LESSONS.indexOf(lesson) + 1;

  return (
    <div className="min-h-dvh app-bg text-foreground flex flex-col">
      <div className="mx-auto w-full max-w-[420px] flex-1 flex flex-col px-4 pt-8 pb-4">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/learn")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="text-center">
            <div className="text-xs font-semibold tracking-[0.25em] text-white/40 uppercase mb-1">Module {currentModuleIndex}</div>
            <div className="text-sm font-semibold text-white flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" /> Learning Session
            </div>
          </div>
          <div className="w-10" />
        </header>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-8 px-2">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white font-[var(--font-serif)] leading-tight">{lesson.title}</h1>
                  <p className="text-sm text-cyan-400/80 font-medium mt-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Theory & Understanding
                  </p>
                </div>

                <div className="space-y-4">
                  {lesson.sections.map((section, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="glass bg-white/5 border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500/50 transition-colors" />
                        <CardContent className="p-5 text-sm leading-relaxed text-white/80">
                          {section}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => setStep(1)}
                    className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-transform text-base"
                  >
                    Continue to Action <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="tool"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 grid place-items-center text-cyan-400">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white font-[var(--font-serif)]">Interactive Tool</h2>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Practical Exercise</p>
                  </div>
                </div>

                <Card className="glass glow bg-white/5 border-white/10 overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-3">{lesson.tool.title}</h3>
                    <p className="text-sm text-white/70 leading-relaxed mb-6">{lesson.tool.prompt}</p>
                    <div className="relative">
                      <textarea
                        value={toolValue}
                        onChange={(e) => setToolValue(e.target.value)}
                        placeholder={lesson.tool.placeholder}
                        className="w-full h-40 bg-black/20 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition shadow-inner resize-none"
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] font-bold text-white/20 uppercase">
                        Saved Locally
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="pt-2">
                  <Button 
                    onClick={() => setStep(2)}
                    className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-transform text-base"
                    disabled={!toolValue.trim()}
                  >
                    Knowledge Check <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white font-[var(--font-serif)]">Final Check</h2>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Validation</p>
                  </div>
                </div>

                {lesson.quiz.map((q, qIndex) => (
                  <Card key={qIndex} className="glass bg-white/5 border-white/10 relative overflow-hidden">
                    <CardContent className="p-6">
                      <p className="text-[17px] font-bold text-white mb-6 leading-snug">{q.question}</p>
                      <div className="space-y-3">
                        {q.options.map((option, oIndex) => {
                          const isSelected = quizAnswers[qIndex] === oIndex;
                          const isCorrect = q.answer === oIndex;
                          const showResult = quizSubmitted;

                          let containerStyle = "border-white/10 bg-white/5 text-white/60 hover:bg-white/10";
                          if (isSelected) containerStyle = "border-cyan-500/50 bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/20";
                          if (showResult && isCorrect) containerStyle = "border-green-500/40 bg-green-500/10 text-green-300 ring-1 ring-green-500/20";
                          if (showResult && isSelected && !isCorrect) containerStyle = "border-red-500/40 bg-red-500/10 text-red-300 ring-1 ring-red-500/20";

                          return (
                            <button
                              key={oIndex}
                              disabled={quizSubmitted}
                              onClick={() => {
                                const newAns = [...quizAnswers];
                                newAns[qIndex] = oIndex;
                                setQuizAnswers(newAns);
                              }}
                              className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between group ${containerStyle}`}
                            >
                              <span>{option}</span>
                              {isSelected && !showResult && <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                              {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                            </button>
                          );
                        })}
                      </div>
                      
                      <AnimatePresence>
                        {quizSubmitted && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 pt-6 border-t border-white/10 text-xs text-white/50 leading-relaxed flex gap-3 italic"
                          >
                            <Lightbulb className="h-5 w-5 shrink-0 text-amber-400/70" />
                            <div>
                              <span className="font-bold text-white/70 block mb-1 not-italic uppercase tracking-wider text-[10px]">Insight</span>
                              {q.explanation}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                ))}

                <div className="pt-2">
                  {!quizSubmitted ? (
                    <Button 
                      onClick={() => setQuizSubmitted(true)}
                      className="w-full grad-pill h-14 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-transform text-base"
                      disabled={quizAnswers.length < lesson.quiz.length}
                    >
                      Complete Session
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleComplete}
                      className="w-full bg-white text-black hover:bg-white/90 h-14 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-transform text-base"
                    >
                      Return to Academy <CheckCircle2 className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-8 text-center px-4 pb-4">
          <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-[0.1em] font-bold">
            Evidence Based Support
          </p>
        </footer>
      </div>
    </div>
  );
}
