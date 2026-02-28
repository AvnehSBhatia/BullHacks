"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, User, Flag, ShieldAlert, Info, AlertTriangle, Sparkles, X } from "lucide-react";
import Link from "next/link";

const POLICY_THRESHOLD = 5;
const GUARDED_KEYWORDS = ["politics", "vote", "democrat", "republican", "election", "trump", "biden", "policy", "liberal", "conservative"];

type Message = {
    id: string;
    text: string;
    sender: "me" | "them" | "system";
    time: string;
};

const CONVERSATIONS = [
    {
        id: "c_1",
        name: "Jordan",
        preview: "That's exactly how I felt about the book too!",
        unread: 0,
        time: "2h ago",
        trustScore: 89,
        initialMessages: [
            { id: "sys_1", text: "Welcome to Guided Mode! 🌟 Policy debates are paused. Here's an icebreaker: What's something you're proud of from this past year?", sender: "system" as const, time: "10:00 AM" },
            { id: "t_1", text: "Honestly? I finished reading all of Dostoevsky's major works. It took me two years but I did it.", sender: "them" as const, time: "10:01 AM" },
            { id: "m_1", text: "That's incredible! I've been meaning to read The Brothers Karamazov. Where would you start?", sender: "me" as const, time: "10:03 AM" },
            { id: "t_2", text: "That's exactly how I felt about the book too!", sender: "them" as const, time: "10:04 AM" },
        ]
    },
    {
        id: "c_2",
        name: "Taylor",
        preview: "I hadn't considered that perspective before.",
        unread: 2,
        time: "1d ago",
        trustScore: 94,
        initialMessages: [
            { id: "sys_1", text: "Welcome to Guided Mode! 🌟 Here's an icebreaker: What's a cause you care about that surprises people?", sender: "system" as const, time: "Yesterday" },
            { id: "t_1", text: "Animal welfare — specifically factory farming. People expect me to be into other things based on how I vote.", sender: "them" as const, time: "Yesterday" },
            { id: "m_1", text: "That's really surprising in the best way. I care about the same thing. What drew you to that?", sender: "me" as const, time: "Yesterday" },
            { id: "t_2", text: "I hadn't considered that perspective before.", sender: "them" as const, time: "Yesterday" },
        ]
    },
];

