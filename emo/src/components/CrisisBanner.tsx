"use client";

import { AlertTriangle, X } from "lucide-react";
import { SafetyScanResult } from "@/lib/safety";

export function CrisisBanner({
    result,
    onClose
}: {
    result: SafetyScanResult;
    onClose: () => void;
}) {
    if (!result.flagged || !result.resourceMessage) return null;

    return (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 my-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <div className="flex-1">
                <h3 className="text-foreground font-medium mb-1">
                    {result.severity === "high" ? "Crisis Support Resources" : "Gentle Reminder"}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    {result.resourceMessage}
                </p>
            </div>
            <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Close message"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
