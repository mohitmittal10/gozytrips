/**
 * @deprecated — Moved to @/services/crm
 * This shim exists to avoid breaking any imports not yet migrated.
 *
 * Note: CrmPipelineFields was a documentation-only type in this file with no
 * active consumers. It is re-declared here for backward-compat.
 */
export {
  isBookedTripStatus,
  normalizeDestinationKey,
  destinationLabelFromTrip,
  computeTopDestinations,
  computeSeasonalityDepartures,
  tripDurationDays,
  computeDurationBuckets,
} from '@/services/crm';

/** Pipeline schema fields — kept here for any static documentation references. */
export type CrmPipelineFields = {
  statusHistoryTable?: 'itinerary_status_events';
  expectedQuoteAmount?: 'itinerary.expected_value';
  lossReason?: 'itinerary.loss_reason';
  lastActivityAt?: 'itinerary.last_activity_at';
};

/** @deprecated Use CountRow from @/services/crm if needed */
export type CountRow = { name: string; count: number };

