/**
 * financial-utils.ts
 *
 * Pure utility functions for financial calculations.
 * Zero React imports, zero side-effects.
 */

import { calcPricingBreakdown } from "./itinerary-calculator";
import { defaultPricingConfig } from "@/types/pricing";

/**
 * Derives the total trip cost from a raw itinerary DB row.
 *
 * Maps raw itinerary_data to the structure required by itinerary-calculator.ts
 * and uses the shared calculation engine to ensure consistency.
 *
 * Falls back to `trip.budget` when the itinerary_data yields nothing.
 */
export function extractTripCost(trip: any): number {
    if (!trip) return 0;
    if (typeof trip === 'number') return trip;

    // Primary source of truth: top-level DB column maintained by persistence/save hooks
    if (typeof trip.client_price === 'number' && trip.client_price > 0) return trip.client_price;

    const data = trip.itinerary_data || {};
    
    try {
        const { finalTotal } = calcPricingBreakdown({
            itinerary: data.itinerary || data.days || [],
            hotels: data.hotels || [],
            flights: data.flights || [],
            cabs: data.cabs || [],
            buses: data.buses || [],
            pricing: data.pricing || defaultPricingConfig
        });

        return finalTotal > 0 ? finalTotal : (trip.budget ?? 0);
    } catch (e) {
        console.error("Error calculating trip cost in extractTripCost:", e);
        return trip.budget ?? 0;
    }
}

