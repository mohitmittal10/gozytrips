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
export function getItemBaseCostForPax(
  item: any,
  pax: { adultPax: number; childPax: number; infantPax: number }
): number {
  if (!item) return 0;
  const adult = Math.max(0, pax.adultPax || 0);
  const child = Math.max(0, pax.childPax || 0);
  const infant = Math.max(0, pax.infantPax || 0);
  const totalPax = adult + child + infant;

  if (
    typeof item.costAdult === 'number' ||
    typeof item.costChild === 'number' ||
    typeof item.costInfant === 'number' ||
    typeof item.flatCost === 'number'
  ) {
    const isFlat = item.costType === 'flat';
    const nights = item.nights || 1;
    if (isFlat) {
      return (item.flatCost ?? item.totalCost ?? 0) * (item.nights ? nights : 1);
    }
    const adultCost = (item.costAdult || 0) * adult;
    const childCost = (item.costChild || 0) * child;
    const infantCost = (item.costInfant || 0) * infant;
    return (adultCost + childCost + infantCost) * nights;
  }

  const amount = Number(item.amount) || 0;
  if (item.type === 'per-person') {
    return amount * (totalPax || 1);
  }
  return amount;
}

export function calcItemBaseCost(item: any, totalPax: number): number {
  const amount = Number(item.amount) || 0;
  return item.type === 'per-person' ? amount * (totalPax || 1) : amount;
}

export function calcItemMarkup(
  item: any,
  totalPax: number,
  fallbackMarkupType: string = 'percentage',
  fallbackMarkupValue: number = 0
): number {
  const itemBase = calcItemBaseCost(item, totalPax);
  const mType = item.markupType || fallbackMarkupType;
  const mVal = typeof item.markupValue === 'number' ? item.markupValue : fallbackMarkupValue;

  if (mType === 'percentage') {
    return (itemBase * mVal) / 100;
  } else {
    return item.type === 'per-person' ? mVal * (totalPax || 1) : mVal;
  }
}

export function calcBaseCost(
  state: Pick<ItineraryState, 'itinerary' | 'hotels' | 'flights' | 'cabs' | 'buses' | 'pricing'>,
): number {
  const { pricing, hotels, flights, cabs, buses, itinerary } = state;
  const pax = {
    adultPax: typeof pricing?.adultPax === 'number' ? pricing.adultPax : 2,
    childPax: typeof pricing?.childPax === 'number' ? pricing.childPax : 0,
    infantPax: typeof pricing?.infantPax === 'number' ? pricing.infantPax : 0,
  };
  const totalPax = pax.adultPax + pax.childPax + pax.infantPax;

  const manualOptions = (pricing?.manualOptions ?? []) as any[];
  if (manualOptions.length > 0) {
    let manualCost = 0;
    for (const item of manualOptions) {
      if (item.linkedItemId) {
        let linkedItem: any = null;
        if (item.category === 'Hotel') {
          linkedItem = (hotels || []).find((h) => h.id === item.linkedItemId);
        } else if (item.category === 'Flight') {
          linkedItem = (flights || []).find((f) => f.id === item.linkedItemId);
        } else if (item.category === 'Transport') {
          linkedItem =
            (cabs || []).find((c) => c.id === item.linkedItemId) ||
            (buses || []).find((b) => b.id === item.linkedItemId);
        }
        if (linkedItem) {
          manualCost += getItemBaseCostForPax(linkedItem, pax);
          continue;
        }
      }
      manualCost += calcItemBaseCost(item, totalPax);
    }
    return manualCost;
  }

  // Fallback auto-calculation if manualOptions is empty
  let autoCost = 0;
  (hotels || []).forEach((h: any) => { autoCost += getItemBaseCostForPax(h, pax); });
  (flights || []).forEach((f: any) => { autoCost += getItemBaseCostForPax(f, pax); });
  (cabs || []).forEach((c: any) => { autoCost += getItemBaseCostForPax(c, pax); });
  (buses || []).forEach((b: any) => { autoCost += getItemBaseCostForPax(b, pax); });
  (itinerary || []).forEach((day: any) => {
    (day.timeline || []).forEach((step: any) => {
      const stepCost = Number(step.cost) || 0;
      if (stepCost > 0) {
        autoCost += stepCost * (totalPax || 1);
      }
    });
  });

  return autoCost;
}

export function calcTotalMarkupAmount(
  state: Pick<ItineraryState, 'itinerary' | 'hotels' | 'flights' | 'cabs' | 'buses' | 'pricing'>,
): number {
  const { pricing, hotels, flights, cabs, buses } = state;
  const pax = {
    adultPax: typeof pricing?.adultPax === 'number' ? pricing.adultPax : 2,
    childPax: typeof pricing?.childPax === 'number' ? pricing.childPax : 0,
    infantPax: typeof pricing?.infantPax === 'number' ? pricing.infantPax : 0,
  };
  const totalPax = pax.adultPax + pax.childPax + pax.infantPax;

  const fallbackMarkupVal =
    pricing?.tiersEnabled && pricing?.tiers?.[pricing.selectedTier]?.isActive
      ? (pricing.tiers[pricing.selectedTier]?.markupValue ?? pricing.markupValue)
      : (pricing?.markupValue ?? 0);
  const fallbackMarkupType = pricing?.markupType || 'percentage';

  const items = (pricing?.manualOptions ?? []) as any[];
  if (items.length === 0) {
    const baseCost = calcBaseCost(state);
    return fallbackMarkupType === 'percentage'
      ? (baseCost * fallbackMarkupVal) / 100
      : fallbackMarkupVal * (totalPax || 1);
  }

  let totalMarkup = 0;
  for (const item of items) {
    let itemBase = calcItemBaseCost(item, totalPax);
    if (item.linkedItemId) {
      let linkedItem: any = null;
      if (item.category === 'Hotel') {
        linkedItem = (hotels || []).find((h) => h.id === item.linkedItemId);
      } else if (item.category === 'Flight') {
        linkedItem = (flights || []).find((f) => f.id === item.linkedItemId);
      } else if (item.category === 'Transport') {
        linkedItem =
          (cabs || []).find((c) => c.id === item.linkedItemId) ||
          (buses || []).find((b) => b.id === item.linkedItemId);
      }
      if (linkedItem) {
        itemBase = getItemBaseCostForPax(linkedItem, pax);
      }
    }
    const mType = item.markupType || fallbackMarkupType;
    const mVal = typeof item.markupValue === 'number' ? item.markupValue : fallbackMarkupVal;

    if (mType === 'percentage') {
      totalMarkup += (itemBase * mVal) / 100;
    } else {
      totalMarkup += item.type === 'per-person' ? mVal * (totalPax || 1) : mVal;
    }
  }
  return totalMarkup;
}

