"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Ban, DoorOpen, HardDriveDownload } from "lucide-react";
import clsx from "clsx";

type FlaggedEvent = {
    roomId: string;
    timestamp: number;
    trigger: string;
};

export default function AdminDashboard() {
    const [events, setEvents] = useState<FlaggedEvent[]>([]);

    useEffect(() => {
        const loadEvents = () => {
            const saved = localStorage.getItem("hearth_flagged");
            if (saved) setEvents(JSON.parse(saved).reverse());
        };

        // Initial load
        loadEvents();

        // Auto-refresh every 2s for demo purposes to simulate live dashboard
        const timer = setInterval(loadEvents, 2000);
        return () => clearInterval(timer);
    }, []);

    const clearEvents = () => {
        setEvents([]);
        localStorage.removeItem("hearth_flagged");
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] font-sans p-6 sm:p-12">
            <div className="max-w-5xl mx-auto flex flex-col gap-10">
                <header className="flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-2 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-destructive" />
                        <span className="font-mono font-bold tracking-wider text-xl text-foreground">HEARTH OVERWATCH</span>
                    </div>
                </header>

                <section className="bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                        <div>
                            <h2 className="text-lg font-medium text-foreground">Crisis Events Queue</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Live Monitoring</p>
                        </div>
                        <button onClick={clearEvents} className="text-xs text-muted-foreground hover:text-foreground underline">
                            Clear Logs
                        </button>
                    </div>

                    <div className="p-0">
                        {events.length === 0 ? (
                            <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
                                <ShieldAlert className="w-8 h-8 opacity-20" />
                                No critical safety events detected. Let's keep it that way.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Time</th>
                                        <th className="px-6 py-4 font-medium">Room ID</th>
                                        <th className="px-6 py-4 font-medium">Auto-Flagged Phrase</th>
                                        <th className="px-6 py-4 font-medium text-right">Moderator Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {events.map((event, i) => (
                                        <tr key={i} className={clsx("transition-colors hover:bg-muted/10", event.trigger ? "bg-destructive/5" : "")}>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {new Date(event.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-foreground font-medium">
                                                {event.roomId}
                                            </td>
                                            <td className="px-6 py-4 text-destructive font-medium">
                                                "{event.trigger}"
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors flex items-center gap-2" title="Send 1:1 specialist">
                                                        <HardDriveDownload className="w-4 h-4 text-primary" /> Specialist
                                                    </button>
                                                    <button className="p-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors" title="Pause room & intervene">
                                                        <Ban className="w-4 h-4 text-accent" />
                                                    </button>
                                                    <button className="p-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted transition-colors" title="Eject user">
                                                        <DoorOpen className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
}
