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
import type { InvoiceLineItem } from '@/types/financial';
import { DEFAULT_CURRENCY, defaultPricingConfig } from '@/types/pricing';
import { getCurrencySymbol, formatMoney } from '@/lib/utils/currency';
import { filterCompleteEntriesForExport, isEntryCompleteForExport } from '@/lib/validation/logistics-validation';

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
    const nights = (typeof item.nights === 'number' && item.nights > 0)
      ? item.nights
      : (Array.isArray(item.dayIndices) && item.dayIndices.length > 0 ? item.dayIndices.length : 1);
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

  // Fallback auto-calculation if manualOptions is empty (only complete items)
  let autoCost = 0;
  filterCompleteEntriesForExport(hotels || [], 'hotel').forEach((h: any) => { autoCost += getItemBaseCostForPax(h, pax); });
  filterCompleteEntriesForExport(flights || [], 'flight').forEach((f: any) => { autoCost += getItemBaseCostForPax(f, pax); });
  filterCompleteEntriesForExport(cabs || [], 'cab').forEach((c: any) => { autoCost += getItemBaseCostForPax(c, pax); });
  filterCompleteEntriesForExport(buses || [], 'bus').forEach((b: any) => { autoCost += getItemBaseCostForPax(b, pax); });
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

/**
 * Calculates client-facing rate and amount for an itemized line item (manualOption).
 * Base cost is NEVER revealed to the client — instead, rate and amount reflect
 * the final item price including any item-level or global markup.
 */
