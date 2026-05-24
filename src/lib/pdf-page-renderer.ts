/**
 * pdf-page-renderer.ts
 *
 * Renders an HTML container as a single, full-height canvas via html2canvas,
 * then exports it as a single adaptive-height PDF page.
 *
 * The document width is fixed at A4 (210 mm / 794 px at 96 dpi) for consistent
 * typography and layout. The height adapts to the actual content — no slicing,
 * no page-break logic, no distortion.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ─── Constants ──────────────────────────────────────────────
export const A4_WIDTH_MM = 210;
export const RENDER_WIDTH_PX = 794; // A4 at 96 DPI

// Kept for any code that still references these — they are no longer used
// internally but removing them would break consumer imports.
export const A4_HEIGHT_MM = 297;
export const MARGIN_MM = 0;
export const USABLE_WIDTH_MM = A4_WIDTH_MM;
export const USABLE_HEIGHT_MM = A4_HEIGHT_MM;

// ─── Types ──────────────────────────────────────────────────

export interface RenderPagesOptions {
    scale?: number;
}

/** @deprecated kept for backward compat — single-page render has no page breaks */
export interface PageBreak {
    start: number;
    end: number;
}

/** @deprecated kept for backward compat — no longer used */
export interface EditOverrides {
    forcedBreaksBefore?: Set<string>;
    spacingOverrides?: Record<string, number>;
}

/** @deprecated kept for backward compat — single page has no section→page mapping */
export interface SectionMeta {
    id: string;
    label: string;
    pageIndex: number;
}

export interface RenderPagesResult {
    pages: HTMLCanvasElement[];
    sections: SectionMeta[];
}

export interface RenderSinglePageResult {
    canvas: HTMLCanvasElement;
}

// ─── Helpers ────────────────────────────────────────────────
function getAbsoluteY(el: HTMLElement): number {
    return el.getBoundingClientRect().top + window.scrollY;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Renders the container as a single full-height canvas.
 * Width is fixed at RENDER_WIDTH_PX; height adapts to the content.
 */
export async function renderSinglePage(
    container: HTMLElement,
    options: RenderPagesOptions = {}
): Promise<RenderSinglePageResult> {
    const { scale = 2 } = options;

    // Constrain width — let height be natural
    const origWidth = container.style.width;
    const origMaxWidth = container.style.maxWidth;
    const origMargin = container.style.margin;
    container.style.width = `${RENDER_WIDTH_PX}px`;
    container.style.maxWidth = `${RENDER_WIDTH_PX}px`;
    container.style.margin = '0';

    container.offsetHeight; // reflow

    const style = document.createElement('style');
    document.head.appendChild(style);
    try {
        style.sheet?.insertRule('body > div:last-child img { display: inline-block; }', 0);
    } catch (e) {
        console.warn('Failed to insert rule for html2canvas', e);
    }

    try {
        const canvas = await html2canvas(container, {
            scale,
            backgroundColor: null,
            logging: false,
            useCORS: true,
            width: RENDER_WIDTH_PX,
            windowWidth: RENDER_WIDTH_PX,
        });

        return { canvas };
    } finally {
        style.remove();
        container.style.width = origWidth;
        container.style.maxWidth = origMaxWidth;
        container.style.margin = origMargin;
    }
}

/**
 * Creates a single-page PDF whose dimensions exactly match the canvas,
 * then triggers a download.
 *
 * The page width is always A4_WIDTH_MM (210 mm).
 * The page height is derived from the canvas aspect ratio, so it can be
 * much taller than a standard A4 page — fully adaptive.
 */
export function downloadPdfSinglePage(
    canvas: HTMLCanvasElement,
    filename: string,
    quality = 0.95
): void {
    if (!canvas) return;

    // Derive page height from canvas aspect ratio
    const pxPerMm = canvas.width / A4_WIDTH_MM;
    const pageHeightMm = canvas.height / pxPerMm;

    const pdf = new jsPDF({
        orientation: pageHeightMm > A4_WIDTH_MM ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [A4_WIDTH_MM, pageHeightMm],
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, pageHeightMm);
    pdf.save(filename);
}

// ─── Legacy wrappers (backward compat) ──────────────────────

/**
 * @deprecated Use renderSinglePage instead. Kept so existing callers compile.
 * Returns a single-element pages array with the full canvas.
 */
export async function renderPdfPages(
    container: HTMLElement,
    options: RenderPagesOptions = {},
    _overrides?: EditOverrides
): Promise<RenderPagesResult> {
    const { canvas } = await renderSinglePage(container, options);

    // Build lightweight section metadata (all on "page 0")
    const sectionMetas: SectionMeta[] = [];
    const containerAbsTop = getAbsoluteY(container);
    container.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach((el) => {
        const id = el.getAttribute('data-pdf-section') || '';
        let label = id;
        if (id === 'cover') label = '📄 Cover';
        else if (id === 'daywise-index') label = '📅 Summary Index';
        else if (id === 'pricing') label = '💰 Pricing';
        else if (id.startsWith('day-')) label = `📅 Day ${id.replace('day-', '')}`;
        sectionMetas.push({ id, label, pageIndex: 0 });
    });

    return { pages: [canvas], sections: sectionMetas };
}

/**
 * @deprecated Use downloadPdfSinglePage instead. Kept so existing callers compile.
 * Treats the first canvas in the array as the single full-page image.
 */
export function downloadPdfFromPages(
    pages: HTMLCanvasElement[],
    filename: string,
    quality = 0.95
): void {
    if (pages.length === 0) return;
    downloadPdfSinglePage(pages[0], filename, quality);
}
