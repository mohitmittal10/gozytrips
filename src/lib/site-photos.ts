/**
 * Site & Destination Photo Service.
 *
 * Uses Wikipedia, Wikivoyage, and Wikimedia Commons APIs to fetch authentic,
 * high-resolution photography for real-world travel destinations, monuments,
 * temples, beaches, viewpoints, and cultural attractions.
 *
 * Falls back to curated category & destination scenery if an obscure activity
 * has no direct encyclopedia or travel guide entry.
 */

import {
    classifyActivityTerm,
    getTypedFallbackUrl,
    type ActivityCategory,
} from './constants';

const USER_AGENT = 'GozyTrips/1.0 (https://gozytrips.com; travel-assistant@gozytrips.com)';

// ─── Term Cleaning & Query Normalization ───────────────────────────────────────

/**
 * Strips activity noise, scheduling markers, and verbs so the search engine
 * queries the actual physical place or monument.
 */
export function cleanTerm(rawTerm: string): string {
    if (!rawTerm) return '';

    return rawTerm
        // Remove parenthetical annotations: "(Day 1)", "(Optional)", "(Ticket required)"
        .replace(/\(.*?\)/g, '')
        // Remove day tags: "Day 1", "Day 02"
        .replace(/\bday\s*\d+\b/gi, '')
        // Remove time/schedule markers
        .replace(/\b(morning|afternoon|evening|night|early|late|pm|am|hours?|stop|half[- ]day|full[- ]day)\b/gi, '')
        // Remove common activity verbs and action noise
        .replace(/\b(visit|visiting|explore|exploring|discover|enjoy|tour|touring|check[- ]in|check[- ]out|transfer|transferring|drive|driving|head|heading|route|arrive|arriving|depart|departing|stroll|walk|walking|sightseeing|ticket|entry|booking|experience|darshan|witness|attend)\b/gi, '')
        // Remove hotel / room filler so we find the scenic location instead of bedroom linen
        .replace(/\b(room|hotel\s*room|bed|dorm)\b/gi, '')
        // Remove generic stop words
        .replace(/\b(the|a|an|at|in|on|of|to|for|with|and|by|from)\b/gi, ' ')
        // Normalize spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extracts the primary city/region name from an area string.
 */
export function cleanArea(rawArea?: string): string {
    if (!rawArea) return '';
    return rawArea
        .replace(/\(.*?\)/g, '')
        .replace(/\bday\s*\d+\b/gi, '')
        .split(',')[0]
        .trim();
}

// ─── Validation Helpers ────────────────────────────────────────────────────────

const INVALID_PATTERNS = [
    /\.svg($|\?)/i,
    /\.ogv($|\?)/i,
    /\.pdf($|\?)/i,
    /\.tif+($|\?)/i,
    /\b(map|locator|plan|diagram|coat_of_arms|flag|icon|logo|symbol|insignia|emblem)\b/i,
];

function isValidPhotoUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') return false;
    for (const pattern of INVALID_PATTERNS) {
        if (pattern.test(url)) return false;
    }
    return true;
}

// ─── Source 1: English Wikipedia ───────────────────────────────────────────────

interface WikiPage {
    pageid: number;
    title: string;
    index?: number;
    thumbnail?: { source: string; width: number; height: number };
    original?: { source: string; width: number; height: number };
}

async function fetchFromWikipedia(query: string, limit: number = 3): Promise<string[]> {
    if (!query) return [];
    try {
        const url = new URL('https://en.wikipedia.org/w/api.php');
        url.searchParams.set('action', 'query');
        url.searchParams.set('format', 'json');
        url.searchParams.set('prop', 'pageimages');
        url.searchParams.set('piprop', 'original|thumbnail');
        url.searchParams.set('pithumbsize', '1200');
        url.searchParams.set('generator', 'search');
        url.searchParams.set('gsrsearch', query);
        url.searchParams.set('gsrlimit', String(limit));

        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return [];
        const data = await res.json();
        const pages: WikiPage[] = Object.values(data.query?.pages || {});

        // Sort by search result relevance index
        pages.sort((a, b) => (a.index || 99) - (b.index || 99));

        const photos: string[] = [];
        for (const page of pages) {
            const photo = page.thumbnail?.source || page.original?.source;
            if (photo && isValidPhotoUrl(photo)) {
                photos.push(photo);
            }
        }
        return photos;
    } catch {
        return [];
    }
}

// ─── Source 2: Wikivoyage (Travel Guide Destination & Sight Pages) ─────────────

async function fetchFromWikivoyage(query: string, limit: number = 3): Promise<string[]> {
    if (!query) return [];
    try {
        const url = new URL('https://en.wikivoyage.org/w/api.php');
        url.searchParams.set('action', 'query');
        url.searchParams.set('format', 'json');
        url.searchParams.set('prop', 'pageimages');
        url.searchParams.set('piprop', 'original|thumbnail');
        url.searchParams.set('pithumbsize', '1200');
        url.searchParams.set('generator', 'search');
        url.searchParams.set('gsrsearch', query);
        url.searchParams.set('gsrlimit', String(limit));

        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return [];
        const data = await res.json();
        const pages: WikiPage[] = Object.values(data.query?.pages || {});

        pages.sort((a, b) => (a.index || 99) - (b.index || 99));

        const photos: string[] = [];
        for (const page of pages) {
            const photo = page.thumbnail?.source || page.original?.source;
            if (photo && isValidPhotoUrl(photo)) {
                photos.push(photo);
            }
        }
        return photos;
    } catch {
        return [];
    }
}

