"use client";

import React from "react";
import { createPortal } from "react-dom";
import { ProgressBar } from "@/components/ui/progress-bar";

interface PdfRenderOverlayProps {
  visible: boolean;
  progress?: number; // 0-100
  stage?: string;
  title?: string;
}

/**
 * Full-viewport blur overlay shown while the PDF pre-renders before opening preview dialog.
 * Features a continuous frame-interpolated progress engine and itinerary filename label.
 */
export function PdfRenderOverlay({
  visible,
  progress = 0,
  stage = "Preparing PDF…",
  title,
}: PdfRenderOverlayProps) {
  const [mounted, setMounted] = React.useState(false);
  const [smoothProgress, setSmoothProgress] = React.useState(0);

  const pdfFileName = React.useMemo(() => {
    if (!title) return "itinerary.pdf";
    const lower = title.toLowerCase().trim();
    if (lower.endsWith(".pdf")) return lower;
    const clean = lower.replace(/[\/\\]+/g, "-").replace(/\s+/g, "_");
    return `${clean}.pdf`;
  }, [title]);

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

  // Continuous smooth ticker loop
  React.useEffect(() => {
    if (!visible) {
      setSmoothProgress(0);
      return;
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      setSmoothProgress((prev) => {
        const target = Math.max(prev, Math.min(100, progress));

        if (target >= 100) {
          const next = prev + (100 - prev) * Math.min(1, delta * 14);
          return next >= 99.5 ? 100 : next;
        }

        if (prev < target) {
          const diff = target - prev;
          const speed = Math.max(12, diff * 4);
          const next = prev + speed * delta;
          return Math.min(target, next);
        } else {
          if (prev < 98) {
            const trickleSpeed = 8;
            return Math.min(98, prev + trickleSpeed * delta);
          }
          return prev;
        }
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible, progress]);

  if (!visible || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blurred background veil */}
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity duration-300"
        style={{ zIndex: 1 }}
      />

      {/* Radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(69, 104, 255, 0.15) 0%, transparent 70%)",
          zIndex: 2,
        }}
      />

      {/* Main modal container with continuous ProgressBar loading state */}
      <div
        className="relative w-full max-w-md p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl transition-all"
        style={{ zIndex: 10 }}
      >
        <ProgressBar
          value={Math.round(smoothProgress)}
          max={100}
          label={pdfFileName}
          pendingLabel={stage || "Generating preview…"}
          completeLabel="Upload complete"
          className="my-1"
        />
      </div>
    </div>,
    document.body
  );
}

export default PdfRenderOverlay;
