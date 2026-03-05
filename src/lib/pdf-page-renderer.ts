/**
 * pdf-page-renderer.ts
 *
 * Shared rendering core used by both the PDF preview and the PDF downloader.
 *
 * Renders an HTML container as one tall canvas via html2canvas, calculates
 * smart page break positions, and returns an array of cropped per-page canvases.
 *
 * The preview displays these canvases directly; the downloader converts them
 * to a jsPDF document.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ─── Constants ──────────────────────────────────────────────
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_MM = 10;
export const USABLE_WIDTH_MM = A4_WIDTH_MM - 2 * MARGIN_MM;   // 190mm
export const USABLE_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM; // 277mm
export const RENDER_WIDTH_PX = 794; // A4 at 96 DPI
const HEADER_GUARD_PX = 300;        // Protect first 300px of each day section

// ─── Types ──────────────────────────────────────────────────
interface SectionInfo {
    topCanvas: number;
    bottomCanvas: number;
    type: string;
}

interface GuardZone {
    top: number;
    bottom: number;
}

export interface RenderPagesOptions {
    scale?: number;
}

export interface PageBreak {
    start: number;
    end: number;
}

export interface EditOverrides {
    /** Section IDs (data-pdf-section values) that should force a page break BEFORE them */
    forcedBreaksBefore?: Set<string>;
    /** Extra top-margin (in px) to add before a section, keyed by section ID */
    spacingOverrides?: Record<string, number>;
}

export interface SectionMeta {
    id: string;          // e.g. "cover", "day-1", "pricing"
    label: string;       // Friendly label
    pageIndex: number;   // Which page this section starts on
}

export interface RenderPagesResult {
    pages: HTMLCanvasElement[];
    sections: SectionMeta[];
}

// ─── Helpers ────────────────────────────────────────────────
function getAbsoluteY(el: HTMLElement): number {
    return el.getBoundingClientRect().top + window.scrollY;
}

function collectSectionsAndGuards(
    container: HTMLElement,
    containerAbsTop: number,
    scale: number,
    forcedBreaksBefore?: Set<string>
): { sections: SectionInfo[]; guardZones: GuardZone[] } {
    const sections: SectionInfo[] = [];
    const guardZones: GuardZone[] = [];

    container.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach((el) => {
        const relTop = getAbsoluteY(el) - containerAbsTop;
        const relBottom = relTop + el.offsetHeight;
        const sectionType = el.getAttribute('data-pdf-section') || '';

        sections.push({
            topCanvas: relTop * scale,
            bottomCanvas: relBottom * scale,
            type: sectionType,
        });

        if (sectionType.startsWith('day-')) {
            guardZones.push({
                top: relTop * scale,
                bottom: (relTop + HEADER_GUARD_PX) * scale,
            });
        }
    });

    container.querySelectorAll<HTMLElement>('.pdf-no-cut').forEach((el) => {
        const relTop = getAbsoluteY(el) - containerAbsTop;
        guardZones.push({
            top: relTop * scale,
            bottom: (relTop + el.offsetHeight) * scale,
        });
    });

    return { sections, guardZones };
}

function calculateBreaks(
    canvasH: number,
    pageH: number,
    sections: SectionInfo[],
    guardZones: GuardZone[],
    forcedBreaksBefore?: Set<string>
): PageBreak[] {
    const forcedBreakAfter = new Set<number>();
    const forcedBreakBeforeY = new Set<number>();

    for (const sec of sections) {
        if (sec.type === 'cover') forcedBreakAfter.add(sec.bottomCanvas);
        if (sec.type === 'pricing') forcedBreakBeforeY.add(sec.topCanvas);
        // User-forced breaks
        if (forcedBreaksBefore?.has(sec.type)) {
            forcedBreakBeforeY.add(sec.topCanvas);
        }
    }

    const breaks: PageBreak[] = [];
    let curY = 0;

    while (curY < canvasH) {
        let cutY = curY + pageH;
        let forcedCut = false;

        // Forced break after cover
        for (const fbY of forcedBreakAfter) {
            if (fbY > curY && fbY <= cutY) {
                cutY = fbY;
                forcedCut = true;
                break;
            }
        }

        // Forced break before pricing + user-forced breaks
        if (!forcedCut) {
            for (const fbY of forcedBreakBeforeY) {
                if (fbY > curY && fbY <= cutY) {
                    cutY = fbY;
                    forcedCut = true;
                    break;
                }
            }
        }

        // Guard zone constraint solver — iterate until clear
        if (!forcedCut && cutY < canvasH) {
            let moved = true;
            while (moved) {
                moved = false;
                const activeZones = guardZones.filter(
                    (z) => z.top > curY && cutY > z.top && cutY < z.bottom
                );
                if (activeZones.length > 0) {
                    cutY = Math.min(...activeZones.map((z) => z.top));
                    moved = true;
                }
            }
        }

        if (cutY >= canvasH) {
            breaks.push({ start: curY, end: canvasH });
            break;
        }

        // Safety: if cut couldn't advance (element taller than a page)
        if (cutY <= curY) cutY = curY + pageH;

        breaks.push({ start: curY, end: Math.min(cutY, canvasH) });
        curY = cutY;
    }

    return breaks;
}

