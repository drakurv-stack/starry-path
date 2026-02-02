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
  AlertTriangle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LESSONS } from "./index";

export default function LessonDetail() {
  const [, navigate] = useLocation();
  const { lessonId } = useParams();
  const [step, setStep] = useState(0); // 0: content, 1: tool, 2: quiz, 3: result
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
    let progress = { completed: [], toolResponses: {}, quizScores: {} };
    if (raw) progress = JSON.parse(raw);
    
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

  return (
    <div className="min-h-dvh app-bg text-foreground">
      <div className="mx-auto w-full max-w-[420px] px-4 py-8">
        <div className="page-in">
          <header className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/learn")}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/70"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="text-center">
              <div className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">Lesson</div>
              <div className="text-sm font-semibold text-white">Module {LESSONS.indexOf(lesson) + 1}</div>
            </div>
            <div className="w-10" />
          </header>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white font-[var(--font-serif)]">{lesson.title}</h1>
                  <p className="text-sm text-white/60 mt-1">{lesson.subtitle}</p>
                </div>

                <div className="space-y-4">
                  {lesson.sections.map((section, i) => (
                    <Card key={i} className="glass bg-white/5 border-white/10">
                      <CardContent className="p-4 text-sm leading-relaxed text-white/80">
                        {section}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button 
                  onClick={() => setStep(1)}
                  className="w-full grad-pill h-12 rounded-full font-bold shadow-lg"
                >
                  Go to Tool <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="tool"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Try This Now</h2>
                </div>

                <Card className="glass glow bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-white mb-2">{lesson.tool.title}</h3>
                    <p className="text-sm text-white/70 mb-4">{lesson.tool.prompt}</p>
                    <textarea
                      value={toolValue}
                      onChange={(e) => setToolValue(e.target.value)}
                      placeholder={lesson.tool.placeholder}
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition"
                    />
                  </CardContent>
                </Card>

                <Button 
                  onClick={() => setStep(2)}
                  className="w-full grad-pill h-12 rounded-full font-bold shadow-lg"
                  disabled={!toolValue.trim()}
                >
                  Next: Quiz <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Check Your Knowledge</h2>
                </div>

                {lesson.quiz.map((q, qIndex) => (
                  <Card key={qIndex} className="glass bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <p className="font-bold text-white mb-4">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((option, oIndex) => {
                          const isSelected = quizAnswers[qIndex] === oIndex;
                          const isCorrect = q.answer === oIndex;
                          const showResult = quizSubmitted;

                          let variantClass = "border-white/10 bg-white/5 text-white/70";
                          if (isSelected) variantClass = "border-cyan-500/50 bg-cyan-500/10 text-cyan-200";
                          if (showResult && isCorrect) variantClass = "border-green-500/50 bg-green-500/10 text-green-200";
                          if (showResult && isSelected && !isCorrect) variantClass = "border-red-500/50 bg-red-500/10 text-red-200";

                          return (
                            <button
                              key={oIndex}
                              disabled={quizSubmitted}
                              onClick={() => {
                                const newAns = [...quizAnswers];
                                newAns[qIndex] = oIndex;
                                setQuizAnswers(newAns);
                              }}
                              className={`w-full text-left p-4 rounded-2xl border text-sm transition-all ${variantClass}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/60 flex gap-3 italic">
                          <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                          {q.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {!quizSubmitted ? (
                  <Button 
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full grad-pill h-12 rounded-full font-bold shadow-lg"
                    disabled={quizAnswers.length < lesson.quiz.length}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button 
                    onClick={handleComplete}
                    className="w-full grad-pill h-12 rounded-full font-bold shadow-lg"
                  >
                    Finish Lesson <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-8 text-center px-4">
            <p className="text-[10px] text-white/30 leading-tight">
              Informational only. Not medical advice.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
