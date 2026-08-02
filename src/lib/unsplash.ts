'use server';

/**
 * Unsplash API utility for fetching destination-relevant images.
 *
 * Improvements over v1:
 * 1. Activity-category detection — "breakfast" → skip Unsplash, use food fallback
 * 2. Destination-boosted queries — always prepend the area name for context
 *    e.g. "check in hotel" + "Jaipur" → "Jaipur hotel heritage rooftop"
 * 3. Multi-query waterfall — 3 progressively broader attempts before fallback
 * 4. Result diversification — randomly samples from top 5 instead of always index 0
 * 5. Expanded India-first fallback pool with activity-category matching
 * 6. Filters out non-travel noise (headshots, food close-ups for landmark slots)
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

import {
    getTypedFallbackUrl,
    classifyActivityTerm,
    ACTIVITY_FALLBACKS,
    DESTINATION_FALLBACKS,
    type ActivityCategory,
} from './constants';

// ─── Unsplash types ──────────────────────────────────────────────────────────

interface UnsplashPhoto {
    urls: { regular: string; small: string };
    alt_description: string | null;
    description: string | null;
}

interface UnsplashSearchResponse {
    results: UnsplashPhoto[];
    total: number;
}

// ─── Query builder ───────────────────────────────────────────────────────────

/**
 * Constructs up to 3 progressively broader Unsplash queries for a given
 * activity term + area context.
 *
 * Examples:
 *  term="hotel check-in", area="Udaipur" →
 *    ["Udaipur heritage hotel palace", "Udaipur hotel", "Rajasthan travel"]
 *
 *  term="Humayun's Tomb visit", area="Delhi" →
 *    ["Humayun Tomb Delhi landmark", "Delhi historical monument", "India heritage site"]
 *
 *  term="breakfast", area="Goa" →
 *    null (route to food fallback instead)
 */
