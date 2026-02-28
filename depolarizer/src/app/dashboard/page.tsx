"use client";

import { motion } from "framer-motion";
import { MessageCircle, Shield, User, Clock, CheckCircle2, AlertTriangle, ArrowRight, Settings, LogOut } from "lucide-react";
import Link from "next/link";

const MOCK_USER = {
    name: "Alex",
    trustScore: 95,
    trustStatus: "Reliable", // Reliable, New, Flagged
};

const MOCK_MATCH = {
    id: "m_123",
    name: "Sam",
    compatibility: 82,
    sharedInterests: ["Outdoors & Hiking", "Reading & Literature"],
    lifeStageMatch: true,
    regionMatch: false,
    commStyleMatch: true,
};

const MOCK_ACTIVE_CHATS = [
    { id: "c_1", name: "Jordan", lastMessage: "That's exactly how I felt about the book too!", unread: 0, time: "2h ago" },
    { id: "c_2", name: "Taylor", lastMessage: "I hadn't considered that perspective before.", unread: 2, time: "1d ago" },
];

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-bridge-blue/20">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-bridge-slate/10 flex flex-col hidden md:flex h-screen sticky top-0">
                <div className="p-6 border-b border-bridge-slate/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bridge-slate flex items-center justify-center text-white font-bold text-sm">
                        B
                    </div>
                    <span className="font-fraunces font-semibold text-xl text-bridge-slate">Bridge</span>
                </div>

                <div className="p-4 flex-1 space-y-2">
                    <div className="px-3 py-2 text-xs font-semibold text-bridge-slate/40 uppercase tracking-wider mb-2 mt-4">Overview</div>
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bridge-blue/5 text-bridge-blue font-medium">
                        <User className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/matches" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors">
                        <CheckCircle2 className="w-5 h-5" /> Past Matches
                    </Link>
                    <Link href="/messages" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="w-5 h-5" /> Messages
                        </div>
                        <span className="bg-bridge-red text-white text-xs px-2 py-0.5 rounded-full font-bold">2</span>
                    </Link>

                    <div className="px-3 py-2 text-xs font-semibold text-bridge-slate/40 uppercase tracking-wider mb-2 mt-8">Account</div>
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors">
                        <Settings className="w-5 h-5" /> Settings
                    </Link>
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors w-full text-left mt-auto">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>

                {/* Trust Score Badge */}
                <div className="p-4 border-t border-bridge-slate/5">
                    <div className="bg-white border border-bridge-slate/10 rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-1 relative z-10">
                            <Shield className="w-4 h-4 text-[#10B981]" />
                            <span className="text-xs font-bold text-bridge-slate uppercase tracking-wide">Trust Score</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-2xl font-bold text-bridge-slate">{MOCK_USER.trustScore}</span>
                            <span className="text-xs font-medium text-[#10B981]">🟢 {MOCK_USER.trustStatus}</span>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-bl-[100px] pointer-events-none" />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 sm:p-10 max-w-5xl mx-auto w-full relative">
                <header className="flex items-center justify-between mb-10 md:hidden">
                    <div className="w-8 h-8 rounded-full bg-bridge-slate flex items-center justify-center text-white font-bold text-sm">B</div>
                    <div className="bg-white border text-sm font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-bridge-slate">
                        <Shield className="w-4 h-4 text-[#10B981]" /> T-Score: {MOCK_USER.trustScore}
                    </div>
                </header>

                <h1 className="font-fraunces text-3xl font-bold text-bridge-slate mb-8">Welcome back, {MOCK_USER.name}.</h1>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column (Main) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Match Card */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-bridge-slate">Your Next Match is Ready</h2>
                                <span className="text-xs font-medium bg-bridge-gold/20 text-bridge-gold px-2 py-1 rounded-md">New</span>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-3xl p-6 sm:p-8 border border-bridge-slate/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-bridge-blue/5 rounded-bl-[200px] pointer-events-none transition-transform group-hover:scale-105" />

                                <div className="flex flex-col sm:flex-row gap-6 items-start relative z-10">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bridge-blue/20 to-bridge-blue/5 flex items-center justify-center shrink-0">
                                        <User className="w-10 h-10 text-bridge-blue opacity-50" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-bridge-slate">{MOCK_MATCH.name}</h3>
                                            <div className="bg-bridge-blue border border-bridge-blue/20 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                {MOCK_MATCH.compatibility}% Compatible
                                            </div>
                                        </div>

                                        <p className="text-bridge-slate/60 text-sm mb-4 max-w-md">
                                            You both value a {MOCK_MATCH.commStyleMatch ? 'reflective' : 'collaborative'} communication style and share a passion for {MOCK_MATCH.sharedInterests[0].toLowerCase()}.
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {MOCK_MATCH.sharedInterests.map(interest => (
                                                <span key={interest} className="text-xs font-semibold bg-bridge-slate/5 text-bridge-slate/70 px-2 py-1 rounded-md">
                                                    {interest}
                                                </span>
                                            ))}
                                            {MOCK_MATCH.lifeStageMatch && (
                                                <span className="text-xs font-semibold bg-bridge-slate/5 text-bridge-slate/70 px-2 py-1 rounded-md">
                                                    Same Life Stage
                                                </span>
                                            )}
                                        </div>

                                        <Link
                                            href={`/match/${MOCK_MATCH.id}`}
                                            className="inline-flex items-center gap-2 bg-bridge-slate text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-bridge-slate/90 transition-all"
                                        >
                                            View Profile & Connect
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        </section>

                    </div>

                    {/* Right Column (Sidebar-ish) */}
                    <div className="space-y-8">

                        {/* Active Conversations */}
                        <section className="bg-white rounded-3xl p-6 border border-bridge-slate/10 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-bridge-slate">Active Chats</h2>
                                <Link href="/messages" className="text-sm font-semibold text-bridge-blue hover:underline">View All</Link>
                            </div>

                            <div className="space-y-4">
                                {MOCK_ACTIVE_CHATS.map(chat => (
                                    <Link href={`/chat/${chat.id}`} key={chat.id} className="block group">
                                        <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-bridge-slate/5 transition-colors -mx-3">
                                            <div className="w-12 h-12 rounded-full bg-bridge-slate/10 flex items-center justify-center shrink-0 relative">
                                                <User className="w-6 h-6 text-bridge-slate/40" />
                                                {chat.unread > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-bridge-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                                                        {chat.unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="font-semibold text-bridge-slate text-sm">{chat.name}</span>
                                                    <span className="text-[10px] text-bridge-slate/40 font-medium">{chat.time}</span>
                                                </div>
                                                <p className={`text-xs truncate ${chat.unread > 0 ? 'text-bridge-slate font-medium' : 'text-bridge-slate/60'}`}>
                                                    {chat.lastMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* Pending Invites Alert */}
                        <section className="bg-bridge-gold/10 rounded-3xl p-6 border border-bridge-gold/20">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-bridge-gold shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-bridge-slate mb-1">1 Pending Request</h3>
                                    <p className="text-xs text-bridge-slate/70 mb-3">
                                        A match from last week wants to start a conversation.
                                    </p>
                                    <button className="text-xs bg-white text-bridge-slate font-bold px-4 py-2 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
                                        Review Request
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
