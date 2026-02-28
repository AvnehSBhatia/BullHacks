"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageCircle, Users, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-bridge-blue/20">
      {/* Navigation Layer */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-bridge-slate/5 bg-bridge-cream/80 backdrop-blur-md z-50 flex items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-2">
          {/* Bridge Logo Motif */}
          <div className="w-8 h-8 rounded-full bg-bridge-red flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="font-fraunces font-semibold text-xl tracking-tight text-bridge-slate">Bridge</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/login" className="text-bridge-slate/70 hover:text-bridge-slate transition-colors">
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="bg-bridge-slate text-bridge-cream px-4 py-2 rounded-full hover:bg-bridge-slate/90 transition-all font-semibold shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Subtle background arches */}
        <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] border-[1px] border-bridge-slate/10 rounded-full" />
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] border-[1px] border-bridge-slate/5 rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <h1 className="font-fraunces text-5xl sm:text-7xl font-bold tracking-tight text-bridge-slate leading-[1.1]">
            Connect across the <br className="hidden sm:block" />
            <span className="text-bridge-blue">divide</span> as <span className="text-bridge-red">humans </span> first.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-bridge-slate/70 max-w-2xl mx-auto leading-relaxed">
            A civic-tech platform pairing people with opposing political views based on shared interests, life stage, and communication style. Built to foster genuine empathy, not outrage.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="group flex items-center gap-2 bg-bridge-blue text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-bridge-blue/90 transition-all shadow-md hover:shadow-xl w-full sm:w-auto justify-center"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 bg-white text-bridge-slate px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all shadow-sm border border-bridge-slate/10 w-full sm:w-auto justify-center"
            >
              How it Works
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white/50 border-y border-bridge-slate/5 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-bridge-slate">
              Connection over controversy
            </h2>
            <p className="mt-4 text-bridge-slate/60 text-lg max-w-2xl mx-auto">
              Our unique pairing algorithm connects you with people you inherently vibe with—even if you vote differently.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-bridge-slate/5 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-bridge-blue/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-bridge-blue" />
              </div>
              <h3 className="font-semibold text-xl text-bridge-slate mb-3">1. Build your core profile</h3>
              <p className="text-bridge-slate/70">
                Share your passions, your life stage, and your communication style. Politics is just one small data point.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-bridge-slate/5 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-bridge-gold/10 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-bridge-gold" />
              </div>
              <h3 className="font-semibold text-xl text-bridge-slate mb-3">2. Get functionally matched</h3>
              <p className="text-bridge-slate/70">
                Our algorithm finds someone totally different from you politically, but exactly like you personally.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-bridge-slate text-white p-8 rounded-3xl shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 block relative z-10">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 relative z-10">3. Guided conversation</h3>
              <p className="text-white/80 relative z-10">
                Talk about your lives first. A gentle AI moderator keeps the chat respectful and free from immediate policy debates.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto">
        <div className="bg-bridge-red/5 rounded-[40px] p-8 sm:p-16 flex flex-col md:flex-row items-center gap-12 border border-bridge-red/10">
          <div className="flex-1">
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-bridge-slate mb-6">
              A safe space to disagree safely.
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-bridge-red/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-bridge-red" />
                </div>
                <p className="text-bridge-slate/80"><strong className="text-bridge-slate font-semibold">Trust Scores:</strong> Everyone is held accountable for how they treat others.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-bridge-red/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-bridge-red" />
                </div>
                <p className="text-bridge-slate/80"><strong className="text-bridge-slate font-semibold">Topic Guards:</strong> Our system actively prevents early hostility or talking over each other.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-bridge-red/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-bridge-red" />
                </div>
                <p className="text-bridge-slate/80"><strong className="text-bridge-slate font-semibold">Active Moderation:</strong> Conversational reports are reviewed by real humans.</p>
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full bg-white rounded-3xl p-6 shadow-sm border border-bridge-slate/10">
            {/* Mock Chat Snippet */}
            <div className="space-y-4">
              <div className="text-center text-xs text-bridge-slate/50 font-medium mb-4">Topic Guard Active</div>
              <div className="bg-bridge-slate/5 p-4 rounded-2xl rounded-tl-sm w-[85%]">
                <p className="text-sm text-bridge-slate/90">I used to play jazz guitar in college too! Where did you perform?</p>
              </div>
              <div className="bg-bridge-blue text-white p-4 rounded-2xl rounded-tr-sm w-[85%] ml-auto">
                <p className="text-sm">Mostly local cafes in Chicago. What about you? Are you still playing?</p>
              </div>
              <div className="bg-bridge-gold/10 p-3 rounded-2xl border border-bridge-gold/30 text-center mt-6">
                <p className="text-xs text-bridge-slate/80 font-medium">✨ You've unlocked the next tier of conversation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-bridge-slate/5 text-center">
        <p className="text-bridge-slate/50 text-sm">
          &copy; {new Date().getFullYear()} Bridge. Fostering radical empathy.
        </p>
      </footer>
    </div>
  );
}