export function calcItemClientPrice(
  item: any,
  totalPax: number,
  pricing?: PricingConfig,
  logistics?: {
    hotels?: any[];
    flights?: any[];
    cabs?: any[];
    buses?: any[];
    pax?: { adultPax: number; childPax: number; infantPax: number };
  }
): { qty: number; rate: number; amount: number } {
  const qty = item.type === 'per-person' ? (totalPax || 1) : 1;
  let itemBase = calcItemBaseCost(item, totalPax);

  if (item.linkedItemId && logistics) {
    let linkedItem: any = null;
    if (item.category === 'Hotel') {
      linkedItem = (logistics.hotels || []).find((h: any) => h.id === item.linkedItemId);
    } else if (item.category === 'Flight') {
      linkedItem = (logistics.flights || []).find((f: any) => f.id === item.linkedItemId);
    } else if (item.category === 'Transport') {
      linkedItem =
        (logistics.cabs || []).find((c: any) => c.id === item.linkedItemId) ||
        (logistics.buses || []).find((b: any) => b.id === item.linkedItemId);
    }
    if (linkedItem && logistics.pax) {
      itemBase = getItemBaseCostForPax(linkedItem, logistics.pax);
    }
  }

  const fallbackMarkupVal =
    pricing?.tiersEnabled && pricing?.tiers?.[pricing.selectedTier]?.isActive
      ? (pricing.tiers[pricing.selectedTier]?.markupValue ?? pricing.markupValue ?? 0)
      : (pricing?.markupValue ?? 0);
  const fallbackMarkupType = pricing?.markupType || 'percentage';
  const mType = item.markupType || fallbackMarkupType;
  const mVal = typeof item.markupValue === 'number' ? item.markupValue : fallbackMarkupVal;

  const itemMarkup = (mType === 'percentage')
    ? (itemBase * mVal) / 100
    : (item.type === 'per-person' ? mVal * (totalPax || 1) : mVal);

  const amount = itemBase + itemMarkup;
  const rate = qty > 0 ? amount / qty : amount;
  return { qty, rate, amount };
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
  const fallbackTaxPct = typeof pricing?.taxPercentage === "number" ? pricing.taxPercentage : 0;

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


// ─────────────────────────────────────────────────────────────────────────────
// Invoice Line Items Builder (Itemized, Net Rate = Base Cost + Markup, plus Tax/GST)
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildInvoiceLineItemsParams {
  hotels?: any[] | null;
  flights?: any[] | null;
  cabs?: any[] | null;
  buses?: any[] | null;
  itinerary?: any[] | null;
  pricing?: any | null;
  manualOptions?: any[] | null;
  adultPax?: number;
  childPax?: number;
  infantPax?: number;
  defaultTaxRate?: number;
  fallbackTitle?: string;
  fallbackDestination?: string;
  fallbackBaseCost?: number;
  fallbackCostWithMarkup?: number;
}

export function buildInvoiceLineItems(params: BuildInvoiceLineItemsParams): InvoiceLineItem[] {
  const adultPax = typeof params.adultPax === 'number' ? Math.max(0, params.adultPax) : Math.max(0, params.pricing?.adultPax ?? 2);
  const childPax = typeof params.childPax === 'number' ? Math.max(0, params.childPax) : Math.max(0, params.pricing?.childPax ?? 0);
  const infantPax = typeof params.infantPax === 'number' ? Math.max(0, params.infantPax) : Math.max(0, params.pricing?.infantPax ?? 0);
  const pax = { adultPax, childPax, infantPax };
  const totalPax = adultPax + childPax + infantPax;

  const fallbackMarkupVal =
    params.pricing?.tiersEnabled && params.pricing?.tiers?.[params.pricing.selectedTier]?.isActive
      ? (params.pricing.tiers[params.pricing.selectedTier]?.markupValue ?? params.pricing.markupValue ?? 0)
      : (params.pricing?.markupValue ?? 0);
  const fallbackMarkupType = params.pricing?.markupType || 'percentage';

  const globalTaxRate = typeof params.defaultTaxRate === 'number'
    ? params.defaultTaxRate
    : (typeof params.pricing?.taxPercentage === 'number' ? params.pricing.taxPercentage : 0);

  const manualList = (params.manualOptions || params.pricing?.manualOptions || []) as any[];

  const paxParts: string[] = [];
  if (adultPax > 0) paxParts.push(`${adultPax} Adult${adultPax > 1 ? 's' : ''}`);
  if (childPax > 0) paxParts.push(`${childPax} Child${childPax > 1 ? 'ren' : ''}`);
  if (infantPax > 0) paxParts.push(`${infantPax} Infant${infantPax > 1 ? 's' : ''}`);
  const standardPaxLabel = paxParts.join(' · ') || '1 Pax';

  const getItemPricing = (
    itemId: string | undefined,
    itemBase: number,
    itemCostType: string | undefined,
    directTaxPct?: number
  ) => {
    const matchingManual = itemId
      ? manualList.find((m: any) => m.linkedItemId === itemId || m.id === itemId)
      : undefined;

    const mType = matchingManual?.markupType || fallbackMarkupType;
    const mVal = typeof matchingManual?.markupValue === 'number'
      ? matchingManual.markupValue
      : fallbackMarkupVal;

    let itemMarkup = 0;
    if (mType === 'percentage') {
      itemMarkup = (itemBase * mVal) / 100;
    } else {
      const isFlat = itemCostType === 'flat' || (matchingManual && matchingManual.type !== 'per-person');
      itemMarkup = isFlat ? mVal : mVal * (totalPax || 1);
    }

    const itemTaxRate = typeof matchingManual?.taxPercentage === 'number'
      ? matchingManual.taxPercentage
      : (typeof directTaxPct === 'number' ? directTaxPct : globalTaxRate);

    // Client-facing Net Rate on invoice = base cost + markup
    const netRate = Math.round((itemBase + itemMarkup) * 100) / 100;
    const taxAmount = Math.round(((netRate * itemTaxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((netRate + taxAmount) * 100) / 100;

    return {
      baseCost: itemBase,
      markupAmount: itemMarkup,
      netRate,
      itemTaxRate,
      taxAmount,
      totalAmount,
    };
  };

  const items: InvoiceLineItem[] = [];

  // 1. Hotels
  (params.hotels || []).forEach((h: any, idx: number) => {
    const itemBase = getItemBaseCostForPax(h, pax);
    const pricing = getItemPricing(h.id, itemBase, h.costType, h.taxPercentage);
    if (pricing.netRate > 0 || (h.name && h.name.trim())) {
      const nights = (typeof h.nights === 'number' && h.nights > 0)
        ? h.nights
        : (Array.isArray(h.dayIndices) && h.dayIndices.length > 0 ? h.dayIndices.length : 1);

      const detailsList: string[] = [];
      if (h.checkIn && h.checkOut) {
        detailsList.push(`Check-in: ${h.checkIn} · Check-out: ${h.checkOut}`);
      } else if (h.checkIn) {
        detailsList.push(`Check-in: ${h.checkIn}`);
      }
      if (nights > 0) {
        detailsList.push(`${nights} Night${nights > 1 ? 's' : ''}`);
      }
      if (h.address) {
        detailsList.push(h.address);
      }
      if (h.bookingRef) {
        detailsList.push(`Ref: ${h.bookingRef}`);
      }
      if (h.starRating) {
        detailsList.push(`${h.starRating}★`);
      }

      items.push({
        id: h.id || `hotel-${idx}`,
        category: 'hotel',
        title: h.name ? `${h.name}` : `Hotel Stay (${nights}N)`,
        details: detailsList.join(' · ') || undefined,
        pax: h.costType === 'flat' ? `${nights} Night${nights > 1 ? 's' : ''}` : standardPaxLabel,
        qty: nights,
        rate: pricing.netRate,
        taxRate: pricing.itemTaxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      });
    }
  });

  // 2. Flights
  (params.flights || []).forEach((f: any, idx: number) => {
    const itemBase = getItemBaseCostForPax(f, pax);
    const pricing = getItemPricing(f.id, itemBase, f.costType, f.taxPercentage);
    if (pricing.netRate > 0 || (f.airline && f.airline.trim()) || (f.flightNumber && f.flightNumber.trim())) {
      const routeParts: string[] = [];
      const from = f.departureAirport || f.departure;
      const to = f.arrivalAirport || f.arrival;
      if (from && to) {
        routeParts.push(`${from} → ${to}`);
      } else if (f.departure && f.arrival) {
        routeParts.push(`${f.departure} → ${f.arrival}`);
      }
      if (f.terminal) {
        routeParts.push(`Terminal: ${f.terminal}`);
      }
      if (f.pnr) {
        routeParts.push(`PNR: ${f.pnr}`);
      }
      if (f.layover) {
        routeParts.push(`Layover: ${f.layover}`);
      }
      if (f.connectingFlightNumber) {
        routeParts.push(`Connecting: ${f.connectingAirline || ''} ${f.connectingFlightNumber}`.trim());
      }

      const title = [f.airline, f.flightNumber].filter(Boolean).join(' ') || 'Flight Booking';

      items.push({
        id: f.id || `flight-${idx}`,
        category: 'flight',
        title,
        details: routeParts.join(' · ') || undefined,
        pax: standardPaxLabel,
        qty: adultPax + childPax || 1,
        rate: pricing.netRate,
        taxRate: pricing.itemTaxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      });
    }
  });

  // 3. Cabs
  (params.cabs || []).forEach((c: any, idx: number) => {
    const itemBase = getItemBaseCostForPax(c, pax);
    const pricing = getItemPricing(c.id, itemBase, c.costType || 'flat', c.taxPercentage);
    if (pricing.netRate > 0 || (c.vehicleType && c.vehicleType.trim()) || (c.route && c.route.trim())) {
      const detailsList: string[] = [];
      if (c.route) detailsList.push(c.route);
      if (c.pickupTime) detailsList.push(`Pickup: ${c.pickupTime}`);
      if (c.driverName) detailsList.push(`Driver: ${c.driverName}${c.driverContact ? ` (${c.driverContact})` : ''}`);
      if (c.bookingRef) detailsList.push(`Ref: ${c.bookingRef}`);

      const title = c.vehicleType ? `${c.vehicleType} Transfer` : 'Cab / Private Transfer';

      items.push({
        id: c.id || `cab-${idx}`,
        category: 'transport',
        title,
        details: detailsList.join(' · ') || undefined,
        pax: c.costType === 'per-person' ? standardPaxLabel : '1 Vehicle',
        qty: 1,
        rate: pricing.netRate,
        taxRate: pricing.itemTaxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      });
    }
  });

  // 4. Buses
  (params.buses || []).forEach((b: any, idx: number) => {
    const itemBase = getItemBaseCostForPax(b, pax);
    const pricing = getItemPricing(b.id, itemBase, b.costType, b.taxPercentage);
    if (pricing.netRate > 0 || (b.busType && b.busType.trim()) || (b.route && b.route.trim())) {
      const detailsList: string[] = [];
      if (b.route) detailsList.push(b.route);
      if (b.reportingTime) detailsList.push(`Reporting: ${b.reportingTime}`);
      if (b.departureTime) detailsList.push(`Departure: ${b.departureTime}`);
      if (b.pnr) detailsList.push(`PNR: ${b.pnr}`);

      const title = b.busType ? `${b.busType} Coach` : 'Bus Transfer';

      items.push({
        id: b.id || `bus-${idx}`,
        category: 'transport',
        title,
        details: detailsList.join(' · ') || undefined,
        pax: b.costType === 'flat' ? '1 Charter' : standardPaxLabel,
        qty: 1,
        rate: pricing.netRate,
        taxRate: pricing.itemTaxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      });
    }
  });

  // 5. Daywise Activities (with cost > 0)
  (params.itinerary || []).forEach((day: any, dIdx: number) => {
    const dayNum = day.dayNumber || dIdx + 1;
    (day.timeline || []).forEach((step: any, sIdx: number) => {
      const stepCost = Number(step.cost) || 0;
      if (stepCost > 0) {
        const paxMultiplier = adultPax + childPax || 1;
        const itemBase = stepCost * paxMultiplier;
        const pricing = getItemPricing(step.id, itemBase, 'per-person', undefined);

        const detailsParts = [`Day ${dayNum}`];
        if (step.time) detailsParts.push(step.time);
        if (step.location) detailsParts.push(step.location);
        if (day.title) detailsParts.push(day.title);

        items.push({
          id: step.id || `activity-d${dayNum}-s${sIdx}`,
          category: 'activity',
          title: step.title || step.activity || `Day ${dayNum} Activity`,
          details: detailsParts.join(' · '),
          pax: standardPaxLabel,
          qty: paxMultiplier,
          rate: pricing.netRate,
          taxRate: pricing.itemTaxRate,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
        });
      }
    });
  });

  // 6. Manual Cost Items (unlinked only)
  const linkedIds = new Set<string>();
  (params.hotels || []).forEach((h: any) => h.id && linkedIds.add(h.id));
  (params.flights || []).forEach((f: any) => f.id && linkedIds.add(f.id));
  (params.cabs || []).forEach((c: any) => c.id && linkedIds.add(c.id));
  (params.buses || []).forEach((b: any) => b.id && linkedIds.add(b.id));

  manualList.forEach((m: any, idx: number) => {
    if (m.linkedItemId && linkedIds.has(m.linkedItemId)) {
      return;
    }
    const itemBase = calcItemBaseCost(m, totalPax);
    const pricing = getItemPricing(m.id, itemBase, m.type === 'per-person' ? 'per-person' : 'flat', m.taxPercentage);
    if (pricing.netRate > 0 || (m.name && m.name.trim())) {
      items.push({
        id: m.id || `manual-${idx}`,
        category: (m.category || 'other').toLowerCase(),
        title: m.name || 'Additional Service',
        details: m.category ? `${m.category} Service` : undefined,
        pax: m.type === 'per-person' ? standardPaxLabel : '1 Package',
        qty: m.type === 'per-person' ? (adultPax + childPax || 1) : 1,
        rate: pricing.netRate,
        taxRate: pricing.itemTaxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      });
    }
  });

  // 7. Fallback if no items found
  if (items.length === 0) {
    let fallbackRate = 0;
    if (typeof params.fallbackCostWithMarkup === 'number' && params.fallbackCostWithMarkup > 0) {
      fallbackRate = params.fallbackCostWithMarkup;
    } else if (typeof params.fallbackBaseCost === 'number') {
      const base = params.fallbackBaseCost;
      const markup = fallbackMarkupType === 'percentage'
        ? (base * fallbackMarkupVal) / 100
        : fallbackMarkupVal * (totalPax || 1);
      fallbackRate = base + markup;
    }
    const taxAmount = (fallbackRate * globalTaxRate) / 100;
    items.push({
      id: 'fallback-package',
      category: 'package',
      title: 'Complete Travel Package',
      details: [params.fallbackTitle, params.fallbackDestination].filter(Boolean).join(' · ') || 'Complete Travel Itinerary',
      pax: standardPaxLabel,
      qty: 1,
      rate: Math.round(fallbackRate * 100) / 100,
      taxRate: globalTaxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round((fallbackRate + taxAmount) * 100) / 100,
    });
  }

  return items;
}
