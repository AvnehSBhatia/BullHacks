"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RoomState } from "@/lib/matching";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

const RULES = [
    "No advice unless explicitly asked.",
    "No graphic details or descriptions.",
    "We are here to listen, not to fix.",
    "Respect silence and take your time."
];

export default function OnboardingPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;

    const [room, setRoom] = useState<RoomState | null>(null);
    const [timeLeft, setTimeLeft] = useState(20); // 20 seconds soft landing
    const [visibleRuleIndex, setVisibleRuleIndex] = useState(-1);

    useEffect(() => {
        const saved = localStorage.getItem("hearth_room");
        if (saved) {
            try {
                setRoom(JSON.parse(saved));
            } catch (e) {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) {
            router.push(`/room/${roomId}`);
            return;
        }
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, router, roomId]);

    useEffect(() => {
        // Reveal rules one by one
        if (visibleRuleIndex < RULES.length) {
            const timer = setTimeout(() => {
                setVisibleRuleIndex((i) => i + 1);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [visibleRuleIndex]);

    if (!room) return null;

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6 sm:p-12 font-sans selection:bg-accent/30">
            <div className="max-w-xl w-full flex flex-col items-center text-center">
                <div className="w-full mb-8 flex justify-start">
                    <button
                        type="button"
                        onClick={() => router.push("/matching")}
                        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to matching
                    </button>
                </div>

                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-8 ring-1 ring-border shadow-sm">
                    <ShieldCheck className="w-8 h-8 text-foreground" />
                </div>

                <h1 className="font-serif text-3xl mb-3 text-foreground">
                    Welcome to your group
                </h1>
                <p className="text-muted-foreground text-lg mb-12">
                    Focus: <span className="capitalize font-medium text-foreground">{room.topic.replace("_", " ")}</span>
                </p>

                <div className="w-full bg-card border border-border rounded-2xl p-6 sm:p-8 mb-12 flex flex-col gap-4 text-left shadow-xl shadow-black/20">
                    <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        Gentle Guidelines
                    </h2>
                    <div className="flex flex-col gap-3 min-h-[160px]">
                        <AnimatePresence>
                            {RULES.map((rule, idx) => (
                                idx <= visibleRuleIndex && (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex items-start gap-3 text-muted-foreground"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                        <p className="leading-relaxed">{rule}</p>
                                    </motion.div>
                                )
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mb-12">
                    <p className="font-serif text-2xl italic text-foreground mb-4">
                        "Take one breath. You can type or just listen."
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    <button
                        onClick={() => router.push(`/room/${roomId}`)}
                        className="w-full max-w-sm flex items-center justify-center gap-2 h-14 rounded-full font-medium bg-foreground text-background hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                    >
                        Enter Room Now
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-sm text-muted-foreground font-mono">
                        Auto-entering in {timeLeft}s
                    </p>
                </div>

            </div>
        </div>
    );
}
