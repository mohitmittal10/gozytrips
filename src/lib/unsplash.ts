'use server';

/**
 * Unsplash API utility for fetching visually stunning, destination-relevant travel images.
 *
 * Enhanced Prompting & Image Quality Pipeline:
 * 1. Intelligent noise stripping — eliminates filler words ("visit", "check-in", "morning", "day 1")
 * 2. Category-tailored visual prompt engineering — injects aesthetic photography modifiers
 *    (e.g., "architecture facade photography", "coastal turquoise sea landscape")
 * 3. 4-Tier Progressive Query Waterfall — moves from ultra-specific visually boosted terms
 *    down to high-quality regional travel scenery
 * 4. Image Quality & Noise Filtering — excludes low-res photos, portraits, studio close-ups,
 *    and non-scenic imagery
 * 5. Weighted Top-Pool Sampling — ranks photos by relevance + quality metrics and samples
 *    with controlled variety to prevent duplicate images across itinerary days
 * 6. High-definition URL parameters — returns web-optimized, high-DPI cropped image URLs
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

import {
    getTypedFallbackUrl,
    classifyActivityTerm,
    type ActivityCategory,
} from './constants';

// ─── Unsplash API Types ──────────────────────────────────────────────────────

interface UnsplashPhoto {
    id: string;
    width: number;
    height: number;
    likes: number;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    alt_description: string | null;
    description: string | null;
}

interface UnsplashSearchResponse {
    results: UnsplashPhoto[];
    total: number;
}

// ─── Category Aesthetic Modifiers ────────────────────────────────────────────

const CATEGORY_AESTHETICS: Record<ActivityCategory, { primary: string; secondary: string }> = {
    landmark: {
        primary: 'architecture facade landscape photography',
        secondary: 'monument heritage architecture',
    },
    sightseeing: {
        primary: 'scenic viewpoint panorama travel photography',
        secondary: 'cityscape landscape view',
    },
    hotel: {
        primary: 'luxury hotel resort architecture interior',
        secondary: 'heritage resort hospitality',
    },
    beach: {
        primary: 'scenic coastal turquoise sea beach landscape',
        secondary: 'ocean coast tropical landscape',
    },
    nature: {
        primary: 'pristine nature landscape scenic travel photography',
        secondary: 'mountain valley forest landscape',
    },
    adventure: {
        primary: 'outdoor adventure landscape travel photography',
        secondary: 'action nature adventure outdoor',
    },
    cultural: {
        primary: 'heritage culture architecture traditional photography',
        secondary: 'cultural history art landmark',
    },
    shopping: {
        primary: 'vibrant bazaar market street photography',
        secondary: 'colorful market bazaar travel',
    },
    food: {
        primary: 'authentic food dining restaurant',
        secondary: 'cuisine gourmet dining',
    },
    transit: {
        primary: 'scenic road journey landscape travel photography',
        secondary: 'scenic drive mountain road',
    },
    transit_generic: {
        primary: 'travel journey scenic landscape',
        secondary: 'travel transportation',
    },
    rest: {
        primary: 'peaceful leisure travel landscape',
        secondary: 'scenic relaxation landscape',
    },
    general: {
        primary: 'travel destination scenic landscape photography',
        secondary: 'landscape scenery travel',
    },
};

// ─── Cleaning & Prompt Engineering ─────────────────────────────────────────

/**
 * Cleans generic noise, verbs, and filler words from search terms
 * to maximize Unsplash API search signal.
 */
