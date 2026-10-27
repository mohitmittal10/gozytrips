/**
 * @deprecated Unsplash API integration has been retired in favor of the
 * Wikipedia + Wikimedia Commons site photo pipeline in `@/lib/site-photos`.
 *
 * This file re-exports the site-photos pipeline for backwards compatibility.
 */

export {
    searchSitePhoto as searchUnsplashPhoto,
    fetchImagesForTerms,
    searchSitePhotos,
    cleanTerm,
    cleanArea,
} from './site-photos';
