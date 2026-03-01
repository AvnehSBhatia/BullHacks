"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { EmoMatch } from "@/lib/api";

export default function MatchingPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<EmoMatch[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem("hearth_user_id");
    const saved = localStorage.getItem("hearth_matches");
    if (!uid || !saved) {
      router.push("/checkin");
      return;
    }
    try {
      setMatches(JSON.parse(saved));
      setUserId(uid);
    } catch {
      router.push("/checkin");
    }
  }, [router]);

  if (userId === null && matches.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans p-6 sm:p-12 selection:bg-accent/30">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <span className="font-serif font-medium text-lg">Hearth</span>
        </header>

        <section>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Your emotional compatibility matches
          </h1>
          <p className="text-muted-foreground mb-8">
            People who share similar emotional patterns. Your ID:{" "}
            <span className="font-mono text-sm text-foreground">{userId}</span>
          </p>

          {matches.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No matches yet. Complete the check-in to find emotionally compatible people.
              </p>
              <Link
                href="/checkin"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
              >
                Start check-in
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {matches.map((m) => {
                const color =
                  m.matchScore > 80 ? "var(--color-accent)" : m.matchScore > 60 ? "var(--color-primary)" : "var(--color-muted-foreground)";
                return (
                  <div
                    key={m.id}
                    className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:border-accent/30 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {m.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-muted-foreground mb-1">{m.id}</div>
                      <div className="text-sm text-foreground">{m.traits}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(m.distance ?? 0).toFixed(1)} mi away
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-serif font-semibold" style={{ color }}>
                        {Math.round(m.matchScore)}%
                      </div>
                      <div className="text-xs text-muted-foreground">compatibility</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex gap-4">
          <Link
            href="/checkin"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full font-medium border border-border text-foreground hover:bg-card transition-all"
          >
            Retake check-in
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
