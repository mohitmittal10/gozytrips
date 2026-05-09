/**
 * src/services/index.ts
 *
 * Top-level barrel. Import from here when you need multiple services,
 * or from the individual service barrel for tree-shaking.
 *
 * Example:
 *   import { BackupService } from '@/services/backup';
 *   import { enrichClients, computeCrmMetrics } from '@/services/crm';
 *   import { calcPricingBreakdown, extractTripCost } from '@/services/financial';
 *   import { updateItineraryStatus, vendorEnquiryService } from '@/services/itinerary';
 */

export * from './backup';
export * from './crm';
export * from './financial';
export * from './itinerary';
