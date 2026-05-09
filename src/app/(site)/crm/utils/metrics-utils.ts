import { type Client } from "@/lib/hooks/use-clients";
import { extractTripCost } from "@/lib/financial-utils";

// A combined type taking our client and adding the dynamic trip data
export interface EnrichedClient extends Client {
    latestStatus: string;
    latestDestination: string;
    latestBudget: string;
    latestRawBudget: number;
    latestContact: string;
    latestTripId?: string;
    bookedDestinations?: { id: string; label: string }[];
    allTrips: any[];
}


/** 
 * Helper function to extract total trip cost from itinerary data.
 * Redirects to the authoritative extractTripCost in financial-utils.ts
 */
export const getTripCost = (trip: any): number => {
    return extractTripCost(trip);
};

export const isBookedTripStatus = (status: string): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'booked' || s === 'confirmed' || s === 'completed';
};

export const computeTopDestinations = (clients: EnrichedClient[]) => {
    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#ddd6fe'];
    const counts: Record<string, number> = {};
    clients.forEach(c => {
        if (!c.allTrips) return;
        c.allTrips.forEach(t => {
            if (!isBookedTripStatus(t.status)) return;
            
            // Extract destination using same logic as enrichment
            let dest = '';
            if (t.destinations && t.destinations !== '') {
                dest = t.destinations;
            } else if (t.title) {
                dest = t.title.replace(/^Trip to\s+/i, '');
            } else if (t.starting_location) {
                dest = t.starting_location;
            }
            
            if (!dest) return;
            
            // Split comma-separated destinations and count each individually
            const parts = dest.split(',').map((d: string) => d.trim()).filter(Boolean);
            parts.forEach((p: string) => {
                counts[p] = (counts[p] || 0) + 1;
            });
        });
    });
    return Object.entries(counts)
        .map(([name, count], i) => ({ name, count, color: colors[i % colors.length] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
};

export const computeSeasonalityDepartures = (clients: EnrichedClient[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts: Record<string, number> = {};
    months.forEach(m => counts[m] = 0);

    const now = new Date();
    clients.forEach(c => {
        if (!c.allTrips) return;
        c.allTrips.forEach(t => {
            if (isBookedTripStatus(t.status) && t.start_date) {
                const d = new Date(t.start_date);
                if (d.getFullYear() === now.getFullYear()) {
                    counts[months[d.getMonth()]]++;
                }
            }
        });
    });

    return months.map(m => ({ month: m, trips: counts[m] }));
};

export const computeDurationBuckets = (clients: EnrichedClient[]) => {
    const buckets = [
        { range: '1-3 Days', count: 0, min: 1, max: 3 },
        { range: '4-7 Days', count: 0, min: 4, max: 7 },
        { range: '8-14 Days', count: 0, min: 8, max: 14 },
        { range: '15+ Days', count: 0, min: 15, max: 999 }
    ];

    clients.forEach(c => {
        if (!c.allTrips) return;
        c.allTrips.forEach(t => {
            if (isBookedTripStatus(t.status) && t.start_date && t.end_date) {
                const s = new Date(t.start_date);
                const e = new Date(t.end_date);
                const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const bucket = buckets.find(b => days >= b.min && days <= b.max);
                if (bucket) bucket.count++;
            }
        });
    });

    return buckets;
};

export interface DashboardFinanceRollup {
    tripLineNet: number;
    tripLineMarkup: number;
    tripLineGross: number;
    standaloneNet: number;
    standaloneMarkup: number;
    standaloneGross: number;
}

export interface CrmMetrics {
    activeTripsCount: number;
    bookedCount: number;
    totalProposals: number;
    conversionRate: number;
    bookedRevenue: number;
    standaloneRevenue: number;
    newClientsThisMonth: number;
    repeatClientStats: { repeat: number; pct: number };
    avgBookedTripValue: number;
    blendedMarginPct: number;
    packageVsStandaloneMix: {
        packageRev: number;
        standaloneRev: number;
        packagePct: number;
        standalonePct: number;
    };
    topDestinationsChart: any[];
    seasonalityChart: any[];
    durationBucketsChart: any[];
    durationMax: number;
    departureCalendarStats: { thisMonth: number; nextMonth: number };
    revenueByMonth: { month: string; revenue: number }[];
}

export const computeCrmMetrics = (
    enrichedClients: EnrichedClient[], 
    clients: Client[], 
    financeRollup: DashboardFinanceRollup
): CrmMetrics => {
    const activeTripsCount = enrichedClients.filter(c => 
        c.latestStatus.toLowerCase() !== "no active trips" && 
        c.latestStatus.toLowerCase() !== "completed" && 
        c.latestStatus.toLowerCase() !== "rejected"
    ).length;

    const bookedCount = enrichedClients.filter(c => 
        c.latestStatus.toLowerCase() === "booked" || 
        c.latestStatus.toLowerCase() === "confirmed"
    ).length;

    const totalProposals = enrichedClients.reduce((acc, c) => acc + (c.allTrips?.length || 0), 0);
    const conversionRate = totalProposals === 0 ? 0 : Math.round((bookedCount / totalProposals) * 100);
    
    const bookedRevenue = financeRollup.tripLineGross;
    const standaloneRevenue = financeRollup.standaloneGross;

    const now = new Date();
    const newClientsThisMonth = clients.filter(c => {
        const created = new Date(c.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    const repeatCount = enrichedClients.filter(c => (c.allTrips?.length || 0) > 1).length;
    const repeatPct = enrichedClients.length > 0 ? (repeatCount / enrichedClients.length) * 100 : 0;
    const repeatClientStats = { repeat: repeatCount, pct: Math.round(repeatPct) };

    const avgBookedTripValue = bookedCount === 0 ? 0 : (bookedRevenue + standaloneRevenue) / bookedCount;

    const totalGross = financeRollup.tripLineGross + financeRollup.standaloneGross;
    const totalMarkup = financeRollup.tripLineMarkup + financeRollup.standaloneMarkup;
    const blendedMarginPct = totalGross === 0 ? 0 : Math.round((totalMarkup / totalGross) * 100);

    const packageVsStandaloneMix = {
        packageRev: financeRollup.tripLineGross,
        standaloneRev: financeRollup.standaloneGross,
        packagePct: totalGross === 0 ? 0 : Math.round((financeRollup.tripLineGross / totalGross) * 100),
        standalonePct: totalGross === 0 ? 0 : Math.round((financeRollup.standaloneGross / totalGross) * 100)
    };

    const topDestinationsChart = computeTopDestinations(enrichedClients);
    const seasonalityChart = computeSeasonalityDepartures(enrichedClients);
    const durationBucketsChart = computeDurationBuckets(enrichedClients);
    const durationMax = Math.max(1, ...durationBucketsChart.map(b => b.count));

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const thisMonthCount = enrichedClients.reduce((acc, c) => acc + (c.allTrips?.filter(t => {
        if (!t.start_date) return false;
        const d = new Date(t.start_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && isBookedTripStatus(t.status);
    }).length || 0), 0);
    const nextMonthCount = enrichedClients.reduce((acc, c) => acc + (c.allTrips?.filter(t => {
        if (!t.start_date) return false;
        const d = new Date(t.start_date);
        return d.getMonth() === nextMonth.getMonth() && d.getFullYear() === nextMonth.getFullYear() && isBookedTripStatus(t.status);
    }).length || 0), 0);
    const departureCalendarStats = { thisMonth: thisMonthCount, nextMonth: nextMonthCount };

    const monthsMap: Record<string, number> = {};
    enrichedClients.forEach(c => {
        c.allTrips?.forEach(t => {
            if (t.start_date && isBookedTripStatus(t.status)) {
                const m = new Date(t.start_date).toLocaleString('default', { month: 'short' });
                monthsMap[m] = (monthsMap[m] || 0) + getTripCost(t);
            }
        });
    });
    const revenueByMonth = Object.entries(monthsMap).map(([month, revenue]) => ({ month, revenue }));

    return {
        activeTripsCount, bookedCount, totalProposals, conversionRate, bookedRevenue, standaloneRevenue,
        newClientsThisMonth, repeatClientStats, avgBookedTripValue, blendedMarginPct, packageVsStandaloneMix,
        topDestinationsChart, seasonalityChart, durationBucketsChart, durationMax,
        departureCalendarStats, revenueByMonth
    };
};

export const computeRecentActivity = (enrichedClients: EnrichedClient[]) => {
    const activities: any[] = [];
    enrichedClients.forEach(c => {
        activities.push({ 
            id: `client-${c.id}`, 
            type: 'client_added', 
            label: `New client added: ${c.name}`, 
            time: new Date(c.created_at), 
            icon: 'user' 
        });
        c.allTrips?.forEach(t => {
            activities.push({ 
                id: `trip-${t.id}`, 
                type: 'trip_created', 
                label: `New trip for ${c.name}: ${t.title}`, 
                time: new Date(t.created_at), 
                icon: 'plane' 
            });
        });
    });
    return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 50);
};
