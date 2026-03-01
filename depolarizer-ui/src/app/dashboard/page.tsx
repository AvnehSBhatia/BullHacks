"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Shield, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getMatches, type Match } from "@/lib/api";

const STORAGE_KEYS = {
  USER_ID: "depolarizer_user_id",
  STANCE: "depolarizer_political_stance",
};

const getStanceEmoji = (stance?: string | null) => {
  const normalized = (stance || "").toLowerCase();
  if (["far-left", "left-leaning", "moderate-left", "left", "center-left", "progressive"].includes(normalized)) return "🔵";
  if (["moderate-right", "right-leaning", "far-right", "right", "center-right", "conservative"].includes(normalized)) return "🔴";
  return "🟣";
};

export default function Dashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;
    setUserId(id);
    if (id) {
      getMatches(id, { minSimilarity: 0, maxSimilarity: 75, includeSameStance: true })
        .then((d) => setMatches(d.matches || []))
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const stance = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.STANCE) : null;

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="w-64 bg-h4h-soft-blue/50 border-r border-h4h-light-blue/40 flex flex-col hidden md:flex h-screen sticky top-0">
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-h4h-light-blue/30 text-h4h-dark-blue font-medium"
          >
            <User className="w-5 h-5" /> Dashboard
          </Link>
          <Link
            href="/matches"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-h4h-dark-blue/70 hover:bg-h4h-light-blue/20 hover:text-h4h-dark-blue font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" /> Past Matches
          </Link>
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-h4h-dark-blue/70 hover:bg-h4h-light-blue/20 hover:text-h4h-dark-blue font-medium transition-colors">
            <Shield className="w-5 h-5" /> Profile
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full relative">
        <header className="flex items-center justify-between mb-10 md:hidden">
          <div className="bg-h4h-dark-green text-white px-2.5 py-1 rounded-lg font-bold text-sm">
            B
          </div>
        </header>

        <h1 className="font-fraunces text-3xl font-bold text-h4h-dark-blue mb-8">
          Welcome back.
        </h1>

        <div className="space-y-8">
          {!userId ? (
            <div className="bg-white rounded-3xl p-8 border border-h4h-light-blue/40 shadow-sm">
              <p className="text-h4h-dark-blue/70 mb-6">
                Complete the quiz to find your depolarizer matches.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-h4h-dark-blue text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity"
              >
                Start Quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : loading ? (
            <div className="text-h4h-dark-blue/60">Loading matches…</div>
          ) : matches.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-h4h-dark-blue">Your Next Matches</h2>
                <span className="text-xs font-medium bg-h4h-light-green/30 text-h4h-dark-green px-2 py-1 rounded-lg">
                  {matches.length} profiles • Most to least similar
                </span>
              </div>
              <div className="space-y-4">
                {matches.map((match, i) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-h4h-light-blue/40 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-h4h-light-blue/10 rounded-bl-[200px] pointer-events-none" />
                    <div className="flex flex-col sm:flex-row gap-6 items-start relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-h4h-light-blue/20 flex items-center justify-center shrink-0 text-4xl">
                        {getStanceEmoji(match.politicalStance)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-h4h-dark-blue">{match.id}</h3>
                          <div className="bg-h4h-dark-green text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {Math.round(match.similarityScore ?? match.matchScore)}% Similar
                          </div>
                        </div>
                        <p className="text-h4h-dark-blue/70 text-sm mb-6">{match.traits}</p>
                        <Link
                          href={`/match/${match.id}`}
                          className="inline-flex items-center gap-2 bg-h4h-dark-blue text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                          View Profile & Connect
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-h4h-light-blue/40 shadow-sm">
              <p className="text-h4h-dark-blue/70 mb-2">No profiles left.</p>
              <p className="text-h4h-dark-blue/60 text-sm">
                Add more users to the pool or retake onboarding to explore lower-similarity profiles.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
