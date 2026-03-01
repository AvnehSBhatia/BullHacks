"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, ShieldAlert, History, Settings, ArrowLeft, Edit2, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MOCK_USER = {
    name: "Alex",
    bio: "Just trying to understand people better. Love hiking, cooking, and reading sci-fi.",
    trustScore: 95,
    status: "Reliable",
    commStyle: "Reflective",
    interests: ["Outdoors & Hiking", "Cooking & Food", "Reading & Literature"]
};

const SCORE_HISTORY = [
    { id: 1, action: "Completed full conversation with Sam", change: "+10", date: "2 days ago" },
    { id: 2, action: "Reported conversation cleared by moderator", change: "0", date: "1 week ago" },
    { id: 3, action: "Account creation baseline", change: "+85", date: "2 weeks ago" },
];

const STORAGE_KEYS = {
    USER_ID: "depolarizer_user_id",
    VECTOR: "depolarizer_vector",
    STANCE: "depolarizer_political_stance",
    CITY: "depolarizer_city",
};

const getStanceColor = (stance: string | null) => {
    const normalized = (stance || "").toLowerCase();
    if (normalized.includes("left") || normalized === "progressive") return "#2563EB";
    if (normalized.includes("right") || normalized === "conservative") return "#DC2626";
    return "#8B5CF6";
};

export default function ProfilePage() {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(MOCK_USER.bio);
    const [stanceColor, setStanceColor] = useState("#8B5CF6");
    const [politicalStance, setPoliticalStance] = useState<string | null>(null);

    useEffect(() => {
        const storedStance = localStorage.getItem(STORAGE_KEYS.STANCE);
        setStanceColor(getStanceColor(storedStance));
        setPoliticalStance(storedStance);
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem(STORAGE_KEYS.VECTOR);
        localStorage.removeItem(STORAGE_KEYS.STANCE);
        localStorage.removeItem(STORAGE_KEYS.CITY);
        router.push("/");
    };

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
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                    </Link>

                    <div className="px-3 py-2 text-xs font-semibold text-bridge-slate/40 uppercase tracking-wider mb-2 mt-8">Account</div>
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bridge-blue/5 text-bridge-blue font-medium transition-colors">
                        <User className="w-5 h-5" /> Profile Identity
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-bridge-slate/70 hover:bg-bridge-slate/5 hover:text-bridge-slate font-medium transition-colors w-full text-left mt-auto"
                    >
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 sm:p-10 max-w-4xl mx-auto w-full">
                <header className="flex items-center justify-between mb-10 md:hidden">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white border flex items-center justify-center text-bridge-slate font-bold text-sm shadow-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <span className="font-fraunces font-bold text-bridge-slate">Profile</span>
                </header>

                <h1 className="font-fraunces text-3xl font-bold text-bridge-slate mb-8">Manage Identity</h1>

                <div className="grid lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-8">
                        {/* Identity Card */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-bridge-slate/10 shadow-sm relative">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bridge-blue/20 to-bridge-blue/5 flex items-center justify-center shrink-0 relative">
                                        <User className="w-10 h-10 text-bridge-blue opacity-50" />
                                        <span
                                            className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white"
                                            style={{ backgroundColor: stanceColor }}
                                            title="Political stance color"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-bridge-slate">{MOCK_USER.name}</h2>
                                        <p className="text-sm font-medium text-bridge-slate/60">{MOCK_USER.commStyle} Communicator</p>
                                        {politicalStance && (
                                            <span
                                                className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full"
                                                style={{ backgroundColor: `${stanceColor}20`, color: stanceColor }}
                                            >
                                                {politicalStance.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isEditing ? 'bg-bridge-blue text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-bridge-slate'}`}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-bridge-slate/50 uppercase tracking-wider mb-2 block">Bio</label>
                                    {isEditing ? (
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-bridge-blue/50 focus:border-bridge-blue focus:ring-1 focus:ring-bridge-blue outline-none transition-all resize-none h-24 text-sm"
                                        />
                                    ) : (
                                        <p className="text-bridge-slate/80 text-sm leading-relaxed">{bio}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-bridge-slate/50 uppercase tracking-wider mb-2 block">Core Interests</label>
                                    <div className="flex flex-wrap gap-2">
                                        {MOCK_USER.interests.map(interest => (
                                            <span key={interest} className="text-xs font-semibold bg-bridge-slate/5 text-bridge-slate/70 px-3 py-1.5 rounded-full">
                                                {interest}
                                            </span>
                                        ))}
                                        {isEditing && (
                                            <button className="text-xs font-semibold bg-gray-100 border border-dashed border-gray-300 text-bridge-slate/70 px-4 py-1.5 rounded-full hover:bg-gray-200">
                                                + Add Interest
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* Trust Score Panel */}
                        <section className="bg-white rounded-3xl p-6 border border-bridge-slate/10 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-bl-[100px] pointer-events-none" />

                            <div className="flex items-center gap-2 mb-6">
                                <ShieldAlert className="w-5 h-5 text-[#10B981]" />
                                <h3 className="font-bold text-bridge-slate">Trust Score</h3>
                            </div>

                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-bold text-bridge-slate">{MOCK_USER.trustScore}</span>
                                <span className="text-sm font-medium text-[#10B981]">🟢 {MOCK_USER.status}</span>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-bridge-slate/50 uppercase tracking-wider flex items-center gap-1">
                                    <History className="w-3 h-3" /> Recent History
                                </h4>
                                {SCORE_HISTORY.map(history => (
                                    <div key={history.id} className="text-sm flex items-start gap-3">
                                        <span className={`font-bold mt-0.5 ${history.change.startsWith('+') ? 'text-[#10B981]' : 'text-bridge-slate/40'}`}>
                                            {history.change}
                                        </span>
                                        <div>
                                            <p className="text-bridge-slate/80 font-medium leading-tight">{history.action}</p>
                                            <span className="text-[10px] text-bridge-slate/40">{history.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
}
