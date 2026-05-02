// Calculates base cost synchronously using useMemo for the given itinerary state
import { useMemo } from "react";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { type HotelInfo, type FlightInfo, type CabInfo, type BusInfo } from "@/components/hotel-flight-editor";
import { type PricingConfig } from "@/types/pricing";

interface BaseCostCalculatorProps {
  itinerary: TravelItineraryOutput | null;
  flights: FlightInfo[];
  hotels: HotelInfo[];
  cabs: CabInfo[];
  buses: BusInfo[];
  pricing?: PricingConfig;
}

export function useBaseCostCalculator({
  itinerary,
  flights,
  hotels,
  cabs,
  buses,
  pricing,
}: BaseCostCalculatorProps) {
  const baseCost = useMemo(() => {
    let cost = 0;

    // Activities cost
    if (itinerary && Array.isArray(itinerary.itinerary)) {
      itinerary.itinerary.forEach((day: any) => {
        if (day.timeline) {
          day.timeline.forEach((step: any) => {
            if (step.cost) cost += step.cost;
          });
        }
      });
    }

    const pax = {
      adult: pricing?.adultPax || 2,
      child: pricing?.childPax || 0,
      infant: pricing?.infantPax || 0
    };

    // Flights cost
    flights.forEach((f: any) => {
      if (f.costAdult) cost += f.costAdult * pax.adult;
      if (f.costChild) cost += f.costChild * pax.child;
      if (f.costInfant) cost += f.costInfant * pax.infant;
    });

    // Hotels cost
    hotels.forEach((h: any) => {
      if (h.costAdult) cost += h.costAdult * pax.adult;
      if (h.costChild) cost += h.costChild * pax.child;
      if (h.costInfant) cost += h.costInfant * pax.infant;
    });

    // Cabs cost
    cabs.forEach((c: any) => {
      if (c.totalCost) cost += c.totalCost;
    });

    // Buses cost
    buses.forEach((b: any) => {
      if (b.costAdult) cost += b.costAdult * pax.adult;
      if (b.costChild) cost += b.costChild * pax.child;
      if (b.costInfant) cost += b.costInfant * pax.infant;
    });

    return cost;
  }, [itinerary, flights, hotels, cabs, buses, pricing]);

  return { baseCost };
}
