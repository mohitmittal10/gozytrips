/**
 * pdf-generator.ts
 *
 * Thin wrapper around pdf-page-renderer.ts. Renders the container as a single
 * adaptive-height page and downloads it — used by callers that don't need the
 * preview dialog.
 */

import { renderSinglePage, downloadPdfSinglePage } from './pdf-page-renderer';

interface GeneratePdfOptions {
    filename: string;
    scale?: number;
    imageQuality?: number;
}

/**
 * Renders the container into a single full-height PDF and saves it.
 */
export async function generatePdfFromSections(
    container: HTMLElement,
    options: GeneratePdfOptions
): Promise<void> {
    const { filename, scale = 2, imageQuality = 0.95 } = options;

    const { canvas } = await renderSinglePage(container, { scale });
    downloadPdfSinglePage(canvas, filename, imageQuality);
}
