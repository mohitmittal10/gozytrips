"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FileText, Download, Check, Sparkles, Layout, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Step3Animation() {
    const [phase, setPhase] = useState(0); // 0, 1, 2, 3

    const runAnimation = async () => {
        setPhase(0);
        await sleep(1500);
        setPhase(1);
        await sleep(2000);
        setPhase(2);
        await sleep(2000);
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
        { icon: Database, text: "Processing Data" },
        { icon: Layout, text: "Generating Layout" },
        { icon: Sparkles, text: "Applying Theme" },
        { icon: Check, text: "PDF Ready" },
    ];

    return (
        <div ref={ref} className="relative w-full max-w-[380px] md:ml-0 mx-auto perspective-1000 h-[380px]">
            <motion.div 
                className="bg-zinc-950/40 backdrop-blur-md rounded-3xl p-6 h-full relative overflow-hidden border border-white/5 shadow-2xl flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Progress Indicators */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2">
                        {phases.map((p, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-700 ease-out",
                                        index < phase && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                                        index === phase && "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]",
                                        index > phase && "bg-zinc-800/50 text-zinc-500 border border-zinc-700",
                                    )}
                                >
                                    {index < phase ? <Check className="h-4 w-4" strokeWidth={3} /> : <p.icon className="h-4 w-4" />}
                                </div>
                                {index < phases.length - 1 && (
                                    <div className="relative h-[2px] w-6">
                                        <div className="absolute inset-0 bg-white/10 rounded-full" />
                                        <div className="absolute inset-0 bg-emerald-500 transition-all duration-700 ease-out origin-left rounded-full" style={{ transform: `scaleX(${index < phase ? 1 : 0})` }} />
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

                {/* PDF Document Container */}
                <div className="flex-1 relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-inner p-4 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {phase === 0 && (
                            <motion.div
                                key="phase0"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center gap-5 w-full"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                >
                                    <Database className="w-12 h-12 text-primary/60" />
                                </motion.div>
                                <div className="space-y-3 w-full max-w-[200px]">
                                    {[1, 2, 3].map((i) => (
                                        <div 
                                            key={i}
                                            className="h-2 bg-black/40 rounded-full w-full overflow-hidden relative border border-white/5"
                                        >
                                            <motion.div 
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/50 to-primary/80 rounded-full"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {phase === 1 && (
                            <motion.div
                                key="phase1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-[170px] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col transform rotate-2 relative"
                                style={{ height: '220px' }}
                            >
                                {/* Skeleton Cover */}
                                <div className="h-[70px] bg-zinc-200 relative overflow-hidden">
                                    <motion.div 
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <div className="absolute bottom-2 left-2 right-2 space-y-1.5">
                                        <div className="h-1.5 w-1/3 bg-zinc-300 rounded-sm" />
                                        <div className="h-4 w-3/4 bg-zinc-400 rounded-sm" />
                                    </div>
                                </div>
                                <div className="h-1 bg-primary w-full" />
                                <div className="p-3 space-y-3 mt-2">
                                    <div className="h-2 w-1/2 bg-zinc-200 rounded-sm" />
                                    <div className="flex gap-1.5 mb-2">
                                        <div className="flex-1 h-8 bg-zinc-100 rounded-sm" />
                                        <div className="flex-1 h-8 bg-zinc-100 rounded-sm" />
                                        <div className="flex-1 h-8 bg-zinc-100 rounded-sm" />
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-200 rounded-sm" />
                                    <div className="h-1.5 w-5/6 bg-zinc-200 rounded-sm" />
                                    <div className="h-1.5 w-4/6 bg-zinc-200 rounded-sm" />
                                </div>
                            </motion.div>
                        )}

                        {phase === 2 && (
                            <motion.div
                                key="phase2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-[170px] bg-white rounded-md shadow-2xl overflow-hidden flex flex-col transform -rotate-1 relative"
                                style={{ height: '220px' }}
                            >
                                {/* Filled Cover - Minimalist Style */}
                                <div className="h-[70px] bg-zinc-800 relative overflow-hidden">
                                    {/* Simulated image background */}
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=300&q=80')] bg-cover bg-center opacity-60 mix-blend-overlay" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-transparent" />
                                    <div className="absolute bottom-2 left-3 right-2">
                                        <div className="h-[2px] w-8 bg-white/70 rounded-full mb-1" />
                                        <div className="h-3.5 w-3/4 bg-white rounded-sm font-bold shadow-sm" />
                                    </div>
                                </div>
                                <div className="h-[2px] bg-primary w-full" />
                                <div className="p-3 space-y-3 mt-1">
                                    <div className="h-[3px] w-1/2 bg-zinc-400 rounded-full" />
                                    <div className="flex gap-1.5">
                                        <div className="flex-1 p-1 bg-zinc-50 border-t-2 border-primary rounded-b-sm shadow-sm">
                                            <div className="h-[2px] w-3/4 bg-zinc-300 rounded-full mb-1" />
                                            <div className="h-2 w-1/2 bg-zinc-800 rounded-sm" />
                                        </div>
                                        <div className="flex-1 p-1 bg-zinc-50 border-t-2 border-primary rounded-b-sm shadow-sm">
                                            <div className="h-[2px] w-3/4 bg-zinc-300 rounded-full mb-1" />
                                            <div className="h-2 w-1/2 bg-zinc-800 rounded-sm" />
                                        </div>
                                        <div className="flex-1 p-1 bg-zinc-50 border-t-2 border-primary rounded-b-sm shadow-sm">
                                            <div className="h-[2px] w-3/4 bg-zinc-300 rounded-full mb-1" />
                                            <div className="h-2 w-1/2 bg-zinc-800 rounded-sm" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 border-t border-zinc-100 pt-2">
                                        <div className="w-1/2 border-l-2 border-primary pl-1.5 space-y-1.5">
                                            <div className="h-[2px] w-full bg-zinc-300 rounded-full" />
                                            <div className="h-[2px] w-5/6 bg-zinc-300 rounded-full" />
                                            <div className="h-[2px] w-4/6 bg-zinc-300 rounded-full" />
                                        </div>
                                        <div className="w-1/2 flex flex-col items-end space-y-1.5">
                                            <div className="h-1.5 w-1/2 bg-zinc-800 rounded-sm" />
                                            <div className="h-[2px] w-1/3 bg-zinc-400 rounded-full" />
                                            <div className="h-[2px] w-1/3 bg-primary rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Overlay scan effect */}
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none"
                                    initial={{ y: '-100%' }}
                                    animate={{ y: '100%' }}
                                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                                />
                            </motion.div>
                        )}

                        {phase === 3 && (
                            <motion.div
                                key="phase3"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center justify-center w-full h-full relative"
                            >
                                <motion.div 
                                    className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        opacity: [0.5, 0.8, 0.5] 
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <div className="relative z-10 flex flex-col items-center">
                                    <motion.div 
                                        className="w-20 h-20 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center mb-6 relative overflow-hidden"
                                        initial={{ y: 20 }}
                                        animate={{ y: 0 }}
                                        transition={{ type: "spring", bounce: 0.5 }}
                                    >
                                        <div className="absolute top-0 right-0 w-6 h-6 bg-zinc-200/50 rounded-bl-2xl border-b border-l border-white/50 backdrop-blur-md z-20" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white to-zinc-100 z-0" />
                                        <FileText className="w-10 h-10 text-rose-500 relative z-10 drop-shadow-md" />
                                    </motion.div>
                                    
                                    <motion.button
                                        className="group relative overflow-hidden bg-primary text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <Download className="w-4 h-4" /> Download PDF
                                        </span>
                                        <motion.div 
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '200%' }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
