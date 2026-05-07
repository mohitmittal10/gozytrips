import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

export const getAgentInfo = (userProfile: any, agencySettings?: any) => ({
    primaryColor: userProfile?.brand_color || "#a855f7",
    agentName: userProfile?.full_name || agencySettings?.brand_name || "Your Travel Architect",
    companyName: userProfile?.company_name || agencySettings?.brand_name || "OdysseyLuxe",
    agentPhone: userProfile?.business_phone || "",
    agentEmail: userProfile?.business_email || "",
    agentWebsite: userProfile?.website || "",
    agentBio: userProfile?.bio || "",
});

export const getTotalBudget = (itinerary: TravelItineraryOutput) => {
    if (!itinerary?.itinerary || !Array.isArray(itinerary.itinerary)) return 0;
    return itinerary.itinerary.reduce((sum, day) => {
        const costMatch = String(day.dailyStats?.totalCost || '0').match(/\d+/g);
        const cost = costMatch ? parseInt(costMatch.join(''), 10) : 0;
        return sum + cost;
    }, 0);
};

export const FALLBACK_IMG = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1080&auto=format&fit=crop';
export const getDayImage = (day: any): string => day?.imageUrl || FALLBACK_IMG;
export const getCoverImage = (itinerary: TravelItineraryOutput): string => {
    if (!itinerary?.itinerary || itinerary.itinerary.length === 0) return FALLBACK_IMG;
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
