"use client";

/**
 * use-itinerary-pricing.ts
 *
 * Derived-values hook — equivalent to useCalculateTotal(itineraryId).
 * All monetary values in the UI must come from here — never calculated inline.
 * useMemo ensures recalculation only when itinerary/hotels/flights/pricing change.
 */

import { useMemo } from "react";
import { useItineraryContext } from "@/contexts/itinerary-context";
import { calcPricingBreakdown } from "@/services/financial";
import type { PricingBreakdown } from "@/services/financial";

export function useItineraryPricing(): PricingBreakdown {
  const { state } = useItineraryContext();

  return useMemo(
    () =>
      calcPricingBreakdown({
        itinerary: state.itinerary,
        hotels: state.hotels,
        flights: state.flights,
        cabs: state.cabs,
        buses: state.buses,
        pricing: state.pricing,
      }),
    // Recalculate whenever any cost-bearing field changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.itinerary, state.hotels, state.flights, state.cabs, state.buses, state.pricing]
  );
}

