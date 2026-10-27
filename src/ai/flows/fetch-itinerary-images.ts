'use server';

import {
    fetchImagesForTerms,
    searchSitePhotos,
} from '@/lib/site-photos';

/**
 * Server action to fetch authentic site & destination photos for itinerary days.
 * Queries Wikipedia, Wikivoyage, and Wikimedia Commons.
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

/**
 * Server action to search for candidate photos for a specific place/sight.
 * Returns multiple high-resolution photos for the user to choose from.
 */
export async function searchSiteCandidatePhotos(
    query: string,
    areaName?: string,
    limit: number = 6
): Promise<string[]> {
    if (!query || !query.trim()) {
        return [];
    }

    return searchSitePhotos(query.trim(), areaName, limit);
}