function cleanTerm(rawTerm: string): string {
    if (!rawTerm) return '';

    return rawTerm
        // Remove parenthetical notes e.g., "(Day 1)", "(Optional)"
        .replace(/\(.*?\)/g, '')
        // Remove day markers e.g., "Day 1", "Day 02"
        .replace(/\bday\s*\d+\b/gi, '')
        // Remove time & duration markers
        .replace(/\b(morning|afternoon|evening|night|early|late|pm|am|hours?|stop|half[- ]day|full[- ]day)\b/gi, '')
        // Remove common activity verbs & action noise
        .replace(/\b(visit|visiting|explore|exploring|discover|enjoy|tour|touring|check[- ]in|check[- ]out|transfer|transferring|drive|driving|head|heading|route|arrive|arriving|depart|departing|stroll|walk|walking|sightseeing|ticket|entry|booking|experience)\b/gi, '')
        // Remove hotel / accommodation noise (so we get scenic landmarks instead of bed sheets)
        .replace(/\b(hotel|resort|room|accommodation|stay|homestay|lodge|hostel|guesthouse|dorm)\b/gi, '')
        // Remove generic stop words
        .replace(/\b(the|a|an|at|in|on|of|to|for|with|and|by|from)\b/gi, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Cleans area/location strings to focus on core city/region names.
 */
function cleanArea(rawArea?: string): string {
    if (!rawArea) return '';
    return rawArea
        .replace(/\(.*?\)/g, '')
        .replace(/\bday\s*\d+\b/gi, '')
        .split(',')[0] // Take primary city name before comma
        .trim();
}

/**
 * Constructs a 4-tier query waterfall of progressively broader, visually boosted
 * Unsplash search prompts.
 */
function buildQueryWaterfall(
    term: string,
    area: string | undefined,
    category: ActivityCategory
): string[] | null {
    // For mundane categories, bypass API calls to avoid generic/irrelevant photos
    if (category === 'food' || category === 'transit_generic' || category === 'rest') {
        return null;
    }

    const sanitizedTerm = cleanTerm(term);
    const sanitizedArea = cleanArea(area);
    const aesthetic = CATEGORY_AESTHETICS[category] || CATEGORY_AESTHETICS.general;

    const queries: string[] = [];

    // Tier 1: Highly specific visual prompt (Clean Term + Location + Primary Aesthetic Modifiers)
    if (sanitizedTerm && sanitizedArea) {
        queries.push(`${sanitizedTerm} ${sanitizedArea} ${aesthetic.primary}`);
    } else if (sanitizedTerm) {
        queries.push(`${sanitizedTerm} ${aesthetic.primary}`);
    }

    // Tier 2: Clean Term + Location (Direct Subject Match)
    if (sanitizedTerm && sanitizedArea) {
        queries.push(`${sanitizedTerm} ${sanitizedArea}`);
    } else if (sanitizedTerm) {
        queries.push(sanitizedTerm);
    }

    // Tier 3: Location + Secondary Aesthetic (Destination Category Focus)
    if (sanitizedArea) {
        queries.push(`${sanitizedArea} ${aesthetic.secondary}`);
    }

    // Tier 4: Broad Destination Travel Landscape
    if (sanitizedArea) {
        queries.push(`${sanitizedArea} travel destination landscape`);
    } else {
        queries.push('travel destination landscape photography');
    }

    // Filter out duplicates and empty queries
    return Array.from(new Set(queries.filter(Boolean))).slice(0, 4);
}

// ─── Raw Unsplash API Search & Candidate Filtering ─────────────────────────

/**
 * Keywords to exclude to prevent noisy non-travel photos
 * (e.g. food closeups, portraits, vector graphics, selfies).
 */
const NEGATIVE_KEYWORDS = [
    'portrait of',
    'face of',
    'selfie',
    'vector',
    'illustration',
    'logo',
    'close up of food',
    'dish',
    'plate of',
    'document',
    'mockup',
    'blank background',
    'studio shot',
];

/**
 * Checks whether a photo description contains negative non-scenic noise.
 */
function isHighQualityTravelPhoto(photo: UnsplashPhoto): boolean {
    // Basic resolution threshold
    if (photo.width < 1000 || photo.height < 600) return false;

    const descriptionText = `${photo.alt_description || ''} ${photo.description || ''}`.toLowerCase();
    
    // Check for negative keywords
    for (const negative of NEGATIVE_KEYWORDS) {
        if (descriptionText.includes(negative)) {
            return false;
        }
    }

    return true;
}

async function rawSearch(
    query: string,
    perPage: number = 15
): Promise<{ photos: UnsplashPhoto[]; total: number }> {
    if (!UNSPLASH_ACCESS_KEY) return { photos: [], total: 0 };

    try {
        const params = new URLSearchParams({
            query,
            per_page: String(perPage),
            orientation: 'landscape',
            order_by: 'relevant',
            content_filter: 'high', // exclude sensitive content
        });

        const response = await fetch(`${UNSPLASH_API_URL}?${params}`, {
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            next: { revalidate: 86400 }, // Cache response for 24h
        });

        if (!response.ok) {
            console.error(`Unsplash API error for "${query}": ${response.status}`);
            return { photos: [], total: 0 };
        }

        const data: UnsplashSearchResponse = await response.json();
        
        // Filter candidate photos for visual travel quality
        const filtered = data.results.filter(isHighQualityTravelPhoto);
        const candidates = filtered.length > 0 ? filtered : data.results;

        return {
            photos: candidates,
            total: data.total,
        };
    } catch (error) {
        console.error(`Unsplash fetch failed for "${query}":`, error);
        return { photos: [], total: 0 };
    }
}

// ─── Smart Candidate Ranking & Variety Sampling ────────────────────────────

/**
 * Optimizes an Unsplash image URL with crop, quality, and resolution parameters.
 */
function optimizeImageUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    try {
        const url = new URL(rawUrl);
        url.searchParams.set('auto', 'format');
        url.searchParams.set('fit', 'crop');
        url.searchParams.set('w', '1200');
        url.searchParams.set('q', '85');
        return url.toString();
    } catch {
        return rawUrl;
    }
}

/**
 * Selects the best photo from the candidate pool, balancing top relevance
 * with randomized variety so multiple days don't repeat the exact same image.
 */
function pickBestPhoto(photos: UnsplashPhoto[]): string {
    if (photos.length === 0) return '';
    if (photos.length === 1) return optimizeImageUrl(photos[0].urls.regular);

    // Sort top candidates slightly by likes / visual weight
    const sorted = [...photos].sort((a, b) => (b.likes || 0) - (a.likes || 0));

    // 75% probability: pick from top 3 liked/relevant candidates
    // 25% probability: pick from remaining candidates (positions 4 to 8)
    const useTopPool = Math.random() < 0.75;
    const pool = useTopPool
        ? sorted.slice(0, Math.min(3, sorted.length))
        : sorted.slice(3, Math.min(8, sorted.length));

    const finalPool = pool.length > 0 ? pool : sorted;
    const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

    return optimizeImageUrl(selected.urls.regular);
}

// ─── Public API Exports ──────────────────────────────────────────────────────

/**
 * Fetches the most visually impressive, relevant Unsplash photo for a given
 * itinerary activity term and area focus.
 *
 * @param specificTerm  - Activity or landmark search term (e.g. "Amber Fort Jaipur")
 * @param fallbackArea  - Destination context (e.g. "Jaipur, Rajasthan")
 * @param dayIndex      - Day number for deterministic fallback selection
 */
export async function searchUnsplashPhoto(
    specificTerm: string,
    fallbackArea?: string,
    dayIndex?: number
): Promise<string> {
    // 1. Categorize activity type
    const category = classifyActivityTerm(specificTerm);

    // 2. Bypass API for mundane non-scenic activities (food, rest, generic transfers)
    if (!UNSPLASH_ACCESS_KEY || category === 'food' || category === 'rest' || category === 'transit_generic') {
        return getTypedFallbackUrl(category, fallbackArea, dayIndex ?? 0);
    }

    // 3. Build 4-tier query waterfall with aesthetic prompt engineering
    const queries = buildQueryWaterfall(specificTerm, fallbackArea, category);

    if (!queries || queries.length === 0) {
        return getTypedFallbackUrl(category, fallbackArea, dayIndex ?? 0);
    }

    // 4. Try queries in waterfall order until a rich candidate pool is found
    for (const query of queries) {
        const result = await rawSearch(query, 15);
        if (result.photos.length > 0) {
            const photoUrl = pickBestPhoto(result.photos);
            if (photoUrl) return photoUrl;
        }
    }

    // 5. Fallback if all API queries yield no results
    return getTypedFallbackUrl(category, fallbackArea, dayIndex ?? 0);
}

/**
 * Fetches images for multiple itinerary search terms in parallel.
 */
export async function fetchImagesForTerms(
    searchTerms: string[],
    areaNames?: string[]
): Promise<string[]> {
    return Promise.all(
        searchTerms.map((term, i) =>
            searchUnsplashPhoto(term, areaNames?.[i], i)
        )
    );
}
