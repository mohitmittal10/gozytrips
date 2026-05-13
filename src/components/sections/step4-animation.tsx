"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
    Users, 
    LayoutDashboard, 
    BellRing, 
    TrendingUp, 
    Check,
    Briefcase,
    DollarSign,
    ChevronRight,
    Search,
    UserPlus,
    Calendar,
    MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Step4Animation() {
    const [phase, setPhase] = useState(0); // 0, 1, 2, 3
    const [revenue, setRevenue] = useState(0);
    const [clients, setClients] = useState(142);

    const runAnimation = async () => {
        setPhase(0);
        setRevenue(0);
        setClients(142);
        await sleep(1500);

        setPhase(1);
        
        // Animate stats counting up
        const targetRevenue = 124500;
        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            setRevenue(Math.round((targetRevenue / steps) * i));
            await sleep(50);
        }
        setRevenue(targetRevenue);
        await sleep(1500);

        setPhase(2);
        await sleep(2500);

        setPhase(3);
        setClients(143);
        
        // Animate revenue increasing further
        const newTarget = targetRevenue + 4500;
        for (let i = 1; i <= 10; i++) {
            setRevenue(Math.round(targetRevenue + ((4500 / 10) * i)));
            await sleep(50);
        }
        setRevenue(newTarget);
        
        await sleep(4000);

        runAnimation();
    };

    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-20%" });
    const hasStarted = useRef(false);

    useEffect(() => {
        if (isInView && !hasStarted.current) {
            hasStarted.current = true;
            runAnimation();
        }
    }, [isInView]);

    const phases = [
        { icon: LayoutDashboard, text: "Workspace" },
        { icon: Users, text: "Client Data" },
        { icon: BellRing, text: "New Lead" },
        { icon: TrendingUp, text: "Pipeline" },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div ref={ref} className="relative w-full max-w-[380px] md:ml-0 mx-auto perspective-1000 h-[420px]">
            <motion.div 
                className="bg-zinc-950/40 backdrop-blur-md rounded-3xl p-5 h-full relative overflow-hidden border border-white/5 shadow-2xl flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Progress Indicators */}
                <div className="mb-5 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2">
                        {phases.map((p, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-700 ease-out",
                                        index < phase && "bg-orange-500/20 text-orange-400 border border-orange-500/30",
                                        index === phase && "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]",
                                        index > phase && "bg-zinc-800/50 text-zinc-500 border border-zinc-700",
                                    )}
                                >
                                    {index < phase ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <p.icon className="h-3.5 w-3.5" />}
                                </div>
                                {index < phases.length - 1 && (
                                    <div className="relative h-[2px] w-5">
                                        <div className="absolute inset-0 bg-white/10 rounded-full" />
                                        <div className="absolute inset-0 bg-orange-500 transition-all duration-700 ease-out origin-left rounded-full" style={{ transform: `scaleX(${index < phase ? 1 : 0})` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90 h-4">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={phase}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="block text-center"
                            >
                                {phases[phase]?.text}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                {/* CRM Lite Dashboard Container */}
                <div className="flex-1 relative bg-[#0a0a0e] rounded-xl border border-white/10 overflow-hidden shadow-inner flex flex-col">
                    
                    {/* Top Nav */}
                    <div className="h-10 border-b border-white/5 flex items-center justify-between px-3 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
                                <Users className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-white">CRM Lite</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-zinc-500" />
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700" />
                        </div>
                    </div>

                    <div className="flex-1 p-3 flex flex-col gap-3 relative">
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <DollarSign className="w-6 h-6 text-emerald-400" />
                                </div>
                                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1 z-10">Total Revenue</span>
                                <span className="text-sm font-black text-white z-10">
                                    {phase === 0 ? "—" : formatCurrency(revenue)}
                                </span>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex flex-col justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Briefcase className="w-6 h-6 text-blue-400" />
                                </div>
                                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1 z-10">Active Clients</span>
                                <span className="text-sm font-black text-white z-10">
                                    {phase === 0 ? "—" : clients}
                                </span>
                            </div>
                        </div>

                        {/* Recent Clients Section */}
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                                <span className="text-[10px] font-semibold text-white">Recent Pipeline</span>
                                <button className="text-[9px] bg-white/10 hover:bg-white/20 transition-colors text-white px-2 py-0.5 rounded flex items-center gap-1">
                                    View All <ChevronRight className="w-2.5 h-2.5" />
                                </button>
                            </div>
                            
                            <div className="flex-1 p-2 space-y-2 relative">
                                
                                {/* New Lead Notification overlay */}
                                <AnimatePresence>
                                    {phase === 2 && (
                                        <motion.div 
                                            className="absolute top-2 left-2 right-2 z-20 bg-orange-500/10 border border-orange-500/30 backdrop-blur-md rounded-lg p-3 shadow-lg shadow-orange-500/10"
                                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                                    <BellRing className="w-4 h-4 text-white animate-[wiggle_1s_ease-in-out_infinite]" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[11px] font-bold text-white mb-0.5 flex items-center gap-1.5">
                                                        New Inquiry! 
                                                        <span className="bg-rose-500 text-white text-[8px] px-1.5 py-[1px] rounded uppercase font-black tracking-wider animate-pulse">Hot</span>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-300">Elena R. requested a trip to Paris</div>
                                                </div>
                                            </div>
                                            <style jsx>{`
                                                @keyframes wiggle {
                                                    0%, 100% { transform: rotate(-10deg); }
                                                    50% { transform: rotate(10deg); }
                                                }
                                            `}</style>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Client List */}
                                <div className="space-y-2 relative z-10">
                                    <AnimatePresence>
                                        {/* Dynamic New Lead */}
                                        {phase >= 3 && (
                                            <motion.div 
                                                key="new-lead"
                                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                                                className="bg-white/5 border border-orange-500/40 rounded-md p-2 relative overflow-hidden"
                                            >
                                                <motion.div 
                                                    className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"
                                                    initial={{ x: '-100%' }}
                                                    animate={{ x: '100%' }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                                                            ER
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-semibold text-white leading-tight">Elena R.</div>
                                                            <div className="text-[9px] text-zinc-400 flex items-center gap-1">
                                                                <MapPin className="w-2.5 h-2.5" /> Paris, FR
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider mb-1">
                                                            Converted
                                                        </div>
                                                        <div className="text-[10px] font-bold text-emerald-400">+$4,500</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Existing Lead 1 */}
                                    <motion.div 
                                        className={cn("bg-white/5 border border-white/5 rounded-md p-2", phase === 0 && "animate-pulse")}
                                        layout
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                    {phase > 0 ? "JM" : ""}
                                                </div>
                                                {phase > 0 ? (
                                                    <div>
                                                        <div className="text-[11px] font-semibold text-white leading-tight">James M.</div>
                                                        <div className="text-[9px] text-zinc-400 flex items-center gap-1">
                                                            <MapPin className="w-2.5 h-2.5" /> Tokyo, JP
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <div className="h-2 w-16 bg-white/10 rounded" />
                                                        <div className="h-1.5 w-12 bg-white/5 rounded" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {phase > 0 ? (
                                                    <div className="bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                                        Planning
                                                    </div>
                                                ) : (
                                                    <div className="h-3 w-12 bg-white/10 rounded" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Existing Lead 2 */}
                                    <motion.div 
                                        className={cn("bg-white/5 border border-white/5 rounded-md p-2", phase === 0 && "animate-pulse")}
                                        layout
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                    {phase > 0 ? "SW" : ""}
                                                </div>
                                                {phase > 0 ? (
                                                    <div>
                                                        <div className="text-[11px] font-semibold text-white leading-tight">Sarah W.</div>
                                                        <div className="text-[9px] text-zinc-400 flex items-center gap-1">
                                                            <MapPin className="w-2.5 h-2.5" /> Bali, ID
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5">
                                                        <div className="h-2 w-14 bg-white/10 rounded" />
                                                        <div className="h-1.5 w-10 bg-white/5 rounded" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {phase > 0 ? (
                                                    <div className="bg-zinc-500/20 text-zinc-400 border border-zinc-500/20 text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                                        Completed
                                                    </div>
                                                ) : (
                                                    <div className="h-3 w-14 bg-white/10 rounded" />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
