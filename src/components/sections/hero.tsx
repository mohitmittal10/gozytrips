"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TypingText } from "@/components/ui/typing-text";
import { 
  ArrowRight, 
  Activity, 
  Zap, 
  Globe, 
  TrendingUp, 
  Search, 
  Compass, 
  Orbit, 
  Workflow, 
  Cpu,
  CheckCircle2,
  Mail,
  CreditCard,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import AnimatedLogo from "@/components/ui/animated-logo";
import MotionButton from "@/components/ui/motion-button";

const ITINERARIES = [
    { id: 1, name: "Amalfi Coast Drift", type: "4 Guests • 12 Days", price: "$42,500", status: "In Progress" },
    { id: 2, name: "Icelandic Aurora", type: "2 Guests • 7 Days", price: "$18,200", status: "Drafting" },
    { id: 3, name: "Tokyo Neon Nights", type: "2 Guests • 5 Days", price: "$12,400", status: "In Progress" },
    { id: 4, name: "Serengeti Safari", type: "4 Guests • 10 Days", price: "$28,900", status: "Drafting" },
    { id: 5, name: "Parisian Romance", type: "2 Guests • 4 Days", price: "$15,600", status: "In Progress" },
    { id: 6, name: "Swiss Alps Retreat", type: "2 Guests • 8 Days", price: "$32,100", status: "Drafting" },
];

const Counter = ({ value, duration = 2, decimals = 0 }: { value: number, duration?: number, decimals?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
            setCount(progress * value);
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration, decimals]);

    return <span>{count.toFixed(decimals)}</span>;
};

const StatusRotator = () => {
    const statuses = [
        "Autonomous parsing of 12M+ travel datasets completed",
        "Neural mapping of global flight corridors active",
        "GDS pipeline synchronization at 99.8% stability",
        "Predictive pricing models successfully deployed",
        "Multi-modal itinerary routing optimized",
        "Vectorizing destination-specific amenities"
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % statuses.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [statuses.length]);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
            >
                {statuses[index]}
            </motion.span>
        </AnimatePresence>
    );
};

