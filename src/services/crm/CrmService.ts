/**
 * CrmService.ts
 *
 * Authoritative module for all CRM domain logic:
 *  - Client enrichment (attaching trip data to clients)
 *  - Metrics computation (dashboard KPIs, charts)
 *  - Recent activity aggregation
 *  - Destination and duration analytics helpers
 *
 * Consolidates:
 *  - src/app/(site)/crm/utils/metrics-utils.ts
 *  - src/lib/crm-dashboard-metrics.ts
 *
 * Zero React imports. Pure TypeScript — safe for server components, unit tests, and hooks.
 */

import { type Client } from '@/lib/hooks/use-clients';
import { extractTripCost } from '../financial';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────────────────────────

export function isBookedTripStatus(status: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'booked' || s === 'confirmed' || s === 'completed';
}

/** Wrapper kept for backward-compat; use extractTripCost directly for new code. */
export const getTripCost = (trip: any): number => extractTripCost(trip);

// ─────────────────────────────────────────────────────────────────────────────
// Destination helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalize for grouping (e.g. "Goa" and "goa" → same bucket) */
export function normalizeDestinationKey(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Best-effort primary destination label for a raw itinerary DB row.
 * Matches the display logic used in the CRM enrichment pipeline.
 */
export function destinationLabelFromTrip(trip: Record<string, any>): string {
  let label = trip.destinations && trip.destinations !== '' ? String(trip.destinations) : '';
  if (!label && trip.title) {
    label = String(trip.title).replace(/^Trip to\s+/i, '');
  }
  if (!label && trip.itinerary_data?.itinerary) {
    const cities = (trip.itinerary_data.itinerary as any[])
      .map((day: any) => day.areaFocus?.split(',')[0]?.trim())
      .filter(Boolean);
    const uniqueCities = Array.from(new Set(cities));
    if (uniqueCities.length > 0) label = uniqueCities.join(', ');
  }
  if (!label) {
    label =
      trip.starting_location === trip.ending_location || !trip.ending_location
        ? trip.starting_location || 'Unknown'
        : `${trip.starting_location} to ${trip.ending_location}`;
  }
  const first = label.split(',')[0]?.trim() || label;
  return first || 'Unknown';
}

/** Calendar-day span. Returns null if dates are missing or invalid. */
export function tripDurationDays(trip: Record<string, any>): number | null {
  if (!trip.start_date || !trip.end_date) return null;
  const a = new Date(trip.start_date).getTime();
  const b = new Date(trip.end_date).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Enrichment
// ─────────────────────────────────────────────────────────────────────────────

interface EnrichClientsOptions {
  clients: Client[];
  itineraries: any[];
  defaultCurrency?: string;
  formatBudget: (amount: number) => string;
}

/**
 * Pure enrichment function — attaches itinerary data to each client.
 *
 * Extracted from useCrmData.ts (lines 104–147) so it can be unit-tested
 * without mounting a React component.
 *
 * @param options.clients       Raw clients from the DB
 * @param options.itineraries   Raw itineraries from the DB (pre-fetched)
 * @param options.formatBudget  Formatting function provided by the caller (currency-aware)
 */
export function enrichClients({ clients, itineraries, formatBudget }: EnrichClientsOptions): EnrichedClient[] {
  return clients.map((client) => {
    const clientTrips = itineraries.filter((it) => it.client_id === client.id);

    const totalBookedRevenue = clientTrips
      .filter((t) => isBookedTripStatus(t.status))
      .reduce((acc, t) => acc + getTripCost(t), 0);

    const latestTrip = clientTrips[0];
    const latestCalculatedBudget = latestTrip ? getTripCost(latestTrip) : 0;

    const bookedTrips = clientTrips.filter((t) => isBookedTripStatus(t.status));
    const tripsToRender = bookedTrips.length > 0 ? bookedTrips : latestTrip ? [latestTrip] : [];

    const bookedDestinations = tripsToRender.map((t) => {
      let label = t.destinations && t.destinations !== '' ? t.destinations : '';
      if (!label && t.title) label = t.title.replace(/^Trip to\s+/i, '');
      if (!label && t.itinerary_data?.itinerary) {
        const cities = t.itinerary_data.itinerary
          .map((day: any) => day.areaFocus?.split(',')[0]?.trim())
          .filter(Boolean);
        const uniqueCities = Array.from(new Set(cities));
        if (uniqueCities.length > 0) label = uniqueCities.join(', ');
      }
      if (!label) {
        label =
          t.starting_location === t.ending_location || !t.ending_location
            ? t.starting_location
            : `${t.starting_location} to ${t.ending_location}`;
      }
      return { id: t.id, label };
    });

    return {
      ...client,
      tags: client.tags || [],
      latestStatus: latestTrip?.status || 'No Active Trips',
      latestDestination:
        bookedDestinations.length > 0 ? bookedDestinations.map((d) => d.label).join(', ') : 'N/A',
      bookedDestinations,
      latestBudget:
        totalBookedRevenue > 0
          ? formatBudget(totalBookedRevenue)
          : latestCalculatedBudget > 0
            ? formatBudget(latestCalculatedBudget)
            : 'N/A',
      latestRawBudget: totalBookedRevenue > 0 ? totalBookedRevenue : latestCalculatedBudget,
      latestContact: new Date(client.updated_at).toLocaleDateString(),
      latestTripId: latestTrip?.id,
      allTrips: clientTrips,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Charts
// ─────────────────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#ddd6fe'];

export function computeTopDestinations(clients: EnrichedClient[]): any[] {
  const counts: Record<string, number> = {};

  clients.forEach((c) => {
    if (!c.allTrips) return;
    c.allTrips.forEach((t) => {
      if (!isBookedTripStatus(t.status)) return;
      const dest = destinationLabelFromTrip(t);
      if (!dest || dest === 'Unknown') return;
      const parts = dest.split(',').map((d: string) => d.trim()).filter(Boolean);
      parts.forEach((p: string) => { counts[p] = (counts[p] || 0) + 1; });
    });
  });

  return Object.entries(counts)
    .map(([name, count], i) => ({ name, count, color: CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function computeSeasonalityDepartures(clients: EnrichedClient[]): any[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts: Record<string, number> = {};
  months.forEach((m) => (counts[m] = 0));

  const now = new Date();
  clients.forEach((c) => {
    if (!c.allTrips) return;
    c.allTrips.forEach((t) => {
      if (isBookedTripStatus(t.status) && t.start_date) {
        const d = new Date(t.start_date);
        if (d.getFullYear() === now.getFullYear()) {
          counts[months[d.getMonth()]]++;
        }
      }
    });
  });

  return months.map((m) => ({ month: m, trips: counts[m] }));
}

const DURATION_BUCKETS = [
  { range: '1-3 Days', count: 0, min: 1, max: 3 },
  { range: '4-7 Days', count: 0, min: 4, max: 7 },
  { range: '8-14 Days', count: 0, min: 8, max: 14 },
  { range: '15+ Days', count: 0, min: 15, max: 999 },
] as const;

export function computeDurationBuckets(clients: EnrichedClient[]): any[] {
  const buckets = DURATION_BUCKETS.map((b) => ({ ...b }));

  clients.forEach((c) => {
    if (!c.allTrips) return;
    c.allTrips.forEach((t) => {
      if (isBookedTripStatus(t.status) && t.start_date && t.end_date) {
        const days = tripDurationDays(t);
        if (days == null) return;
        const bucket = buckets.find((b) => days >= b.min && days <= b.max);
        if (bucket) bucket.count++;
      }
    });
  });

  return buckets;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics Computation
// ─────────────────────────────────────────────────────────────────────────────

export function computeCrmMetrics(
  enrichedClients: EnrichedClient[],
  clients: Client[],
  financeRollup: DashboardFinanceRollup,
): CrmMetrics {
  const activeTripsCount = enrichedClients.filter(
    (c) =>
      c.latestStatus.toLowerCase() !== 'no active trips' &&
      c.latestStatus.toLowerCase() !== 'completed' &&
      c.latestStatus.toLowerCase() !== 'rejected',
  ).length;

  const bookedCount = enrichedClients.filter(
    (c) =>
      c.latestStatus.toLowerCase() === 'booked' || c.latestStatus.toLowerCase() === 'confirmed',
  ).length;

  const totalProposals = enrichedClients.reduce((acc, c) => acc + (c.allTrips?.length || 0), 0);
  const conversionRate = totalProposals === 0 ? 0 : Math.round((bookedCount / totalProposals) * 100);

  const bookedRevenue = financeRollup.tripLineGross;
  const standaloneRevenue = financeRollup.standaloneGross;

  const now = new Date();
  const newClientsThisMonth = clients.filter((c) => {
    const created = new Date(c.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const repeatCount = enrichedClients.filter((c) => (c.allTrips?.length || 0) > 1).length;
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
    standalonePct:
      totalGross === 0 ? 0 : Math.round((financeRollup.standaloneGross / totalGross) * 100),
  };

  const topDestinationsChart = computeTopDestinations(enrichedClients);
  const seasonalityChart = computeSeasonalityDepartures(enrichedClients);
  const durationBucketsChart = computeDurationBuckets(enrichedClients);
  const durationMax = Math.max(1, ...durationBucketsChart.map((b) => b.count));

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const thisMonthCount = enrichedClients.reduce(
    (acc, c) =>
      acc +
      (c.allTrips?.filter((t) => {
        if (!t.start_date) return false;
        const d = new Date(t.start_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          isBookedTripStatus(t.status)
        );
      }).length || 0),
    0,
  );
  const nextMonthCount = enrichedClients.reduce(
    (acc, c) =>
      acc +
      (c.allTrips?.filter((t) => {
        if (!t.start_date) return false;
        const d = new Date(t.start_date);
        return (
          d.getMonth() === nextMonth.getMonth() &&
          d.getFullYear() === nextMonth.getFullYear() &&
          isBookedTripStatus(t.status)
        );
      }).length || 0),
    0,
  );
  const departureCalendarStats = { thisMonth: thisMonthCount, nextMonth: nextMonthCount };

  const monthsMap: Record<string, number> = {};
  enrichedClients.forEach((c) => {
    c.allTrips?.forEach((t) => {
      if (t.start_date && isBookedTripStatus(t.status)) {
        const m = new Date(t.start_date).toLocaleString('default', { month: 'short' });
        monthsMap[m] = (monthsMap[m] || 0) + getTripCost(t);
      }
    });
  });
  const revenueByMonth = Object.entries(monthsMap).map(([month, revenue]) => ({ month, revenue }));

  return {
    activeTripsCount, bookedCount, totalProposals, conversionRate,
    bookedRevenue, standaloneRevenue, newClientsThisMonth, repeatClientStats,
    avgBookedTripValue, blendedMarginPct, packageVsStandaloneMix,
    topDestinationsChart, seasonalityChart, durationBucketsChart, durationMax,
    departureCalendarStats, revenueByMonth,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent Activity
// ─────────────────────────────────────────────────────────────────────────────

export function computeRecentActivity(enrichedClients: EnrichedClient[]): any[] {
  const activities: any[] = [];
  enrichedClients.forEach((c) => {
    activities.push({
      id: `client-${c.id}`,
      type: 'client_added',
      label: `New client added: ${c.name}`,
      time: new Date(c.created_at),
      icon: 'user',
    });
    c.allTrips?.forEach((t) => {
      activities.push({
        id: `trip-${t.id}`,
        type: 'trip_created',
        label: `New trip for ${c.name}: ${t.title}`,
        time: new Date(t.created_at),
        icon: 'plane',
      });
    });
  });
  return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 50);
}
