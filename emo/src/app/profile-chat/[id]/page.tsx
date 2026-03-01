"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import type { EmoMatch } from "@/lib/api";

type ChatMessage = {
  id: string;
  sender: "me" | "them";
  text: string;
  createdAt: number;
};

export default function ProfileChatPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = decodeURIComponent((params.id as string) ?? "");
  const [match, setMatch] = useState<EmoMatch | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const storageKey = useMemo(() => `hearth_dm_${profileId}`, [profileId]);

  useEffect(() => {
    if (!profileId) {
      router.push("/matching");
      return;
    }

    const savedMatches = localStorage.getItem("hearth_matches");
    if (!savedMatches) {
      router.push("/matching");
      return;
    }

    try {
      const parsed = JSON.parse(savedMatches) as EmoMatch[];
      const selected = parsed.find((m) => m.id === profileId) ?? null;
      setMatch(selected);

      const savedDm = localStorage.getItem(storageKey);
      if (savedDm) {
        setMessages(JSON.parse(savedDm));
        return;
      }

      if (selected) {
        setMessages([
          {
            id: `seed-${Date.now()}`,
            sender: "them",
            text: `Hey, I saw we matched on "${selected.traits}". Glad to connect.`,
            createdAt: Date.now(),
          },
        ]);
      }
    } catch {
      router.push("/matching");
    }
  }, [profileId, router, storageKey]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const outgoing: ChatMessage = {
      id: `me-${Date.now()}`,
      sender: "me",
      text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, outgoing]);
    setInput("");

    // Simple mock reply so the conversation feels alive.
    const replies = [
      "Thanks for sharing that. I relate to that part too.",
      "I appreciate your honesty. Want to talk more about it?",
      "That makes sense. What helped you most this week?",
      "I hear you. I'm here to listen.",
    ];
    const reply: ChatMessage = {
      id: `them-${Date.now() + 1}`,
      sender: "them",
      text: replies[Math.floor(Math.random() * replies.length)],
      createdAt: Date.now() + 1,
    };
    setTimeout(() => setMessages((prev) => [...prev, reply]), 450);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans p-6 sm:p-12 selection:bg-accent/30">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link
            href="/matching"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to matching
          </Link>
          <span className="font-serif font-medium text-lg">Hearth</span>
        </header>

        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <h1 className="font-serif text-2xl sm:text-3xl text-foreground">Chat with {profileId}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {match ? `Compatibility ${Math.round(match.matchScore)}% • ${match.traits}` : "Profile details are unavailable."}
          </p>
        </section>

        <section className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col gap-4 min-h-[380px]">
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Start the conversation when you are ready.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.sender === "me" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.sender === "me"
                        ? "max-w-[80%] rounded-2xl px-4 py-3 bg-foreground text-background text-sm leading-relaxed"
                        : "max-w-[80%] rounded-2xl px-4 py-3 bg-secondary text-foreground text-sm leading-relaxed border border-border"
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Write a message..."
              className="flex-1 bg-[var(--color-background)] border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
            />
            <button
              type="submit"
              disabled={input.trim().length === 0}
              className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
