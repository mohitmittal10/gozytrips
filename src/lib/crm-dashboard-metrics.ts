/**
 * Pure helpers and future-field specs for the CRM dashboard.
 *
 * Implemented today: destination labels, top destinations, seasonality by departure month,
 * trip duration buckets, repeat-client detection.
 *
 * Now implemented:
 * - `itinerary_status_events`: itinerary_id, from_status, to_status, changed_at, user_id (stage duration)
 * - `itineraries.expected_value` — pipeline value
 * - `itineraries.loss_reason` — win/loss analysis
 * - `itineraries.last_activity_at` — stale deals
 */

/**
 * Pipeline schema fields implemented via itinerary_status_events
 * and the expected_value/loss_reason/last_activity_at on itineraries.
 */
export type CrmPipelineFields = {
  /** ISO timestamps per stage transition; enables avg time in stage */
  statusHistoryTable?: "itinerary_status_events";
  /** Forward-looking open pipeline total */
  expectedQuoteAmount?: "itinerary.expected_value";
  /** Categorize lost deals */
  lossReason?: "itinerary.loss_reason";
  /** Last touch for stale-deal alerts */
  lastActivityAt?: "itinerary.last_activity_at";
};

export function isBookedTripStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "booked" || s === "confirmed";
}

/** Normalize for grouping (e.g. "Goa" and "goa" together) */
export function normalizeDestinationKey(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Best-effort primary destination label for analytics (matches CRM display logic).
 */
export function destinationLabelFromTrip(trip: Record<string, any>): string {
  let label = trip.destinations && trip.destinations !== "" ? String(trip.destinations) : "";
  if (!label && trip.title) {
    label = String(trip.title).replace(/^Trip to\s+/i, "");
  }
  if (!label && trip.itinerary_data?.itinerary) {
    const cities = (trip.itinerary_data.itinerary as any[])
      .map((day: any) => day.areaFocus?.split(",")[0]?.trim())
      .filter(Boolean);
    const uniqueCities = Array.from(new Set(cities));
    if (uniqueCities.length > 0) label = uniqueCities.join(", ");
  }
  if (!label) {
    label =
      trip.starting_location === trip.ending_location || !trip.ending_location
        ? trip.starting_location || "Unknown"
        : `${trip.starting_location} to ${trip.ending_location}`;
  }
  const first = label.split(",")[0]?.trim() || label;
  return first || "Unknown";
}

export type CountRow = { name: string; count: number };

export function computeTopDestinations(
  bookedTrips: Record<string, any>[],
  limit: number
): CountRow[] {
  const map = new Map<string, { display: string; count: number }>();
  for (const trip of bookedTrips) {
    const display = destinationLabelFromTrip(trip);
    const key = normalizeDestinationKey(display);
    const prev = map.get(key);
    if (prev) prev.count += 1;
    else map.set(key, { display: display || "Unknown", count: 1 });
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((v) => ({ name: v.display, count: v.count }));
}

/** Booked trips by calendar month of departure (start_date), last `monthsBack` months from "now" */
export function computeSeasonalityDepartures(
  bookedTrips: Record<string, any>[],
  monthsBack: number,
  now: Date = new Date()
): CountRow[] {
  const buckets: { monthDate: Date; name: string; count: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      monthDate: d,
      name: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      count: 0,
    });
  }

  for (const trip of bookedTrips) {
    const sd = new Date(trip.start_date);
    if (Number.isNaN(sd.getTime())) continue;
    const idx = buckets.findIndex(
      (b) => b.monthDate.getMonth() === sd.getMonth() && b.monthDate.getFullYear() === sd.getFullYear()
    );
    if (idx >= 0) buckets[idx].count += 1;
  }
  return buckets.map(({ name, count }) => ({ name, count }));
}

export function tripDurationDays(trip: Record<string, any>): number | null {
  if (!trip.start_date || !trip.end_date) return null;
  const a = new Date(trip.start_date).getTime();
  const b = new Date(trip.end_date).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
}

/** Calendar-day span (start → end). Bucket labels include the word "days" for clarity in the CRM. */
const DURATION_BUCKETS = [
  { label: "1–3 days", min: 1, max: 3 },
  { label: "4–7 days", min: 4, max: 7 },
  { label: "8–14 days", min: 8, max: 14 },
  { label: "15+ days", min: 15, max: Infinity },
] as const;

export function computeDurationBuckets(bookedTrips: Record<string, any>[]): CountRow[] {
  const counts = DURATION_BUCKETS.map((b) => ({ name: b.label, count: 0 }));
  for (const trip of bookedTrips) {
    const days = tripDurationDays(trip);
    if (days == null) continue;
    const i = DURATION_BUCKETS.findIndex((b) => days >= b.min && days <= b.max);
    if (i >= 0) counts[i].count += 1;
  }
  return counts;
}
