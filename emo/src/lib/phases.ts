export type PhaseId = "ARRIVAL" | "SHARING" | "REFLECTION" | "CLOSE";

export interface PhaseConfig {
    id: PhaseId;
    name: string;
    durationMs: number; // For demo, we might speed this up to seconds instead of minutes
    systemPrompt: string;
}

// In a real app, these would be 5m, 20m, 10m, 5m.
// For demo purposes, we'll compress them to simulate the flow easily within minutes.
// Arrival = 30s, Sharing = 2m, Reflection = 1m, Close = 30s
export const PHASES: PhaseConfig[] = [
    {
        id: "ARRIVAL",
        name: "Arrival phase",
        durationMs: 30 * 1000,
        systemPrompt: "Welcome. How is everyone feeling right now? A single word or emoji is fine."
    },
    {
        id: "SHARING",
        name: "Sharing",
        durationMs: 120 * 1000,
        systemPrompt: "We are now moving into sharing time. Remember: no advice unless asked. Who would like to share first?"
    },
    {
        id: "REFLECTION",
        name: "Reflection",
        durationMs: 60 * 1000,
        systemPrompt: "Let's pause and reflect. What resonated with you today? Did anything help you feel less alone?"
    },
    {
        id: "CLOSE",
        name: "Closing",
        durationMs: 30 * 1000,
        systemPrompt: "Our time is coming to an end. Take a moment to notice your breath. Thank you for showing up for each other."
    }
];

export const SHARING_NUDGES = [
    "Let's pause and hear from someone else.",
    "If you haven't shared yet and would like to, now is a good time.",
    "Remember to reflect instead of advising.",
];
