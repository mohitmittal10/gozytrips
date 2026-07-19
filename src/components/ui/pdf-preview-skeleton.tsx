"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PdfPreviewSkeletonProps {
  /** 0–100 progress for the top bar */
  progress?: number;
  /** Current stage label shown below the document */
  stage?: string;
  className?: string;
}

/**
 * Lightweight CSS-only loading skeleton for the PDF preview area.
 * No framer-motion, no heavy SVG path animations.
 * Color palette matches the dialog: zinc-900 bg, indigo-500/violet-500 accents.
 */
export function PdfPreviewSkeleton({
  progress = 0,
  stage = "Preparing your PDF\u2026",
  className,
}: PdfPreviewSkeletonProps) {
  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 8px 1px rgba(99,102,241,0.35); }
          50%       { box-shadow: 0 0 16px 3px rgba(139,92,246,0.5); }
        }
        @keyframes stageShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .pdf-skel-bar {
          position: relative;
          overflow: hidden;
          border-radius: 3px;
          background: rgb(39 39 42 / 0.6);
        }
        .pdf-skel-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(99,102,241,0.12) 40%,
            rgba(139,92,246,0.18) 50%,
            rgba(99,102,241,0.12) 60%,
            transparent 100%
          );
          animation: skeletonShimmer 2s ease-in-out infinite;
        }
        .pdf-skel-stage {
          background-image: linear-gradient(
            90deg,
            rgb(82 82 91) 0%,
            rgb(82 82 91) 35%,
            rgb(139 92 246 / 0.9) 50%,
            rgb(82 82 91) 65%,
            rgb(82 82 91) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: stageShimmer 2.4s ease-in-out infinite;
        }
      `}</style>

      <div className={cn("flex flex-col items-center justify-center gap-6 w-full h-full select-none", className)}>

        {/* Progress bar — thin stripe above the document */}
        <div className="w-[280px] sm:w-[340px] flex flex-col gap-2">
          <div className="h-[2px] w-full rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(4, progress)}%`,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
                animation: "progressGlow 2s ease-in-out infinite",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="pdf-skel-stage text-[11px] font-medium tracking-wide">{stage}</span>
            {progress > 0 && (
              <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{Math.round(progress)}%</span>
            )}
          </div>
        </div>

        {/* A4 document skeleton */}
        <div
          className="relative rounded-lg border border-zinc-800/50 bg-zinc-900/40 overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)]"
          style={{ width: 240, height: 340 }}
        >
          {/* Subtle grid paper pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Header block */}
          <div className="px-5 pt-5 pb-4 border-b border-zinc-800/40 flex items-center gap-3">
            <div className="pdf-skel-bar w-8 h-8 rounded-md flex-shrink-0" style={{ animation: "skeletonPulse 2s ease-in-out infinite" }} />
            <div className="flex-1 space-y-1.5">
              <div className="pdf-skel-bar h-2.5 w-24" />
              <div className="pdf-skel-bar h-1.5 w-16" />
            </div>
          </div>

          {/* Body rows */}
          <div className="px-5 py-4 space-y-3">
            {/* Title row */}
            <div className="pdf-skel-bar h-3 w-3/4" />
            {/* Subtitle */}
            <div className="pdf-skel-bar h-2 w-1/2" />

            {/* Divider */}
            <div className="h-px w-full bg-zinc-800/40 my-1" />

            {/* Content rows */}
            {[0.9, 0.7, 0.8, 0.65, 0.75].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="pdf-skel-bar flex-shrink-0 rounded-full"
                  style={{ width: 6, height: 6, animation: "skeletonPulse 2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
                />
                <div
                  className="pdf-skel-bar h-2"
                  style={{ width: `${w * 100}%`, animationDelay: `${i * 0.1}s` }}
                />
              </div>
            ))}

            {/* Divider */}
            <div className="h-px w-full bg-zinc-800/40 my-1" />

            {/* Second block */}
            {[0.85, 0.6, 0.7].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="pdf-skel-bar flex-shrink-0 rounded-full"
                  style={{ width: 6, height: 6, animation: "skeletonPulse 2s ease-in-out infinite", animationDelay: `${(i + 5) * 0.15}s` }}
                />
                <div
                  className="pdf-skel-bar h-2"
                  style={{ width: `${w * 100}%`, animationDelay: `${(i + 5) * 0.1}s` }}
                />
              </div>
            ))}
          </div>

          {/* Footer strip */}
          <div className="absolute bottom-0 inset-x-0 px-5 py-3 border-t border-zinc-800/40 flex items-center gap-2">
            <div className="pdf-skel-bar h-1.5 w-12" />
            <div className="flex-1" />
            <div className="pdf-skel-bar h-1.5 w-8" />
          </div>

          {/* Indigo corner accent */}
          <div
            className="absolute top-0 right-0 w-8 h-8 opacity-20"
            style={{
              background: "linear-gradient(135deg, transparent 50%, rgba(99,102,241,0.6) 50%)",
            }}
          />
        </div>
      </div>
    </>
  );
}
