"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Compass, Heart, MessageSquare, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LIFE_STAGES = [
    "High School Student", "College Student", "Early Career",
    "Mid Career", "Parent of Young Kids", "Parent of Teens",
    "Empty Nester", "Retiree", "Other"
];

const INTERESTS = [
    "Music", "Outdoors & Hiking", "Sports", "Faith & Religion",
    "Cooking & Food", "Reading & Literature", "Technology", "Arts & Culture",
    "Travel", "Gaming", "DIY & Crafting", "Volunteering"
];

const POL_LEANS = [
    { id: "left", label: "Progressive / Left" },
    { id: "center-left", label: "Center-Left" },
    { id: "moderate", label: "Moderate / Independent" },
    { id: "center-right", label: "Center-Right" },
    { id: "right", label: "Conservative / Right" }
];

export default function OnboardingFlow() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const totalSteps = 6;

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        lifeStage: "",
        interests: [] as string[],
        region: "",
        commStyle: "",
        politicalLean: ""
    });

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
        else {
            // Complete Onboarding -> redirect to dashboard
            // In a real app, save to Supabase here
            router.push("/dashboard");
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const toggleInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const progress = (step / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-bridge-cream flex flex-col selection:bg-bridge-blue/20">
            {/* Top Bar with Progress */}
            <header className="h-16 border-b border-bridge-slate/5 px-6 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <div className="w-8 h-8 rounded-full bg-bridge-slate flex items-center justify-center text-white font-bold cursor-pointer">
                            B
                        </div>
                    </Link>
                    <span className="font-fraunces font-medium text-bridge-slate">Profile Setup</span>
                </div>
                <div className="text-sm text-bridge-slate/60 font-medium">
                    Step {step} of {totalSteps}
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full bg-bridge-slate/5 h-1">
                <motion.div
                    className="h-full bg-bridge-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Subtle background element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-bridge-slate/5 rounded-full -z-10" />

                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-bridge-slate/10 overflow-hidden min-h-[500px] flex flex-col relative">

                    <div className="flex-1 p-8 sm:p-12 relative">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-12 h-12 bg-bridge-blue/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Heart className="w-6 h-6 text-bridge-blue" />
                                    </div>
                                    <h2 className="font-fraunces text-3xl font-bold text-bridge-slate">Let's start with the basics</h2>
                                    <p className="text-bridge-slate/60 text-lg">Who are you behind the screen?</p>

                                    <div className="space-y-4 mt-8">
                                        <div>
                                            <label className="block text-sm font-medium text-bridge-slate mb-1">First Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-bridge-slate/20 focus:border-bridge-blue focus:ring-1 focus:ring-bridge-blue outline-none transition-all"
                                                placeholder="Alex"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-bridge-slate mb-1">Short Bio</label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border border-bridge-slate/20 focus:border-bridge-blue focus:ring-1 focus:ring-bridge-blue outline-none transition-all resize-none h-24"
                                                placeholder="A sentence or two about what makes you, you."
                                                value={formData.bio}
                                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-12 h-12 bg-bridge-red/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Compass className="w-6 h-6 text-bridge-red" />
                                    </div>
                                    <h2 className="font-fraunces text-3xl font-bold text-bridge-slate">Where are you in life?</h2>
                                    <p className="text-bridge-slate/60 text-lg">Life stage is one of the strongest predictors of mutual understanding.</p>

                                    <div className="grid grid-cols-2 gap-3 mt-8">
                                        {LIFE_STAGES.map(stage => (
                                            <button
                                                key={stage}
                                                onClick={() => setFormData({ ...formData, lifeStage: stage })}
                                                className={`p-4 rounded-xl border text-left transition-all ${formData.lifeStage === stage
                                                        ? "border-bridge-red bg-bridge-red/5 text-bridge-red font-medium shadow-sm"
                                                        : "border-bridge-slate/10 hover:border-bridge-slate/30 text-bridge-slate"
                                                    }`}
                                            >
                                                {stage}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-12 h-12 bg-bridge-gold/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Heart className="w-6 h-6 text-bridge-gold" />
                                    </div>
                                    <h2 className="font-fraunces text-3xl font-bold text-bridge-slate">What do you love?</h2>
                                    <p className="text-bridge-slate/60 text-lg">Pick a few interests. We use this to find common ground.</p>

                                    <div className="flex flex-wrap gap-3 mt-8">
                                        {INTERESTS.map(interest => {
                                            const isSelected = formData.interests.includes(interest);
                                            return (
                                                <button
                                                    key={interest}
                                                    onClick={() => toggleInterest(interest)}
                                                    className={`px-5 py-3 rounded-full border transition-all text-sm font-medium flex items-center gap-2 ${isSelected
                                                            ? "border-bridge-gold bg-bridge-gold text-white shadow-md"
                                                            : "border-bridge-slate/20 hover:border-bridge-slate/40 text-bridge-slate"
                                                        }`}
                                                >
                                                    {interest}
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-12 h-12 bg-bridge-slate/10 rounded-2xl flex items-center justify-center mb-6">
                                        <MapPin className="w-6 h-6 text-bridge-slate" />
                                    </div>
                                    <h2 className="font-fraunces text-3xl font-bold text-bridge-slate">Where's home?</h2>
                                    <p className="text-bridge-slate/60 text-lg">Local context matters when building empathy.</p>

                                    <div className="mt-8 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-bridge-slate mb-1">State / Region</label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-bridge-slate/20 focus:border-bridge-blue focus:ring-1 focus:ring-bridge-blue outline-none transition-all bg-white"
                                                value={formData.region}
                                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                                            >
                                                <option value="" disabled>Select your state</option>
                                                <option value="CA">California</option>
                                                <option value="TX">Texas</option>
                                                <option value="NY">New York</option>
                                                <option value="FL">Florida</option>
                                                <option value="IL">Illinois</option>
                                                <option value="PA">Pennsylvania</option>
                                                <option value="OH">Ohio</option>
                                                <option value="MI">Michigan</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-2xl flex items-center justify-center mb-6">
                                        <MessageSquare className="w-6 h-6 text-[#8B5CF6]" />
                                    </div>
                                    <h2 className="font-fraunces text-3xl font-bold text-bridge-slate">How do you communicate?</h2>
                                    <p className="text-bridge-slate/60 text-lg">Which of these best describes you in a disagreement?</p>

                                    <div className="space-y-3 mt-8">
                                        {[
                                            { id: "direct", label: "Direct", desc: "I say exactly what I mean and appreciate blunt honesty." },
                                            { id: "reflective", label: "Reflective", desc: "I like to listen, process, and take time before responding." },
                                            { id: "collaborative", label: "Collaborative", desc: "I try to find the 'yes, and' and seek immediate common ground." }
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => setFormData({ ...formData, commStyle: style.id })}
                                                className={`w-full p-4 rounded-xl border text-left transition-all ${formData.commStyle === style.id
                                                        ? "border-[#8B5CF6] bg-[#8B5CF6]/5 shadow-sm"
                                                        : "border-bridge-slate/10 hover:border-bridge-slate/30"
                                                    }`}
                                            >
                                                <div className={`font-semibold ${formData.commStyle === style.id ? 'text-[#8B5CF6]' : 'text-bridge-slate'}`}>
                                                    {style.label}
                                                </div>
                                                <div className="text-sm text-bridge-slate/60 mt-1">{style.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 6 && (
                                <motion.div
                                    key="step6"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="w-12 h-12 bg-bridge-slate/5 rounded-2xl flex items-center justify-center mb-6">
                                        <span className="text-2xl">⚖️</span>
                                    </div>
                                    <h2 className="font-fraunces text-3xl font-bold text-bridge-slate">The final piece.</h2>
                                    <p className="text-bridge-slate/60 text-lg">
                                        We use this <strong>only</strong> to pair you with someone who sees the world differently. We don't show this to your matches.
                                    </p>

                                    <div className="space-y-3 mt-8">
                                        {POL_LEANS.map(lean => (
                                            <button
                                                key={lean.id}
                                                onClick={() => setFormData({ ...formData, politicalLean: lean.id })}
                                                className={`w-full p-4 rounded-xl border text-left transition-all ${formData.politicalLean === lean.id
                                                        ? "border-bridge-slate bg-bridge-slate text-white shadow-md"
                                                        : "border-bridge-slate/10 hover:border-bridge-slate/30 text-bridge-slate"
                                                    }`}
                                            >
                                                {lean.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 border-t border-bridge-slate/10 bg-gray-50 flex items-center justify-between">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-bridge-slate/60 hover:text-bridge-slate font-medium transition-colors px-4 py-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                        ) : <div />}

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-bridge-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-bridge-blue/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {step === totalSteps ? "Complete Profile" : "Continue"}
                            {step < totalSteps && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
