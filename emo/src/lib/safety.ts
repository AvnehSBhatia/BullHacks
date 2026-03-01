export type SafetyScanResult = {
    flagged: boolean;
    severity: "none" | "moderate" | "high";
    resourceMessage: string | null;
    triggerWord: string | null;
};

// Simple mock keyword lists for demonstration
const HIGH_SEVERITY_KEYWORDS = [
    "kill myself",
    "suicide",
    "end it all",
    "hurt myself",
    "nothing to live for",
    "want to die"
];

const MODERATE_SEVERITY_KEYWORDS = [
    "hopeless",
    "too much pain",
    "can't go on",
    "worthless",
    "giving up"
];

const GRAPHIC_KEYWORDS = [
    "bleeding",
    "cutting",
    "blood", // In a real app, context checking is crucial here.
];

export function scanMessage(text: string): SafetyScanResult {
    const normalizedText = text.toLowerCase().trim();

    // Check graphic terms
    const graphicTrigger = GRAPHIC_KEYWORDS.find((k) => normalizedText.includes(k));
    if (graphicTrigger) {
        return {
            flagged: true,
            severity: "moderate",
            resourceMessage: "A reminder: please avoid graphic details to keep this space safe for everyone.",
            triggerWord: graphicTrigger,
        };
    }

    // Check high severity
    const highTrigger = HIGH_SEVERITY_KEYWORDS.find((k) => normalizedText.includes(k));
    if (highTrigger) {
        return {
            flagged: true,
            severity: "high",
            resourceMessage: "It sounds like you are going through an overwhelming amount of pain. Please know you are not alone. You can call or text 988 to reach the Suicide & Crisis Lifeline.",
            triggerWord: highTrigger,
        };
    }

    // Check moderate severity
    const modTrigger = MODERATE_SEVERITY_KEYWORDS.find((k) => normalizedText.includes(k));
    if (modTrigger) {
        return {
            flagged: true,
            severity: "moderate",
            resourceMessage: "We hear how hard this is. Remember to take a breath. If you need 1-on-1 support, text HOME to 741741 (Crisis Text Line).",
            triggerWord: modTrigger,
        };
    }

    return { flagged: false, severity: "none", resourceMessage: null, triggerWord: null };
}
