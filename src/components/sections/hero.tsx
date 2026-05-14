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
  Cpu 
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RippleButton } from "@/components/ui/multi-type-ripple-buttons";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import AnimatedGlassySearchBar from "@/components/ui/animated-glassy-search-bar";

const ITINERARIES = [
    { id: 1, name: "Amalfi Coast Drift", type: "4 Guests • 12 Days", price: "$42,500", status: "In Progress" },
    { id: 2, name: "Icelandic Aurora", type: "2 Guests • 7 Days", price: "$18,200", status: "Drafting" },
    { id: 3, name: "Tokyo Neon Nights", type: "2 Guests • 5 Days", price: "$12,400", status: "In Progress" },
    { id: 4, name: "Serengeti Safari", type: "4 Guests • 10 Days", price: "$28,900", status: "Drafting" },
    { id: 5, name: "Parisian Romance", type: "2 Guests • 4 Days", price: "$15,600", status: "In Progress" },
    { id: 6, name: "Swiss Alps Retreat", type: "2 Guests • 8 Days", price: "$32,100", status: "Drafting" },
];

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

    const handleSearch = (value: string) => {
        if (!value.trim()) return;
        // Navigate to the lab with the query
        router.push(`/the-lab?q=${encodeURIComponent(value)}`);
    };

    return (
        <section id="home" className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-8 overflow-hidden bg-[#020205] pt-20 pb-12">
            <HeroShaderCanvas />
            
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#020205] to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
                <div className="flex flex-col items-center text-center space-y-6 mb-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] md:text-xs font-bold text-indigo-400 tracking-widest uppercase"
                    >
                        <Orbit className="w-3 h-3" />
                        Modern Travel Architecture
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-white max-w-4xl"
                    >
                        Your Trip, <br />
                        <TypingText 
                            texts={[
                                "Synthesized.",
                                "Structured.",
                                "Architected.",
                                "Elevated."
                            ]} 
                            className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500 bg-clip-text text-transparent" 
                        />
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base md:text-lg text-zinc-500 max-w-2xl leading-relaxed font-medium"
                    >
                        Sophisticated infrastructure for the modern travel architect. 
                        Precision-engineered itineraries, professional CRM, and enterprise-grade automation.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="w-full flex justify-center"
                    >
                        <AnimatedGlassySearchBar onSearch={handleSearch} />
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap justify-center items-center gap-8 pt-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-500 backdrop-blur-sm">
                                        {i}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-zinc-600 font-bold tracking-tight uppercase">500+ Architecture Partners</span>
                        </div>
                        <div className="h-4 w-px bg-white/5 hidden sm:block" />
                        <div className="flex items-center gap-2 text-zinc-600">
                            <Globe className="w-4 h-4 text-indigo-400/40" />
                            <span className="text-xs font-bold tracking-tight uppercase">Global Coverage</span>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="col-span-1 md:col-span-1 rounded-3xl p-6 border border-white/10 bg-white/[0.02] backdrop-blur-2xl flex flex-col h-[290px] overflow-hidden group hover:border-indigo-500/30 transition-all"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white tracking-tight flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-indigo-400" />
                                Live Updates
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active</span>
                        </div>
                        
                        <div className="flex-grow overflow-hidden relative">
                            <motion.div 
                                animate={{ y: [0, -300] }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="space-y-4"
                            >
                                {[...ITINERARIES, ...ITINERARIES].map((item, index) => (
                                    <div key={index} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between transition-all group-hover:border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                                                <Compass className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{item.name}</p>
                                                <p className="text-[10px] text-zinc-600 font-medium">{item.type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-white">{item.price}</p>
                                            <p className="text-[8px] uppercase tracking-widest text-indigo-500 font-black">{item.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#020205] to-transparent z-10" />
                            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#020205] to-transparent z-10" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="col-span-1 md:col-span-1 rounded-3xl p-8 border border-white/10 bg-[#0a0a1a] shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Workflow className="w-32 h-32 text-indigo-500 -rotate-12 translate-x-8 -translate-y-8" />
                        </div>
                        
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <Cpu className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Synthesis Engine</span>
                                </div>
                                <h2 className="text-5xl font-black text-white mb-1 tracking-tighter">98.2%</h2>
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Accuracy Threshold</p>
                            </div>
                            
                            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-wider">
                                    Autonomous parsing of 12M+ travel datasets completed. Structure optimization active.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="col-span-1 md:col-span-1 rounded-3xl p-8 border border-white/10 bg-white/[0.02] flex flex-col justify-between h-[290px] group relative overflow-hidden hover:border-indigo-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20">
                            <TrendingUp className="w-12 h-12 text-indigo-400" />
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Business Intelligence</h4>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-black text-white tracking-tighter">+24%</span>
                                <span className="text-xs font-bold text-emerald-500 mb-2 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Lift
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Conversion architecture optimized.</p>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                <span>Efficiency Index</span>
                                <span className="text-indigo-400">88%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "88%" }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-indigo-500" 
                                />
                            </div>
                        </div>

                        <div className="mt-auto pt-6 flex items-center gap-3">
                            <div className="flex-grow h-px bg-white/5" />
                            <Link href="#demo" className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                                Systems Report
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
