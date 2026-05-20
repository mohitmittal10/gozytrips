"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  isLoading?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const AnimatedLogo = ({
  isLoading = false,
  size = "md",
  className,
}: AnimatedLogoProps) => {
  const sizes = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-24 h-24",
  };

  // Symmetrical nested W paths in 0 0 100 100 space
  const paths = [
    { id: "left-outer", d: "M 20,38 L 37,78 L 54,48" },
    { id: "right-outer", d: "M 80,38 L 63,78 L 46,48" },
    { id: "left-inner", d: "M 28,38 L 42,70 L 52,52" },
    { id: "right-inner", d: "M 72,38 L 58,70 L 48,52" },
  ];

  return (
    <div className={cn("relative flex items-center justify-center select-none", sizes[size], className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
      >
        <defs>
          {/* Silver metallic gradient for W strokes */}
          <linearGradient id="silver-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Radial gradient for the floating dot */}
          <radialGradient id="neon-dot-gradient" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffb380" />
            <stop offset="30%" stopColor="#ff4da6" />
            <stop offset="75%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#4f46e5" />
          </radialGradient>

          {/* Soft neon glow filter */}
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.8" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- Background / Glow Aura --- */}
        <motion.circle
          cx="50"
          cy="60"
          r="25"
          fill="rgba(139, 92, 246, 0.08)"
          filter="url(#logo-glow)"
          animate={isLoading ? {
            scale: [0.9, 1.1, 0.9],
            opacity: [0.5, 0.8, 0.5]
          } : {
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.7, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* --- Floating Gradient Circle (Dot) --- */}
        <motion.circle
          cx="50"
          cy="24"
          r="8"
          fill="url(#neon-dot-gradient)"
          filter="url(#logo-glow)"
          initial={{ scale: 0, opacity: 0, y: -10 }}
          animate={isLoading ? {
            scale: [1, 1.25, 0.95, 1],
            y: [0, -6, 2, 0],
            filter: [
              "drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))",
              "drop-shadow(0 0 16px rgba(236, 72, 153, 0.95))",
              "drop-shadow(0 0 6px rgba(236, 72, 153, 0.6))",
              "drop-shadow(0 0 4px rgba(236, 72, 153, 0.5))"
            ]
          } : {
            scale: 1,
            opacity: 1,
            y: [0, -3, 0]
          }}
          whileHover={isLoading ? {} : {
            scale: 1.2,
            y: -5,
            filter: "drop-shadow(0 0 15px rgba(236, 72, 153, 0.95))"
          }}
          transition={isLoading ? {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          } : {
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            },
            scale: { duration: 0.3 },
            filter: { duration: 0.3 }
          }}
        />

        {/* --- Metallic "W" Strokes --- */}
        <g>
          {paths.map((p, idx) => (
            <motion.path
              key={p.id}
              d={p.d}
              stroke="url(#silver-metallic)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isLoading ? {
                pathLength: 1,
                opacity: 1,
                strokeDashoffset: [0, -40],
                filter: [
                  "drop-shadow(0 0 2px rgba(129, 140, 248, 0.2))",
                  "drop-shadow(0 0 8px rgba(129, 140, 248, 0.6))",
                  "drop-shadow(0 0 2px rgba(129, 140, 248, 0.2))"
                ]
              } : {
                pathLength: 1,
                opacity: 1,
                strokeDashoffset: 0
              }}
              whileHover={isLoading ? {} : {
                strokeWidth: 4.5,
                filter: "drop-shadow(0 0 10px rgba(129, 140, 248, 0.75))",
                transition: { duration: 0.2 }
              }}
              transition={isLoading ? {
                pathLength: { duration: 0.8, delay: idx * 0.1 },
                opacity: { duration: 0.8, delay: idx * 0.1 },
                strokeDashoffset: {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "linear"
                },
                filter: {
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              } : {
                pathLength: { duration: 1.2, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.8, delay: idx * 0.12 }
              }}
              style={isLoading ? {
                strokeDasharray: "15, 10"
              } : {}}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default AnimatedLogo;
