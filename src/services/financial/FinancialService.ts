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

  if (pricing?.costingType === 'manual') {
    let manualCost = 0;
    const totalPax = (pricing.adultPax || 0) + (pricing.childPax || 0) + (pricing.infantPax || 0);
    for (const item of pricing.manualOptions || []) {
      const amount = Number(item.amount) || 0;
      manualCost += item.type === 'per-person' ? amount * totalPax : amount;
    }
    return manualCost;
  }

  let cost = 0;

  for (const day of state.itinerary) {
    for (const step of day.timeline) {
      const c = Number(step.cost);
      if (!isNaN(c) && c > 0) cost += c;
    }
  }

  for (const h of state.hotels) {
    if (h.costAdult) cost += Number(h.costAdult) || 0;
    if (h.costChild) cost += Number(h.costChild) || 0;
    if (h.costInfant) cost += Number(h.costInfant) || 0;
  }

  for (const f of state.flights) {
    if (f.costAdult) cost += Number(f.costAdult) || 0;
    if (f.costChild) cost += Number(f.costChild) || 0;
    if (f.costInfant) cost += Number(f.costInfant) || 0;
  }

  for (const c of state.cabs || []) {
    if (c.totalCost) cost += Number(c.totalCost) || 0;
  }

  for (const b of state.buses || []) {
    if (b.costAdult) cost += Number(b.costAdult) || 0;
    if (b.costChild) cost += Number(b.costChild) || 0;
    if (b.costInfant) cost += Number(b.costInfant) || 0;
  }

  return cost;
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
 *  1. `client_price` DB column (set during save)
 *  2. Calculated from itinerary_data via the pricing engine
 *  3. `budget` fallback
 */
export function extractTripCost(trip: any): number {
  if (!trip) return 0;
  if (typeof trip === 'number') return trip;
  if (typeof trip.client_price === 'number' && trip.client_price > 0) return trip.client_price;

  const data = trip.itinerary_data || {};

  try {
    const { finalTotal } = calcPricingBreakdown({
      itinerary: data.itinerary || data.days || [],
      hotels: data.hotels || [],
      flights: data.flights || [],
      cabs: data.cabs || [],
      buses: data.buses || [],
      pricing: data.pricing || defaultPricingConfig,
    });
    return finalTotal > 0 ? finalTotal : (trip.budget ?? 0);
  } catch (e) {
    console.error('[FinancialService] Error in extractTripCost:', e);
    return trip.budget ?? 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency helpers (re-exported for convenience)
// ─────────────────────────────────────────────────────────────────────────────
export { getCurrencySymbol, formatMoney };
export { DEFAULT_CURRENCY };
export type { Currency };
