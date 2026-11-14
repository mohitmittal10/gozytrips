import { describe, it, expect } from "vitest";
import { buildInvoiceLineItems } from "../src/services/financial/FinancialService";

describe("Invoice Line Items & Calculations (Itemized, Net Rate = Base + Markup, plus Tax/GST)", () => {
  it("calculates line items where net rate includes markup, and tax is computed on top of (base + markup)", () => {
    const items = buildInvoiceLineItems({
      adultPax: 2,
      childPax: 1,
      infantPax: 0,
      defaultTaxRate: 5,
      pricing: {
        markupValue: 10,
        markupType: "percentage",
        taxPercentage: 5,
      },
      hotels: [
        {
          id: "hotel-1",
          name: "Grand Hyatt Bali",
          checkIn: "2026-11-10",
          checkOut: "2026-11-13",
          nights: 3,
          starRating: 5,
          address: "Nusa Dua, Bali",
          bookingRef: "HYATT-7788",
          costType: "flat",
          flatCost: 10000,
        },
      ],
      flights: [
        {
          id: "flight-1",
          airline: "Singapore Airlines",
          flightNumber: "SQ 942",
          departureAirport: "SIN",
          arrivalAirport: "DPS",
          costType: "per-person",
          costAdult: 15000,
          costChild: 10000,
          pnr: "SQBALI1",
        },
      ],
      cabs: [
        {
          id: "cab-1",
          vehicleType: "Toyota Innova",
          route: "Airport to Nusa Dua & Sightseeing",
          pickupTime: "10:00 AM",
          costType: "flat",
          flatCost: 3500,
        },
      ],
      buses: [],
      itinerary: [
        {
          dayNumber: 1,
          timeline: [
            {
              time: "02:00 PM",
              title: "Scuba Diving Experience",
              cost: 2000,
              location: "Nusa Dua Reef",
            },
          ],
        },
      ],
    });

    expect(items.length).toBe(4);

    // Hotel: base 30000 + 10% markup (3000) = 33000 net rate; 5% tax = 1650
    const hotelItem = items.find((i) => i.category === "hotel");
    expect(hotelItem).toBeDefined();
    expect(hotelItem?.title).toBe("Grand Hyatt Bali");
    expect(hotelItem?.details).toContain("Check-in: 2026-11-10 · Check-out: 2026-11-13");
    expect(hotelItem?.details).toContain("3 Nights");
    expect(hotelItem?.details).toContain("5★");
    expect(hotelItem?.details).toContain("Ref: HYATT-7788");
    expect(hotelItem?.rate).toBe(33000); // Base (30000) + Markup (3000)
    expect(hotelItem?.taxAmount).toBe(1650); // 5% of 33000
    expect(hotelItem?.totalAmount).toBe(34650);

    // Flight: base 40000 + 10% markup (4000) = 44000 net rate; 5% tax = 2200
    const flightItem = items.find((i) => i.category === "flight");
    expect(flightItem).toBeDefined();
    expect(flightItem?.title).toBe("Singapore Airlines SQ 942");
    expect(flightItem?.details).toContain("SIN → DPS");
    expect(flightItem?.details).toContain("PNR: SQBALI1");
    expect(flightItem?.rate).toBe(44000); // Base (40000) + Markup (4000)
    expect(flightItem?.taxAmount).toBe(2200); // 5% of 44000
    expect(flightItem?.totalAmount).toBe(46200);

    // Cab: base 3500 + 10% markup (350) = 3850 net rate; 5% tax = 192.5
    const cabItem = items.find((i) => i.category === "transport");
    expect(cabItem).toBeDefined();
    expect(cabItem?.title).toBe("Toyota Innova Transfer");
    expect(cabItem?.details).toContain("Airport to Nusa Dua & Sightseeing");
    expect(cabItem?.details).toContain("Pickup: 10:00 AM");
    expect(cabItem?.rate).toBe(3850); // Base (3500) + Markup (350)
    expect(cabItem?.taxAmount).toBe(192.5);
    expect(cabItem?.totalAmount).toBe(4042.5);

    // Activity: base 6000 + 10% markup (600) = 6600 net rate; 5% tax = 330
    const actItem = items.find((i) => i.category === "activity");
    expect(actItem).toBeDefined();
    expect(actItem?.title).toBe("Scuba Diving Experience");
    expect(actItem?.details).toContain("Day 1 · 02:00 PM · Nusa Dua Reef");
    expect(actItem?.rate).toBe(6600); // Base (6000) + Markup (600)
    expect(actItem?.taxAmount).toBe(330);
    expect(actItem?.totalAmount).toBe(6930);

    // Mathematical consistency: sum of net rates (subtotal) = base + markup
    const subtotal = items.reduce((acc, i) => acc + i.rate, 0);
    const totalTax = items.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
    const grandTotal = items.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    expect(subtotal).toBe(33000 + 44000 + 3850 + 6600); // 87450
    expect(totalTax).toBe(1650 + 2200 + 192.5 + 330); // 4372.5
    expect(grandTotal).toBe(87450 + 4372.5); // 91822.5
  });

  it("handles 0% tax / exempt correctly without forcing a fixed 5% fallback", () => {
    const items = buildInvoiceLineItems({
      adultPax: 2,
      childPax: 0,
      infantPax: 0,
      defaultTaxRate: 0, // 0% tax / exempt
      pricing: {
        markupValue: 15,
        markupType: "percentage",
        taxPercentage: 0,
      },
      hotels: [
        {
          id: "hotel-0",
          name: "Heritage Haveli",
          nights: 2,
          costType: "flat",
          flatCost: 5000,
        },
      ],
    });

    expect(items.length).toBe(1);
    expect(items[0].rate).toBe(11500); // 10000 base + 15% markup (1500)
    expect(items[0].taxRate).toBe(0);
    expect(items[0].taxAmount).toBe(0); // 0 tax!
    expect(items[0].totalAmount).toBe(11500); // Matches rate exactly
  });

  it("falls back cleanly to Complete Travel Package with markup when no itemized logistics are present", () => {
    const items = buildInvoiceLineItems({
      adultPax: 2,
      childPax: 0,
      infantPax: 0,
      defaultTaxRate: 18,
      fallbackTitle: "Wonders of Rajasthan",
      fallbackDestination: "Jaipur, Udaipur",
      fallbackCostWithMarkup: 55000, // 50000 base + 5000 markup
    });

    expect(items.length).toBe(1);
    expect(items[0].category).toBe("package");
    expect(items[0].title).toBe("Complete Travel Package");
    expect(items[0].details).toContain("Wonders of Rajasthan · Jaipur, Udaipur");
    expect(items[0].rate).toBe(55000);
    expect(items[0].taxAmount).toBe(9900); // 18% of 55000
    expect(items[0].totalAmount).toBe(64900);
  });
});
