/**
 * pdf-generator.ts
 *
 * Thin wrapper around pdf-page-renderer.ts. Renders pages and downloads
 * directly — used by callers that don't need the preview.
 */

import { renderPdfPages, downloadPdfFromPages } from './pdf-page-renderer';

interface GeneratePdfOptions {
    filename: string;
    scale?: number;
    imageQuality?: number;
}

/**
 * Renders the container and saves it as a multi-page PDF.
 */
export async function generatePdfFromSections(
    container: HTMLElement,
    options: GeneratePdfOptions
): Promise<void> {
    const { filename, scale = 2, imageQuality = 0.95 } = options;

    const { pages } = await renderPdfPages(container, { scale });
    downloadPdfFromPages(pages, filename, imageQuality);
}
