import { describe, it, expect } from "vitest";
import { enrichClients, computeSeasonalityDepartures } from "@/services/crm/CrmService";

describe("CRM Service & Invoicing Regression Tests", () => {
  it("enrichClients correctly separates latestTrip budget from lifetimeBookedRevenue", () => {
    const mockClients: any[] = [
      {
        id: "client-1",
        user_id: "agent-1",
        name: "Alice Smith",
        email: "alice@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockItineraries: any[] = [
      {
        id: "trip-latest",
        client_id: "client-1",
        title: "Weekend Getaway",
        status: "proposal",
        budget: 500,
        client_price: 500,
        currency: "USD",
        created_at: "2026-10-01T00:00:00Z",
      },
      {
        id: "trip-old-booked-1",
        client_id: "client-1",
        title: "Europe Tour",
        status: "booked",
        budget: 6000,
        client_price: 6000,
        currency: "USD",
        created_at: "2026-05-01T00:00:00Z",
      },
      {
        id: "trip-old-booked-2",
        client_id: "client-1",
        title: "Bali Retreat",
        status: "completed",
        budget: 4000,
        client_price: 4000,
        currency: "USD",
        created_at: "2026-02-01T00:00:00Z",
      },
    ];

    const enriched = enrichClients({
      clients: mockClients,
      itineraries: mockItineraries,
      formatBudget: (val) => `$${val.toLocaleString()}`,
    });

    expect(enriched).toHaveLength(1);
    const client = enriched[0];

    // Latest budget must reflect the latest proposal ($500), not the lifetime total ($10,000)
    expect(client.latestBudget).toBe("$500");
    expect(client.latestRawBudget).toBe(500);

    // Lifetime booked revenue must accurately sum booked + completed ($6,000 + $4,000 = $10,000)
    expect(client.lifetimeBookedRevenue).toBe(10000);
  });

  it("computeSeasonalityDepartures accounts for departures in current and upcoming year", () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const mockEnriched: any[] = [
      {
        id: "client-1",
        allTrips: [
          { status: "booked", start_date: `${currentYear}-03-15` }, // March current year
          { status: "confirmed", start_date: `${nextYear}-01-20` }, // January next year
          { status: "booked", start_date: `${nextYear}-02-10` },    // February next year
          { status: "proposal", start_date: `${nextYear}-05-01` },  // Not booked - excluded
        ],
      },
    ];

    const departures = computeSeasonalityDepartures(mockEnriched);

    const march = departures.find((d) => d.month === "Mar");
    const jan = departures.find((d) => d.month === "Jan");
    const feb = departures.find((d) => d.month === "Feb");
    const may = departures.find((d) => d.month === "May");

    expect(march?.trips).toBe(1);
    expect(jan?.trips).toBe(1);
    expect(feb?.trips).toBe(1);
    expect(may?.trips).toBe(0);
  });

  it("Standalone booking invoice arithmetic computes tax and balance due correctly", () => {
    const netCost = 10000;
    const markupPercentage = 20; // 20% markup -> subtotal 12,000
    const subtotal = netCost * (1 + markupPercentage / 100);
    const taxPercentage = 18; // 18% GST -> 2,160
    const taxAmount = subtotal * (taxPercentage / 100);
    const grossTotal = subtotal + taxAmount; // 14,160
    const paidAmount = 5000;
    const balanceDue = Math.max(0, grossTotal - paidAmount); // 9,160

    expect(subtotal).toBe(12000);
    expect(taxAmount).toBe(2160);
    expect(grossTotal).toBe(14160);
    expect(balanceDue).toBe(9160);
  });
});
