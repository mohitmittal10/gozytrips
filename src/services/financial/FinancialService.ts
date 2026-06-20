/**
 * FinancialService.ts
 *
 * Authoritative module for all pure pricing and financial calculations.
 * Zero React imports, zero side-effects — safe to import on server and client.
 *
 * Consolidates:
 *  - src/lib/itinerary-calculator.ts  (pricing engine)
 *  - src/lib/financial-utils.ts        (trip cost extraction)
 */

import type { ItineraryState } from '@/types/itinerary-store';
import type { PricingConfig, PaymentMilestone, Currency } from '@/types/pricing';
import { DEFAULT_CURRENCY, defaultPricingConfig } from '@/types/pricing';
import { getCurrencySymbol, formatMoney } from '@/lib/utils/currency';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingBreakdown {
  baseCost: number;
  markupAmount: number;
  costWithMarkup: number;
  taxAmount: number;
  finalTotal: number;
  perAdult: number;
  perChild: number;
  totalPax: number;
  currencySymbol: string;
  milestoneAmounts: MilestoneAmount[];
}

export interface MilestoneAmount extends PaymentMilestone {
  amount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Engine (from itinerary-calculator.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sum of all trackable cost inputs:
 *  - timeline step costs (per activity)
 *  - hotel costs (adult + child + infant)
 *  - flight costs (adult + child + infant)
 *  - cab and bus costs
 */
export function calcBaseCost(
  state: Pick<ItineraryState, 'itinerary' | 'hotels' | 'flights' | 'cabs' | 'buses' | 'pricing'>,
): number {
  const { pricing } = state;
  const pax = {
    adult: pricing?.adultPax || 1,
    child: pricing?.childPax || 0,
    infant: pricing?.infantPax || 0
  };

  let manualCost = 0;
  const totalPax = pax.adult + pax.child + pax.infant;
  for (const item of (pricing?.manualOptions ?? []) as any[]) {
    const amount = Number(item.amount) || 0;
    manualCost += item.type === 'per-person' ? amount * totalPax : amount;
  }

  return manualCost;
}

export function calcMarkupAmount(baseCost: number, pricing: PricingConfig): number {
  const markupValue =
    pricing?.tiersEnabled && pricing?.tiers?.[pricing.selectedTier]?.isActive
      ? (pricing.tiers[pricing.selectedTier]?.markupValue ?? pricing.markupValue)
      : (pricing?.markupValue ?? 0);

  return pricing?.markupType === 'percentage'
    ? (baseCost * markupValue) / 100
    : markupValue;
}

export function calcTaxAmount(costWithMarkup: number, pricing: PricingConfig): number {
  return (costWithMarkup * (pricing?.taxPercentage || 0)) / 100;
}

/**
 * Calculates pricing details from a pre-calculated base cost.
 */
export function calcPricingFromBaseCost(
  baseCost: number,
  pricing: PricingConfig,
): Omit<PricingBreakdown, 'totalPax' | 'perAdult' | 'perChild' | 'currencySymbol'> {
  const markupAmount = calcMarkupAmount(baseCost, pricing);
  const costWithMarkup = baseCost + markupAmount;
  const taxAmount = calcTaxAmount(costWithMarkup, pricing);
  const finalTotal = costWithMarkup + taxAmount;

  const milestones = pricing?.milestones || [];
  const milestoneAmounts: MilestoneAmount[] = milestones.map((m) => ({
    ...m,
    amount: (finalTotal * m.percentage) / 100,
  }));

  return { baseCost, markupAmount, costWithMarkup, taxAmount, finalTotal, milestoneAmounts };
}

/**
 * Master calculation — returns all derived values from a single state snapshot.
 * Call via useItineraryPricing() to get memoised results in React.
 */
export function calcPricingBreakdown(
  state: Pick<ItineraryState, 'itinerary' | 'hotels' | 'flights' | 'cabs' | 'buses' | 'pricing'>,
): PricingBreakdown {
  const { pricing } = state;
  const baseCost = calcBaseCost(state);
  const results = calcPricingFromBaseCost(baseCost, pricing);

  const totalPax = (pricing?.adultPax || 0) + (pricing?.childPax || 0) + (pricing?.infantPax || 0);
  const perAdult = (pricing?.adultPax || 0) > 0 ? results.finalTotal / pricing.adultPax : results.finalTotal;
  const perChild = (pricing?.childPax || 0) > 0 ? results.finalTotal / pricing.childPax : 0;
  const currencySymbol = getCurrencySymbol(pricing?.currency || DEFAULT_CURRENCY);

  return { ...results, perAdult, perChild, totalPax, currencySymbol };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trip Cost Extraction (from financial-utils.ts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the total trip cost from a raw itinerary DB row.
 *
 * Priority:
 *  1. `client_price` DB column (set during save via the pricing tab)
 *  2. Calculated from itinerary_data via the pricing engine (hotels/flights/activities)
 *  3. AI-generated total — sum of dailyStats.totalCost across all days
 *  4. `budget` column fallback (user-entered total trip budget from form)
 */
export function extractTripCost(trip: any): number {
  if (!trip) return 0;
  if (typeof trip === 'number') return trip;
  if (typeof trip.client_price === 'number' && trip.client_price > 0) return trip.client_price;

  const data = trip.itinerary_data || {};

  // Tier 2: pricing engine (only meaningful when hotels/flights/activities have been filled in)
  try {
    const { finalTotal } = calcPricingBreakdown({
      itinerary: data.itinerary || data.days || [],
      hotels: data.hotels || [],
      flights: data.flights || [],
      cabs: data.cabs || [],
      buses: data.buses || [],
      pricing: data.pricing || defaultPricingConfig,
    });
    if (finalTotal > 0) return finalTotal;
  } catch (e) {
    console.error('[FinancialService] Error in extractTripCost (pricing engine):', e);
  }

  // Tier 3: AI-generated total — sum of each day's totalCost from dailyStats
  const days: any[] = data.itinerary || data.days || [];
  if (days.length > 0) {
    const aiTotal = days.reduce((sum: number, day: any) => {
      const raw = String(day?.dailyStats?.totalCost ?? '0');
      // Strip currency symbols and commas, then parse the first number found
      const digits = raw.replace(/[₹$€£,]/g, '').match(/\d+(\.\d+)?/);
      return sum + (digits ? parseFloat(digits[0]) : 0);
    }, 0);
    if (aiTotal > 0) return aiTotal;
  }

  // Tier 4: user-entered total trip budget
  return trip.budget ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency helpers (re-exported for convenience)
// ─────────────────────────────────────────────────────────────────────────────
export { getCurrencySymbol, formatMoney };
export { DEFAULT_CURRENCY };
export type { Currency };