export default function MessagesPage() {
    const [selectedConvo, setSelectedConvo] = useState(CONVERSATIONS[0]);
    const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(() => {
        const init: Record<string, Message[]> = {};
        CONVERSATIONS.forEach(c => { init[c.id] = c.initialMessages; });
        return init;
    });
    const [inputText, setInputText] = useState("");
    const [topicGuardAlert, setTopicGuardAlert] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);

    const messages = allMessages[selectedConvo.id] || [];
    const userMessageCount = messages.filter(m => m.sender !== "system").length;
    const isPolicyUnlocked = userMessageCount >= POLICY_THRESHOLD;

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (!isPolicyUnlocked) {
            const lower = inputText.toLowerCase();
            const hit = GUARDED_KEYWORDS.find(kw => lower.includes(kw));
            if (hit) {
                setTopicGuardAlert(`Let's get to know each other as people first before diving into "${hit}" 😊.`);
                return;
            }
        }

        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const newMsg: Message = { id: `me_${Date.now()}`, text: inputText.trim(), sender: "me", time: now };
        const updated = [...messages, newMsg];

        // Check if this is the policy unlock message
        const newUserCount = updated.filter(m => m.sender !== "system").length;
        if (newUserCount === POLICY_THRESHOLD) {
            updated.push({ id: `sys_unlock_${Date.now()}`, text: "🔓 Policy Mode Unlocked! You can now discuss moderate policy topics respectfully.", sender: "system", time: now });
        }

        setAllMessages(prev => ({ ...prev, [selectedConvo.id]: updated }));
        setInputText("");
        setTopicGuardAlert(null);

        setTimeout(() => {
            setAllMessages(prev => ({
                ...prev,
                [selectedConvo.id]: [...(prev[selectedConvo.id] || []), {
                    id: `them_${Date.now()}`,
                    text: "That's a really interesting point — I feel similarly about that.",
                    sender: "them",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }]
            }));
        }, 1500);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-bridge-slate/10 flex flex-col h-full">
                <div className="p-5 border-b border-bridge-slate/5 flex items-center gap-3">
                    <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-bridge-slate">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <span className="font-fraunces font-semibold text-lg text-bridge-slate">Messages</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {CONVERSATIONS.map(convo => (
                        <button
                            key={convo.id}
                            onClick={() => { setSelectedConvo(convo); setInputText(""); setTopicGuardAlert(null); }}
                            className={`w-full p-4 border-b border-bridge-slate/5 text-left transition-colors flex items-start gap-3 ${selectedConvo.id === convo.id ? "bg-bridge-blue/5 border-l-4 border-l-bridge-blue" : "hover:bg-gray-50 border-l-4 border-l-transparent"}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-bridge-slate/10 flex items-center justify-center shrink-0 relative">
                                <User className="w-5 h-5 text-bridge-slate/40" />
                                {convo.unread > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-bridge-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">{convo.unread}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-0.5">
                                    <span className="font-semibold text-sm text-bridge-slate">{convo.name}</span>
                                    <span className="text-[10px] text-bridge-slate/40">{convo.time}</span>
                                </div>
                                <p className="text-xs text-bridge-slate/60 truncate">{convo.preview}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-bridge-slate/10 bg-white flex items-center justify-between px-5 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bridge-blue/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-bridge-blue" />
                        </div>
                        <div>
                            <p className="font-bold text-bridge-slate">{selectedConvo.name}</p>
                            <p className="text-xs text-[#10B981] font-medium flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> T-Score: {selectedConvo.trustScore}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isPolicyUnlocked ? "bg-bridge-gold/10 text-bridge-gold border-bridge-gold/20" : "bg-bridge-blue/10 text-bridge-blue border-bridge-blue/20"}`}>
                            {isPolicyUnlocked ? <><Sparkles className="w-3 h-3" /> Policy Unlocked</> : <><Info className="w-3 h-3" /> Guided Mode</>}
                        </div>
                        <button onClick={() => setShowReport(true)} className="w-9 h-9 rounded-full hover:bg-bridge-red/10 flex items-center justify-center text-bridge-slate/50 hover:text-bridge-red transition-colors">
                            <Flag className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <AnimatePresence initial={false}>
                        {messages.map(msg => {
                            if (msg.sender === "system") return (
                                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-4">
                                    <div className="bg-white border border-bridge-slate/10 px-5 py-3 rounded-3xl max-w-md text-center shadow-sm">
                                        <p className="text-sm font-medium text-bridge-slate/80">{msg.text}</p>
                                    </div>
                                </motion.div>
                            );
                            const isMe = msg.sender === "me";
                            return (
                                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className="max-w-[72%]">
                                        <div className={`p-4 shadow-sm ${isMe ? "bg-bridge-blue text-white rounded-3xl rounded-tr-sm" : "bg-white border border-bridge-slate/10 text-bridge-slate rounded-3xl rounded-tl-sm"}`}>
                                            <p className="text-[15px] leading-relaxed">{msg.text}</p>
                                        </div>
                                        <p className={`text-[10px] font-medium text-bridge-slate/40 mt-1 ${isMe ? "text-right" : "text-left"}`}>{msg.time}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Input */}
                <footer className="bg-white border-t border-bridge-slate/10 px-4 py-4 shrink-0">
                    <AnimatePresence>
                        {topicGuardAlert && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3">
                                <div className="bg-bridge-red/5 border border-bridge-red/20 rounded-2xl p-3 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-bridge-red shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium text-bridge-red flex-1">{topicGuardAlert}</p>
                                    <button onClick={() => setTopicGuardAlert(null)} className="w-5 h-5 flex items-center justify-center text-bridge-red shrink-0"><X className="w-4 h-4" /></button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-[#F8FAFC] border border-bridge-slate/20 rounded-full px-5 py-3 outline-none focus:border-bridge-blue focus:ring-2 focus:ring-bridge-blue/20 transition-all text-bridge-slate placeholder-bridge-slate/40"
                            placeholder={isPolicyUnlocked ? "Message..." : "Share something about your life…"}
                            value={inputText}
                            onChange={e => { setInputText(e.target.value); if (topicGuardAlert) setTopicGuardAlert(null); }}
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                            disabled={!!topicGuardAlert}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || !!topicGuardAlert}
                            className="w-12 h-12 bg-bridge-blue text-white rounded-full flex items-center justify-center hover:bg-bridge-blue/90 transition-all disabled:opacity-50 shadow-md shrink-0"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </footer>
            </div>

            {/* Report Dialog */}
            <AnimatePresence>
                {showReport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-bridge-slate/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-xl border border-bridge-slate/10">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-fraunces text-2xl font-bold text-bridge-slate">Report Conversation</h3>
                                <button onClick={() => setShowReport(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-bridge-slate/40"><X className="w-5 h-5" /></button>
                            </div>
                            <p className="text-sm text-bridge-slate/70 mb-5">A human moderator will review this chat log.</p>
                            <div className="space-y-3 mb-6">
                                {["Hostility & Name Calling", "Bypassing Topic Guards", "Inappropriate Content", "Other"].map(r => (
                                    <label key={r} className="flex items-center gap-3 p-3 rounded-xl border border-bridge-slate/10 hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name="reason" className="w-4 h-4 text-bridge-red" />
                                        <span className="text-sm font-semibold text-bridge-slate">{r}</span>
                                    </label>
                                ))}
                                <textarea className="w-full px-4 py-3 border border-bridge-slate/20 rounded-xl outline-none focus:border-bridge-red text-sm h-20 resize-none" placeholder="Additional details (optional)" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowReport(false)} className="flex-1 py-3 font-semibold bg-gray-100 hover:bg-gray-200 rounded-full text-bridge-slate transition-colors">Cancel</button>
                                <button onClick={() => setShowReport(false)} className="flex-1 py-3 font-semibold text-white bg-bridge-red hover:bg-bridge-red/90 rounded-full shadow-md transition-colors">Submit Report</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
