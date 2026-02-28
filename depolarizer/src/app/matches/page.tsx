"use client";

import { motion } from "framer-motion";
import { ArrowLeft, User, MessageCircle, Star, Calendar } from "lucide-react";
import Link from "next/link";

const PAST_MATCHES = [
    {
        id: "pm_1",
        name: "Jordan",
        compatibility: 78,
        sharedInterests: ["Reading & Literature", "Outdoors & Hiking"],
        lifeStage: "Early Career",
        conversationStatus: "Completed",
        date: "Feb 20, 2026",
        messageCount: 34,
        rating: 5,
    },
    {
        id: "pm_2",
        name: "Casey",
        compatibility: 65,
        sharedInterests: ["Music", "Gaming"],
        lifeStage: "College Student",
        conversationStatus: "Completed",
        date: "Feb 14, 2026",
        messageCount: 12,
        rating: 4,
    },
    {
        id: "pm_3",
        name: "Morgan",
        compatibility: 71,
        sharedInterests: ["Cooking & Food", "Travel"],
        lifeStage: "Parent of Young Kids",
        conversationStatus: "Ended Early",
        date: "Feb 8, 2026",
        messageCount: 6,
        rating: 3,
    },
];

const statusColors: Record<string, string> = {
    "Completed": "bg-[#10B981]/10 text-[#10B981]",
    "Ended Early": "bg-bridge-gold/10 text-bridge-gold",
};

export default function PastMatchesPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-bridge-blue/20">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-bridge-slate/10 flex-col hidden md:flex h-screen sticky top-0">
                <div className="p-6 border-b border-bridge-slate/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bridge-slate flex items-center justify-center text-white font-bold text-sm">B</div>
                    <span className="font-fraunces font-semibold text-xl text-bridge-slate">Bridge</span>
                </div>
                <div className="p-4 flex-1 space-y-2">
                    <div className="px-3 py-2 text-xs font-semibold text-bridge-slate/40 uppercase tracking-wider mt-4 mb-2">Overview</div>
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                    </Link>
                    <Link href="/matches" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bridge-blue/5 text-bridge-blue font-medium">
                        <Star className="w-5 h-5" /> Past Matches
                    </Link>
                    <Link href="/messages" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors">
                        <MessageCircle className="w-5 h-5" /> Messages
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white border border-bridge-slate/10 flex items-center justify-center text-bridge-slate shadow-sm md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-fraunces text-3xl font-bold text-bridge-slate">Past Matches</h1>
                </div>

                <div className="space-y-4">
                    {PAST_MATCHES.map((match, i) => (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white rounded-3xl p-6 border border-bridge-slate/10 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-6"
                        >
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bridge-blue/20 to-bridge-blue/5 flex items-center justify-center shrink-0">
                                <User className="w-8 h-8 text-bridge-blue opacity-50" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-bridge-slate">{match.name}</h2>
                                    <span className="text-xs font-bold bg-bridge-blue/10 text-bridge-blue px-2 py-0.5 rounded-full">{match.compatibility}% Match</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[match.conversationStatus]}`}>{match.conversationStatus}</span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {match.sharedInterests.map(interest => (
                                        <span key={interest} className="text-xs font-semibold bg-bridge-slate/5 text-bridge-slate/60 px-3 py-1 rounded-full">{interest}</span>
                                    ))}
                                    <span className="text-xs font-semibold bg-bridge-slate/5 text-bridge-slate/60 px-3 py-1 rounded-full">{match.lifeStage}</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-bridge-slate/50 font-medium">
                                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {match.date}</div>
                                    <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {match.messageCount} messages</div>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <Star key={j} className={`w-3 h-3 ${j < match.rating ? "text-bridge-gold fill-bridge-gold" : "text-bridge-slate/20"}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link
                                href={`/messages`}
                                className="shrink-0 flex items-center gap-2 bg-bridge-slate text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-bridge-slate/90 transition-colors shadow-sm"
                            >
                                <MessageCircle className="w-4 h-4" /> View Chat
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {PAST_MATCHES.length === 0 && (
                    <div className="text-center py-24 text-bridge-slate/40">
                        <p className="text-lg font-semibold">No past matches yet.</p>
                        <p className="text-sm mt-1">Complete your first conversation to see it here!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
