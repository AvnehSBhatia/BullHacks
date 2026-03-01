"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { EmoMatch } from "@/lib/api";
import type { RoomState, UserVector } from "@/lib/matching";

export default function MatchingPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<EmoMatch[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const groupChats = matches.slice(0, 3).map((m, idx) => ({
    id: `group-${m.id}`,
    name: `Group Chat ${idx + 1}`,
    focus: m.traits,
    members: 4 + idx,
    compatibility: Math.round(m.matchScore),
  }));

  const toRoomTopic = (focus: string) => {
    const lower = focus.toLowerCase();
    if (lower.includes("anx")) return "anxiety";
    if (lower.includes("stress")) return "stress";
    if (lower.includes("lonely") || lower.includes("alone")) return "loneliness";
    if (lower.includes("burn")) return "burnout";
    return "general_support";
  };

  const joinGroupChat = (group: (typeof groupChats)[number]) => {
    const topic = toRoomTopic(group.focus);
    const currentUser: UserVector = {
      topic,
      intensity: 55,
      energy: 45,
      needs: ["listening", "understood"],
      readiness: "share_little",
    };
    const room: RoomState = {
      id: Math.random().toString(36).slice(2, 10),
      topic,
      members: [
        currentUser,
        { topic, intensity: 38, energy: 58, needs: ["perspective"], readiness: "listen" },
        { topic, intensity: 62, energy: 40, needs: ["sharing"], readiness: "talk_lot" },
        { topic, intensity: 48, energy: 52, needs: ["coping"], readiness: "share_little" },
      ],
    };

    localStorage.setItem("hearth_vector", JSON.stringify(currentUser));
    localStorage.setItem("hearth_room", JSON.stringify(room));
    router.push(`/room/${room.id}/onboarding`);
  };

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
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <h2 className="font-serif text-2xl text-foreground">Group Chats</h2>
                <p className="text-sm text-muted-foreground">
                  Small circles built from your strongest compatibility signals.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {groupChats.map((group) => (
                    <div
                      key={group.id}
                      className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{group.members} members</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">{group.compatibility}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{group.focus}</p>
                      <button
                        type="button"
                        onClick={() => joinGroupChat(group)}
                        className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
                      >
                        Join group
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-2xl text-foreground">Individual Profiles</h2>
                <p className="text-sm text-muted-foreground">
                  Your 1:1 emotional compatibility suggestions.
                </p>
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
                          <Link
                            href={`/profile-chat/${encodeURIComponent(m.id)}`}
                            className="mt-3 inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
                          >
                            Chat
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
