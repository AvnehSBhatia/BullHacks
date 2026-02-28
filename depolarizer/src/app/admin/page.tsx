"use client";

import { useState } from "react";
import { Shield, Flag, AlertTriangle, CheckCircle, XCircle, Search, User, FileText } from "lucide-react";
import Link from "next/link";

const MOCK_REPORTS = [
    {
        id: "rep_102",
        reporter: "Sam",
        reported: "Alex",
        reason: "Hostility & Name Calling",
        status: "Pending",
        date: "10 mins ago",
        transcript: [
            { sender: "Sam", text: "I just think we should focus on community solutions first.", time: "10:02 AM" },
            { sender: "Alex", text: "That's exactly the kind of naive garbage I'd expect.", time: "10:04 AM" },
            { sender: "System", text: "User Alex has been flagged by Topic Guard previously.", time: "System Note", isSystem: true }
        ],
        reportedTrustScore: 65
    },
    {
        id: "rep_103",
        reporter: "Jordan",
        reported: "Taylor",
        reason: "Bypassing Topic Guards",
        status: "Pending",
        date: "1 hour ago",
        transcript: [
            { sender: "System", text: "Guided Mode Icebreaker active.", time: "System Note", isSystem: true },
            { sender: "Taylor", text: "P0L1T1C$ are ruining this country.", time: "09:12 AM" },
            { sender: "Jordan", text: "Hey, I thought we weren't doing that yet?", time: "09:15 AM" }
        ],
        reportedTrustScore: 88
    }
];

