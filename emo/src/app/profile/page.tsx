"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User as UserIcon, BookText, Settings } from "lucide-react";

export default function ProfilePage() {
    const [nickname, setNickname] = useState("Seeker");

    useEffect(() => {
        const saved = localStorage.getItem("hearth_profile");
        if (saved) setNickname(JSON.parse(saved).nickname);
    }, []);

    const saveProfile = (name: string) => {
        setNickname(name);
        localStorage.setItem("hearth_profile", JSON.stringify({ nickname: name }));
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] font-sans p-6 sm:p-12">
            <div className="max-w-3xl mx-auto flex flex-col gap-10">
                <header className="flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Home
                    </Link>
                    <span className="font-serif font-medium text-lg">Your Profile</span>
                </header>

                <section className="bg-card border border-border rounded-2xl p-8 flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-sm">
                    <div className="w-24 h-24 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                        <UserIcon className="w-10 h-10" />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <h2 className="text-xl font-medium text-foreground">Soft Identity</h2>
                        <p className="text-sm text-muted-foreground">This is how you appear in rooms. You can change this anytime to remain anonymous.</p>
                        <input
                            value={nickname}
                            onChange={(e) => saveProfile(e.target.value)}
                            className="w-full max-w-sm bg-[var(--color-background)] border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                        />
                    </div>
                </section>

                <div className="grid sm:grid-cols-2 gap-6">
                    <section className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors group">
                        <BookText className="w-8 h-8 text-secondary-foreground mb-4 opacity-80" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Private Journal</h3>
                        <p className="text-sm text-muted-foreground mb-6">Reflect on your sessions or write down what you couldn't say in the room.</p>
                        <Link href="/journal" className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Open Journal &rarr;</Link>
                    </section>

                    <section className="bg-card border border-border rounded-2xl p-8">
                        <Settings className="w-8 h-8 text-muted-foreground mb-4 opacity-80" />
                        <h3 className="text-lg font-medium text-foreground mb-2">People I felt safe with</h3>
                        <p className="text-sm text-muted-foreground mb-6">No users saved yet. You can bookmark supportive members from rooms.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
