import { type Client } from "@/lib/hooks/use-clients";

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
 */
export const getTripCost = (trip: any): number => {
    if (typeof trip === 'number') return trip;
    if (!trip) return 0;

    let totalBaseCost = 0;
    const data = trip.itinerary_data || {};

    const itineraryDays = data.itinerary || data.days || [];
    if (Array.isArray(itineraryDays)) {
        itineraryDays.forEach((day: any) => {
            if (Array.isArray(day.timeline)) {
                day.timeline.forEach((item: any) => {
                    if (typeof item.cost === 'number') {
                        totalBaseCost += item.cost;
                    }
                });
            } else if (day.dailyStats?.totalCost) {
                const costStr = day.dailyStats.totalCost.toString();
                const costNum = parseInt(costStr.replace(/[^\d]/g, ''), 10);
                totalBaseCost += isNaN(costNum) ? 0 : costNum;
            }
        });
    }

    const pax = {
        adult: data.pricing?.adultPax || 2,
        child: data.pricing?.childPax || 0,
        infant: data.pricing?.infantPax || 0
    };

    if (Array.isArray(data.hotels)) {
        data.hotels.forEach((h: any) => {
            if (h.costAdult) totalBaseCost += h.costAdult * pax.adult;
            if (h.costChild) totalBaseCost += h.costChild * pax.child;
            if (h.costInfant) totalBaseCost += h.costInfant * pax.infant;
        });
    }

    if (Array.isArray(data.flights)) {
        data.flights.forEach((f: any) => {
            if (f.costAdult) totalBaseCost += f.costAdult * pax.adult;
            if (f.costChild) totalBaseCost += f.costChild * pax.child;
            if (f.costInfant) totalBaseCost += f.costInfant * pax.infant;
        });
    }

    const pricing = data.pricing || {};
    const markupValue = pricing.markupValue || 0;
    const markupType = pricing.markupType || 'percentage';
    const taxPercentage = pricing.taxPercentage || 0;

    const markupAmount = markupType === 'percentage'
        ? (totalBaseCost * markupValue) / 100
        : markupValue;

    const costWithMarkup = totalBaseCost + markupAmount;
    const taxAmount = (costWithMarkup * taxPercentage) / 100;

    const finalTotal = costWithMarkup + taxAmount;

    if (finalTotal > 0) return finalTotal;
    return trip.budget || 0;
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
