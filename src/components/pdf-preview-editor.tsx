"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
    Download,
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Eye,
    Settings,
    ZoomIn,
    X,
    RotateCw,
} from "lucide-react";
import UniqueLoading from "./ui/morph-loading";
import { PdfTemplate, type PdfTheme, type PdfTemplateProps } from "@/components/pdf-template";
import { useToast } from "@/hooks/use-toast";
import { useReferenceOptions } from "@/hooks/use-reference-options";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { SectionMeta, EditOverrides } from "@/lib/pdf-page-renderer";
import { generateDaySummaries } from "@/ai/flows/generate-day-summaries";

function hashCode(str: string) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0;
    }
    return hash.toString();
}

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

export function PdfPreviewEditor({
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
}: PdfPreviewEditorProps) {
    const { toast } = useToast();
    const { userPreferences, agencySettings } = useAuth();
    const { options: themeOptions } = useReferenceOptions("pdf_theme");
    const supabase = createClient();

    // ─── State ───
    const [localTheme, setLocalTheme] = useState<PdfTheme>(initialTheme);
    const theme = propTheme !== undefined ? propTheme : localTheme;
    const setTheme = useCallback((t: PdfTheme) => {
        setLocalTheme(t);
        if (onThemeChange) onThemeChange(t);
    }, [onThemeChange]);
    const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
    const [sections, setSections] = useState<SectionMeta[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(70);
    const [isRendering, setIsRendering] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [daySummaries, setDaySummaries] = useState<string[]>([]);
    const [savedDaySummaries, setSavedDaySummaries] = useState<string[]>([]);
    const [savedDaySummariesHash, setSavedDaySummariesHash] = useState<string | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    /** 0–100 loading progress; -1 means not loading */
    const [loadingProgress, setLoadingProgress] = useState(-1);
    const [loadingStage, setLoadingStage] = useState('');

    // Edit tools state
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [forcedBreaks, setForcedBreaks] = useState<Set<string>>(new Set());
    const [spacingOverrides, setSpacingOverrides] = useState<Record<string, number>>({});
    const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ─── Initialize from persisted data ───
    useEffect(() => {
        if (isOpen) {
            if (pdfOverrides !== undefined) {
                if (propTheme !== undefined) setTheme(propTheme);
                else if (userPreferences?.default_pdf_theme) setTheme(userPreferences.default_pdf_theme as PdfTheme);

                const overrides = pdfOverrides as any;
                if (overrides.forcedBreaksBefore) setForcedBreaks(new Set(overrides.forcedBreaksBefore));
                else setForcedBreaks(new Set());
                if (overrides.spacingOverrides) setSpacingOverrides(overrides.spacingOverrides);
                else setSpacingOverrides({});
                if (overrides.daySummaries) {
                    setSavedDaySummaries(overrides.daySummaries);
                    setDaySummaries(overrides.daySummaries);
                } else {
                    setSavedDaySummaries([]);
                    setDaySummaries([]);
                }
                if (overrides.daySummariesHash) setSavedDaySummariesHash(overrides.daySummariesHash);
                else setSavedDaySummariesHash(null);

                setIsDataLoaded(true);
                return;
            }

            if (itineraryId) {
                const fetchItineraryData = async () => {
                    const { data, error } = await supabase
                        .from('itineraries')
                        .select('selected_theme, pdf_overrides')
                        .eq('id', itineraryId)
                        .single();

                    if (!error && data) {
                        if (data.selected_theme) setTheme(data.selected_theme as PdfTheme);
                        if (data.pdf_overrides) {
                            const overrides = data.pdf_overrides as any;
                            if (overrides.forcedBreaksBefore) setForcedBreaks(new Set(overrides.forcedBreaksBefore));
                            if (overrides.spacingOverrides) setSpacingOverrides(overrides.spacingOverrides);
                            if (overrides.daySummaries) setSavedDaySummaries(overrides.daySummaries);
                            if (overrides.daySummariesHash) setSavedDaySummariesHash(overrides.daySummariesHash);
                        }
                    } else if (userPreferences?.default_pdf_theme) {
                        setTheme(userPreferences.default_pdf_theme as PdfTheme);
                    }
                    setIsDataLoaded(true);
                };
                fetchItineraryData();
            } else {
                if (userPreferences?.default_pdf_theme) {
                    setTheme(userPreferences.default_pdf_theme as PdfTheme);
                }
                setIsDataLoaded(true);
            }
        } else {
            // Reset state when closing
            setIsDataLoaded(false);
            // We intentionally do NOT reset savedDaySummaries and savedDaySummariesHash here.
            // This ensures the in-memory cache persists across open/close cycles, 
            // which is critical for "The Lab" since it doesn't have an itineraryId to save to the DB.
        }
    }, [isOpen, itineraryId, userPreferences, pdfOverrides, propTheme]);

    // Refs
    const hiddenContainerRef = useRef<HTMLDivElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // ─── Zoom to fit ───
    const handleZoomToFit = useCallback(() => {
        const scrollEl = previewContainerRef.current;
        const currentCanvasRef = pages[currentPage];
        if (!scrollEl || !currentCanvasRef || currentCanvasRef.width === 0) return;

        // Canvas is rendered at 2× scale; display width is canvas.width / 2
        const displayWidth = currentCanvasRef.width / 2;
        const padding = window.innerWidth < 640 ? 24 : 48; // smaller padding on mobile
        const availableWidth = scrollEl.clientWidth - padding;
        const fitZoom = Math.floor((availableWidth / displayWidth) * 100);
        setZoom(Math.max(20, Math.min(fitZoom, 150)));
    }, [pages, currentPage]);

    // ─── Auto-zoom to fit on load or page/resize change ───
    useEffect(() => {
        const currentCanvasRef = pages[currentPage];
        if (!currentCanvasRef || currentCanvasRef.width === 0) return;

        // Calculate and apply initial zoom to fit
        handleZoomToFit();

        const handleResize = () => {
            handleZoomToFit();
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [pages, currentPage, handleZoomToFit]);

    // ─── Ctrl + Wheel zoom support ───
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

    // ─── Build overrides object ───
    const buildOverrides = useCallback((): any | undefined => {
        const hasForcedBreaks = forcedBreaks.size > 0;
        const hasSpacing = Object.values(spacingOverrides).some((v) => v > 0);
        const hasSummaries = daySummaries.length > 0;

        if (!hasForcedBreaks && !hasSpacing && !hasSummaries) return undefined;

        return {
            ...(hasForcedBreaks && { forcedBreaksBefore: Array.from(forcedBreaks) }),
            ...(hasSpacing && { spacingOverrides }),
            ...(hasSummaries && { daySummaries, daySummariesHash: savedDaySummariesHash }),
        };
    }, [forcedBreaks, spacingOverrides, daySummaries, savedDaySummariesHash]);

    // ─── Render pages ───
    const renderPages = useCallback(async (summaries?: string[]) => {
        const container = hiddenContainerRef.current;
        if (!container) return;

        setIsRendering(true);
        setLoadingProgress(50);
        setLoadingStage('Rendering PDF layout…');

        try {
            // Container remains layout-active off-screen via JSX styling.
            // We wait 500ms to ensure the browser has fully calculated style & layout before capture.
            await new Promise((r) => setTimeout(r, 500));
            setLoadingProgress(70);

            const { renderPdfPages } = await import("@/lib/pdf-page-renderer");
            const overrides = buildOverrides();
            const result = await renderPdfPages(container, { scale: 2 }, overrides);

            setLoadingProgress(95);
            setLoadingStage('Finalising…');
            await new Promise((r) => setTimeout(r, 200));

            setPages(result.pages);
            setSections(result.sections);
            setCurrentPage(0);
            setHasUnappliedChanges(false);
            setLoadingProgress(100);
            await new Promise((r) => setTimeout(r, 350));
        } catch (err) {
            console.error("Failed to render PDF pages:", err);
            toast({
                variant: "destructive",
                title: "Render Failed",
                description: "Could not generate the PDF preview.",
            });
        } finally {
            setIsRendering(false);
            setLoadingProgress(-1);
            setLoadingStage('');
        }
    }, [theme, templateProps, toast, buildOverrides]);

    /** Full preview pipeline: check cache → fetch summaries → render canvas */
    const checkAndGenerateSummaries = useCallback(async () => {
        const days = templateProps.itinerary?.itinerary;
        if (!days || days.length === 0) {
            await renderPages([]);
            return;
        }

        const currentPayload = JSON.stringify(days.map(d => ({
            day: d.day,
            date: d.date,
            areaFocus: d.areaFocus,
            timeline: (d.timeline || []).map(t => ({ time: t.time, details: t.details })),
        })));
        const currentHash = hashCode(currentPayload);

        // Check Cache
        if (currentHash === savedDaySummariesHash && savedDaySummaries && savedDaySummaries.length === days.length) {
            console.log("[PdfPreviewEditor] AI Summary cache hit. Skipping generation.");
            setDaySummaries(savedDaySummaries);
            await renderPages(savedDaySummaries);
            return;
        }

        setLoadingProgress(0);
        setLoadingStage('Opening preview…');
        await new Promise((r) => setTimeout(r, 80));

        setLoadingProgress(10);
        setLoadingStage('Generating AI summaries…');

        let summaries: string[] = [];
        try {
            const result = await generateDaySummaries({
                days: days.map(d => ({
                    day: d.day,
                    date: d.date,
                    areaFocus: d.areaFocus,
                    timeline: (d.timeline || []).map(t => ({ time: t.time, details: t.details })),
                })),
            });
            summaries = result.summaries;
            setDaySummaries(summaries);
            setSavedDaySummaries(summaries);
            setSavedDaySummariesHash(currentHash);

            // Persist the generated summaries immediately so we don't regenerate next time
            const nextOverrides = {
                ...(pdfOverrides || {}),
                daySummaries: summaries,
                daySummariesHash: currentHash
            };

            if (onPdfOverridesChange) {
                onPdfOverridesChange(nextOverrides);
            }

            if (itineraryId) {
                const { data } = await supabase.from('itineraries').select('pdf_overrides').eq('id', itineraryId).single();
                const currentOverrides = (data?.pdf_overrides || {}) as any;

                await supabase.from('itineraries').update({
                    pdf_overrides: {
                        ...currentOverrides,
                        daySummaries: summaries,
                        daySummariesHash: currentHash
                    }
                }).eq('id', itineraryId);
            }
        } catch (err) {
            console.warn('[PdfPreviewEditor] generateDaySummaries failed, using fallback:', err);
            // Graceful degradation — PdfDaywiseIndex has its own fallback chain
        }

        setLoadingProgress(45);
        await renderPages(summaries);
    }, [templateProps.itinerary, renderPages, savedDaySummaries, savedDaySummariesHash, itineraryId, supabase, pdfOverrides, onPdfOverridesChange]);

    // Re-render pipeline when dialog opens and data is loaded
    useEffect(() => {
        if (isOpen && isDataLoaded) {
            checkAndGenerateSummaries();
        }
    }, [isOpen, isDataLoaded]);

    // Render pages only when theme changes (don't regenerate summaries)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (!isOpen) {
            isFirstRender.current = true;
            return;
        }
        if (isDataLoaded && !isFirstRender.current) {
            const timer = setTimeout(() => renderPages(daySummaries), 100);
            return () => clearTimeout(timer);
        }
        if (isDataLoaded) {
            isFirstRender.current = false;
        }
    }, [theme]);

    // DEV ONLY — re-run renderPages after every HMR hot update so canvas
    // stays in sync with component changes without manual close/reopen.    

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        // @ts-ignore
        if (typeof module === 'undefined' || !(module as any).hot) return;

        const handler = (status: string) => {
            if (status === 'idle') {
                // HMR has finished applying the update — re-snapshot the DOM
                setTimeout(() => renderPages(daySummaries), 100);
            }
        };

        // @ts-ignore
        (module as any).hot.addStatusHandler(handler);
        return () => {
            // @ts-ignore
            if (typeof module !== 'undefined' && (module as any).hot && (module as any).hot.removeStatusHandler) {
                // @ts-ignore
                (module as any).hot.removeStatusHandler(handler);
            }
        };
    }, [renderPages, daySummaries]);

    // ─── Edit handlers ───
    const toggleForcedBreak = (sectionId: string) => {
        setForcedBreaks((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
        setHasUnappliedChanges(true);
    };

    const updateSpacing = (sectionId: string, value: number) => {
        setSpacingOverrides((prev) => ({ ...prev, [sectionId]: value }));
        setHasUnappliedChanges(true);
    };

    const resetEdits = () => {
        setForcedBreaks(new Set());
        setSpacingOverrides({});
        setHasUnappliedChanges(true);
    };

    const applyAndRerender = async () => {
        renderPages();

        const overrides = buildOverrides() || {};
        if (onPdfOverridesChange) {
            onPdfOverridesChange(overrides);
        }

        // Auto-save when applying changes if we have an itineraryId
        if (itineraryId) {
            setIsSaving(true);
            try {
                await supabase
                    .from('itineraries')
                    .update({
                        selected_theme: theme,
                        pdf_overrides: overrides
                    })
                    .eq('id', itineraryId);
            } catch (err) {
                console.error("Failed to save PDF overrides:", err);
            } finally {
                setIsSaving(false);
            }
        }
    };

    // Also auto-save theme change immediately if no other changes are pending
    const handleThemeChange = async (newTheme: PdfTheme) => {
        setTheme(newTheme);
        if (itineraryId && !hasUnappliedChanges) {
            try {
                await supabase
                    .from('itineraries')
                    .update({ selected_theme: newTheme })
                    .eq('id', itineraryId);
            } catch (err) {
                console.error("Failed to save theme selection:", err);
            }
        } else {
            setHasUnappliedChanges(true);
        }
    };

    const handleRefresh = useCallback(async () => {
        await checkAndGenerateSummaries();
    }, [checkAndGenerateSummaries]);

    // ─── Download ───
    const handleDownload = useCallback(async () => {
        if (pages.length === 0) return;
        setIsDownloading(true);

        try {
            const { downloadPdfFromPages } = await import("@/lib/pdf-page-renderer");
            downloadPdfFromPages(pages, filename, 0.95);
            toast({ title: "Download Complete!", description: "Your PDF has been saved." });
        } catch (err) {
            console.error("PDF download failed:", err);
            toast({ variant: "destructive", title: "Download Failed", description: "Could not save the PDF file." });
        } finally {
            setIsDownloading(false);
        }
    }, [pages, filename, toast]);

    // ─── Navigation ───
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

    const currentCanvas = pages[currentPage];

    // Sections that can have forced breaks (not cover — it already starts on a new page)
    const editableSections = sections.filter((s) => s.id !== "cover");

    return (
        <>
            {/* Hidden PDF template (layout-active off-screen) */}
            <div ref={hiddenContainerRef} style={{
                position: "fixed",
                top: 0,
                left: "-9999px",
                width: "794px",
                pointerEvents: "none",
                zIndex: -1,
            }}>
                <PdfTemplate {...templateProps} theme={theme} agencySettings={agencySettings} daySummaries={daySummaries} />
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[96vw] w-full max-h-[96vh] md:max-w-[92vw] md:max-h-[92vh] h-full p-0 flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl shadow-black/90">
                    <DialogTitle className="sr-only">PDF Preview & Editor</DialogTitle>

                    {/* ─── Toolbar ─── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl flex-shrink-0">
                        {/* Row 1 / Left: Title & Theme Select */}
                        <div className="flex items-center justify-between md:justify-start gap-4 pr-8 md:pr-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                    PDF Preview
                                </span>
                            </div>

                            <Select value={theme} onValueChange={(v) => handleThemeChange(v as PdfTheme)}>
                                <SelectTrigger className="w-[125px] h-8 bg-zinc-900/65 border-zinc-800 hover:border-zinc-700 text-zinc-100 text-xs transition-all rounded-lg focus:ring-1 focus:ring-indigo-500/50 shadow-inner">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                    {themeOptions.length > 0 ? (
                                        themeOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="hover:bg-zinc-800 focus:bg-zinc-800 text-xs cursor-pointer">{opt.label}</SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="classic" className="text-xs">Classic</SelectItem>
                                            <SelectItem value="editorial" className="text-xs">Editorial</SelectItem>
                                            <SelectItem value="minimalist" className="text-xs">Minimalist</SelectItem>
                                            <SelectItem value="dark" className="text-xs">Dark</SelectItem>
                                            <SelectItem value="corporate" className="text-xs">Corporate</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Row 2 / Right: Controls & Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap md:flex-nowrap">

                            {/* Zoom controls */}
                            <div className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-0.5 text-zinc-300">
                                <button
                                    onClick={() => setZoom(z => Math.max(20, z - 10))}
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
                                    onClick={() => setZoom(z => Math.min(150, z + 10))}
                                    className="hover:text-white transition-colors p-1 hover:bg-zinc-800/50 rounded-md cursor-pointer"
                                    title="Zoom In"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>

                                <span className="text-[11px] font-mono font-medium w-[34px] text-center tabular-nums">{zoom}%</span>

                                <div className="h-3.5 w-px bg-zinc-800 mx-0.5" />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomToFit}
                                    disabled={!currentCanvas || currentCanvas.width === 0 || isRendering}
                                    className="h-6 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800/50 gap-1 px-1.5 rounded-md"
                                    title="Fit to Screen"
                                >
                                    <ZoomIn className="w-3 h-3" />
                                    <span className="hidden min-[480px]:inline">Fit</span>
                                </Button>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-2 pr-0 md:pr-10">
                                <Button
                                    variant={showEditPanel ? "default" : "ghost"}
                                    size="sm"
                                    className={`h-8 text-xs rounded-lg transition-all border font-medium ${showEditPanel
                                        ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                                        : "bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"}`}
                                    onClick={() => setShowEditPanel(!showEditPanel)}
                                >
                                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                                    <span className="hidden sm:inline">Layout Editor</span>
                                    <span className="inline sm:hidden">Edit</span>
                                </Button>
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
                                        <UniqueLoading variant="morph" size="sm" className="w-4 h-4" />
                                    ) : (
                                        <Download className="w-3.5 h-3.5" />
                                    )}
                                    <span className="hidden sm:inline">Download PDF</span>
                                    <span className="inline sm:hidden">Download</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ─── Main Content (Preview + optional sidebar) ─── */}
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Preview Area */}
                        <div
                            ref={previewContainerRef}
                            className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8 relative selection:bg-indigo-500/30"
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
                            {/* ── Loading Overlay with Progress Bar ── */}
                            {loadingProgress >= 0 ? (
                                <div className="flex flex-col items-center justify-center gap-7 p-10 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 backdrop-blur-md shadow-2xl max-w-sm w-full mx-auto my-auto transition-all duration-300 animate-in fade-in-0 zoom-in-95">
                                    {/* Glowing orb */}
                                    <div className="relative">
                                        <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl opacity-70 animate-pulse" />
                                        <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                            <span className="text-white font-bold font-mono text-sm tabular-nums">{loadingProgress}%</span>
                                        </div>
                                    </div>

                                    {/* Text */}
                                    <div className="text-center z-10 w-full">
                                        <h3 className="text-zinc-100 font-semibold tracking-wide text-sm mb-1">{loadingStage || 'Preparing preview…'}</h3>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[240px] mx-auto mb-5">
                                            Generating your personalised PDF with AI-crafted summaries.
                                        </p>

                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden relative">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                                                style={{ width: `${loadingProgress}%`, transition: 'width 400ms ease' }}
                                            />
                                        </div>

                                        {/* Stage dots */}
                                        <div className="flex items-center justify-between mt-3 px-1">
                                            {[
                                                { label: 'Opening', threshold: 5 },
                                                { label: 'AI Summaries', threshold: 45 },
                                                { label: 'Rendering', threshold: 70 },
                                                { label: 'Done', threshold: 98 },
                                            ].map(({ label, threshold }) => (
                                                <div key={label} className="flex flex-col items-center gap-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${loadingProgress >= threshold
                                                            ? 'bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]'
                                                            : 'bg-zinc-700'
                                                        }`} />
                                                    <span className={`text-[8.5px] font-medium transition-colors duration-300 ${loadingProgress >= threshold ? 'text-indigo-400' : 'text-zinc-600'
                                                        }`}>{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : currentCanvas ? (
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
                                    <p className="text-sm font-semibold text-zinc-400">No pages to preview</p>
                                    <p className="text-[11px] text-zinc-500 max-w-[200px] text-center mt-1 leading-relaxed">
                                        Select an itinerary or theme to generate the preview document.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Backdrop Overlay for Mobile/Tablet */}
                        {showEditPanel && (
                            <div
                                className="absolute inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
                                onClick={() => setShowEditPanel(false)}
                            />
                        )}

                        {/* ─── Edit Sidebar ─── */}
                        {showEditPanel && (
                            <div className="absolute md:relative right-0 top-0 bottom-0 z-35 w-[280px] sm:w-[320px] md:w-[300px] flex-shrink-0 border-l border-zinc-800 bg-zinc-950/95 md:bg-zinc-950/40 backdrop-blur-xl md:backdrop-blur-none flex flex-col overflow-hidden shadow-2xl md:shadow-none animate-in slide-in-from-right duration-300">
                                {/* Sidebar Header */}
                                <div className="px-4 py-3.5 border-b border-zinc-800 bg-zinc-950/80 flex-shrink-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Layout Editor</h3>
                                        <div className="flex items-center gap-1.5">
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 px-2 rounded-md"
                                                onClick={resetEdits}>
                                                Reset All
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/60 rounded-md md:hidden"
                                                onClick={() => setShowEditPanel(false)}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[10.5px] text-zinc-400 mt-1">
                                        {pages.length > 1 ? "Adjust page breaks & vertical alignment." : "Adjust section spacing."}
                                    </p>
                                </div>

                                {/* Scrollable content */}
                                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-zinc-950/10">
                                    {/* ── Page Break Controls ── */}
                                    {pages.length > 1 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2.5">
                                                Page Breaks
                                            </h4>
                                            <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                                                Force a new page to start before a section. Useful when content is leaking across pages.
                                            </p>
                                            <div className="space-y-2">
                                                {editableSections.map((section) => (
                                                    <div
                                                        key={section.id}
                                                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-900/80 transition-colors"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs text-zinc-200 font-semibold truncate">
                                                                {section.label}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-400">
                                                                Currently on page {section.pageIndex + 1}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <span className="text-[9px] text-zinc-500 font-medium">Break</span>
                                                            <Switch
                                                                checked={forcedBreaks.has(section.id)}
                                                                onCheckedChange={() => toggleForcedBreak(section.id)}
                                                                className="data-[state=checked]:bg-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Spacing Controls ── */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2.5">
                                            Section Spacing
                                        </h4>
                                        <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                                            Add top padding to push content down. Helps fix elements sitting too close to page edges.
                                        </p>
                                        <div className="space-y-4">
                                            {editableSections.map((section) => (
                                                <div key={section.id} className="space-y-1.5 p-2 rounded-lg bg-zinc-900/20 border border-zinc-800/20">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-semibold text-zinc-300">{section.label}</span>
                                                        <span className="text-[10px] text-indigo-400 font-mono font-bold">
                                                            +{spacingOverrides[section.id] || 0}px
                                                        </span>
                                                    </div>
                                                    <Slider
                                                        value={[spacingOverrides[section.id] || 0]}
                                                        onValueChange={([v]) => updateSpacing(section.id, v)}
                                                        min={0}
                                                        max={200}
                                                        step={10}
                                                        className="w-full"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── Quick navigations ── */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2.5">
                                            Jump to Section
                                        </h4>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {sections.map((section) => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => goToPage(section.pageIndex)}
                                                    className={`text-left px-2 py-1.5 rounded-lg text-[10.5px] font-medium transition-all truncate border cursor-pointer ${currentPage === section.pageIndex
                                                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200"
                                                        : "bg-zinc-900/30 hover:bg-zinc-900 border-zinc-800/60 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                                                        }`}
                                                >
                                                    {section.label}
                                                    {pages.length > 1 && (
                                                        <span className="block text-[8.5px] opacity-60 font-mono mt-0.5">
                                                            Page {section.pageIndex + 1}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/80 flex-shrink-0">
                                    <Button
                                        onClick={applyAndRerender}
                                        disabled={isRendering || !hasUnappliedChanges || isSaving}
                                        className={`w-full h-9 text-xs font-semibold transition-all rounded-lg ${hasUnappliedChanges
                                            ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20 border-0"
                                            : "bg-zinc-900/40 text-zinc-500 border border-zinc-800/80"
                                            }`}
                                    >
                                        {isRendering ? (
                                            <><UniqueLoading variant="morph" size="sm" className="w-4 h-4 mr-2" />Re-rendering…</>
                                        ) : isSaving ? (
                                            <><UniqueLoading variant="morph" size="sm" className="w-4 h-4 mr-2" />Saving…</>
                                        ) : hasUnappliedChanges ? (
                                            <><span className="mr-1.5">↻</span>Apply &amp; Save Changes</>
                                        ) : (
                                            <>Up to date</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Thumbnail Strip ─── */}
                    {pages.length > 1 && (
                        <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950/60 backdrop-blur-xl px-4 py-3.5">
                            <div className="flex gap-3 overflow-x-auto justify-center py-0.5 scrollbar-thin scrollbar-thumb-zinc-800">
                                {pages.map((page, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`relative flex-shrink-0 rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden ${i === currentPage
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
                                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8.5px] font-bold text-zinc-300 font-mono border border-zinc-850 leading-none">
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

