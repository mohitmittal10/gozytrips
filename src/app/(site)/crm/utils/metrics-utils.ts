/**
 * @deprecated — Moved to @/services/crm
 * This shim exists to avoid breaking any imports not yet migrated.
 */
export {
  isBookedTripStatus,
  getTripCost,
  computeTopDestinations,
  computeSeasonalityDepartures,
  computeDurationBuckets,
  computeCrmMetrics,
  computeRecentActivity,
  enrichClients,
  type EnrichedClient,
  type DashboardFinanceRollup,
  type CrmMetrics,
} from '@/services/crm';
