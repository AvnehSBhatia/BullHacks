"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { getMatches, type Match } from "@/lib/api";

const getStanceEmoji = (stance?: string | null) => {
  const normalized = (stance || "").toLowerCase();
  if (["far-left", "left-leaning", "moderate-left", "left", "center-left", "progressive"].includes(normalized)) return "🔵";
  if (["moderate-right", "right-leaning", "far-right", "right", "center-right", "conservative"].includes(normalized)) return "🔴";
  return "🟣";
};

export default function PastMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("depolarizer_user_id") : null;

  useEffect(() => {
    if (userId) {
      getMatches(userId)
        .then((d) => setMatches(d.matches || []))
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="w-64 bg-h4h-soft-blue/50 border-r border-h4h-light-blue/40 flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-h4h-light-blue/30 flex items-center gap-3">
          <div className="bg-h4h-dark-green text-white px-2.5 py-1 rounded-lg font-bold text-sm">
            B
          </div>
          <span className="font-semibold text-xl text-h4h-dark-blue">Bridge</span>
        </div>
        <div className="p-4 flex-1 space-y-2">
          <div className="px-3 py-2 text-xs font-semibold text-h4h-dark-blue/50 uppercase tracking-wider mt-4 mb-2">
            Overview
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-h4h-dark-blue/70 hover:bg-h4h-light-blue/20 hover:text-h4h-dark-blue font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </Link>
          <Link
            href="/matches"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-h4h-light-blue/30 text-h4h-dark-blue font-medium"
          >
            <MessageCircle className="w-5 h-5" /> Past Matches
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-2xl bg-white border border-h4h-light-blue/40 flex items-center justify-center text-h4h-dark-blue shadow-sm md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-fraunces text-3xl font-bold text-h4h-dark-blue">Past Matches</h1>
        </div>

        {loading ? (
          <div className="text-h4h-dark-blue/60">Loading…</div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-3xl p-6 border border-h4h-light-blue/40 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-h4h-light-blue/20 flex items-center justify-center shrink-0 text-3xl">
                  {getStanceEmoji(match.politicalStance)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-h4h-dark-blue">{match.id}</h2>
                    <span className="text-xs font-bold bg-h4h-dark-green/15 text-h4h-dark-green px-2 py-0.5 rounded-lg">
                      {Math.round(match.matchScore)}% Match
                    </span>
                    <span className="text-xs font-bold bg-h4h-light-green/30 text-h4h-dark-green px-2 py-0.5 rounded-lg">
                      {match.politicalStance?.charAt(0).toUpperCase()}
                      {match.politicalStance?.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-h4h-dark-blue/70 mb-3">{match.traits}</p>
                </div>
                <Link
                  href={`/match/${match.id}`}
                  className="shrink-0 flex items-center gap-2 bg-h4h-dark-blue text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> View Profile
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="text-center py-24 text-h4h-dark-blue/60">
            <p className="text-lg font-semibold">No matches yet.</p>
            <p className="text-sm mt-1">
              We show people 75%+ similar with a different political stance.
            </p>
            <Link href="/onboarding" className="inline-block mt-4 text-h4h-dark-green font-semibold hover:underline">
              Retake the quiz
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