function buildQueryWaterfall(
    term: string,
    area: string | undefined,
    category: ActivityCategory
): string[] | null {
    const cleanArea = area
        ? area.replace(/,.*$/, '').replace(/\(.*?\)/g, '').replace(/day\s*\d+/gi, '').trim()
        : '';

    // For mundane activity categories, skip Unsplash entirely
    if (category === 'food' || category === 'transit_generic' || category === 'rest') {
        return null;
    }

    // Clean the specific term — strip generic filler & hotel words
    const cleanTerm = term
        .replace(/\b(visit|check[- ]in|check[- ]out|transfer|drive|arrive|depart|departure|arrival|morning|evening|afternoon|night|hotel|resort|room|accommodation|stay|homestay|lodge|hostel)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    const queries: string[] = [];

    if (category === 'landmark' || category === 'sightseeing' || category === 'hotel') {
        // Query 1: Specific landmark + location
        if (cleanTerm && cleanArea) {
            queries.push(`${cleanTerm} ${cleanArea}`);
        } else if (cleanTerm) {
            queries.push(cleanTerm);
        }
        // Query 2: Area + category context
        if (cleanArea) {
            queries.push(`${cleanArea} landmark architecture`);
        }
        // Query 3: Broad destination travel
        if (cleanArea) {
            queries.push(`${cleanArea} travel destination`);
        }
    } else if (category === 'beach' || category === 'nature') {
        if (cleanTerm && cleanArea) {
            queries.push(`${cleanArea} ${category} scenic`);
        } else if (cleanArea) {
            queries.push(`${cleanArea} ${category}`);
        }
        queries.push(cleanTerm || `${category} travel`);
        if (cleanArea) queries.push(`${cleanArea} travel`);
    } else if (category === 'adventure') {
        if (cleanTerm) queries.push(`${cleanTerm} ${cleanArea || ''}`.trim());
        queries.push(`${cleanArea || ''} adventure outdoor`.trim());
        queries.push('adventure travel landscape');
    } else if (category === 'cultural') {
        if (cleanArea) queries.push(`${cleanArea} culture festival traditional`);
        if (cleanTerm) queries.push(cleanTerm);
        queries.push(`${cleanArea || 'India'} heritage`);
    } else if (category === 'shopping') {
        if (cleanArea) queries.push(`${cleanArea} market bazaar shopping`);
        queries.push('colorful market bazaar travel');
    } else {
        // Generic: area-boosted term
        if (cleanTerm && cleanArea) {
            queries.push(`${cleanArea} ${cleanTerm}`);
        } else if (cleanTerm) {
            queries.push(cleanTerm);
        }
        if (cleanArea) queries.push(`${cleanArea} travel`);
        queries.push('travel destination landscape');
    }

    return queries.filter(Boolean).slice(0, 3);
}

// ─── Raw search ──────────────────────────────────────────────────────────────

async function rawSearch(
    query: string,
    perPage: number = 8
): Promise<{ urls: string[]; total: number }> {
    if (!UNSPLASH_ACCESS_KEY) return { urls: [], total: 0 };

    try {
        const params = new URLSearchParams({
            query,
            per_page: String(perPage),
            orientation: 'landscape',
            order_by: 'relevant',
            content_filter: 'high',   // exclude adult content
        });

        const response = await fetch(`${UNSPLASH_API_URL}?${params}`, {
            headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
            next: { revalidate: 86400 },
        });

        if (!response.ok) {
            console.error(`Unsplash API error for "${query}": ${response.status}`);
            return { urls: [], total: 0 };
        }

        const data: UnsplashSearchResponse = await response.json();
        return {
            urls: data.results.map(r => r.urls.regular),
            total: data.total,
        };
    } catch (error) {
        console.error(`Unsplash fetch failed for "${query}":`, error);
        return { urls: [], total: 0 };
    }
}

// ─── Pick with variety ───────────────────────────────────────────────────────

/**
 * Picks a URL from the results pool with some randomization to avoid every
 * day getting the same "top result" image.
 * Biased toward the top 3 but occasionally picks from positions 4–7.
 */
function pickFromPool(urls: string[]): string {
    if (urls.length === 0) return '';
    if (urls.length === 1) return urls[0];
    // 70% chance: pick from top 3; 30% chance: pick from rest
    const useTop = Math.random() < 0.7;
    const pool = useTop ? urls.slice(0, Math.min(3, urls.length)) : urls.slice(3);
    const finalPool = pool.length > 0 ? pool : urls;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Fetches the most relevant Unsplash image for a given itinerary activity term.
 *
 * @param specificTerm  - AI-generated imageSearchTerm for the activity
 * @param fallbackArea  - The day's areaFocus (e.g. "Jaipur, Rajasthan")
 * @param dayIndex      - Day number (for deterministic fallback variety)
 */
export async function searchUnsplashPhoto(
    specificTerm: string,
    fallbackArea?: string,
    dayIndex?: number
): Promise<string> {
    // Classify what kind of activity this is
    const category = classifyActivityTerm(specificTerm);

    // For mundane activities (meals, rest, generic transit) — skip the API call
    // and go straight to a category-appropriate fallback
    if (!UNSPLASH_ACCESS_KEY || category === 'food' || category === 'rest') {
        return getTypedFallbackUrl(category, fallbackArea, dayIndex ?? 0);
    }

    // Build waterfall of queries
    const queries = buildQueryWaterfall(specificTerm, fallbackArea, category);

    if (!queries || queries.length === 0) {
        return getTypedFallbackUrl(category, fallbackArea, dayIndex ?? 0);
    }

    // Try each query in the waterfall until we get a good result
    for (const query of queries) {
        const result = await rawSearch(query, 8);
        if (result.total >= 3 && result.urls.length > 0) {
            return pickFromPool(result.urls);
        }
    }

    // All queries failed — use typed fallback
    return getTypedFallbackUrl(category, fallbackArea, dayIndex ?? 0);
}

/**
 * Fetch images for multiple itinerary days in parallel.
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
