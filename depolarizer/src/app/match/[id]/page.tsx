"use client";

import { motion } from "framer-motion";
import { ArrowLeft, User, MessageCircle, MapPin, Compass, MessageSquare, Heart, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Mock Data
const MOCK_MATCH = {
    name: "Sam",
    bio: "A middle school teacher who loves weekend hikes and sci-fi novels. I'm trying to learn Spanish but mostly I just practice on Duolingo.",
    compatibility: 82,
    sharedInterests: ["Outdoors & Hiking", "Reading & Literature", "Cooking & Food"],
    lifeStage: "Early Career",
    lifeStageMatch: true,
    region: "Illinois",
    regionMatch: false,
    commStyle: "Reflective",
    commStyleMatch: true,
    trustScore: 92,
};

export default function MatchProfilePreview() {
    const params = useParams();
    const router = useRouter();

    // In a real app we'd fetch data based on params.id

    return (
        <div className="min-h-screen bg-[#F8FAFC] selection:bg-bridge-blue/20 flex flex-col items-center pt-8 pb-24 px-6">

            {/* Top Nav */}
            <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 text-bridge-slate/60 hover:text-bridge-slate font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl"
            >
                {/* Profile Header Card */}
                <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-sm border border-bridge-slate/10 relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-bridge-blue/5 rounded-bl-full pointer-events-none -translate-y-1/4 translate-x-1/4" />

                    <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-bridge-blue/20 to-bridge-blue/5 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                            <User className="w-16 h-16 text-bridge-blue opacity-50" />
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                                <h1 className="font-fraunces text-4xl font-bold text-bridge-slate">{MOCK_MATCH.name}</h1>
                                <div className="bg-bridge-blue text-white px-4 py-1.5 rounded-full font-bold shadow-sm inline-flex items-center justify-center">
                                    {MOCK_MATCH.compatibility}% Match
                                </div>
                            </div>

                            <p className="text-bridge-slate/80 text-lg leading-relaxed mb-6">
                                "{MOCK_MATCH.bio}"
                            </p>

                            <div className="flex items-center gap-2 text-sm font-medium text-bridge-slate/60">
                                <ShieldAlert className="w-4 h-4 text-[#10B981]" />
                                Trust Score: {MOCK_MATCH.trustScore} (Reliable)
                            </div>
                        </div>
                    </div>
                </div>

                {/* The "Why We Matched You" Section */}
                <div className="mb-10 pl-4 border-l-2 border-bridge-slate/10">
                    <h2 className="font-fraunces text-2xl font-bold text-bridge-slate mb-2">Why we paired you</h2>
                    <p className="text-bridge-slate/60 max-w-xl">
                        You two have fundamentally different political worldviews, but incredible overlap in who you are as people.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-10">

                    {/* Interests */}
                    <div className="bg-white p-6 rounded-3xl border border-bridge-slate/10 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-bridge-gold/10 flex items-center justify-center text-bridge-gold">
                                <Heart className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-bridge-slate">Shared Interests</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {MOCK_MATCH.sharedInterests.map(interest => (
                                <span key={interest} className="text-xs font-semibold bg-bridge-gold/10 text-bridge-gold px-3 py-1.5 rounded-full">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Communication Style */}
                    <div className="bg-white p-6 rounded-3xl border border-bridge-slate/10 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-bridge-slate">Comm Style</h3>
                                {MOCK_MATCH.commStyleMatch && <div className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wide">You both align</div>}
                            </div>
                        </div>
                        <p className="text-sm text-bridge-slate/70 mt-auto font-medium">
                            You both prefer a <strong className="text-bridge-slate">{MOCK_MATCH.commStyle.toLowerCase()}</strong> approach to difficult conversations.
                        </p>
                    </div>

                    {/* Life Stage */}
                    <div className="bg-white p-6 rounded-3xl border border-bridge-slate/10 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-bridge-red/10 flex items-center justify-center text-bridge-red">
                                <Compass className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-bridge-slate">Life Stage</h3>
                                {MOCK_MATCH.lifeStageMatch && <div className="text-[10px] font-bold text-bridge-red uppercase tracking-wide">Same phase of life</div>}
                            </div>
                        </div>
                        <p className="text-sm text-bridge-slate/70 mt-auto font-medium">
                            Currently in their <strong className="text-bridge-slate">{MOCK_MATCH.lifeStage.toLowerCase()}</strong>.
                        </p>
                    </div>

                    {/* Region */}
                    <div className="bg-white p-6 rounded-3xl border border-bridge-slate/10 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-bridge-slate/10 flex items-center justify-center text-bridge-slate">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-bridge-slate">Location</h3>
                                {MOCK_MATCH.regionMatch ? (
                                    <div className="text-[10px] font-bold text-bridge-slate uppercase tracking-wide">Local Match</div>
                                ) : (
                                    <div className="text-[10px] font-bold text-bridge-slate/50 uppercase tracking-wide">Different Region</div>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-bridge-slate/70 mt-auto font-medium">
                            Based in <strong className="text-bridge-slate">{MOCK_MATCH.region}</strong>.
                        </p>
                    </div>

                </div>

                {/* CTA Bar */}
                <div className="bg-bridge-slate text-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="max-w-md">
                        <h3 className="font-bold text-lg mb-1">Ready to cross the bridge?</h3>
                        <p className="text-white/70 text-sm">
                            Your first 10 messages will be fully guided to help you learn about each other's lives before policy discussions unlock.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push(`/chat/${params.id || 'c_new'}`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-bridge-slate px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-sm shrink-0"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Start Guided Chat
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
