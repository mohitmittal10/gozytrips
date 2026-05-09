/**
 * @deprecated — Moved to @/services/financial
 * This shim exists to avoid breaking any imports not yet migrated.
 */
export {
  calcBaseCost,
  calcMarkupAmount,
  calcTaxAmount,
  calcPricingFromBaseCost,
  calcPricingBreakdown,
  type PricingBreakdown,
  type MilestoneAmount,
} from '@/services/financial';
