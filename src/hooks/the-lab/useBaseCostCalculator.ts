import { useMemo } from "react";
import { calcPricingBreakdown } from "@/services/financial/FinancialService";
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
  const breakdown = useMemo(() => {
    return calcPricingBreakdown({
      itinerary: itinerary?.itinerary || [],
      hotels,
      flights,
      cabs,
      buses,
      pricing: pricing as any
    });
  }, [itinerary, flights, hotels, cabs, buses, pricing]);

  return { 
    baseCost: breakdown.baseCost,
    finalTotal: breakdown.finalTotal,
    currencySymbol: breakdown.currencySymbol
  };
}


