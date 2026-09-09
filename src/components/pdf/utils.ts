import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { extractTripCost } from '@/services/financial/FinancialService';

export const getTotalBudget = (itinerary: any): number => {
    if (!itinerary) return 0;
    if (typeof itinerary === 'number') return itinerary;
    if (typeof itinerary.finalTotal === 'number' && itinerary.finalTotal > 0) return itinerary.finalTotal;
    if (typeof itinerary.client_price === 'number' && itinerary.client_price > 0) return itinerary.client_price;
    if (typeof itinerary.estimatedTotal === 'number' && itinerary.estimatedTotal > 0) return itinerary.estimatedTotal;
    if (typeof itinerary.totalBudget === 'number' && itinerary.totalBudget > 0) return itinerary.totalBudget;
    if (typeof itinerary.budget === 'number' && itinerary.budget > 0) return itinerary.budget;
    if (typeof itinerary.pricing?.finalTotal === 'number' && itinerary.pricing.finalTotal > 0) return itinerary.pricing.finalTotal;

    return extractTripCost(itinerary);
};

export const getAgentInfo = (userProfile: any, agencySettings?: any, liveData?: any) => {
    const overrides = liveData?.agencyOverrides || liveData?.agency || {};
    const consultant = liveData?.consultant || {};

    const primaryColor =
        overrides.primaryColor ||
        overrides.primary_color ||
        userProfile?.brand_color ||
        userProfile?.brandColor ||
        agencySettings?.primary_color ||
        agencySettings?.primaryColor ||
        agencySettings?.brand_color ||
        agencySettings?.brandColor ||
        "";

    const agentName =
        consultant.name ||
        overrides.agentName ||
        overrides.agent_name ||
        userProfile?.full_name ||
        userProfile?.display_name ||
        userProfile?.name ||
        agencySettings?.agent_name ||
        agencySettings?.agentName ||
        agencySettings?.full_name ||
        agencySettings?.name ||
        "";

    let companyName =
        overrides.companyName ||
        overrides.company_name ||
        overrides.brandName ||
        overrides.brand_name ||
        userProfile?.company_name ||
        userProfile?.companyName ||
        userProfile?.brand_name ||
        agencySettings?.brand_name ||
        agencySettings?.brandName ||
        agencySettings?.company_name ||
        agencySettings?.companyName ||
        agencySettings?.agency_name ||
        agencySettings?.agencyName ||
        "";

    // Guard: If companyName accidentally equals the agent's personal name (e.g. from prior erroneous data-field saves),
    // and a real company/brand name exists on profile or agency settings, restore the real company name.
    const realBrandOrCompany =
        userProfile?.company_name ||
        userProfile?.companyName ||
        userProfile?.brand_name ||
        agencySettings?.brand_name ||
        agencySettings?.brandName ||
        agencySettings?.company_name ||
        agencySettings?.companyName ||
        agencySettings?.agency_name ||
        agencySettings?.agencyName ||
        "";

    if (
        realBrandOrCompany &&
        companyName &&
        agentName &&
        (companyName.trim().toLowerCase() === agentName.trim().toLowerCase() ||
            companyName.trim().toLowerCase() === (userProfile?.full_name || "").trim().toLowerCase())
    ) {
        companyName = realBrandOrCompany;
    }

    const agentPhone =
        overrides.phone ||
        overrides.agentPhone ||
        userProfile?.business_phone ||
        userProfile?.phone ||
        agencySettings?.phone ||
        agencySettings?.business_phone ||
        agencySettings?.contact_phone ||
        agencySettings?.agentPhone ||
        "";

    const agentEmail =
        overrides.email ||
        overrides.agentEmail ||
        userProfile?.business_email ||
        userProfile?.email ||
        agencySettings?.email ||
        agencySettings?.business_email ||
        agencySettings?.agentEmail ||
        "";

    const agentWebsite =
        overrides.website ||
        overrides.agentWebsite ||
        userProfile?.website ||
        agencySettings?.website ||
        agencySettings?.agentWebsite ||
        "";

    const agentBio =
        overrides.bio ||
        overrides.agentBio ||
        userProfile?.bio ||
        agencySettings?.bio ||
        agencySettings?.description ||
        agencySettings?.agentBio ||
        "";

    const tagline =
        overrides.tagline ||
        agencySettings?.tagline ||
        agencySettings?.brand_tagline ||
        agencySettings?.brandTagline ||
        userProfile?.tagline ||
        "";

    const bankDetails =
        overrides.bankDetails ||
        agencySettings?.bank_details ||
        agencySettings?.bankDetails ||
        userProfile?.bank_details ||
        "";

    const upi =
        overrides.upi ||
        agencySettings?.upi ||
        agencySettings?.upi_id ||
        agencySettings?.upiId ||
        userProfile?.upi ||
        userProfile?.upi_id ||
        "";

    const logoUrl =
        overrides.logoUrl ||
        overrides.logo_url ||
        overrides.logo ||
        agencySettings?.logo_url ||
        agencySettings?.logoUrl ||
        agencySettings?.logo ||
        agencySettings?.brand_logo ||
        agencySettings?.brandLogo ||
        userProfile?.logo_url ||
        userProfile?.logoUrl ||
        userProfile?.logo ||
        "";

    return {
        primaryColor,
        agentName,
        companyName,
        agentPhone,
        agentEmail,
        agentWebsite,
        agentBio,
        tagline,
        bankDetails,
        upi,
        logoUrl,
    };
};