export default function AdminQueue() {
    const [selectedReport, setSelectedReport] = useState(MOCK_REPORTS[0]);
    const [actionDone, setActionDone] = useState<string | null>(null);

    const handleAction = (action: string) => {
        setActionDone(`Report ${selectedReport.id} resolved: ${action}`);
        setTimeout(() => setActionDone(null), 3000);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-bridge-red/20 text-bridge-slate">

            {/* Sidebar */}
            <aside className="w-16 md:w-64 bg-[#1E293B] flex col flex-col h-screen sticky top-0 text-white">
                <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-center md:justify-start gap-3">
                    <Shield className="w-8 h-8 text-bridge-red" />
                    <span className="font-fraunces font-semibold text-xl hidden md:block">Moderator</span>
                </div>

                <div className="p-2 md:p-4 flex-1 space-y-1">
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 font-medium w-full text-left">
                        <Flag className="w-5 h-5 text-bridge-red shrink-0" />
                        <span className="hidden md:block">Flagged Queue</span>
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 font-medium transition-colors w-full text-left">
                        <User className="w-5 h-5 opacity-70 shrink-0" />
                        <span className="hidden md:block opacity-70">User Directory</span>
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 font-medium transition-colors w-full text-left">
                        <FileText className="w-5 h-5 opacity-70 shrink-0" />
                        <span className="hidden md:block opacity-70">Audit Logs</span>
                    </button>
                </div>

                <div className="p-4 border-t border-white/10">
                    <Link href="/dashboard" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors">
                        Exit Admin
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 border-b border-bridge-slate/10 bg-white flex items-center justify-between px-6 shrink-0">
                    <h1 className="font-fraunces text-xl font-bold">Review Queue</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bridge-slate/40" />
                            <input
                                type="text"
                                placeholder="Search report ID..."
                                className="pl-9 pr-4 py-1.5 bg-[#F8FAFC] border border-bridge-slate/10 rounded-full text-sm outline-none w-64 focus:border-bridge-blue"
                            />
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">

                    {/* Reports List */}
                    <div className="w-1/3 border-r border-bridge-slate/10 bg-white overflow-y-auto">
                        {MOCK_REPORTS.map(report => (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className={`w-full p-5 border-b border-bridge-slate/5 text-left transition-colors flex flex-col gap-2 ${selectedReport.id === report.id ? 'bg-bridge-red/5 border-l-4 border-l-bridge-red' : 'hover:bg-[#F8FAFC] border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-bold text-sm tracking-wide">{report.id}</span>
                                    <span className="text-[10px] uppercase font-bold text-bridge-red bg-bridge-red/10 px-2 py-0.5 rounded-full">{report.status}</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Rep. against: <span className="font-bold">{report.reported}</span></div>
                                    <div className="text-xs text-bridge-slate/60 mt-0.5">Reason: {report.reason}</div>
                                </div>
                                <div className="text-[10px] text-bridge-slate/40 mt-1">{report.date}</div>
                            </button>
                        ))}
                    </div>

                    {/* Action Panel */}
                    <div className="w-2/3 bg-[#F8FAFC] flex flex-col">

                        {actionDone && (
                            <div className="bg-[#10B981]/10 border-b border-[#10B981]/20 p-3 flex justify-center text-sm font-bold text-[#10B981]">
                                ✅ {actionDone}
                            </div>
                        )}

                        <div className="p-6 border-b border-bridge-slate/10 bg-white shrink-0">
                            <h2 className="font-fraunces text-2xl font-bold mb-2">Detailed Report</h2>
                            <div className="flex gap-4 text-sm text-bridge-slate/70 font-medium">
                                <div>Reported User: <strong className="text-bridge-slate">{selectedReport.reported}</strong> (T-Score: {selectedReport.reportedTrustScore})</div>
                                <div>Reporter: <strong className="text-bridge-slate">{selectedReport.reporter}</strong></div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="bg-white rounded-2xl border border-bridge-slate/10 shadow-sm p-6 max-w-2xl mx-auto">
                                <h3 className="text-sm font-bold text-bridge-slate/40 uppercase tracking-wider mb-6">Conversation Transcript</h3>

                                <div className="space-y-4">
                                    {selectedReport.transcript.map((msg, i) => (
                                        <div key={i} className={`flex flex-col gap-1 ${msg.sender === selectedReport.reported ? 'items-end' : 'items-start'}`}>
                                            <div className="text-xs font-bold text-bridge-slate/40">{msg.sender} <span className="font-medium text-[10px]">{msg.time}</span></div>
                                            <div className={`
                        p-3 rounded-2xl text-[15px] leading-relaxed max-w-[85%] border
                        ${msg.isSystem ? 'bg-gray-50 border-dashed border-bridge-slate/20 text-bridge-slate/60 p-2 text-sm italic items-center w-full text-center rounded-xl my-2' :
                                                    msg.sender === selectedReport.reported
                                                        ? 'bg-bridge-red/5 border-bridge-red/20 text-bridge-red font-medium rounded-tr-sm'
                                                        : 'bg-white border-bridge-slate/10 text-bridge-slate rounded-tl-sm'
                                                }
                      `}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Moderation Actions */}
                        <div className="p-6 bg-white border-t border-bridge-slate/10 shrink-0 shadow-[0_-10px_30px_rgb(0,0,0,0.02)]">
                            <h3 className="text-sm font-bold text-bridge-slate mb-4">Moderator Actions</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleAction('Cleared')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-bridge-slate/10 hover:bg-gray-50 text-bridge-slate font-bold transition-colors"
                                >
                                    <CheckCircle className="w-5 h-5 text-[#10B981]" /> Clear Report
                                </button>
                                <button
                                    onClick={() => handleAction('Warned (-5 T-Score)')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border bg-bridge-gold/10 border-bridge-gold/20 hover:bg-bridge-gold/20 text-bridge-gold font-bold transition-colors"
                                >
                                    <AlertTriangle className="w-5 h-5" /> Issue Warning
                                </button>
                                <button
                                    onClick={() => handleAction('Suspended (-15 T-Score)')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border bg-bridge-red text-white hover:bg-bridge-red/90 font-bold shadow-md transition-colors"
                                >
                                    <XCircle className="w-5 h-5" /> Suspend User
                                </button>
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
}