const WorkflowFeed = () => {
    const steps = [
        { text: "AI mapping the destination...", icon: <Globe className="w-3 h-3" /> },
        { text: "Building your itinerary...", icon: <Compass className="w-3 h-3" /> },
        { text: "Proposal sent to client...", icon: <Mail className="w-3 h-3" /> },
        { text: "Client viewed trip details...", icon: <Activity className="w-3 h-3" /> },
        { text: "Deposit received...", icon: <CreditCard className="w-3 h-3" /> },
        { text: "Trip confirmed.", icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> }
    ];
    const [visibleSteps, setVisibleSteps] = useState<{text: string, icon: any}[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleSteps((prev) => {
                const next = [...prev, steps[prev.length % steps.length]];
                if (next.length > 5) return next.slice(1);
                return next;
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-3">
            {visibleSteps.map((step, i) => (
                <motion.div 
                    key={step.text + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                >
                    <span className="text-indigo-400 shrink-0">
                        {step.icon}
                    </span>
                    <span className="text-[11px] text-zinc-300 font-medium tracking-tight">
                        {step.text}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};

const LiquidGlassBackground = () => (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
            animate={{ 
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-500/10 rounded-full blur-[80px]"
        />
        <motion.div 
            animate={{ 
                x: [0, -80, 0],
                y: [0, -60, 0],
                scale: [1, 1.3, 1],
                rotate: [0, -120, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/10 rounded-full blur-[80px]"
        />
    </div>
);

const HeroShaderCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const glProgramRef = useRef<WebGLProgram | null>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl');
        if (!gl) return;
        glRef.current = gl;

        const vertexShaderSource = `
            attribute vec2 aPosition;
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            uniform float iTime;
            uniform vec2 iResolution;
            
            mat2 rotate2d(float angle){
                float c=cos(angle), s=sin(angle);
                return mat2(c,-s,s,c);
            }

            float variation(vec2 v1, vec2 v2, float strength, float speed) {
                return sin(dot(normalize(v1), normalize(v2)) * strength + iTime * speed) / 100.0;
            }

            vec3 paintCircle(vec2 uv, vec2 center, float rad, float width) {
                vec2 diff = center - uv;
                float len = length(diff);
                len += variation(diff, vec2(0.0, 1.0), 5.0, 2.0);
                len -= variation(diff, vec2(1.0, 0.0), 5.0, 2.0);
                float circle = smoothstep(rad - width, rad, len) - smoothstep(rad, rad + width, len);
                return vec3(circle);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / iResolution.xy;
                uv.x *= iResolution.x / iResolution.y;
                uv.x -= (iResolution.x / iResolution.y - 1.0) * 0.5;
                
                vec3 backgroundColor = vec3(0.01, 0.01, 0.02); // Deep midnight
                float mask = 0.0;
                
                mask += paintCircle(uv, vec2(0.5, 0.5), 0.4, 0.06).r;
                mask += paintCircle(uv, vec2(0.5, 0.5), 0.35, 0.04).r;
                mask += paintCircle(uv, vec2(0.2, 0.8), 0.2, 0.03).r;
                mask += paintCircle(uv, vec2(0.8, 0.2), 0.25, 0.03).r;

                vec2 v = rotate2d(iTime * 0.05) * uv;
                vec3 foregroundColor = mix(
                    vec3(0.2, 0.2, 0.5), // Subtle Indigo
                    vec3(0.1, 0.1, 0.3), // Darker Indigo
                    v.x + 0.5
                );
                
                vec3 color = mix(backgroundColor, foregroundColor, mask * 0.3);
                
                float n = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
                color += n * 0.01;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const compileShader = (type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        const program = gl.createProgram();
        const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!program || !vs || !fs) return;

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);
        glProgramRef.current = program;

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const aPosition = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const iTimeLoc = gl.getUniformLocation(program, 'iTime');
        const iResLoc = gl.getUniformLocation(program, 'iResolution');

        let animationFrameId: number;
        const render = (time: number) => {
            gl.uniform1f(iTimeLoc, time * 0.001);
            gl.uniform2f(iResLoc, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0 opacity-40 pointer-events-none" />;
};

const Hero = () => {
    const router = useRouter();
    const { user } = useAuth();

    return (
        <section id="home" className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#020205] pt-20 pb-12">
            <HeroShaderCanvas />
            
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#020205] to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6 mb-8 sm:mb-10">
                    

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-white max-w-4xl"
                    >
                        Your Trip, <br />
                        <TypingText 
                            texts={[
                                "Synthesized.",
                                "Structured.",
                                "Refined.",
                                "Elevated."
                            ]} 
                            className="text-[#71717A]" 
                        />
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm sm:text-base md:text-lg text-zinc-500 max-w-2xl leading-relaxed font-medium"
                    >
                        Turn a 3-hour planning session into 3 minutes.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto"
                    >
                        <Link href={user ? "/the-lab" : "/auth/signup"} className="w-full sm:w-auto flex justify-center">
                            <MotionButton label="Try Free" classes="w-full sm:w-auto" />
                        </Link>
                        <Link href="#how-it-works" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-full text-sm font-extrabold hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 flex items-center justify-center gap-2">
                                How It Works <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 pt-2"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-zinc-500 backdrop-blur-sm">
                                        {i}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[11px] sm:text-xs text-zinc-600 font-bold tracking-tight uppercase">500+ Travel Partners</span>
                        </div>
                        <div className="h-4 w-px bg-white/5" />
                        <div className="flex items-center gap-2 text-zinc-600">
                            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400/40" />
                            <span className="text-[11px] sm:text-xs font-bold tracking-tight uppercase">Global Coverage</span>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mt-6 sm:mt-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="col-span-1 sm:col-span-2 md:col-span-1 rounded-3xl p-5 sm:p-6 border border-white/10 bg-white/[0.02] backdrop-blur-2xl flex flex-col h-[260px] sm:h-[290px] overflow-hidden group hover:border-indigo-500/30 transition-all relative"
                    >
                        <LiquidGlassBackground />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-white tracking-tight flex items-center gap-2 text-sm">
                                    <Activity className="w-4 h-4 text-indigo-400" />
                                    Recent Activity
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            
                            <div className="flex-grow overflow-hidden relative">
                                <WorkflowFeed />
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Today&apos;s Operations</span>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active now</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="col-span-1 rounded-3xl p-5 sm:p-6 border border-white/10 bg-[#0a0a1a] shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all h-[340px] sm:h-[380px]"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Workflow className="w-32 h-32 text-indigo-500 -rotate-12 translate-x-8 -translate-y-8" />
                        </div>
                        
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                                        <AnimatedLogo isLoading={true} size="sm" className="text-indigo-400 scale-[0.7]" />
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Synthesis Engine</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <motion.h2 
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        className="text-5xl font-black text-white mb-1 tracking-tighter"
                                    >
                                        <Counter value={98.2} decimals={1} />%
                                    </motion.h2>
                                    <div className="flex items-center gap-1 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Optimal</span>
                                    </div>
                                </div>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Accuracy Threshold</p>
                            </div>

                            <div className="mt-6 flex-grow">
                                <div className="space-y-2">
                                    {[
                                        { label: "GDS Pipeline", status: "Active", width: "94%" },
                                        { label: "Neural Mapping", status: "Synched", width: "88%" },
                                        { label: "Vector Search", status: "Optimized", width: "91%" }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter">
                                                <span className="text-zinc-500">{item.label}</span>
                                                <span className="text-indigo-400">{item.status}</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: item.width }}
                                                    transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                                    className="h-full bg-indigo-500/40"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mt-6 bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500/20 overflow-hidden">
                                    <motion.div 
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-1/3 h-full bg-indigo-500/50"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-wider h-8 flex items-center">
                                    <StatusRotator />
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="col-span-1 rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/[0.02] backdrop-blur-2xl flex flex-col justify-between h-[260px] sm:h-[290px] group relative overflow-hidden hover:border-indigo-500/30 transition-all"
                    >
                        <LiquidGlassBackground />
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                <Zap className="w-12 h-12 text-indigo-400" />
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Efficiency ROI</h4>
                                <div className="flex items-end gap-2">
                                    <span className="text-5xl font-black text-white tracking-tighter">3m</span>
                                    <span className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-1 italic">
                                        vs 3h
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">98% Faster Synthesis Cycle</p>
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                    <span>Time Recovery</span>
                                    <span className="text-indigo-400">98%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "98%" }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-indigo-500" 
                                    />
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex items-center gap-3">
                                <div className="flex-grow h-px bg-white/5" />
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                    Planning Efficiency
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
