/**
 * Emo backend API client.
 * Uses relative /api paths; Next.js rewrites these to the Flask server.
 */

const API_BASE = process.env.NEXT_PUBLIC_EMO_API_URL || "";

export async function fetchQuestions(): Promise<{ questions: string[]; set_index: number }> {
  const res = await fetch(`${API_BASE}/api/questions`);
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

export async function embed(questions: string[], answers: string[]): Promise<{ vector: number[] }> {
  const res = await fetch(`${API_BASE}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions, answers }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Embed failed");
  }
  return res.json();
}

export async function getMatches(
  vector: number[],
  options?: { city?: string; user_id?: string; questions?: string[]; answers?: string[] }
): Promise<{ user_id: string; matches: EmoMatch[] }> {
  const res = await fetch(`${API_BASE}/api/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vector,
      city: options?.city ?? "",
      user_id: options?.user_id,
      questions: options?.questions,
      answers: options?.answers,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Matches failed");
  }
  return res.json();
}

export interface EmoMatch {
  id: string;
  emoji: string;
  matchScore: number;
  similarityScore?: number;
  distance: number;
  traits: string;
}
