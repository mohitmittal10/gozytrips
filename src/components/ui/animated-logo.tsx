"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const AnimatedLogo = ({
  isLoading = false,
  size = "md",
  className,
}: AnimatedLogoProps) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-24 h-24",
  };

  // The "W" shape is formed by 4 line segments
  // Points for W: (0,0) -> (6,20) -> (12,10) -> (18,20) -> (24,0)
  // Segment 1: (0,0) to (6,20)
  // Segment 2: (6,20) to (12,10)
  // Segment 3: (12,10) to (18,20)
  // Segment 4: (18,20) to (24,0)

  const segments = [
    { id: "s1", x1: 2, y1: 4, x2: 7, y2: 20 },
    { id: "s2", x1: 7, y1: 20, x2: 12, y2: 10 },
    { id: "s3", x1: 12, y1: 10, x2: 17, y2: 20 },
    { id: "s4", x1: 17, y1: 20, x2: 22, y2: 4 },
  ];

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <AnimatePresence mode="wait">
          {!isLoading ? (
            <motion.g key="logo-static">
              {segments.map((s, i) => (
                <motion.line
                  key={s.id}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                />
              ))}
              {/* Add a subtle dot or accent to make it "Lab" like */}
              <motion.circle
                cx="12"
                cy="6"
                r="1.5"
                fill="url(#logo-gradient)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              />
            </motion.g>
          ) : (
            <motion.g key="logo-loading">
              {/* Transform segments into floating/pulsing dots or shorter lines */}
              {[0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={`loading-${i}`}
                  cx={12}
                  cy={12}
                  r="3"
                  fill="currentColor"
                  animate={{
                    x: [0, (i % 2 === 0 ? 8 : -8), 0],
                    y: [0, (i < 2 ? 8 : -8), 0],
                    scale: [1, 1.5, 0.8, 1],
                    opacity: [0.3, 1, 0.5, 0.3],
                    borderRadius: ["0%", "50%", "20%", "0%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5c33" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default AnimatedLogo;
