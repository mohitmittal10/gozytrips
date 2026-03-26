"use client";

import { useState, useEffect } from 'react';
import { CursorDrivenParticleTypography } from '@/components/ui/cursor-driven-particles-typography';

export default function AnimatedTypography() {
    const [typographyText, setTypographyText] = useState("DISCOVER");
    const words = ["DISCOVER", "EXPLORE", "WANDER", "JOURNEY"];

    useEffect(() => {
        const interval = setInterval(() => {
            setTypographyText((current) => {
                const currentIndex = words.indexOf(current);
                return words[(currentIndex + 1) % words.length];
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-[40vh] min-h-[300px] bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Ambient Background Image */}
            <div
                className="absolute inset-0 opacity-20 bg-cover bg-center grayscale mix-blend-luminosity"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=2000&auto=format&fit=crop")' }}
            ></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-neutral-900/50 via-transparent to-black/80 z-0"></div>

            <p className="text-zinc-400 text-sm md:text-base mb-2 tracking-[0.3em] uppercase z-10 font-light relative">
                Your journey begins here
            </p>
            <div className="relative z-10 w-full flex items-center justify-center">
                <CursorDrivenParticleTypography
                    text={typographyText}
                    fontSize={180}
                    particleDensity={5}
                    dispersionStrength={25}
                    color="#ffffff"
                />
            </div>
        </div>
    );
}
