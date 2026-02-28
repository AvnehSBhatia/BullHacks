"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Flag, ShieldAlert, Sparkles, User, Info, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock Data
const MOCK_MATCH = {
    name: "Sam",
    trustScore: 92,
};

const POLICY_THRESHOLD = 5; // Unlocks after 5 total messages for demo purposes
const GUARDED_KEYWORDS = ["politics", "vote", "democrat", "republican", "election", "trump", "biden", "policy", "liberal", "conservative"];

type Message = {
    id: string;
    text: string;
    sender: "me" | "them" | "system";
    time: string;
};

export default function ChatInterface() {
    const params = useParams();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "sys_1",
            text: "Welcome to Guided Mode! 🌟 To help you build a human connection first, policy debates are paused for the moment. Here's an icebreaker to get started: What's something you're proud of from this past year?",
            sender: "system",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
    ]);
    const [inputText, setInputText] = useState("");
    const [topicGuardAlert, setTopicGuardAlert] = useState<string | null>(null);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isPolicyDiscussionUnlocked = messages.filter(m => m.sender !== "system").length >= POLICY_THRESHOLD;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Unlock check
    useEffect(() => {
        const userMsgCount = messages.filter(m => m.sender !== "system").length;
        if (userMsgCount === POLICY_THRESHOLD && !messages.some(m => m.text.includes("Policy Mode Unlocked"))) {
            setMessages(prev => [...prev, {
                id: `sys_unlock_${Date.now()}`,
                text: "🔓 Policy Mode Unlocked. You've established a foundation of shared humanity! You can now freely discuss moderate policy topics. Remember to maintain respect and lead with curiosity.",
                sender: "system",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        // Run Topic Guard check if Policy Mode is locked
        if (!isPolicyDiscussionUnlocked) {
            const lowerInput = inputText.toLowerCase();
            const triggeredWord = GUARDED_KEYWORDS.find(kw => lowerInput.includes(kw));

            if (triggeredWord) {
                setTopicGuardAlert(`Hold on! It looks like you're trying to talk about "${triggeredWord}". Let's get to know each other as people first before diving into politics 😊.`);
                return;
            }
        }

        const newMessage: Message = {
            id: `me_${Date.now()}`,
            text: inputText.trim(),
            sender: "me",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText("");
        setTopicGuardAlert(null);

        // Mock response after 1.5s
        setTimeout(() => {
            let replyText = "That's really interesting! I'd love to hear more about that.";
            if (inputText.toLowerCase().includes("proud")) replyText = "For me, I'm really proud of finishing my degree while working full time. It took a lot out of me but it was worth it.";

            setMessages(prev => [...prev, {
                id: `them_${Date.now()}`,
                text: replyText,
                sender: "them",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#F8FAFC] selection:bg-bridge-blue/20">
            {/* Top Bar */}
            <header className="h-16 border-b border-bridge-slate/10 bg-white flex items-center justify-between px-4 shrink-0 z-10 sticky top-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full hover:bg-bridge-slate/5 flex items-center justify-center text-bridge-slate transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bridge-blue/20 to-bridge-blue/5 flex items-center justify-center shrink-0 border border-bridge-slate/5">
                            <User className="w-5 h-5 text-bridge-blue" />
                        </div>
                        <div>
                            <h1 className="font-bold text-bridge-slate leading-tight">{MOCK_MATCH.name}</h1>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#10B981]">
                                <ShieldAlert className="w-3 h-3" /> T-Score: {MOCK_MATCH.trustScore}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase Indicator */}
                <div className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${isPolicyDiscussionUnlocked
                        ? 'bg-bridge-gold/10 text-bridge-gold border-bridge-gold/20'
                        : 'bg-bridge-blue/10 text-bridge-blue border-bridge-blue/20'
                    }`}>
                    {isPolicyDiscussionUnlocked ? (
                        <><Sparkles className="w-3 h-3" /> Policy Mode Unlocked</>
                    ) : (
                        <><Info className="w-3 h-3" /> Guided Mode ({POLICY_THRESHOLD - messages.filter(m => m.sender !== "system").length} msgs to unlock)</>
                    )}
                </div>

                <button
                    onClick={() => setShowReportDialog(true)}
                    className="w-10 h-10 rounded-full hover:bg-bridge-red/10 flex items-center justify-center text-bridge-slate hover:text-bridge-red transition-colors"
                    title="Report Conversation"
                >
                    <Flag className="w-4 h-4" />
                </button>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                        const isMe = msg.sender === "me";
                        const isSystem = msg.sender === "system";

                        if (isSystem) {
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="flex justify-center my-6"
                                >
                                    <div className="bg-white border border-bridge-slate/10 px-6 py-4 rounded-3xl max-w-xl text-center shadow-sm">
                                        <p className="text-sm font-medium text-bridge-slate/80 leading-relaxed">{msg.text}</p>
                                    </div>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
                            >
                                <div className={`max-w-[75%] sm:max-w-md ${isMe ? "order-1" : "order-2"}`}>
                                    <div className={`
                    p-4 shadow-sm relative group
                    ${isMe
                                            ? "bg-bridge-blue text-white rounded-3xl rounded-tr-sm"
                                            : "bg-white border border-bridge-slate/10 text-bridge-slate rounded-3xl rounded-tl-sm"
                                        }
                  `}>
                                        <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>

                                        {/* Hover Actions (Flag) */}
                                        {!isMe && (
                                            <button
                                                onClick={() => setShowReportDialog(true)}
                                                className="absolute top-1/2 -translate-y-1/2 -right-10 w-8 h-8 rounded-full hover:bg-bridge-slate/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-bridge-slate/40 hover:text-bridge-red"
                                            >
                                                <Flag className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className={`text-[10px] font-medium text-bridge-slate/40 mt-1.5 ${isMe ? "text-right" : "text-left"}`}>
                                        {msg.time}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* Input Area */}
            <footer className="bg-white border-t border-bridge-slate/10 px-4 py-4 shrink-0 relative z-20">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence>
                        {topicGuardAlert && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-3"
                            >
                                <div className="bg-bridge-red/5 border border-bridge-red/20 rounded-2xl p-3 flex items-start gap-3 shadow-sm">
                                    <AlertTriangle className="w-5 h-5 text-bridge-red shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-bridge-red flex-1 leading-relaxed">
                                        {topicGuardAlert}
                                    </p>
                                    <button
                                        onClick={() => setTopicGuardAlert(null)}
                                        className="w-6 h-6 rounded-full hover:bg-bridge-red/10 flex items-center justify-center text-bridge-red shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative flex items-end gap-2">
                        <div className="relative flex-1 bg-white border border-bridge-slate/20 rounded-3xl focus-within:border-bridge-blue focus-within:ring-2 focus-within:ring-bridge-blue/20 transition-all shadow-sm">
                            <input
                                type="text"
                                className="w-full bg-transparent px-5 py-4 outline-none text-bridge-slate placeholder-bridge-slate/40"
                                placeholder={isPolicyDiscussionUnlocked ? "Message..." : "Answer the icebreaker or share something about your day..."}
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    if (topicGuardAlert) setTopicGuardAlert(null); // Clear alert on type
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={!!topicGuardAlert}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || !!topicGuardAlert}
                            className="w-14 h-14 shrink-0 bg-bridge-blue text-white rounded-full flex items-center justify-center hover:bg-bridge-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            <Send className="w-5 h-5 ml-1" />
                        </button>
                    </div>

                    {/* Progress to unlock indicator for mobile */}
                    {!isPolicyDiscussionUnlocked && (
                        <div className="mt-3 text-center sm:hidden text-xs font-semibold text-bridge-slate/50">
                            {POLICY_THRESHOLD - messages.filter(m => m.sender !== "system").length} messages until Policy Mode unlocks
                        </div>
                    )}
                </div>
            </footer>

            {/* Report Dialog */}
            <AnimatePresence>
                {showReportDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-bridge-slate/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-xl border border-bridge-slate/10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-fraunces text-2xl font-bold text-bridge-slate">Report Conversation</h3>
                                <button
                                    onClick={() => setShowReportDialog(false)}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-bridge-slate/40"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-bridge-slate/70 mb-6">
                                If the person you're talking to is being hostile, using name-calling, or severely violating the conversational trust, please report them. A human moderator will review this chat log.
                            </p>

                            <div className="space-y-4 mb-8">
                                {['Hostility & Name Calling', 'Bypassing Topic Guards', 'Inappropriate Content', 'Other'].map(reason => (
                                    <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-bridge-slate/10 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input type="radio" name="reportReason" className="w-4 h-4 text-bridge-red border-gray-300 focus:ring-bridge-red" />
                                        <span className="text-sm font-semibold text-bridge-slate">{reason}</span>
                                    </label>
                                ))}
                                <textarea
                                    className="w-full px-4 py-3 border border-bridge-slate/20 rounded-xl outline-none focus:border-bridge-red focus:ring-1 focus:ring-bridge-red transition-all text-sm h-24 resize-none"
                                    placeholder="Additional details (optional)"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReportDialog(false)}
                                    className="flex-1 py-3 font-semibold text-bridge-slate bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        // In a real app, send report
                                        setShowReportDialog(false);
                                    }}
                                    className="flex-1 py-3 font-semibold text-white bg-bridge-red hover:bg-bridge-red/90 rounded-full shadow-md transition-colors"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
