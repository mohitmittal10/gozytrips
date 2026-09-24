"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Eye,
  ZoomIn,
  X,
  RotateCw,
  Zap,
  Minus,
  Plus,
} from "lucide-react";
import { PdfTemplate, type PdfTheme, type PdfTemplateProps } from "@/components/pdf-template";
import { getMergedPdfThemeOptions } from "@/components/pdf/theme-config";
import { useToast } from "@/hooks/use-toast";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

// All themes — kept for the theme selector UI
const ALL_THEMES: PdfTheme[] = [
  "classic",
  "editorial",
  "minimalist",
  "dark",
  "corporate",
  "desert",
  "tropical",
  "luxury",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString();
}

function getTemplatePropsHash(props: any, overrides: any): string {
  const payload = {
    itinerary: props?.itinerary ?? null,
    title: props?.title ?? "",
    clientName: props?.clientName ?? "",
    hotels: props?.hotels ?? [],
    flights: props?.flights ?? [],
    cabs: props?.cabs ?? [],
    buses: props?.buses ?? [],
    pricing: props?.pricing ?? null,
    baseCost: props?.baseCost ?? 0,
    showTimestamps: props?.showTimestamps ?? true,
    inclusions: props?.inclusions ?? "",
    exclusions: props?.exclusions ?? "",
    termsAndConditions: props?.termsAndConditions ?? "",
    cancellationPolicy: props?.cancellationPolicy ?? "",
    paymentMethods: props?.paymentMethods ?? "",
    agencySettings: props?.agencySettings ?? null,
    userProfile: props?.userProfile ?? null,
  };
  return hashCode(JSON.stringify(payload));
}

// ─── Public ref API ─────────────────────────────────────────────────────────

