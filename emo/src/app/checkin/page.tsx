"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import clsx from "clsx";
import { fetchQuestions, embed, getMatches } from "@/lib/api";

type QuestionState = {
  prompt: string;
  id: string;
  placeholder: string;
  hint: string;
};

export default function CheckinPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState("");

  useEffect(() => {
    fetchQuestions()
      .then((data) => {
        const qs = data.questions.map((prompt, i) => ({
          id: `q${i}`,
          prompt,
          placeholder: "Write your answer here…",
          hint: "No need to be specific, write however feels natural.",
        }));
        setQuestions(qs);
      })
      .catch((e) => setError(e.message || "Could not load questions"))
      .finally(() => setLoading(false));
  }, []);

  const currentQ = questions[step];
  const isLast = questions.length > 0 && step === questions.length - 1;
  const canAdvance = currentInput.trim().length >= 3 && !submitting;

  const handleNext = async () => {
    if (!currentQ) return;

    const newAnswers = { ...answers, [currentQ.id]: currentInput.trim() };
    setAnswers(newAnswers);
    setCurrentInput("");

    if (isLast) {
      setSubmitting(true);
      try {
        const qList = questions.map((q) => q.prompt);
        const aList = questions.map((q) => newAnswers[q.id] ?? "I'm not sure.");

        const { vector } = await embed(qList, aList);
        const { user_id, matches } = await getMatches(vector, {
          questions: qList,
          answers: aList,
        });

        localStorage.setItem("hearth_user_id", user_id);
        localStorage.setItem("hearth_matches", JSON.stringify(matches));
        router.push("/matching");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setSubmitting(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && canAdvance) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setCurrentInput(answers[questions[step - 1]?.id ?? ""] ?? "");
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Loading questions…</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Make sure the Hearth server is running on port 5031.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-sm font-medium text-foreground hover:underline"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  const progressPct = questions.length > 0 ? ((step + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans selection:bg-accent/30">
      <header className="w-full max-w-2xl mx-auto px-4 sm:px-8 pt-6 mb-4 flex justify-between items-center">
        <button
          onClick={handleBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? "Back" : "Previous"}
        </button>
        <span className="font-serif font-medium text-lg text-foreground">Hearth</span>
      </header>

      {/* Progress bar */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 mb-10">
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {step + 1} of {questions.length}
        </p>
      </div>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8 flex flex-col">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-8 space-y-1">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Question {step + 1}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground leading-snug">
            {currentQ?.prompt}
          </h1>
          <p className="text-muted-foreground text-sm pt-1">{currentQ?.hint}</p>
        </div>

        <textarea
          autoFocus
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentQ?.placeholder}
          rows={5}
          disabled={submitting}
          className="w-full bg-card border border-border rounded-2xl px-6 py-5 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-none placeholder:text-muted-foreground text-base leading-relaxed shadow-sm disabled:opacity-70"
        />

        <p className="text-xs text-muted-foreground mt-2 ml-1">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-xs">Enter ↵</kbd> to
          continue, or click the button below.
        </p>

        <div className="mt-8">
          <button
            onClick={() => handleNext()}
            disabled={!canAdvance}
            className={clsx(
              "w-full flex items-center justify-center gap-2 h-14 rounded-full font-medium transition-all",
              canAdvance
                ? "bg-foreground text-background hover:scale-[1.02] active:scale-95 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding your matches…
              </>
            ) : isLast ? (
              <>
                Find my matches
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Previous answers summary */}
        {Object.keys(answers).length > 0 && (
          <div className="mt-12 border-t border-border pt-8 space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Your answers so far
            </p>
            {questions.slice(0, step).map((q) => (
              <div key={q.id} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{q.prompt}</span>
                <p className="text-foreground text-sm leading-relaxed pl-3 border-l-2 border-border">
                  {answers[q.id]}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="h-16" />
    </div>
  );
}
