import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

export const getAgentInfo = (userProfile: any, agencySettings?: any) => ({
    primaryColor: userProfile?.brand_color || "#a855f7",
    agentName: userProfile?.full_name || agencySettings?.brand_name || "The Lab",
    companyName: userProfile?.company_name || agencySettings?.brand_name || "Wander Labs",
    agentPhone: userProfile?.business_phone || "",
    agentEmail: userProfile?.business_email || "",
    agentWebsite: userProfile?.website || "",
    agentBio: userProfile?.bio || "",
    tagline: agencySettings?.tagline || agencySettings?.brand_tagline || userProfile?.tagline || "Your custom travel blueprint, prepared by experts.",
    bankDetails: agencySettings?.bank_details || "",
    logoUrl: userProfile?.logo_url || "",
});

export const getTotalBudget = (itinerary: TravelItineraryOutput) => {
    if (!itinerary?.itinerary || !Array.isArray(itinerary.itinerary)) return 0;
    return itinerary.itinerary.reduce((sum, day) => {
        const raw = String((day as any).dailyStats?.totalCost || '0');
        const digits = raw.replace(/[₹$€£,]/g, '').match(/\d+(\.\d+)?/);
        return sum + (digits ? parseFloat(digits[0]) : 0);
    }, 0);
};

export const FALLBACK_IMG = '';
export const getDayImage = (day: any): string => day?.imageUrl || "";
export const getCoverImage = (itinerary: TravelItineraryOutput): string => {
    if (!itinerary?.itinerary || itinerary.itinerary.length === 0) return "";
    return getDayImage(itinerary.itinerary[0]);
};

export const formatTitleCase = (str: string) => {
    if (!str || typeof str !== 'string') return "";
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
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
    let displayTitle = title || "Your Tailored Itinerary";
    if (displayTitle.toLowerCase().includes("exploration") && itinerary?.itinerary?.length > 0) {
        const distinctAreas = Array.from(new Set(itinerary.itinerary.map(day => day.areaFocus?.split(',')[0] || ""))).filter(Boolean);
        if (distinctAreas.length > 1) {
            displayTitle = `Journey: ${distinctAreas[0]} to ${distinctAreas[distinctAreas.length - 1]}`;
        }
    }
    return displayTitle;
};