function sliceCanvas(
    fullCanvas: HTMLCanvasElement,
    breaks: PageBreak[]
): HTMLCanvasElement[] {
    const canvasW = fullCanvas.width;
    return breaks.map(({ start, end }) => {
        const sliceH = end - start;
        const page = document.createElement('canvas');
        page.width = canvasW;
        page.height = sliceH;
        const ctx = page.getContext('2d')!;
        ctx.drawImage(fullCanvas, 0, start, canvasW, sliceH, 0, 0, canvasW, sliceH);
        return page;
    });
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Constrains the container, applies overrides, renders to canvas,
 * and returns per-page canvases + section metadata.
 */
export async function renderPdfPages(
    container: HTMLElement,
    options: RenderPagesOptions = {},
    overrides?: EditOverrides
): Promise<RenderPagesResult> {
    const { scale = 2 } = options;

    // Constrain width
    const origWidth = container.style.width;
    const origMaxWidth = container.style.maxWidth;
    const origMargin = container.style.margin;
    container.style.width = `${RENDER_WIDTH_PX}px`;
    container.style.maxWidth = `${RENDER_WIDTH_PX}px`;
    container.style.margin = '0';

    // Apply spacing overrides — store originals for restore
    const spacingRestore: { el: HTMLElement; orig: string }[] = [];
    if (overrides?.spacingOverrides) {
        container.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach((el) => {
            const sectionId = el.getAttribute('data-pdf-section') || '';
            const extra = overrides.spacingOverrides?.[sectionId];
            if (extra && extra > 0) {
                spacingRestore.push({ el, orig: el.style.paddingTop });
                el.style.paddingTop = `${extra}px`;
            }
        });
    }

    container.offsetHeight; // reflow

    try {
        const containerAbsTop = getAbsoluteY(container);
        const { sections, guardZones } = collectSectionsAndGuards(
            container, containerAbsTop, scale, overrides?.forcedBreaksBefore
        );

        const fullCanvas = await html2canvas(container, {
            scale,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            width: RENDER_WIDTH_PX,
            windowWidth: RENDER_WIDTH_PX,
        });

        const pxPerMm = fullCanvas.width / USABLE_WIDTH_MM;
        const pageH = USABLE_HEIGHT_MM * pxPerMm;
        const breaks = calculateBreaks(
            fullCanvas.height, pageH, sections, guardZones, overrides?.forcedBreaksBefore
        );
        const pageCanvases = sliceCanvas(fullCanvas, breaks);

        // Build section metadata with page mapping
        const sectionMetas: SectionMeta[] = [];
        container.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach((el) => {
            const id = el.getAttribute('data-pdf-section') || '';
            const relTop = (getAbsoluteY(el) - containerAbsTop) * scale;
            let pageIdx = 0;
            for (let i = 0; i < breaks.length; i++) {
                if (relTop >= breaks[i].start && relTop < breaks[i].end) {
                    pageIdx = i;
                    break;
                }
                if (relTop >= breaks[i].end) pageIdx = i + 1;
            }
            let label = id;
            if (id === 'cover') label = '📄 Cover Page';
            else if (id === 'pricing') label = '💰 Pricing';
            else if (id.startsWith('day-')) label = `📅 Day ${id.replace('day-', '')}`;
            sectionMetas.push({ id, label, pageIndex: Math.min(pageIdx, pageCanvases.length - 1) });
        });

        return { pages: pageCanvases, sections: sectionMetas };
    } finally {
        container.style.width = origWidth;
        container.style.maxWidth = origMaxWidth;
        container.style.margin = origMargin;
        for (const { el, orig } of spacingRestore) {
            el.style.paddingTop = orig;
        }
    }
}

/**
 * Converts an array of page canvases into a PDF and triggers a download.
 */
export function downloadPdfFromPages(
    pages: HTMLCanvasElement[],
    filename: string,
    quality = 0.95
): void {
    if (pages.length === 0) return;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pxPerMm = pages[0].width / USABLE_WIDTH_MM;

    for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        const imgData = pages[i].toDataURL('image/jpeg', quality);
        const chunkMm = pages[i].height / pxPerMm;

        pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, USABLE_WIDTH_MM, chunkMm);
    }

    pdf.save(filename);
}
