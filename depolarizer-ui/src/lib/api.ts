/**
 * Depolarizer API client.
 * Set NEXT_PUBLIC_DEPOLARIZER_API=http://localhost:5042 in .env.local
 */

const API_BASE = process.env.NEXT_PUBLIC_DEPOLARIZER_API || "http://localhost:5042";

export type PoliticalStance = "progressive" | "conservative" | "moderate";

export interface Q11Option {
  id: string;
  label: string;
}

export interface QuestionsResponse {
  questions: string[];
  q11: {
    question: string;
    options: Q11Option[];
  };
}

export interface EmbedResponse {
  vector: number[];
}

export interface Match {
  id: string;
  emoji: string;
  matchScore: number;
  similarityScore?: number;
  politicalStance: string;
  distance: number;
  traits: string;
}

export interface MatchesResponse {
  user_id: string;
  matches: Match[];
}

export async function fetchQuestions(): Promise<QuestionsResponse> {
  const res = await fetch(`${API_BASE}/api/questions`);
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}

export async function embed(questions: string[], answers: string[]): Promise<EmbedResponse> {
  const res = await fetch(`${API_BASE}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questions, answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Embed failed");
  return data;
}

export async function findMatches(params: {
  vector: number[];
  political_stance: PoliticalStance;
  city: string;
  user_id?: string;
  questions?: string[];
  answers?: string[];
}): Promise<MatchesResponse> {
  const res = await fetch(`${API_BASE}/api/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Matches failed");
  return data;
}

export async function getMatches(userId: string): Promise<{ matches: Match[] }> {
  const res = await fetch(`${API_BASE}/api/matches?user_id=${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch matches");
  return data;
}
