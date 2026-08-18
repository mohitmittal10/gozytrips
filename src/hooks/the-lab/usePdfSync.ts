import { useEffect, useRef } from "react";
import { useLabStore } from "@/store/the-lab/labStore";
import type { PdfPreviewEditorRef } from "@/components/pdf-preview-editor";

interface UsePdfSyncOptions {
  previewRef: React.RefObject<PdfPreviewEditorRef>;
  isPreviewOpen: boolean;
  debounceMs?: number;
}

/**
 * Custom hook driving PDF regeneration based on central store dirty state.
 *
 * Requirements & Logic:
 * 1. Single Subscription: Listens directly to `isDirty` and `currentHash` in `useLabStore`.
 * 2. Debouncing: Defers regeneration by `debounceMs` (default 400ms) so rapid keystrokes/drag edits
 *    do not fire multiple CPU-heavy html2canvas renders.
 * 3. Exact State Matching (Undo support): If a user edits and then undoes back to the last committed
 *    state, structural hashing evaluates `currentHash === lastCommittedHash` and sets `isDirty = false`,
 *    canceling any pending regeneration.
 * 4. Sync Reset: Once `preRender()` succeeds, calls `markPdfSynced()` to save `lastCommittedHash` and reset `isDirty = false`.
 */
export function usePdfSync({
  previewRef,
  isPreviewOpen,
  debounceMs = 400,
}: UsePdfSyncOptions) {
  const isDirty = useLabStore((state) => state.isDirty);
  const currentHash = useLabStore((state) => state.currentHash);
  const lastCommittedHash = useLabStore((state) => state.lastCommittedHash);
  const markPdfSynced = useLabStore((state) => state.markPdfSynced);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRenderingRef = useRef(false);

  useEffect(() => {
    // If state is not dirty (or user undid back to last committed state), clear pending timer
    if (!isDirty || currentHash === lastCommittedHash) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    // Clear any previous debounce timer on new mutation
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Schedule debounced PDF background pre-render
    debounceTimerRef.current = setTimeout(async () => {
      // Skip expensive html2canvas render while the preview dialog is closed.
      // Dirty state is already tracked — preRender() will fire on-demand when
      // the user opens the preview or clicks Download.
      if (!isPreviewOpen) return;

      // Avoid overlapping render passes
      if (isRenderingRef.current) return;

      const editor = previewRef.current;
      if (!editor) return;

      try {
        isRenderingRef.current = true;
        // Always trigger preRender on state changes so cache stays up to date
        await editor.preRender();
        // Mark store as synced to update lastCommittedHash and reset isDirty = false
        markPdfSynced();
      } catch (err) {
        console.error("[usePdfSync] PDF regeneration failed:", err);
      } finally {
        isRenderingRef.current = false;
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isDirty, currentHash, lastCommittedHash, markPdfSynced, previewRef, isPreviewOpen, debounceMs]);
}
