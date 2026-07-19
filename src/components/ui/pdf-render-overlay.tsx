"use client";

import React from "react";
import { createPortal } from "react-dom";

interface PdfRenderOverlayProps {
  visible: boolean;
  progress?: number; // 0-100
  stage?: string;
}

/**
 * Full-viewport blur overlay shown while the PDF pre-renders.
 * Uses an SVG arc + Tailwind animate-spin — zero custom @keyframes needed
 * for the spinner. The card is IMMEDIATELY visible (no opacity-0 start).
 */
export function PdfRenderOverlay({
  visible,
  progress = 0,
  stage = "Preparing PDF\u2026",
}: PdfRenderOverlayProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (visible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [visible]);

  if (!visible || !mounted) return null;

  const pct = Math.max(2, Math.min(100, progress));

  // Arc geometry: r=26, circumference≈163.4, show 75% of arc
  const R = 26;
  const C = 2 * Math.PI * R;
  const arc = C * 0.75;
  const gap = C - arc;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Minimal shimmer for stage label — tiny keyframe, nothing that hides the card */}
      <style>{`
        @keyframes _pdfStageShimmer {
          0%,100% { opacity:.5 } 50% { opacity:1 }
        }
        ._pdfStage { animation: _pdfStageShimmer 2s ease-in-out infinite; color: rgb(161,161,170); }
      `}</style>

      {/* Blurred veil */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(9,9,11,0.72)", backdropFilter: "blur(6px)", zIndex: 1 }}
      />

      {/* Soft radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
          zIndex: 2,
        }}
      />

      {/* ── Card — always visible, no entry animation that could start at opacity:0 ── */}
      <div
        className="relative flex flex-col items-center"
        style={{
          gap: 28,
          width: 280,
          zIndex: 10,
        }}
      >
        {/* ── SVG Ring Spinner ── */}
        {/* Static track + spinning arc rendered together, entire SVG rotates */}
        <div className="relative" style={{ width: 72, height: 72 }}>
          {/* Static dim track (non-rotating) */}
          <svg
            className="absolute inset-0"
            viewBox="0 0 64 64"
            style={{ width: 72, height: 72 }}
          >
            <circle cx="32" cy="32" r={R} fill="none" stroke="rgb(39,39,42)" strokeWidth="2.5" />
          </svg>

          {/* Spinning gradient arc */}
          <svg
            className="absolute inset-0 animate-spin"
            viewBox="0 0 64 64"
            style={{
              width: 72,
              height: 72,
              animationDuration: "1.1s",
              animationTimingFunction: "linear",
            }}
          >
            <defs>
              <linearGradient id="pdfArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="url(#pdfArcGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${arc.toFixed(1)} ${gap.toFixed(1)}`}
            />
          </svg>

          {/* Center glow dot */}
          <div
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "linear-gradient(135deg, #818cf8, #a78bfa)",
              boxShadow: "0 0 12px 3px rgba(139,92,246,0.65)",
            }}
          />
        </div>

        {/* ── Progress bar + labels ── */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Track */}
          <div
            style={{
              height: 2,
              width: "100%",
              borderRadius: 9999,
              overflow: "hidden",
              background: "rgb(39,39,42)",
            }}
          >
            {/* Fill */}
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: 9999,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
                transition: "width 0.45s ease-out",
                boxShadow: "0 0 8px rgba(99,102,241,0.55)",
              }}
            />
          </div>

          {/* Stage label + percentage */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="_pdfStage" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.04em" }}>
              {stage}
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                fontVariantNumeric: "tabular-nums",
                color: "rgb(82,82,91)",
              }}
            >
              {Math.round(pct)}%
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
