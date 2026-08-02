"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLabStore } from "@/store/the-lab/labStore";
import type { AutosaveStatus } from "@/store/the-lab/types";

export type { AutosaveStatus };

interface AutosaveIndicatorProps {
  status?: AutosaveStatus;
  isSaving?: boolean;
  isDirty?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const AutosaveIndicator = React.memo(function AutosaveIndicator({
  status,
  isSaving,
  isDirty,
  onRetry,
  className,
}: AutosaveIndicatorProps) {
  const storeAutosaveStatus = useLabStore((state) => state.autosaveStatus);

  // Determine effective state from props or Zustand store
  let currentStatus: AutosaveStatus = status || storeAutosaveStatus || "saved";
  if (isSaving) {
    currentStatus = "saving";
  } else if (isDirty && currentStatus === "saved") {
    currentStatus = "saving";
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-tight transition-all duration-300 select-none border backdrop-blur-xl shadow-sm",
        currentStatus === "saving" && "bg-white/[0.06] border-white/15 text-zinc-200 shadow-primary/5",
        currentStatus === "saved" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        currentStatus === "error" && "bg-rose-500/10 border-rose-500/20 text-rose-400",
        currentStatus === "idle" && "bg-white/5 border-white/10 text-zinc-400",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {currentStatus === "saving" && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
          <span className="font-semibold text-zinc-200">Saving changes...</span>
        </>
      )}

      {currentStatus === "saved" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-emerald-400">All changes saved</span>
        </>
      )}

      {currentStatus === "error" && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="font-semibold text-rose-300">Couldn&apos;t save</span>
          {onRetry && (
            <button
              onClick={onRetry}
              type="button"
              className="ml-1 hover:underline flex items-center gap-0.5 text-rose-300 font-bold"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Retry</span>
            </button>
          )}
        </>
      )}

      {currentStatus === "idle" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
});
