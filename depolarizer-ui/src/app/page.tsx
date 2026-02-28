"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageCircle, Users, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-h4h-dark-blue relative">
      {/* Top nav bar - light blue, rounded */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4">
        <div className="flex items-center gap-6">
          <Link href="#about" className="text-h4h-dark-blue font-semibold hover:underline">
            About
          </Link>
          <Link href="#how-it-works" className="text-h4h-dark-blue font-semibold hover:underline">
            How it Works
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {/* Logo ribbon style */}
          <div className="bg-h4h-dark-green text-white px-4 py-2 rounded-lg font-bold text-sm">
            BRIDGE
          </div>
          <Link
            href="/onboarding"
            className="bg-h4h-dark-blue text-white px-5 py-2.5 rounded-2xl font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 sm:px-12 max-w-5xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          <h1 className="font-fraunces text-5xl sm:text-7xl font-bold tracking-tight text-h4h-dark-blue leading-[1.1]">
            Connect across the <br className="hidden sm:block" />
            <span className="text-h4h-dark-green">divide</span> as humans first
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-h4h-dark-blue/80 max-w-2xl mx-auto">
            A civic-tech platform pairing people with opposing political views based on shared values. Built for Hack for Humanity.
          </p>

          <Link
            href="/onboarding"
            className="mt-10 inline-flex items-center gap-2 bg-h4h-light-blue text-h4h-dark-blue px-8 py-4 rounded-3xl font-semibold text-lg hover:bg-h4h-light-blue/80 transition-colors shadow-md w-full sm:w-auto justify-center"
          >
            Sign Up Now!
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 bg-h4h-soft-blue/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-h4h-dark-blue text-center mb-4">
            How it works
          </h2>
          <p className="text-center text-h4h-dark-blue/70 mb-16 max-w-2xl mx-auto">
            Our algorithm connects you with people you inherently vibe with—even if you vote differently.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-h4h-light-blue/50"
            >
              <div className="w-12 h-12 bg-h4h-light-blue/30 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-h4h-dark-blue" />
              </div>
              <h3 className="font-semibold text-xl text-h4h-dark-blue mb-3">1. Build your profile</h3>
              <p className="text-h4h-dark-blue/70">
                Answer 10 political questions + your stance. Politics is just one data point—we find common ground.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-h4h-light-blue/50"
            >
              <div className="w-12 h-12 bg-h4h-light-green/30 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-h4h-dark-green" />
              </div>
              <h3 className="font-semibold text-xl text-h4h-dark-blue mb-3">2. Get matched</h3>
              <p className="text-h4h-dark-blue/70">
                We match you with someone 75%+ similar who has a different political identity. Same values, different label.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-h4h-dark-blue text-white p-8 rounded-3xl shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12" />
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-xl mb-3 relative z-10">3. Start the conversation</h3>
              <p className="text-white/80 relative z-10">
                Connect and discover what you have in common beyond politics.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 sm:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-fraunces text-3xl font-bold text-h4h-dark-blue mb-6">
            Ready to cross the bridge?
          </h2>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-h4h-dark-green text-white px-8 py-4 rounded-3xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-md"
          >
            Sign Up Now!
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-h4h-light-blue/30 text-center">
        <p className="text-h4h-dark-blue/50 text-sm">
          &copy; {new Date().getFullYear()} Bridge. Built for Hack for Humanity.
        </p>
      </footer>
    </div>
  );
}
