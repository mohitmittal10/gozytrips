// Pure helper function for seeding trip line items into database or memory
// Reusable across TheLab and CRM
import { type TripLineItem } from "@/types/financial"; // TODO: verify import path if TripLineItem exists

export function buildLineItems({
  activeTripId,
  itinerary,
  hotels,
  flights,
  cabs,
  buses,
  paxInfo,
  pricingCfg,
}: {
  activeTripId: string;
  itinerary: any;
  hotels: any[];
  flights: any[];
  cabs: any[];
  buses: any[];
  paxInfo: { adult: number; child: number; infant: number };
  pricingCfg: any;
}) {
  const currency = pricingCfg?.currency || "INR";
  const markupPct = pricingCfg?.markupValue || 0;
  
  const lineItems: any[] = [];

  // Activities (per-day)
  if (itinerary?.itinerary) {
    itinerary.itinerary.forEach((day: any, dayIdx: number) => {
      if (Array.isArray(day.timeline)) {
        day.timeline.forEach((step: any) => {
          if (typeof step.cost === "number" && step.cost > 0) {
            lineItems.push({
              itinerary_id: activeTripId,
              title: step.details?.slice(0, 80) || `Day ${dayIdx + 1} Activity`,
              category: "activity",
              net_cost: step.cost,
              markup_percentage: markupPct,
              currency,
            });
          }
        });
      }
    });
  }

  // Hotels
  if (hotels && hotels.length > 0) {
    hotels.forEach((h: any) => {
      const cost =
        (h.costAdult || 0) * paxInfo.adult +
        (h.costChild || 0) * paxInfo.child +
        (h.costInfant || 0) * paxInfo.infant;
      if (cost > 0) {
        lineItems.push({
          itinerary_id: activeTripId,
          title: h.hotelName || "Hotel Accommodation",
          category: "hotel",
          net_cost: cost,
          markup_percentage: markupPct,
          currency,
        });
      }
    });
  }

  // Flights
  if (flights && flights.length > 0) {
    flights.forEach((f: any) => {
      const cost =
        (f.costAdult || 0) * paxInfo.adult +
        (f.costChild || 0) * paxInfo.child +
        (f.costInfant || 0) * paxInfo.infant;
      if (cost > 0) {
        lineItems.push({
          itinerary_id: activeTripId,
          title: `${f.departureAirport || "Dep"} → ${f.arrivalAirport || "Arr"} (${f.airline || f.flightNumber || "Flight"})`,
          category: "flight",
          net_cost: cost,
          markup_percentage: markupPct,
          currency,
        });
      }
    });
  }

  // Cabs
  if (cabs && cabs.length > 0) {
    cabs.forEach((c: any) => {
      if (c.totalCost && c.totalCost > 0) {
        lineItems.push({
          itinerary_id: activeTripId,
          title: `Cab: ${c.route || "Local Travel"} (${c.vehicleType || "Cab"})`,
          category: "transport",
          net_cost: c.totalCost,
          markup_percentage: markupPct,
          currency,
        });
      }
    });
  }

  // Tourist Bus
  if (buses && buses.length > 0) {
    buses.forEach((b: any) => {
      const cost =
        (b.costAdult || 0) * paxInfo.adult +
        (b.costChild || 0) * paxInfo.child +
        (b.costInfant || 0) * paxInfo.infant;
      if (cost > 0) {
        lineItems.push({
          itinerary_id: activeTripId,
          title: `Bus: ${b.route || "Travel"} (${b.busType || "Bus"})`,
          category: "transport",
          net_cost: cost,
          markup_percentage: markupPct,
          currency,
        });
      }
    });
  }

  return lineItems;
}

