"use client";

import Link from "next/link";
import { ArrowRight, Heart, Shield, MessageCircleHeart, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col antialiased selection:bg-accent/30">
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-foreground">
          <Heart className="w-6 h-6 text-accent fill-accent" />
          Hearth
        </div>
        <Link
          href="/matching"
          className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          Profile
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <h1 className="font-serif text-5xl sm:text-7xl font-semibold text-foreground tracking-tight max-w-4xl leading-[1.1] mb-6 shadow-sm">
            You don't have to go through this alone.
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mb-10 font-light leading-relaxed">
            Find immediate, guided emotional support in small peer groups tailored precisely to your current state and needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              href="/checkin"
              className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] gap-2 group"
            >
              Start check-in
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-card/30 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">How Hearth Works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A safe, structured approach to finding peer support.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-inner">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Honest Check-in</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tell us what you're dealing with and what you need right now—whether it's someone to listen, or just to feel less alone.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 ring-1 ring-accent/20 shadow-inner">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Compatibility Matching</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our algorithm carefully matches you with 3-5 others to ensure a balanced, supportive, and emotionally safe dynamic.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-6 ring-1 ring-secondary/50 shadow-inner">
                  <MessageCircleHeart className="w-8 h-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Connect</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enter a structured chat room with soft grounding exercises, gentle nudges, and protected turn-taking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        <p>Hearth is for peer support, not a replacement for therapy.</p>
        <p className="mt-1">If you are in crisis, please call 988 or text HOME to 741741.</p>
      </footer>
    </div>
  );
}
