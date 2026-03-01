"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, FileText } from "lucide-react";

type Entry = {
    id: string;
    date: string;
    text: string;
};

export default function JournalPage() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [newEntry, setNewEntry] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("hearth_journal");
        if (saved) setEntries(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        if (!newEntry.trim()) return;

        const entry: Entry = {
            id: Math.random().toString(),
            date: new Date().toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            text: newEntry,
        };

        const updated = [entry, ...entries];
        setEntries(updated);
        localStorage.setItem("hearth_journal", JSON.stringify(updated));
        setNewEntry("");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] font-sans p-6 sm:p-12">
            <div className="max-w-3xl mx-auto flex flex-col gap-8">
                <header className="flex items-center justify-between">
                    <Link href="/profile" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Profile
                    </Link>
                    <span className="font-serif font-medium text-lg">Private Journal</span>
                </header>

                <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm">
                    <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent" /> Write a reflection
                    </h2>
                    <textarea
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="What's on your mind? What helped today? What didn't?"
                        className="w-full h-40 bg-[var(--color-background)] border border-border rounded-xl p-4 text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={!newEntry.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background font-medium rounded-full hover:bg-foreground/90 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Save className="w-4 h-4" /> Save
                        </button>
                    </div>
                </section>

                <section className="flex flex-col gap-6 mt-4">
                    <h3 className="font-serif text-2xl text-foreground mb-2">Past Entries</h3>
                    {entries.length === 0 ? (
                        <p className="text-muted-foreground text-center py-12">Your journal is empty. Take your time.</p>
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className="border-l-2 border-border pl-6 py-2 space-y-3">
                                <span className="block text-sm font-medium text-muted-foreground">{entry.date}</span>
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </div>
    );
}
