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
    Loader,
    Eye,
    Settings,
} from "lucide-react";
import { PdfTemplate, type PdfTheme, type PdfTemplateProps } from "@/components/pdf-template";
import { useToast } from "@/hooks/use-toast";
import type { SectionMeta, EditOverrides } from "@/lib/pdf-page-renderer";

interface PdfPreviewEditorProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    templateProps: Omit<PdfTemplateProps, "theme">;
    initialTheme?: PdfTheme;
    filename?: string;
}

export function PdfPreviewEditor({
    isOpen,
    onOpenChange,
    templateProps,
    initialTheme = "classic",
    filename = "Itinerary.pdf",
}: PdfPreviewEditorProps) {
    const { toast } = useToast();

    // ─── State ───
    const [theme, setTheme] = useState<PdfTheme>(initialTheme);
    const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
    const [sections, setSections] = useState<SectionMeta[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(70);
    const [isRendering, setIsRendering] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Edit tools state
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [forcedBreaks, setForcedBreaks] = useState<Set<string>>(new Set());
    const [spacingOverrides, setSpacingOverrides] = useState<Record<string, number>>({});
    const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

    // Refs
    const hiddenContainerRef = useRef<HTMLDivElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // ─── Build overrides object ───
    const buildOverrides = useCallback((): EditOverrides | undefined => {
        const hasForcedBreaks = forcedBreaks.size > 0;
        const hasSpacing = Object.values(spacingOverrides).some((v) => v > 0);
        if (!hasForcedBreaks && !hasSpacing) return undefined;

        return {
            forcedBreaksBefore: hasForcedBreaks ? forcedBreaks : undefined,
            spacingOverrides: hasSpacing ? spacingOverrides : undefined,
        };
    }, [forcedBreaks, spacingOverrides]);

    // ─── Render pages ───
    const renderPages = useCallback(async () => {
        const container = hiddenContainerRef.current;
        if (!container) return;

        setIsRendering(true);

        try {
            container.style.display = "block";
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.top = "0";
            container.style.zIndex = "-1";

            await new Promise((r) => setTimeout(r, 500));

            const { renderPdfPages } = await import("@/lib/pdf-page-renderer");
            const overrides = buildOverrides();
            const result = await renderPdfPages(container, { scale: 2 }, overrides);

            setPages(result.pages);
            setSections(result.sections);
            setCurrentPage(0);
            setHasUnappliedChanges(false);
        } catch (err) {
            console.error("Failed to render PDF pages:", err);
            toast({
                variant: "destructive",
                title: "Render Failed",
                description: "Could not generate the PDF preview.",
            });
        } finally {
            const container = hiddenContainerRef.current;
            if (container) container.style.display = "none";
            setIsRendering(false);
        }
    }, [theme, templateProps, toast, buildOverrides]);

    // Re-render when dialog opens or theme changes
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => renderPages(), 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, theme, renderPages]);

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

    const applyAndRerender = () => {
        renderPages();
    };

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

    // Sections that can have forced breaks (not cover — it already auto-breaks)
    const editableSections = sections.filter((s) => s.id !== "cover");

    return (
        <>
            {/* Hidden PDF template */}
            <div ref={hiddenContainerRef} style={{ display: "none" }}>
                <PdfTemplate {...templateProps} theme={theme} />
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 flex flex-col bg-gray-950 border-white/10 rounded-xl overflow-hidden">
                    <DialogTitle className="sr-only">PDF Preview & Editor</DialogTitle>

                    {/* ─── Toolbar ─── */}
                    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-black/60 backdrop-blur-xl flex-shrink-0">
                        {/* Left: Theme + Zoom */}
                        <div className="flex items-center gap-3">
                            <Select value={theme} onValueChange={(v) => setTheme(v as PdfTheme)}>
                                <SelectTrigger className="w-[130px] h-8 bg-white/5 border-white/15 text-white text-sm">
                                    <SelectValue placeholder="Theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="classic">Classic</SelectItem>
                                    <SelectItem value="editorial">Editorial</SelectItem>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2 text-white/60">
                                <Minus className="w-3.5 h-3.5" />
                                <Slider
                                    value={[zoom]}
                                    onValueChange={([v]) => setZoom(v)}
                                    min={30}
                                    max={150}
                                    step={5}
                                    className="w-[100px]"
                                />
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-xs w-[36px] text-center">{zoom}%</span>
                            </div>
                        </div>

                        {/* Center: Page Nav */}
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0 || pages.length === 0}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-white/80 min-w-[80px] text-center">
                                {pages.length === 0 ? "—" : `Page ${currentPage + 1} of ${pages.length}`}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= pages.length - 1 || pages.length === 0}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Right: Edit toggle + Download */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showEditPanel ? "default" : "ghost"}
                                size="sm"
                                className={`h-8 text-sm ${showEditPanel
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "text-white/60 hover:text-white"}`}
                                onClick={() => setShowEditPanel(!showEditPanel)}
                            >
                                <Settings className="w-4 h-4 mr-1.5" />
                                Edit Layout
                            </Button>
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading || pages.length === 0}
                                className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-sm px-4"
                            >
                                {isDownloading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                Download
                            </Button>
                        </div>
                    </div>

                    {/* ─── Main Content (Preview + optional sidebar) ─── */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Preview Area */}
                        <div
                            ref={previewContainerRef}
                            className="flex-1 overflow-auto flex items-start justify-center p-6 bg-gray-900/80"
                        >
                            {isRendering ? (
                                <div className="flex flex-col items-center justify-center gap-3 h-full text-white/60">
                                    <Loader className="w-8 h-8 animate-spin" />
                                    <p className="text-sm">Rendering preview…</p>
                                </div>
                            ) : currentCanvas ? (
                                <div style={{
                                    transform: `scale(${zoom / 100})`,
                                    transformOrigin: "top center",
                                    transition: "transform 0.15s ease",
                                }}>
                                    <div className="shadow-2xl rounded-sm bg-white" style={{
                                        width: currentCanvas.width / 2,
                                        height: currentCanvas.height / 2,
                                    }}>
                                        <canvas
                                            ref={(canvasEl) => {
                                                if (!canvasEl || !currentCanvas) return;
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
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 h-full text-white/40">
                                    <Eye className="w-8 h-8" />
                                    <p className="text-sm">No pages to preview</p>
                                </div>
                            )}
                        </div>

                        {/* ─── Edit Sidebar ─── */}
                        {showEditPanel && (
                            <div className="w-[300px] flex-shrink-0 border-l border-white/10 bg-black/40 flex flex-col overflow-hidden">
                                {/* Sidebar Header */}
                                <div className="px-4 py-3 border-b border-white/10">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-white">Layout Editor</h3>
                                        <Button variant="ghost" size="sm" className="h-6 text-xs text-white/50 hover:text-white"
                                            onClick={resetEdits}>
                                            Reset All
                                        </Button>
                                    </div>
                                    <p className="text-xs text-white/40 mt-1">
                                        Fix page breaks and alignment issues
                                    </p>
                                </div>

                                {/* Scrollable content */}
                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                                    {/* ── Page Break Controls ── */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                                            Page Breaks
                                        </h4>
                                        <p className="text-[10px] text-white/40 mb-3">
                                            Force a new page to start before a section. Useful when content is leaking across pages.
                                        </p>
                                        <div className="space-y-2">
                                            {editableSections.map((section) => (
                                                <div
                                                    key={section.id}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-white/80 font-medium truncate">
                                                            {section.label}
                                                        </div>
                                                        <div className="text-[10px] text-white/40">
                                                            Currently on page {section.pageIndex + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <span className="text-[10px] text-white/40">Break</span>
                                                        <Switch
                                                            checked={forcedBreaks.has(section.id)}
                                                            onCheckedChange={() => toggleForcedBreak(section.id)}
                                                            className="data-[state=checked]:bg-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ── Spacing Controls ── */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                                            Section Spacing
                                        </h4>
                                        <p className="text-[10px] text-white/40 mb-3">
                                            Add top padding to push content down. Helps fix elements sitting too close to page edges.
                                        </p>
                                        <div className="space-y-3">
                                            {editableSections.map((section) => (
                                                <div key={section.id} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-white/60">{section.label}</span>
                                                        <span className="text-[10px] text-purple-400 font-mono">
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
                                        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                                            Jump to Section
                                        </h4>
                                        <div className="space-y-1">
                                            {sections.map((section) => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => goToPage(section.pageIndex)}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${currentPage === section.pageIndex
                                                        ? "bg-purple-500/20 text-purple-300"
                                                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                                                        }`}
                                                >
                                                    {section.label}
                                                    <span className="ml-1 text-[10px] text-white/30">
                                                        — pg {section.pageIndex + 1}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Apply Button */}
                                <div className="px-4 py-3 border-t border-white/10">
                                    <Button
                                        onClick={applyAndRerender}
                                        disabled={isRendering || !hasUnappliedChanges}
                                        className={`w-full h-9 text-sm font-medium transition-all ${hasUnappliedChanges
                                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white shadow-lg shadow-purple-500/20"
                                            : "bg-white/5 text-white/40 border border-white/10"
                                            }`}
                                    >
                                        {isRendering ? (
                                            <><Loader className="w-4 h-4 mr-2 animate-spin" />Re-rendering…</>
                                        ) : hasUnappliedChanges ? (
                                            <><span className="mr-2">↻</span>Apply Changes & Re-render</>
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
                        <div className="flex-shrink-0 border-t border-white/10 bg-black/60 px-4 py-3">
                            <div className="flex gap-2 overflow-x-auto justify-center">
                                {pages.map((page, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`relative flex-shrink-0 rounded border-2 transition-all cursor-pointer ${i === currentPage
                                            ? "border-purple-500 shadow-lg shadow-purple-500/30"
                                            : "border-white/10 hover:border-white/30"
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
                                            style={{ width: "100%", height: "100%", display: "block", borderRadius: "2px" }}
                                        />
                                        <span className="absolute bottom-0.5 right-1 text-[9px] text-white/60 font-mono">
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
