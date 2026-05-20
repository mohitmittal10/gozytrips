"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Sparkles, Plane, Hotel, Map, MapPin, Navigation, Clock, CheckCircle2, ShieldCheck, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedLogo from "../ui/animated-logo";
import Image from "next/image";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Step2Animation() {
    const [phase, setPhase] = useState(0); // 0, 1, 2, 3
    const [scanData, setScanData] = useState("");

    const runAnimation = async () => {
        setPhase(0);
        await sleep(1500);

        setPhase(1);
        // Simulate rapid scanning
        for (let i = 0; i < 15; i++) {
            const types = ["Flight", "Hotel", "Activity", "Transport"];
            const type = types[Math.floor(Math.random() * types.length)];
            const id = Math.floor(10000 + Math.random() * 90000);
            setScanData(`Evaluating ${type} #${id}...`);
            await sleep(150);
        }
        await sleep(500);

        setPhase(2);
        await sleep(3500);

        setPhase(3);
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
        { icon: BrainCircuit, text: "Initializing AI" },
        { icon: Sparkles, text: "Scanning Options" },
        { icon: Navigation, text: "Routing Days" },
        { icon: CheckCircle2, text: "Optimized" },
    ];

    return (
        <div ref={ref} className="relative w-full max-w-[380px] md:ml-auto mx-auto perspective-1000 h-[420px] xs:h-[390px] sm:h-[380px]">
            <motion.div 
                className="bg-zinc-950/40 backdrop-blur-md rounded-3xl p-4 sm:p-6 h-full relative overflow-hidden border border-white/5 shadow-2xl flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Progress Indicators */}
                <div className="mb-6 flex flex-col items-center">
                    {/* Logo badge */}
                    <div className="flex items-center justify-center mb-4">
                        <motion.div
                            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <AnimatedLogo size="xs" />
                            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Wander Labs</span>
                        </motion.div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        {phases.map((p, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-700 ease-out",
                                        index < phase && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                                        index === phase && "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]",
                                        index > phase && "bg-zinc-800/50 text-zinc-500 border border-zinc-700",
                                    )}
                                >
                                    {index < phase ? <CheckCircle2 className="h-4 w-4" strokeWidth={3} /> : <p.icon className="h-4 w-4" />}
                                </div>
                                {index < phases.length - 1 && (
                                    <div className="relative h-[2px] w-6">
                                        <div className="absolute inset-0 bg-white/10 rounded-full" />
                                        <div className="absolute inset-0 bg-blue-500 transition-all duration-700 ease-out origin-left rounded-full" style={{ transform: `scaleX(${index < phase ? 1 : 0})` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary/90 h-4">
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

                {/* AI Processing Container */}
                <div className="flex-1 relative bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden shadow-inner p-4 flex flex-col items-center justify-center">
                    
                    {/* Background grid effect for the AI lab feel */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-50 z-0" />

                    <AnimatePresence mode="wait">
                        {/* PHASE 0: Initializing */}
                        {phase === 0 && (
                            <motion.div
                                key="phase0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative z-10 flex flex-col items-center gap-4"
                            >
                                <motion.div 
                                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center"
                                    animate={{ 
                                        boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 30px rgba(99,102,241,0.4)", "0 0 0px rgba(99,102,241,0)"]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <AnimatedLogo isLoading={true} size="sm" className="text-indigo-400" />
                                </motion.div>
                                <div className="text-sm font-mono text-indigo-300">Connecting to Wander Labs AI...</div>
                                <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                                    <motion.div 
                                        className="h-full bg-indigo-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.4, ease: "easeInOut" }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 1: Scanning Data */}
                        {phase === 1 && (
                            <motion.div
                                key="phase1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6"
                            >
                                {/* Spinning orbits */}
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-violet-400 absolute z-10 animate-pulse" />
                                    
                                    <motion.div 
                                        className="absolute w-full h-full border border-violet-500/30 rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center border border-violet-500/50">
                                            <Plane className="w-2 h-2 text-violet-300" />
                                        </div>
                                    </motion.div>
                                    
                                    <motion.div 
                                        className="absolute w-16 h-16 border border-blue-500/30 rounded-full"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    >
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-zinc-800 rounded-full flex items-center justify-center border border-blue-500/50">
                                            <Hotel className="w-2 h-2 text-blue-300" />
                                        </div>
                                    </motion.div>
                                </div>
                                
                                <div className="bg-black/50 border border-white/5 rounded-lg px-4 py-2 w-[80%]">
                                    <div className="text-[10px] uppercase text-zinc-500 mb-1 tracking-widest font-bold">Live Scan</div>
                                    <div className="text-xs font-mono text-violet-300 h-4 truncate">
                                        {scanData}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 2: Routing Days */}
                        {phase === 2 && (
                            <motion.div
                                key="phase2"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative z-10 w-full h-full flex flex-col pt-2"
                            >
                                <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 mb-3 text-center font-bold">
                                    Plotting Optimal Route
                                </div>
                                
                                <div className="relative flex-1 flex flex-col justify-between px-3 sm:px-6 pb-2">
                                    {/* Timeline line */}
                                    <div className="absolute left-[27px] sm:left-[39px] top-4 bottom-8 w-[2px] bg-white/10" />
                                    
                                    {/* Timeline progress */}
                                    <motion.div 
                                        className="absolute left-[27px] sm:left-[39px] top-4 w-[2px] bg-gradient-to-b from-emerald-400 to-cyan-500"
                                        initial={{ height: "0%" }}
                                        animate={{ height: "100%" }}
                                        transition={{ duration: 3, ease: "linear" }}
                                    />

                                    {/* Nodes */}
                                    {[
                                        { day: 1, text: "Arrival & Hotel Check-in" },
                                        { day: 2, text: "City Tour & Local Dining" },
                                        { day: 3, text: "Adventure Activity" },
                                    ].map((node, i) => (
                                        <div key={i} className="flex items-center gap-4 relative z-10">
                                            <motion.div 
                                                className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400"
                                                initial={{ borderColor: "rgba(63, 63, 70, 1)", color: "rgba(161, 161, 170, 1)", backgroundColor: "rgba(39, 39, 42, 1)" }}
                                                animate={{ 
                                                    borderColor: "rgba(52, 211, 153, 0.5)", 
                                                    color: "rgba(52, 211, 153, 1)", 
                                                    backgroundColor: "rgba(6, 78, 59, 0.5)" 
                                                }}
                                                transition={{ delay: i * 1, duration: 0.3 }}
                                            >
                                                D{node.day}
                                            </motion.div>
                                            <motion.div 
                                                className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex-1"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: (i * 1) + 0.2, duration: 0.4 }}
                                            >
                                                <div className="h-1.5 w-1/3 bg-emerald-500/50 rounded-full mb-1.5" />
                                                <div className="text-[10px] text-zinc-300">{node.text}</div>
                                            </motion.div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* PHASE 3: Optimized */}
                        {phase === 3 && (
                            <motion.div
                                key="phase3"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center justify-center w-full h-full relative z-10"
                            >
                                <motion.div 
                                    className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-[90%] shadow-xl">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                            <span className="text-sm font-bold text-white tracking-wide">100% Optimized</span>
                                        </div>
                                        <div className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md font-bold">
                                            AI APPROVED
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Best Routes</span>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Perfect Timing</span>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-400 flex items-center gap-1.5"><Map className="w-3.5 h-3.5" /> Hidden Gems Added</span>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                    </div>
                                    
                                    <motion.div 
                                        className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
