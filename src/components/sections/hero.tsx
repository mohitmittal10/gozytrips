"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TypingText } from "@/components/ui/typing-text";
import { Sparkles, ArrowRight, Activity, MapPin, Zap, Globe, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const ITINERARIES = [
    { id: 1, name: "Amalfi Coast Drift", type: "4 Guests • 12 Days", price: "$42,500", status: "In Progress", color: "purple" },
    { id: 2, name: "Icelandic Aurora", type: "2 Guests • 7 Days", price: "$18,200", status: "Drafting", color: "indigo" },
    { id: 3, name: "Tokyo Neon Nights", type: "2 Guests • 5 Days", price: "$12,400", status: "In Progress", color: "violet" },
    { id: 4, name: "Serengeti Safari", type: "4 Guests • 10 Days", price: "$28,900", status: "Drafting", color: "purple" },
    { id: 5, name: "Parisian Romance", type: "2 Guests • 4 Days", price: "$15,600", status: "In Progress", color: "indigo" },
    { id: 6, name: "Swiss Alps Retreat", type: "2 Guests • 8 Days", price: "$32,100", status: "Drafting", color: "violet" },
];

const Hero = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Subtle grid particle background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();
        window.addEventListener("resize", resize);

        // Create floating particles
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.3 + 0.05,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.offsetWidth;
                if (p.x > canvas.offsetWidth) p.x = 0;
                if (p.y < 0) p.y = canvas.offsetHeight;
                if (p.y > canvas.offsetHeight) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
                ctx.fill();
            }

            // Draw faint connecting lines between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(168, 85, 247, ${0.04 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <section id="home" className="relative min-h-screen sm:h-screen w-full flex items-center px-4 sm:px-8 overflow-hidden bg-black pt-16 pb-8">
            {/* Particle Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full z-0 pointer-events-none"
            />

            {/* Ambient Gradient Orbs — Muted, Midnight-aligned */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-15%] right-[-5%] w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-purple-600/[0.08] rounded-full blur-[120px] md:blur-[180px]"></div>
                <div className="absolute top-[20%] left-[-10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-indigo-500/[0.06] rounded-full blur-[100px] md:blur-[160px]"></div>
                <div className="absolute bottom-[10%] right-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-500/[0.04] rounded-full blur-[100px] md:blur-[180px]"></div>
                {/* Gradient fade to black at bottom for seamless transition */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>
            </div>

            {/* Subtle Grid Overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center relative z-10 h-full">
                <div className="space-y-4 md:space-y-6">
                    

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-[4.5rem] font-extrabold tracking-tighter leading-[1.05] text-white">
                        Your Trip, <br className="hidden sm:block" />
                        <TypingText 
                            texts={[
                                "Reimagined.",
                                "Simplified.",
                                "Automated.",
                                "Explored.",
                                "Elevated."
                            ]} 
                            className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent" 
                        />
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm md:text-base text-zinc-400 max-w-lg leading-relaxed font-light">
                        Experience the pinnacle of AI-driven travel planning. Effortless itineraries, bespoke routes, and unforgettable journeys crafted in seconds.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-1 md:pt-2">
                        <Link href="#packages" className="group relative px-6 py-3 md:px-8 md:py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white font-bold text-xs md:text-sm shadow-[0_20px_50px_-12px_rgba(139,92,246,0.5)] hover:shadow-[0_20px_50px_-12px_rgba(139,92,246,0.7)] hover:brightness-110 transition-all flex items-center justify-center space-x-2.5 md:space-x-3 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <span className="relative z-10">Start Planning</span>
                            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="#demo" className="px-6 py-3 md:px-8 md:py-3.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white font-bold text-xs md:text-sm hover:bg-white/[0.08] hover:border-white/[0.15] transition-all backdrop-blur-2xl text-center">
                            View Demo
                        </Link>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-600/30 border-2 border-black flex items-center justify-center text-[8px] font-bold text-purple-300">
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-medium">500+ agents</span>
                        </div>
                        <div className="h-4 w-px bg-white/[0.06]" />
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-purple-400/60" />
                            <span className="text-[10px] text-zinc-500 font-medium">190+ countries</span>
                        </div>
                    </div>
                </div>

                {/* Right Content: Refined Bento Grid */}
                <div className="relative group hidden sm:block">
                    <div className="absolute -inset-10 bg-gradient-to-tr from-purple-600/10 to-indigo-600/10 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                    <div className="grid grid-cols-12 gap-2 md:gap-3 relative max-w-[420px] ml-auto">
                        {/* Main Card */}
                        <div className="col-span-12 rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl h-[280px] overflow-hidden flex flex-col relative">
                            <div className="flex justify-between items-center mb-4 shrink-0 relative z-20">
                                <h3 className="font-extrabold text-base md:text-lg text-white tracking-tight">Active Itineraries</h3>
                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <Activity className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-400" />
                                </div>
                            </div>
                            
                            {/* Infinite Scroll Container */}
                            <div className="relative flex-grow overflow-hidden">
                                <motion.div 
                                    className="space-y-3"
                                    animate={{
                                        y: [0, -480] // Roughly height of 6 items (each ~80px)
                                    }}
                                    transition={{
                                        duration: 20,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                >
                                    {[...ITINERARIES, ...ITINERARIES].map((item, index) => (
                                        <div key={`${item.id}-${index}`} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-purple-500/20 transition-all cursor-default group/item h-[70px]">
                                            <div className="flex items-center space-x-2.5 md:space-x-3">
                                                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br ${item.color === 'purple' ? 'from-purple-500 to-violet-600 shadow-purple-500/20' : item.color === 'indigo' ? 'from-indigo-500 to-violet-500' : 'from-violet-500 to-purple-600'} flex items-center justify-center shadow-lg`}>
                                                    <MapPin className="text-white w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-xs md:text-sm group-hover/item:text-purple-100 transition-colors whitespace-nowrap">{item.name}</div>
                                                    <div className="text-[9px] md:text-[10px] text-zinc-600 font-medium mt-0.5">{item.type}</div>
                                                </div>
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <div className="text-sm md:text-base font-black text-white">{item.price}</div>
                                                <div className={`text-[7px] md:text-[8px] uppercase tracking-[0.2em] font-black ${item.color === 'indigo' ? 'text-indigo-400' : 'text-purple-400'} mt-1`}>{item.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                                
                                {/* Fade gradients for infinite look */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
                            </div>
                        </div>

                        {/* Insight Card */}
                        <div className="col-span-12 md:col-span-7 rounded-xl md:rounded-2xl p-3.5 md:p-4 transform transition-all duration-700 hover:-translate-y-1 delay-75 border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                            <h4 className="text-[7px] md:text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1.5 md:mb-2 text-gradient">AI Insight</h4>
                            <div className="text-xl md:text-2xl font-black text-white mb-1 md:mb-1.5 tracking-tighter">84% Match</div>
                            <p className="text-[10px] md:text-xs text-zinc-500 leading-relaxed font-light">Private Heli-Tour over the Swiss Alps suggested based on preference for alpine luxury.</p>
                        </div>

                        {/* Stats Card */}
                        <div className="col-span-12 md:col-span-5 bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 rounded-xl md:rounded-2xl p-3.5 md:p-4 shadow-2xl shadow-purple-500/10 flex flex-col justify-between relative overflow-hidden group/card transform transition-all duration-700 hover:-translate-y-1 delay-150 border border-white/10 animate-gradient-slow">
                            <motion.div 
                                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.3),transparent)]"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.5, 0.3],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.08] rounded-full blur-2xl group-hover/card:scale-150 transition-transform duration-700"></div>
                            
                            <motion.div
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <TrendingUp className="text-white/80 w-4 h-4 md:w-5 md:h-5 relative z-10 mb-3 md:mb-0" />
                            </motion.div>
                            
                            <div className="text-white relative z-10">
                                <motion.div 
                                    className="text-xl md:text-2xl font-black tracking-tighter"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    +24%
                                </motion.div>
                                <div className="text-[7px] md:text-[8px] uppercase font-black tracking-widest opacity-70">Conversion Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
