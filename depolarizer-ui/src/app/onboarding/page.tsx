"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchQuestions, embed, findMatches, type QuestionsResponse, type Q11Option } from "@/lib/api";

const STORAGE_KEYS = {
  USER_ID: "depolarizer_user_id",
  VECTOR: "depolarizer_vector",
  STANCE: "depolarizer_political_stance",
  CITY: "depolarizer_city",
};

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionsResponse | null>(null);

  const [textAnswers, setTextAnswers] = useState<string[]>([]);
  const [politicalStance, setPoliticalStance] = useState<string>("");
  const [city, setCity] = useState("");

  useEffect(() => {
    fetchQuestions()
      .then(setQuestionsData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (questionsData) {
      setTextAnswers(new Array(10).fill(""));
    }
  }, [questionsData]);

  const totalSteps = questionsData ? 12 : 0; // 10 Q + Q11 stance + city
  const isTextStep = step < 10;
  const isStanceStep = step === 10;
  const isCityStep = step === 11;

  const canProceed = () => {
    if (isTextStep) return textAnswers[step]?.trim().length >= 3;
    if (isStanceStep) return !!politicalStance;
    if (isCityStep) return city.trim().length >= 2;
    return false;
  };

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!questionsData) return;
    setLoading(true);
    setError(null);
    try {
      const questions = questionsData.questions;
      const answers = textAnswers.map((a) => (a?.trim() || "I'm not sure."));
      const { vector } = await embed(questions, answers);
      const { user_id, matches } = await findMatches({
        vector,
        political_stance: politicalStance as "progressive" | "conservative" | "moderate",
        city: city || "Unknown",
        questions,
        answers,
      });
      localStorage.setItem(STORAGE_KEYS.USER_ID, user_id);
      localStorage.setItem(STORAGE_KEYS.VECTOR, JSON.stringify(vector));
      localStorage.setItem(STORAGE_KEYS.STANCE, politicalStance);
      localStorage.setItem(STORAGE_KEYS.CITY, city);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  if (loading && !questionsData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-h4h-dark-blue/60">Loading questions…</div>
      </div>
    );
  }

  if (error && !questionsData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <p className="text-h4h-dark-green font-medium mb-4">{error}</p>
        <p className="text-h4h-dark-blue/60 text-sm mb-6">Is the depolarizer server running on port 5042?</p>
        <Link href="/" className="bg-h4h-dark-blue text-white px-6 py-3 rounded-2xl font-semibold">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!questionsData) return null;

  const q11Options = questionsData.q11?.options || [
    { id: "progressive", label: "Progressive / Left-leaning" },
    { id: "conservative", label: "Conservative / Right-leaning" },
    { id: "moderate", label: "Moderate / Centrist" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="h-16 border-b border-h4h-light-blue/40 px-6 flex items-center justify-between bg-h4h-soft-blue/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="bg-h4h-dark-green text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-sm">
              B
            </div>
          </Link>
          <span className="font-semibold text-h4h-dark-blue">Depolarizer Quiz</span>
        </div>
        <div className="text-sm text-h4h-dark-blue/60 font-medium">
          Step {step + 1} of {totalSteps}
        </div>
      </header>

      <div className="w-full bg-h4h-light-blue/30 h-1">
        <motion.div
          className="h-full bg-h4h-dark-green"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-bridge-slate/5 rounded-full -z-10" />

        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-h4h-light-blue/40 overflow-hidden min-h-[500px] flex flex-col relative">
          <div className="flex-1 p-8 sm:p-12 relative">
            <AnimatePresence mode="wait">
              {isTextStep && (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="w-12 h-12 bg-bridge-blue/10 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-xl font-bold text-bridge-blue">{step + 1}</span>
                  </div>
                  <h2 className="font-fraunces text-2xl font-bold text-h4h-dark-blue">
                    {questionsData.questions[step]}
                  </h2>
                  <textarea
                    className="w-full px-4 py-3 rounded-2xl border border-h4h-light-blue/50 focus:border-h4h-dark-blue focus:ring-1 focus:ring-h4h-dark-blue outline-none transition-all resize-none h-32 bg-h4h-soft-blue/30"
                    placeholder="Write your answer here…"
                    value={textAnswers[step] || ""}
                    onChange={(e) => {
                      const next = [...textAnswers];
                      next[step] = e.target.value;
                      setTextAnswers(next);
                    }}
                  />
                </motion.div>
              )}

              {isStanceStep && (
                <motion.div
                  key="stance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="w-12 h-12 bg-bridge-slate/5 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl">⚖️</span>
                  </div>
                  <h2 className="font-fraunces text-3xl font-bold text-h4h-dark-blue">Political Stance</h2>
                  <p className="text-h4h-dark-blue/70 text-lg">
                    We use this <strong>only</strong> to pair you with someone who identifies differently. We don't show this to your matches.
                  </p>
                  <div className="space-y-3 mt-8">
                    {q11Options.map((opt: Q11Option) => (
                      <button
                        key={opt.id}
                        onClick={() => setPoliticalStance(opt.id)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all ${
                          politicalStance === opt.id
                            ? "border-h4h-dark-blue bg-h4h-dark-blue text-white shadow-md"
                            : "border-h4h-light-blue/50 hover:border-h4h-dark-blue/50 text-h4h-dark-blue"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {isCityStep && (
                <motion.div
                  key="city"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="w-12 h-12 bg-bridge-slate/10 rounded-2xl flex items-center justify-center mb-6">
                    <MapPin className="w-6 h-6 text-bridge-slate" />
                  </div>
                  <h2 className="font-fraunces text-3xl font-bold text-h4h-dark-blue">Where are you?</h2>
                  <p className="text-h4h-dark-blue/70 text-lg">We use this for matching context.</p>
                  <div className="mt-8">
                    <label className="block text-sm font-medium text-bridge-slate mb-1">City / Region</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-2xl border border-h4h-light-blue/50 focus:border-h4h-dark-blue focus:ring-1 focus:ring-h4h-dark-blue outline-none transition-all bg-h4h-soft-blue/30"
                      placeholder="e.g. San Francisco"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="px-8 pb-2 text-sm text-bridge-red font-medium">{error}</div>
          )}

          <div className="p-6 border-t border-h4h-light-blue/30 bg-h4h-soft-blue/30 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-h4h-dark-blue/70 hover:text-h4h-dark-blue font-medium transition-colors px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
                className="flex items-center gap-2 bg-h4h-dark-blue text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === totalSteps - 1 ? (loading ? "Building profile…" : "Complete & Find Matches") : "Continue"}
              {step < totalSteps - 1 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
