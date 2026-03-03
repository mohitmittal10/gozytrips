'use server';

import { fetchImagesForTerms } from '@/lib/unsplash';

/**
 * Server action to fetch Unsplash images for itinerary days.
 * Takes search terms + area names (for fallback relevance) and returns image URLs.
 */
export async function fetchItineraryImages(
    searchTerms: string[],
    areaNames?: string[]
): Promise<string[]> {
    if (!searchTerms || searchTerms.length === 0) {
        return [];
    }

    return fetchImagesForTerms(searchTerms, areaNames);
}
