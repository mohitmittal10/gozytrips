'use server';

/**
 * Unsplash API utility for fetching destination-relevant images.
 * Uses a multi-step search strategy for maximum relevance:
 * 1. Search with the AI's specific keyword
 * 2. If too few results, fallback to the area/place name
 * 3. If still nothing, use a generic travel fallback
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// Fallback images — a variety of stunning travel photos
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1080&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1080&auto=format&fit=crop',
];

interface UnsplashPhoto {
    urls: {
        regular: string;
        small: string;
    };
    alt_description: string | null;
    description: string | null;
}

interface UnsplashSearchResponse {
    results: UnsplashPhoto[];
    total: number;
}

/**
 * Raw Unsplash search — returns top N photo URLs.
 */
async function rawSearch(query: string, perPage: number = 5): Promise<{ urls: string[]; total: number }> {
    if (!UNSPLASH_ACCESS_KEY) return { urls: [], total: 0 };

    try {
        const params = new URLSearchParams({
            query,
            per_page: String(perPage),
            orientation: 'landscape',
            order_by: 'relevant',
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

/**
 * Smart search with relevance fallback.
 *
 * Strategy:
 *  1. Try the specific search term (e.g. "Red Fort Delhi")
 *  2. If < 5 total results, fallback to area name (e.g. "Delhi landmark")
 *  3. Pick the first result from the best search
 */
export async function searchUnsplashPhoto(
    specificTerm: string,
    fallbackArea?: string
): Promise<string> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn('UNSPLASH_ACCESS_KEY not set, using fallback image.');
        return FALLBACK_IMAGES[0];
    }

    // Step 1: Try the specific AI-generated term
    const specific = await rawSearch(specificTerm, 3);
    if (specific.total >= 5 && specific.urls.length > 0) {
        // Good relevance — use top result
        return specific.urls[0];
    }

    // Step 2: If specific term didn't work well, try area/place name
    if (fallbackArea) {
        // Clean the area name — extract the main place name
        const cleanArea = fallbackArea
            .replace(/,.*$/, '')              // Remove everything after comma
            .replace(/\(.*?\)/g, '')          // Remove parenthetical text
            .replace(/day \d+/gi, '')         // Remove "Day 1" etc
            .replace(/[-–]/g, ' ')            // Replace dashes
            .trim();

        if (cleanArea && cleanArea !== specificTerm) {
            const areaResult = await rawSearch(`${cleanArea} travel landmark`, 3);
            if (areaResult.urls.length > 0) {
                return areaResult.urls[0];
            }
        }
    }

    // Step 3: If the specific search returned *anything*, use it
    if (specific.urls.length > 0) {
        return specific.urls[0];
    }

    // Step 4: Ultimate fallback
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

/**
 * Fetch images for multiple days in parallel.
 * Takes both the specific search terms and area names for fallback.
 */
export async function fetchImagesForTerms(
    searchTerms: string[],
    areaNames?: string[]
): Promise<string[]> {
    return Promise.all(
        searchTerms.map((term, i) =>
            searchUnsplashPhoto(term, areaNames?.[i])
        )
    );
}