export function calcItemTax(
  item: any,
  totalPax: number,
  fallbackMarkupType: string = 'percentage',
  fallbackMarkupValue: number = 0,
  fallbackTaxPct: number = 0
): number {
  const itemBase = calcItemBaseCost(item, totalPax);
  const itemMarkup = calcItemMarkup(item, totalPax, fallbackMarkupType, fallbackMarkupValue);
  const itemCostWithMarkup = itemBase + itemMarkup;
  const taxPct = typeof item.taxPercentage === 'number' ? item.taxPercentage : fallbackTaxPct;
  return (itemCostWithMarkup * taxPct) / 100;
}

export function calcTotalTaxAmount(
  state: Pick<ItineraryState, 'itinerary' | 'hotels' | 'flights' | 'cabs' | 'buses' | 'pricing'>,
): number {
  const { pricing, hotels, flights, cabs, buses } = state;
  const pax = {
    adultPax: typeof pricing?.adultPax === 'number' ? pricing.adultPax : 2,
    childPax: typeof pricing?.childPax === 'number' ? pricing.childPax : 0,
    infantPax: typeof pricing?.infantPax === 'number' ? pricing.infantPax : 0,
  };
  const totalPax = pax.adultPax + pax.childPax + pax.infantPax;
  const fallbackMarkupVal =
    pricing?.tiersEnabled && pricing?.tiers?.[pricing.selectedTier]?.isActive
      ? (pricing.tiers[pricing.selectedTier]?.markupValue ?? pricing.markupValue)
      : (pricing?.markupValue ?? 0);
  const fallbackMarkupType = pricing?.markupType || 'percentage';
  const fallbackTaxPct = pricing?.taxPercentage || 0;

  const items = (pricing?.manualOptions ?? []) as any[];
  if (items.length === 0) {
    const baseCost = calcBaseCost(state);
    const markupAmount = calcTotalMarkupAmount(state);
    return ((baseCost + markupAmount) * fallbackTaxPct) / 100;
  }

  let totalTax = 0;
  for (const item of items) {
    let itemBase = calcItemBaseCost(item, totalPax);
    if (item.linkedItemId) {
      let linkedItem: any = null;
      if (item.category === 'Hotel') {
        linkedItem = (hotels || []).find((h) => h.id === item.linkedItemId);
      } else if (item.category === 'Flight') {
        linkedItem = (flights || []).find((f) => f.id === item.linkedItemId);
      } else if (item.category === 'Transport') {
        linkedItem =
          (cabs || []).find((c) => c.id === item.linkedItemId) ||
          (buses || []).find((b) => b.id === item.linkedItemId);
      }
      if (linkedItem) {
        itemBase = getItemBaseCostForPax(linkedItem, pax);
      }
    }
    const mType = item.markupType || fallbackMarkupType;
    const mVal = typeof item.markupValue === 'number' ? item.markupValue : fallbackMarkupVal;
    const itemMarkup = mType === 'percentage' ? (itemBase * mVal) / 100 : (item.type === 'per-person' ? mVal * (totalPax || 1) : mVal);
    const itemCostWithMarkup = itemBase + itemMarkup;
    const taxPct = typeof item.taxPercentage === 'number' ? item.taxPercentage : fallbackTaxPct;
    totalTax += (itemCostWithMarkup * taxPct) / 100;
  }
  return totalTax;
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
  const markupAmount = calcTotalMarkupAmount(state);
  const costWithMarkup = baseCost + markupAmount;
  const taxAmount = calcTotalTaxAmount(state);
  const finalTotal = costWithMarkup + taxAmount;

  const milestones = pricing?.milestones || [];
  const milestoneAmounts: MilestoneAmount[] = milestones.map((m) => ({
    ...m,
    amount: (finalTotal * m.percentage) / 100,
  }));

  const totalPax = (pricing?.adultPax || 0) + (pricing?.childPax || 0) + (pricing?.infantPax || 0);
  const perAdult = (pricing?.adultPax || 0) > 0 ? finalTotal / pricing.adultPax : finalTotal;
  const perChild = (pricing?.childPax || 0) > 0 ? finalTotal / pricing.childPax : 0;
  const currencySymbol = getCurrencySymbol(pricing?.currency || DEFAULT_CURRENCY);

  return { baseCost, markupAmount, costWithMarkup, taxAmount, finalTotal, milestoneAmounts, perAdult, perChild, totalPax, currencySymbol };
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

  const data = trip.itinerary_data || trip;

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
  return trip.budget ?? data.budget ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency helpers (re-exported for convenience)
// ─────────────────────────────────────────────────────────────────────────────
export { getCurrencySymbol, formatMoney };
export { DEFAULT_CURRENCY };
export type { Currency };