// ─── Source 3: Wikimedia Commons (Geotagged & Community Travel Photography) ─────

interface CommonsPage {
    pageid: number;
    title: string;
    index?: number;
    imageinfo?: Array<{
        url?: string;
        thumburl?: string;
        width?: number;
        height?: number;
    }>;
}

async function fetchFromCommons(query: string, limit: number = 4): Promise<string[]> {
    if (!query) return [];
    try {
        const url = new URL('https://commons.wikimedia.org/w/api.php');
        url.searchParams.set('action', 'query');
        url.searchParams.set('format', 'json');
        url.searchParams.set('prop', 'imageinfo');
        url.searchParams.set('iiprop', 'url|size');
        url.searchParams.set('iiurlwidth', '1200');
        url.searchParams.set('generator', 'search');
        url.searchParams.set('gsrsearch', query);
        url.searchParams.set('gsrnamespace', '6'); // File: namespace
        url.searchParams.set('gsrlimit', String(limit));

        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': USER_AGENT },
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(6000),
        });

        if (!res.ok) return [];
        const data = await res.json();
        const pages: CommonsPage[] = Object.values(data.query?.pages || {});

        pages.sort((a, b) => (a.index || 99) - (b.index || 99));

        const photos: string[] = [];
        for (const page of pages) {
            const info = page.imageinfo?.[0];
            const candidate = info?.thumburl || info?.url;
            if (candidate && isValidPhotoUrl(candidate)) {
                photos.push(candidate);
            }
        }
        return photos;
    } catch {
        return [];
    }
}

// ─── Query Waterfall Pipeline ──────────────────────────────────────────────────

/**
 * Searches for multiple relevant photos of a specific place, landmark, or activity.
 * Ideal for manual photo pickers where the user chooses from several visual options.
 */
export async function searchSitePhotos(
    term: string,
    fallbackArea?: string,
    limit: number = 6
): Promise<string[]> {
    const sanitizedTerm = cleanTerm(term);
    const sanitizedArea = cleanArea(fallbackArea);

    const candidates: string[] = [];
    const seen = new Set<string>();

    const addPhotos = (urls: string[]) => {
        for (const u of urls) {
            if (u && !seen.has(u)) {
                seen.add(u);
                candidates.push(u);
            }
        }
    };

    // 1. Try combined specific term + area on Wikipedia & Wikivoyage
    if (sanitizedTerm && sanitizedArea) {
        const combined = `${sanitizedTerm} ${sanitizedArea}`;
        const [wiki, voy] = await Promise.all([
            fetchFromWikipedia(combined, 3),
            fetchFromWikivoyage(combined, 2),
        ]);
        addPhotos([...wiki, ...voy]);
        if (candidates.length >= limit) return candidates.slice(0, limit);
    }

    // 2. Try the specific term alone
    if (sanitizedTerm) {
        const [wiki, voy, comm] = await Promise.all([
            fetchFromWikipedia(sanitizedTerm, 3),
            fetchFromWikivoyage(sanitizedTerm, 2),
            fetchFromCommons(sanitizedTerm, 4),
        ]);
        addPhotos([...wiki, ...voy, ...comm]);
        if (candidates.length >= limit) return candidates.slice(0, limit);
    }

    // 3. Try Commons with area context
    if (sanitizedTerm && sanitizedArea) {
        const comm = await fetchFromCommons(`${sanitizedTerm} ${sanitizedArea}`, 4);
        addPhotos(comm);
        if (candidates.length >= limit) return candidates.slice(0, limit);
    }

    // 4. Try destination / area alone as fallback
    if (sanitizedArea && candidates.length === 0) {
        const [areaWiki, areaVoy] = await Promise.all([
            fetchFromWikipedia(sanitizedArea, 3),
            fetchFromWikivoyage(sanitizedArea, 3),
        ]);
        addPhotos([...areaWiki, ...areaVoy]);
    }

    return candidates.slice(0, limit);
}

/**
 * Searches for the single best photo for an itinerary day.
 *
 * Checks:
 * 1. Wikipedia / Wikivoyage for the specific site
 * 2. Wikimedia Commons for the site
 * 3. Area / destination focus
 * 4. Curated category fallback from constants
 */
export async function searchSitePhoto(
    specificTerm: string,
    fallbackArea?: string,
    dayIndex: number = 0
): Promise<string> {
    const category = classifyActivityTerm(specificTerm);

    // Skip encyclopedia API for mundane activities (food, generic transit, rest)
    if (category === 'food' || category === 'rest' || category === 'transit_generic') {
        return getTypedFallbackUrl(category, fallbackArea, dayIndex);
    }

    const photos = await searchSitePhotos(specificTerm, fallbackArea, 3);
    if (photos.length > 0) {
        // Deterministically select to avoid duplicate photos if multiple days share a broad term
        return photos[dayIndex % photos.length];
    }

    // Ultimate fallback to destination & category pool
    return getTypedFallbackUrl(category, fallbackArea, dayIndex);
}

/**
 * Batch fetches site photos for itinerary days in parallel.
 */
export async function fetchImagesForTerms(
    searchTerms: string[],
    areaNames?: string[]
): Promise<string[]> {
    if (!searchTerms || searchTerms.length === 0) return [];

    return Promise.all(
        searchTerms.map((term, i) =>
            searchSitePhoto(term, areaNames?.[i], i)
        )
    );
}
