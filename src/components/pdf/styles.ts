import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import type { PdfTheme } from './theme-config';

export const THEME_PATTERNS = {
    topography: "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM15 45c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5v0zm32 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 23c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm63 7.004c-1.105 0-2-.896-2-2.004 0-1.105.895-2 2-2s2 .895 2 2c0 1.108-.895 2.004-2 2.004z' fill='currentColor' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E",
    minimal: "data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5z' fill='currentColor' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E",
    geometric: "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='currentColor' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
    diagonal: "data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.22 0l-1.415 1.414L10.392 9l-1.414 1.414L1.392 2.828 0 4.243v2.828l1.414-1.414L8.98 13.22l1.415-1.414L2.808 4.243l1.414-1.414L11.808 10.42 13.22 9V6.172l-1.414 1.414L4.22 0z' fill='currentColor' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E",
    waves: "data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.392-5.024 3.42-9.61 8.816-9.61 5.395 0 8.423 4.586 8.816 9.61H21.184zM100 20c-.392-5.59-3.92-10.39-9.825-10.39-4.886 0-8.238 3.518-9.355 7.64L78.697 16c-.576-8.525-4.57-16-12.78-16-8.21 0-12.204 7.475-12.78 16l-2.12-1.25C49.897 10.518 46.545 7 41.66 7c-5.905 0-9.434 4.802-9.826 10.39H0c.392-5.59 3.92-10.39 9.825-10.39 4.886 0 8.238 3.518 9.355 7.64l2.122 1.25c.576-8.525 4.57-16 12.78-16 8.21 0 12.204 7.475 12.78 16l2.12 1.25c1.117-4.12 4.47-7.64 9.355-7.64 5.905 0 9.434 4.802 9.826 10.39H100z' fill='currentColor' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E",
    darkDots: "data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 9l3 3-3 3-3-3 3-3zm0-2L5 4l3-3 3 3-3 3z' fill='currentColor' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E",
    moroccan: "data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15zm0 28C7.82 28 2 22.18 2 15S7.82 2 15 2s13 5.82 13 13-5.82 13-13 13zm8-13c0-4.418-3.582-8-8-8s-8 3.582-8 8 3.582 8 8 8 8-3.582 8-8z' fill='currentColor' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E"
};

export const getThematicBackground = (itinerary: TravelItineraryOutput, theme: PdfTheme, agentColor: string) => {
    let patternSrc = THEME_PATTERNS.topography;
    let color = "%231e293b"; // slate-800 mostly

    if (!itinerary?.itinerary || !Array.isArray(itinerary.itinerary)) return patternSrc.replace(/currentColor/g, color);

    const destString = (itinerary.itinerary.map(d => d.areaFocus).join(" ") + " ").toLowerCase();

    if (destString.match(/beach|island|coast|sea|ocean|resort|maldives|hawaii|bali|phuket|goa|cancun|cruise/)) {
        patternSrc = THEME_PATTERNS.waves;
    } else if (destString.match(/tokyo|new york|london|paris|city|dubai|singapore|urban|downtown/)) {
        patternSrc = THEME_PATTERNS.geometric;
    } else if (destString.match(/marrakech|morocco|istanbul|egypt|arab|middle east/)) {
        patternSrc = THEME_PATTERNS.moroccan;
    } else if (theme === 'minimalist' || theme === 'corporate') {
        patternSrc = THEME_PATTERNS.diagonal;
    } else if (theme === 'desert') {
        patternSrc = THEME_PATTERNS.moroccan;
        color = "%23b7793e";
    } else if (theme === 'dark' || theme === 'luxury') {
        patternSrc = THEME_PATTERNS.darkDots;
        color = "%23c9a84c";
    }

    if (agentColor && agentColor.startsWith('#') && theme !== 'dark' && theme !== 'desert' && theme !== 'luxury') {
        color = "%23" + agentColor.substring(1);
    }

    return patternSrc.replace(/currentColor/g, color);
};

export const glassStyles = {
    background: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.05)",
};

export const darkGlassStyles = {
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
};