export interface PdfPreviewEditorRef {
  /**
   * Pre-render the active theme outside the dialog.
   * Call this before opening the dialog so it shows the canvas instantly.
   */
  preRender: (onProgress?: (progress: number, stage: string) => void) => Promise<void>;
  /**
   * Returns true if the current theme + content is already cached.
   * If true, open the dialog immediately — no overlay needed.
   */
  hasValidCache: () => boolean;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PdfPreviewEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templateProps: Omit<PdfTemplateProps, "theme">;
  initialTheme?: PdfTheme;
  filename?: string;
  itineraryId?: string;
  pdfOverrides?: any;
  onPdfOverridesChange?: (overrides: any) => void;
  theme?: PdfTheme;
  onThemeChange?: (theme: PdfTheme) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const PdfPreviewEditor = forwardRef<PdfPreviewEditorRef, PdfPreviewEditorProps>(
  function PdfPreviewEditor(
    {
      isOpen,
      onOpenChange,
      templateProps,
      initialTheme = "classic",
      filename = "Itinerary.pdf",
      itineraryId,
      pdfOverrides,
      onPdfOverridesChange,
      theme: propTheme,
      onThemeChange,
    },
    ref
  ) {
    const { toast } = useToast();
    const { userPreferences, agencySettings } = useAuth();
    const { options: themeOptions } = useReferenceOptions("pdf_theme");
    const pdfThemeOptions = getMergedPdfThemeOptions(themeOptions);
    const supabase = createClient();

    // ─── Theme ──────────────────────────────────────────────────────────────
    const [localTheme, setLocalTheme] = useState<PdfTheme>(initialTheme);
    const theme = propTheme !== undefined ? propTheme : localTheme;
    const setTheme = useCallback(
      (t: PdfTheme) => {
        setLocalTheme(t);
        if (onThemeChange) onThemeChange(t);
      },
      [onThemeChange]
    );

    // ─── Core display state ──────────────────────────────────────────────────
    const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(70);

    // ─── Loading / operation state ────────────────────────────────────────────
    /** true when rendering happens INSIDE the dialog (theme switch / apply) */
    const [isRendering, setIsRendering] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [loadingStage, setLoadingStage] = useState("");

    // ─── AI content (persists across open/close) ─────────────────────────────
    const [daySummaries, setDaySummaries] = useState<string[]>([]);
    const [aboutPlace, setAboutPlace] = useState<any>(null);

    /**
     * Controls whether the off-screen PdfTemplate container is in the DOM.
     * Mounted only during an active render — never permanently.
     */
    const [isContainerMounted, setIsContainerMounted] = useState(false);

    // ─── Refs ────────────────────────────────────────────────────────────────
    const hiddenContainerRef = useRef<HTMLDivElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    /** Per-theme canvas cache — persists across open/close cycles */
    const themePagesCache = useRef<Partial<Record<PdfTheme, HTMLCanvasElement[]>>>({});

    const lastRenderedTheme = useRef<PdfTheme | null>(null);
    const lastRenderedPropsHash = useRef<string | null>(null);

    // Stable refs for useImperativeHandle (avoids stale closure issues)
    const themeRef = useRef(theme);
    const templatePropsRef = useRef(templateProps);
    const pdfOverridesRef = useRef(pdfOverrides);
    useEffect(() => { themeRef.current = theme; }, [theme]);
    useEffect(() => { templatePropsRef.current = templateProps; }, [templateProps]);
    useEffect(() => { pdfOverridesRef.current = pdfOverrides; }, [pdfOverrides]);

    // ─── Unlock body scroll on close ────────────────────────────────────────
    useEffect(() => {
      if (!isOpen) {
        document.body.style.overflow = "";
      }
    }, [isOpen]);

    // ─── Build overrides object ──────────────────────────────────────────────
    const buildOverrides = useCallback((): any | undefined => {
      const hasSummaries = daySummaries.length > 0;
      if (!hasSummaries && !aboutPlace) return undefined;
      return {
        ...(hasSummaries && { daySummaries, daySummariesHash: hashCode(JSON.stringify(daySummaries)) }),
        ...(aboutPlace && { aboutPlace }),
      };
    }, [daySummaries, aboutPlace]);

    // ─── Core html2canvas render ─────────────────────────────────────────────
    /**
     * Snapshots the hidden container via html2canvas.
     * The container MUST already be mounted (isContainerMounted = true)
     * and React must have committed before this is called.
     */
    const doRender = useCallback(
      async (overrides?: any): Promise<HTMLCanvasElement[] | null> => {
        try {
          // Extra yield: let the browser finish painting after React commit
          await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 16)));
          const container = hiddenContainerRef.current;
          if (!container || !document.body.contains(container)) {
            console.warn("[PdfPreviewEditor] Hidden container not in DOM");
            return null;
          }
          const { renderPdfPages } = await import("@/lib/pdf-page-renderer");
          const result = await renderPdfPages(container, { scale: 2 }, overrides);
          return result?.pages ?? null;
        } catch (err) {
          console.error("[PdfPreviewEditor] Render failed:", err);
          return null;
        }
      },
      []
    );

    // ─── Full pipeline: data load → AI summaries → html2canvas ─────────────
    /**
     * Runs the complete render pipeline for a given theme.
     * Used by preRender (before dialog) and handleRefresh (inside dialog).
     */
    const runPipeline = useCallback(
      async (
        targetTheme: PdfTheme,
        onProgress?: (p: number, stage: string) => void
      ) => {
        onProgress?.(10, "Preparing layout\u2026");

        // 1. Resolve PDF overrides
        let resolvedOverrides: any = pdfOverrides ?? {};
        let loadedSummaries: string[] = resolvedOverrides.daySummaries ?? [];
        let loadedPlace: any = resolvedOverrides.aboutPlace ?? null;

        // If overrides not provided via props, fetch from Supabase
        if (!pdfOverrides && itineraryId) {
          onProgress?.(15, "Loading saved settings\u2026");
          try {
            const { data } = await supabase
              .from("itineraries")
              .select("selected_theme,pdf_overrides")
              .eq("id", itineraryId)
              .single();
            if (data) {
              if (data.selected_theme) setTheme(data.selected_theme as PdfTheme);
              resolvedOverrides = (data.pdf_overrides as any) ?? {};
              loadedSummaries = resolvedOverrides.daySummaries ?? [];
              loadedPlace = resolvedOverrides.aboutPlace ?? null;
            }
          } catch (err) {
            console.warn("[PdfPreviewEditor] Failed to fetch saved settings:", err);
          }
        } else if (userPreferences?.default_pdf_theme && !propTheme) {
          setTheme(userPreferences.default_pdf_theme as PdfTheme);
        }

        // 2. Load summaries and place details from saved overrides
        setDaySummaries(loadedSummaries);
        setAboutPlace(loadedPlace);

        onProgress?.(55, "Rendering PDF layout\u2026");

        // 4. Mount the hidden container
        setIsContainerMounted(true);

        // 5. Wait for React to commit — container + template must be in DOM and painted
        await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 80)));

        onProgress?.(75, "Capturing pages\u2026");

        // 6. html2canvas
        const result = await doRender(
          Object.keys(resolvedOverrides).length > 0 ? resolvedOverrides : undefined
        );

        if (result) {
          themePagesCache.current[targetTheme] = result;
          setPages(result);
          setCurrentPage(0);

          lastRenderedTheme.current = targetTheme;
          lastRenderedPropsHash.current = getTemplatePropsHash(templateProps, resolvedOverrides);
        }

        // 7. Unmount container — clean up DOM
        setIsContainerMounted(false);

        onProgress?.(100, "Ready");
      },
      [
        templateProps,
        pdfOverrides,
        onPdfOverridesChange,
        itineraryId,
        doRender,
        userPreferences,
        propTheme,
        supabase,
        setTheme,
      ]
    );

    // Keep a stable ref so imperative handle doesn't hold stale closures
    const runPipelineRef = useRef(runPipeline);
    useEffect(() => {
      runPipelineRef.current = runPipeline;
    }, [runPipeline]);

    const hasValidCache = useCallback(() => {
      const t = themeRef.current;
      const currentPropsHash = getTemplatePropsHash(templatePropsRef.current, pdfOverridesRef.current);

      return (
        !!themePagesCache.current[t] &&
        t === lastRenderedTheme.current &&
        currentPropsHash === lastRenderedPropsHash.current
      );
    }, []);

    useImperativeHandle(ref, () => ({
      preRender: async (onProgress) => {
        if (hasValidCache()) {
          onProgress?.(100, "Ready (cached)");
          return;
        }
        const currentPropsHash = getTemplatePropsHash(templatePropsRef.current, pdfOverridesRef.current);
        if (currentPropsHash !== lastRenderedPropsHash.current) {
          themePagesCache.current = {};
        }
        await runPipelineRef.current(themeRef.current, onProgress);
      },
      hasValidCache,
    }));

    // ─── Zoom to fit ─────────────────────────────────────────────────────────
    const handleZoomToFit = useCallback(() => {
      const scrollEl = previewContainerRef.current;
      const currentCanvasRef = pages[currentPage];
      if (!scrollEl || !currentCanvasRef || currentCanvasRef.width === 0) return;
      const displayWidth = currentCanvasRef.width / 2;
      const padding = window.innerWidth < 640 ? 24 : 48;
      const availableWidth = scrollEl.clientWidth - padding;
      const fitZoom = Math.floor((availableWidth / displayWidth) * 100);
      setZoom(Math.max(20, Math.min(fitZoom, 150)));
    }, [pages, currentPage]);

    useEffect(() => {
      const currentCanvasRef = pages[currentPage];
      if (!currentCanvasRef || currentCanvasRef.width === 0) return;
      handleZoomToFit();
      window.addEventListener("resize", handleZoomToFit);
      return () => window.removeEventListener("resize", handleZoomToFit);
    }, [pages, currentPage, handleZoomToFit]);

    useEffect(() => {
      const scrollEl = previewContainerRef.current;
      if (!scrollEl) return;
      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
          setZoom((prev) => {
            const delta = e.deltaY < 0 ? 5 : -5;
            return Math.max(20, Math.min(150, prev + delta));
          });
        }
      };
      scrollEl.addEventListener("wheel", handleWheel, { passive: false });
      return () => scrollEl.removeEventListener("wheel", handleWheel);
    }, [isOpen]);

    // ─── Theme switch inside dialog ──────────────────────────────────────────
    const handleThemeChange = async (newTheme: PdfTheme) => {
      if (isRendering) return;
      setTheme(newTheme);

      const currentPropsHash = getTemplatePropsHash(templateProps, buildOverrides());
      if (currentPropsHash !== lastRenderedPropsHash.current) {
        themePagesCache.current = {};
      }

      // Cache hit — instant swap
      if (themePagesCache.current[newTheme]?.length && currentPropsHash === lastRenderedPropsHash.current) {
        setPages(themePagesCache.current[newTheme]!);
        setCurrentPage(0);

        // Update active theme ref, keep other hashes as they remain identical
        lastRenderedTheme.current = newTheme;

        if (itineraryId) {
          supabase.from("itineraries").update({ selected_theme: newTheme }).eq("id", itineraryId).then(() => {});
        }
        return;
      }

      // Cache miss — render inline with small spinner (no full overlay)
      setIsRendering(true);
      setLoadingStage(`Loading ${newTheme} theme\u2026`);
      setIsContainerMounted(true);

      // Wait for React to commit theme state + container mount
      await new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 80)));

      const result = await doRender(buildOverrides());
      if (result) {
        themePagesCache.current[newTheme] = result;
        setPages(result);
        setCurrentPage(0);

        lastRenderedTheme.current = newTheme;
        lastRenderedPropsHash.current = currentPropsHash;
      }

      setIsContainerMounted(false);
      setIsRendering(false);
      setLoadingStage("");

      if (itineraryId) {
        try {
          await supabase.from("itineraries").update({ selected_theme: newTheme }).eq("id", itineraryId);
        } catch {}
      }
    };

    // ─── Refresh ─────────────────────────────────────────────────────────────
    const handleRefresh = useCallback(async () => {
      themePagesCache.current = {};
      lastRenderedTheme.current = null;
      lastRenderedPropsHash.current = null;
      setPages([]);
      setIsRendering(true);
      setLoadingStage("Refreshing\u2026");
      await runPipelineRef.current(theme, (_, s) => setLoadingStage(s));
      setIsRendering(false);
      setLoadingStage("");
    }, [theme]);

    // ─── Download ─────────────────────────────────────────────────────────────
    const handleDownload = useCallback(async () => {
      if (pages.length === 0) return;
      setIsDownloading(true);
      try {
        const { downloadPdfFromPages } = await import("@/lib/pdf-page-renderer");
        downloadPdfFromPages(pages, filename, 0.95);
        toast({ title: "Download Complete!", description: "Your PDF has been saved." });
      } catch (err) {
        console.error("PDF download failed:", err);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "Could not save the PDF file.",
        });
      } finally {
        setIsDownloading(false);
      }
    }, [pages, filename, toast]);

    // ─── Keyboard navigation ─────────────────────────────────────────────────
    const goToPage = (idx: number) => {
      if (idx >= 0 && idx < pages.length) setCurrentPage(idx);
    };

    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") goToPage(currentPage - 1);
        if (e.key === "ArrowRight") goToPage(currentPage + 1);
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    });

    // ─── Derived values ───────────────────────────────────────────────────────
    const currentCanvas = pages[currentPage];
    const cachedThemeCount = ALL_THEMES.filter((t) => !!themePagesCache.current[t]).length;
    const allThemesCached = cachedThemeCount === ALL_THEMES.length;

    // ─── JSX ──────────────────────────────────────────────────────────────────
    return (
      <>
        {/* ── Off-screen container: mounted ONLY during active rendering ──────
            Using position:fixed + left:-9999px so html2canvas can capture it.
            NOT visible:hidden or display:none — those cause blank captures. */}
        {isContainerMounted && (
          <div
            ref={hiddenContainerRef}
            style={{
              position: "fixed",
              top: 0,
              left: "-9999px",
              width: "794px",
              pointerEvents: "none",
              zIndex: -1,
            }}
            aria-hidden="true"
          >
            <PdfTemplate
              {...templateProps}
              theme={theme}
              agencySettings={agencySettings}
              daySummaries={daySummaries}
              aboutPlace={aboutPlace}
              isHtmlEditor={false}
            />
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[96vw] w-full max-h-[96vh] md:max-w-[92vw] md:max-h-[92vh] h-full p-0 flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl shadow-black/90">
            <DialogTitle className="sr-only">PDF Preview & Editor</DialogTitle>

            {/* ─── Toolbar ──────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl flex-shrink-0">
              {/* Row 1 / Left: Title & Theme Select */}
              <div className="flex items-center justify-between md:justify-start gap-4 pr-8 md:pr-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    PDF Preview
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Select value={theme} onValueChange={(v) => handleThemeChange(v as PdfTheme)}>
                    <SelectTrigger className="w-[125px] h-8 bg-zinc-900/65 border-zinc-800 hover:border-zinc-700 text-zinc-100 text-xs transition-all rounded-lg focus:ring-1 focus:ring-indigo-500/50 shadow-inner">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {pdfThemeOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="hover:bg-zinc-800 focus:bg-zinc-800 text-xs cursor-pointer"
                        >
                          {opt.label}
                          {themePagesCache.current[opt.value as PdfTheme] && (
                            <span className="ml-1.5 text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">●</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {allThemesCached && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-wide whitespace-nowrap">
                      <Zap className="w-2.5 h-2.5" />
                      Instant
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2 / Right: Zoom, Refresh, Download */}
              <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap md:flex-nowrap">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-0.5 text-zinc-300">
                  <button
                    onClick={() => setZoom((z) => Math.max(20, z - 10))}
                    className="hover:text-white transition-colors p-1 hover:bg-zinc-800/50 rounded-md cursor-pointer"
                    title="Zoom Out"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="hidden lg:flex items-center">
                    <Slider
                      value={[zoom]}
                      onValueChange={([v]) => setZoom(v)}
                      min={20}
                      max={150}
                      step={5}
                      className="w-[70px] mx-1 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => setZoom((z) => Math.min(150, z + 10))}
                    className="hover:text-white transition-colors p-1 hover:bg-zinc-800/50 rounded-md cursor-pointer"
                    title="Zoom In"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-mono font-medium w-[34px] text-center tabular-nums">
                    {zoom}%
                  </span>

                  <div className="h-3.5 w-px bg-zinc-800 mx-0.5" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomToFit}
                    disabled={!currentCanvas || currentCanvas.width === 0 || isRendering}
                    className="h-6 text-[10px] text-slate-600 dark:text-zinc-400 hover:text-white hover:bg-zinc-800/50 gap-1 px-1.5 rounded-md"
                    title="Fit to Screen"
                  >
                    <ZoomIn className="w-3 h-3" />
                    <span className="hidden min-[480px]:inline">Fit</span>
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isRendering || isDownloading}
                    className="h-8 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs rounded-lg transition-all font-medium gap-1.5 flex items-center justify-center"
                    onClick={handleRefresh}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isRendering ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </Button>

                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading || pages.length === 0}
                    className="h-8 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 border-0 text-white font-medium text-xs px-3 rounded-lg shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all gap-1.5 flex items-center justify-center"
                  >
                    {isDownloading ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Download PDF</span>
                    <span className="inline sm:hidden">Download</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* ─── Main Content ────────────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* ── Inline rendering spinner (theme switch / layout apply) ── */}
              {isRendering && (
                <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm bg-transparent">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <span className="text-xs text-slate-600 dark:text-zinc-400 tracking-wide font-medium">
                      {loadingStage || "Rendering\u2026"}
                    </span>
                  </div>
                </div>
              )}

              {/* Preview Area */}
              <div
                ref={previewContainerRef}
                className={`flex-1 flex items-start justify-center p-4 md:p-8 relative selection:bg-indigo-500/30 ${
                  isRendering ? "overflow-hidden" : "overflow-auto"
                }`}
                style={{
                  backgroundColor: "rgb(9, 9, 11)",
                  backgroundImage: `
                    radial-gradient(ellipse at top, rgba(39, 39, 42, 0.15), rgba(9, 9, 11, 0.95), rgb(0, 0, 0)),
                    linear-gradient(rgba(255, 255, 255, 0.007) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px)
                  `,
                  backgroundSize: "100% 100%, 24px 24px, 24px 24px",
                }}
              >

                {currentCanvas ? (
                  <div
                    className="shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9),_0_0_1px_rgba(255,255,255,0.15)] border border-zinc-800/40 rounded-lg overflow-hidden bg-white hover:border-zinc-700/50 transition-all duration-300"
                    style={{
                      width: (currentCanvas.width / 2) * (zoom / 100),
                      height: (currentCanvas.height / 2) * (zoom / 100),
                    }}
                  >
                    <canvas
                      ref={(canvasEl) => {
                        if (!canvasEl || !currentCanvas) return;
                        if (currentCanvas.width === 0 || currentCanvas.height === 0) return;
                        canvasEl.width = currentCanvas.width;
                        canvasEl.height = currentCanvas.height;
                        const ctx = canvasEl.getContext("2d");
                        if (ctx) {
                          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                          ctx.drawImage(currentCanvas, 0, 0);
                        }
                      }}
                      style={{ width: "100%", height: "100%", display: "block" }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-zinc-950/30 border border-zinc-900 text-zinc-500 my-auto">
                    <Eye className="w-8 h-8 opacity-45" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">No pages to preview</p>
                    <p className="text-[11px] text-zinc-500 max-w-[200px] text-center mt-1 leading-relaxed">
                      Select an itinerary or theme to generate the preview.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Thumbnail Strip ─────────────────────────────────────────── */}
            {pages.length > 1 && (
              <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950/60 backdrop-blur-xl px-4 py-3.5">
                <div className="flex gap-3 overflow-x-auto justify-center py-0.5 scrollbar-thin scrollbar-thumb-zinc-800">
                  {pages.map((page, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`relative flex-shrink-0 rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                        i === currentPage
                          ? "border-indigo-500 shadow-lg shadow-indigo-500/30 scale-105"
                          : "border-zinc-800 hover:border-zinc-700 hover:scale-102"
                      }`}
                      style={{ width: 56, height: 72 }}
                      title={`Page ${i + 1}`}
                    >
                      <canvas
                        ref={(canvasEl) => {
                          if (!canvasEl) return;
                          canvasEl.width = page.width;
                          canvasEl.height = page.height;
                          const ctx = canvasEl.getContext("2d");
                          if (ctx) ctx.drawImage(page, 0, 0);
                        }}
                        style={{ width: "100%", height: "100%", display: "block", borderRadius: "6px" }}
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8.5px] font-bold text-zinc-300 font-mono border border-zinc-800 leading-none">
                        {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }
);
