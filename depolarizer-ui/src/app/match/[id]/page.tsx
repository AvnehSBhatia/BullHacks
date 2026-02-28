"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getMatches, type Match } from "@/lib/api";

export default function MatchProfilePreview() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("depolarizer_user_id") : null;

  useEffect(() => {
    const id = params?.id as string;
    if (!id) {
      setLoading(false);
      return;
    }
    if (userId) {
      getMatches(userId)
        .then((d) => {
          const m = (d.matches || []).find((x) => x.id === id);
          setMatch(m || null);
        })
        .catch(() => setMatch(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [params?.id, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-h4h-dark-blue/60">Loading…</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <p className="text-h4h-dark-blue/70 mb-4">Match not found.</p>
        <Link href="/dashboard" className="text-h4h-dark-green font-semibold hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 pb-24 px-6">
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-h4h-dark-blue/70 hover:text-h4h-dark-blue font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-h4h-light-blue/40 relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-h4h-light-blue/5 rounded-bl-full pointer-events-none -translate-y-1/4 translate-x-1/4" />

          <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
            <div className="w-32 h-32 rounded-3xl bg-h4h-light-blue/20 flex items-center justify-center shrink-0 border-4 border-white shadow-sm text-6xl">
              {match.emoji || "👤"}
            </div>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                <h1 className="font-fraunces text-4xl font-bold text-h4h-dark-blue">{match.id}</h1>
                <div className="bg-h4h-dark-green text-white px-4 py-1.5 rounded-full font-bold shadow-sm inline-flex items-center justify-center">
                  {Math.round(match.matchScore)}% Match
                </div>
              </div>

              <p className="text-h4h-dark-blue/80 text-lg leading-relaxed mb-6">{match.traits}</p>

              <div className="flex items-center gap-2 text-sm font-medium text-h4h-dark-blue/70">
                <span className="bg-h4h-light-green/30 px-2 py-0.5 rounded-full">
                  {match.politicalStance?.charAt(0).toUpperCase()}
                  {match.politicalStance?.slice(1)}
                </span>
                {(match.similarityScore ?? match.matchScore) > 0 && (
                  <span>{(match.similarityScore ?? match.matchScore).toFixed(0)}% similar on political Q&A</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10 pl-4 border-l-2 border-h4h-light-blue/40">
          <h2 className="font-fraunces text-2xl font-bold text-h4h-dark-blue mb-2">Why we paired you</h2>
          <p className="text-h4h-dark-blue/70 max-w-xl">
            You two have different political identities but 75%+ similarity in how you reason about political questions.
          </p>
        </div>

        <div className="bg-h4h-dark-blue text-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h3 className="font-bold text-lg mb-1">Ready to cross the bridge?</h3>
            <p className="text-white/70 text-sm">
              Start a conversation and discover what you have in common beyond politics.
            </p>
          </div>
          <button
            onClick={() => router.push(`/chat/${params?.id || "c_new"}`)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-h4h-dark-blue px-8 py-4 rounded-2xl font-bold hover:bg-h4h-soft-blue transition-colors shadow-sm shrink-0"
          >
            <MessageCircle className="w-5 h-5" />
            Start Guided Chat
          </button>
        </div>
      </motion.div>
    </div>
  );
}
