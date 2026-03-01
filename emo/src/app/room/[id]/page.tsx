"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, Ear, User as UserIcon, ArrowLeft } from "lucide-react";
import { PHASES, PhaseConfig, SHARING_NUDGES } from "@/lib/phases";
import { scanMessage, SafetyScanResult } from "@/lib/safety";
import { RoomState, UserVector } from "@/lib/matching";
import { CrisisBanner } from "@/components/CrisisBanner";
import clsx from "clsx";

type Message = {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
    isSystem?: boolean;
};

export default function RoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params.id as string;

    const [room, setRoom] = useState<RoomState | null>(null);
    const [currentUser, setCurrentUser] = useState<UserVector | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");

    const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
    const [safetyAlert, setSafetyAlert] = useState<SafetyScanResult | null>(null);

    const [adviceMode, setAdviceMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activePhase = PHASES[currentPhaseIdx];

    useEffect(() => {
        // Load room state
        const savedRoom = localStorage.getItem("hearth_room");
        const savedUser = localStorage.getItem("hearth_vector");
        if (savedRoom) setRoom(JSON.parse(savedRoom));
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
    }, []);

    // Phase progression
    useEffect(() => {
        if (!activePhase) return;
        setPhaseTimeLeft(activePhase.durationMs / 1000);

        // Announce phase
        setMessages((prev) => [
            ...prev,
            {
                id: Math.random().toString(),
                senderId: "system",
                senderName: "Hearth Guide",
                text: activePhase.systemPrompt,
                timestamp: new Date(),
                isSystem: true,
            }
        ]);

        const timer = setInterval(() => {
            setPhaseTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timer);
                    if (currentPhaseIdx < PHASES.length - 1) {
                        setCurrentPhaseIdx((idx) => idx + 1);
                    }
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentPhaseIdx, activePhase]);

    // Nudge system during SHARING phase
    useEffect(() => {
        if (activePhase?.id === "SHARING") {
            const nudgeTimer = setInterval(() => {
                const randomNudge = SHARING_NUDGES[Math.floor(Math.random() * SHARING_NUDGES.length)];
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Math.random().toString(),
                        senderId: "system",
                        senderName: "Hearth Guide",
                        text: randomNudge,
                        timestamp: new Date(),
                        isSystem: true,
                    }
                ]);
            }, 45000); // 45s between nudges
            return () => clearInterval(nudgeTimer);
        }
    }, [activePhase]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Safety scan
        const scan = scanMessage(inputText);
        if (scan.flagged && scan.severity === "high") {
            // Don't send, just show banner
            setSafetyAlert(scan);

            // Also log to admin dashboard
            const flaggedRooms = JSON.parse(localStorage.getItem("hearth_flagged") || "[]");
            flaggedRooms.push({ roomId, timestamp: Date.now(), trigger: scan.triggerWord });
            localStorage.setItem("hearth_flagged", JSON.stringify(flaggedRooms));

            setInputText("");
            return;
        } else if (scan.flagged && scan.severity === "moderate") {
            // Show gentle warning, but still send? Or block?
            // Let's block graphic ones entirely to protect room.
            if (scan.resourceMessage?.includes("graphic")) {
                setSafetyAlert(scan);
                setInputText("");
                return;
            }
            setSafetyAlert(scan);
            // Fall through to send for other moderate flags
        }

        const newMsg: Message = {
            id: Math.random().toString(),
            senderId: "me",
            senderName: "You",
            text: inputText,
            timestamp: new Date()
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (!room || !currentUser) return null;

    return (
        <div className="flex h-screen bg-[var(--color-background)] font-sans antialiased">

            {/* SIDEBAR */}
            <aside className="w-64 border-r border-border bg-card/30 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-border">
                    <h2 className="font-serif font-medium text-lg text-foreground">Hearth Room</h2>
                    <p className="text-sm text-muted-foreground capitalize">{room.topic.replace("_", " ")}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Members ({room.members.length})</h3>

                    <div className="flex items-center gap-3 p-2 rounded-lg bg-foreground/5 border border-border/50">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                            <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">You</p>
                            <p className="text-xs text-muted-foreground capitalize truncate">
                                {currentUser.readiness === "listen" ? "Listening" :
                                    currentUser.readiness === "share_little" ? "Might share" : "Needs to share"}
                            </p>
                        </div>
                        {adviceMode && <span className="flex w-2 h-2 rounded-full bg-primary" title="Advice mode on"></span>}
                    </div>

                    {room.members.slice(1).map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">Member {i + 1}</p>
                                <p className="text-xs text-muted-foreground capitalize truncate">
                                    {m.readiness === "listen" ? "Listening" :
                                        m.readiness === "share_little" ? "Might share" : "Sharing"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border mt-auto">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={adviceMode} onChange={(e) => setAdviceMode(e.target.checked)} />
                            <div className={clsx("block w-10 h-6 rounded-full transition-colors", adviceMode ? "bg-primary" : "bg-muted")}></div>
                            <div className={clsx("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", adviceMode ? "transform translate-x-4" : "")}></div>
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">Advice Mode</p>
                            <p className="text-xs text-muted-foreground leading-tight">Others can see you are open to advice.</p>
                        </div>
                    </label>
                </div>
            </aside>

            {/* CHAT AREA */}
            <main className="flex-1 flex flex-col relative h-full">

                {/* TOP BAR / PHASE INDICATOR */}
                <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between gap-4 w-full max-w-3xl mx-auto">
                        <button
                            type="button"
                            onClick={() => router.push("/matching")}
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to matching
                        </button>
                        <div className="flex-1 flex gap-1 h-1.5">
                            {PHASES.map((p, i) => (
                                <div key={p.id} className="h-full flex-1 rounded-full overflow-hidden bg-muted relative">
                                    {i < currentPhaseIdx && <div className="absolute inset-0 bg-foreground" />}
                                    {i === currentPhaseIdx && (
                                        <motion.div
                                            className="absolute inset-y-0 left-0 bg-primary"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${100 - (phaseTimeLeft / (activePhase?.durationMs / 1000)) * 100}%` }}
                                            transition={{ ease: "linear", duration: 1 }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm font-medium text-foreground whitespace-nowrap min-w-[120px] text-right">
                            {activePhase?.name} <span className="text-muted-foreground ml-1 font-mono">{formatTime(phaseTimeLeft)}</span>
                        </div>
                    </div>
                </header>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {safetyAlert && (
                            <CrisisBanner result={safetyAlert} onClose={() => setSafetyAlert(null)} />
                        )}

                        {messages.map((m) => {
                            if (m.isSystem) {
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        key={m.id} className="flex justify-center my-6"
                                    >
                                        <div className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm flex items-center gap-2 border border-border/50">
                                            <Ear className="w-4 h-4 text-primary" />
                                            {m.text}
                                        </div>
                                    </motion.div>
                                );
                            }

                            const isMe = m.senderId === "me";
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                    key={m.id} className={clsx("flex", isMe ? "justify-end" : "justify-start")}
                                >
                                    <div className={clsx(
                                        "max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm",
                                        isMe
                                            ? "bg-foreground text-background rounded-br-sm"
                                            : "bg-card text-card-foreground border border-border rounded-bl-sm"
                                    )}>
                                        {!isMe && <p className="text-xs font-medium text-muted-foreground mb-1">{m.senderName}</p>}
                                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                        <p className={clsx("text-[10px] mt-2 text-right opacity-60", isMe ? "text-background/80" : "text-muted-foreground")}>
                                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* INPUT */}
                <div className="p-4 bg-background border-t border-border">
                    <div className="max-w-3xl mx-auto">
                        {activePhase?.id === "CLOSE" ? (
                            <div className="w-full text-center p-4 border border-border rounded-xl bg-card text-muted-foreground text-sm">
                                The room is now closing. You may bookmark this session from your profile.
                                <button
                                    onClick={() => window.location.href = "/profile"}
                                    className="mt-3 block mx-auto text-foreground font-medium hover:underline text-sm"
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="relative flex items-center group">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={
                                        currentUser.readiness === "listen"
                                            ? "You opted to listen, but you can still type if you want..."
                                            : "Share your thoughts securely..."
                                    }
                                    className="w-full bg-card border border-border rounded-full pl-5 pr-14 py-4 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-muted-foreground"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="absolute right-2 p-2.5 bg-foreground text-background rounded-full hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        )}

                        <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground px-2">
                            <span className="flex items-center gap-1.5"><Ear className="w-3.5 h-3.5" /> End-to-end encrypted locally (demo)</span>
                            <span>Protected by Hearth Safety Scanner</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
