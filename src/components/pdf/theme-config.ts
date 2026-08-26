import type { ReferenceOption } from '@/hooks/use-reference-options';

export type PdfTheme = 'classic' | 'editorial' | 'minimalist' | 'dark' | 'corporate' | 'desert' | 'tropical' | 'luxury';

export const DEFAULT_PDF_THEME_OPTIONS: Array<{ value: PdfTheme; label: string }> = [
    { value: 'classic', label: 'Classic' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'dark', label: 'Dark' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'desert', label: 'Desert' },
    { value: 'tropical', label: 'Tropical' },
    { value: 'luxury', label: 'Luxury' },
];

export const getMergedPdfThemeOptions = (
    options: Array<Pick<ReferenceOption, 'value' | 'label'>> = []
) => {
    const seen = new Set(options.map((option) => option.value));
    const missingDefaults = DEFAULT_PDF_THEME_OPTIONS.filter((option) => !seen.has(option.value));

    return [...options, ...missingDefaults];
};