export const getPrimaryDestination = (itinerary: any) =>
    itinerary?.itinerary?.[0]?.areaFocus?.split(',')[0]?.trim() ||
    itinerary?.starting_location ||
    (Array.isArray(itinerary?.destinations) ? itinerary?.destinations[0] : null) ||
    "Destination";

export const resolveAboutPlace = (rawAboutPlace: any, itineraryData: any) => {
    const primaryDest = getPrimaryDestination(itineraryData);
    const rawAbout = rawAboutPlace || itineraryData?.aboutPlace || itineraryData?.about_place || {};

    const title =
        rawAbout?.title ||
        itineraryData?.aboutPlaceTitle ||
        (primaryDest !== "Destination" ? `Discover ${primaryDest}` : "About The Destination");

    const description =
        rawAbout?.description ||
        rawAbout?.aboutText ||
        itineraryData?.overview ||
        itineraryData?.summary ||
        itineraryData?.aboutText ||
        `Explore the breathtaking sights, rich culture, and unforgettable experiences awaiting you on this luxury journey to ${primaryDest !== "Destination" ? primaryDest : "your destination"}.`;

    const rawHighlights =
        (Array.isArray(rawAbout?.highlights) && rawAbout.highlights.length > 0)
            ? rawAbout.highlights
            : (Array.isArray(itineraryData?.highlights) && itineraryData.highlights.length > 0)
                ? itineraryData.highlights
                : (itineraryData?.itinerary || [])
                    .map((d: any) => d.areaFocus || d.title || d.themeTitle)
                    .filter(Boolean)
                    .slice(0, 4);

    const highlights = rawHighlights.length > 0 ? rawHighlights : [
        `Curated daily excursions in ${primaryDest !== "Destination" ? primaryDest : "top locations"}`,
        "Handpicked luxury accommodations & stays",
        "Seamless transfers & dedicated travel support",
        "Exclusive local cultural & culinary experiences"
    ];

    const heroImageUrl = rawAbout?.heroImageUrl || itineraryData?.heroImageUrl || null;

    return {
        title,
        description,
        highlights,
        heroImageUrl,
    };
};

export const FALLBACK_IMG = '';
export const getDayImage = (day: any): string => day?.imageUrl || "";
export const getCoverImage = (itinerary: TravelItineraryOutput): string => {
    if (!itinerary?.itinerary || itinerary.itinerary.length === 0) return "";
    return getDayImage(itinerary.itinerary[0]);
};

export const formatTitleCase = (str?: string | null): string => {
    if (!str || typeof str !== 'string') return "";
    const trimmed = str.trim();
    if (!trimmed) return "";

    const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'via', 'with']);

    return trimmed
        .split(/\s+/)
        .map((word, index) => {
            const lower = word.toLowerCase();
            if (/^\d+[nd]$/i.test(word) || /^\d+n\d+d$/i.test(word)) {
                return word.toUpperCase();
            }
            if (index > 0 && minorWords.has(lower)) {
                return lower;
            }
            if (word === word.toUpperCase() && word.length > 1 && !/^[IVXLCDM]+$/i.test(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
};

export const formatDistance = (dist: string | number) => {
    if (!dist) return "0";
    const numMatch = String(dist).match(/[\d.]+/);
    return numMatch ? numMatch[0] : "0";
};

export const formatDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return "";
    return dateStr.replace(/^DAY\s*\d+/i, '').replace(/^-/, '').trim();
};

export const formatPlural = (count: number, singular: string, plural: string) => {
    return `${count} ${count === 1 ? singular : plural}`;
};

export const getSanitizedTitle = (title: string, itinerary: TravelItineraryOutput): string => {
    let displayTitle = title || (itinerary as any)?.tripTitle || (itinerary as any)?.title || "";
    if (displayTitle && displayTitle.toLowerCase().includes("exploration") && itinerary?.itinerary?.length > 0) {
        const distinctAreas = Array.from(new Set(itinerary.itinerary.map(day => day.areaFocus?.split(',')[0] || ""))).filter(Boolean);
        if (distinctAreas.length > 1) {
            displayTitle = `Journey: ${distinctAreas[0]} to ${distinctAreas[distinctAreas.length - 1]}`;
        }
    }
    return formatTitleCase(displayTitle);
};

