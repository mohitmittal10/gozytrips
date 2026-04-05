/**
 * itinerary-calculator.ts
 *
 * PURE calculation engine — zero React imports, zero side effects.
 * This is the ONLY place in the codebase where pricing math is performed.
 * Every component that shows a monetary value must derive it from here.
 */

import type { ItineraryState } from "@/types/itinerary-store";
import type { PricingConfig, PaymentMilestone, Currency } from "@/types/pricing";

// ── Currency ───────────────────────────────────────────────────────────────────

/** Single authoritative map — eliminates duplicates in financial.ts & pricing-module.tsx */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  AED: "AED ",
};

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

// ── Base Cost ─────────────────────────────────────────────────────────────────

/**
 * Sum of all trackable cost inputs:
 *  - timeline step costs (per activity)
 *  - hotel costs (adult + child + infant)
 *  - flight costs (adult + child + infant)
 */
export function calcBaseCost(state: Pick<ItineraryState, "itinerary" | "hotels" | "flights" | "cabs" | "buses">): number {
  let cost = 0;

  // Activity / timeline step costs
  for (const day of state.itinerary) {
    for (const step of day.timeline) {
      const c = Number(step.cost);
      if (!isNaN(c) && c > 0) cost += c;
    }
  }

  // Hotel costs
  for (const h of state.hotels) {
    if (h.costAdult) cost += Number(h.costAdult) || 0;
    if (h.costChild) cost += Number(h.costChild) || 0;
    if (h.costInfant) cost += Number(h.costInfant) || 0;
  }

  // Flight costs
  for (const f of state.flights) {
    if (f.costAdult) cost += Number(f.costAdult) || 0;
    if (f.costChild) cost += Number(f.costChild) || 0;
    if (f.costInfant) cost += Number(f.costInfant) || 0;
  }

  // Cab costs
  for (const c of state.cabs || []) {
    if (c.totalCost) cost += Number(c.totalCost) || 0;
  }

  // Bus costs
  for (const b of state.buses || []) {
    if (b.costAdult) cost += Number(b.costAdult) || 0;
    if (b.costChild) cost += Number(b.costChild) || 0;
    if (b.costInfant) cost += Number(b.costInfant) || 0;
  }

  return cost;
}

// ── Markup ─────────────────────────────────────────────────────────────────────

export function calcMarkupAmount(baseCost: number, pricing: PricingConfig): number {
  // If tier pricing is enabled, use the active tier's markup value
  const markupValue =
    pricing.tiersEnabled && pricing.tiers[pricing.selectedTier]?.isActive
      ? (pricing.tiers[pricing.selectedTier]?.markupValue ?? pricing.markupValue)
      : pricing.markupValue;

  if (pricing.markupType === "percentage") {
    return (baseCost * markupValue) / 100;
  }
  return markupValue; // flat fee
}

// ── Tax ───────────────────────────────────────────────────────────────────────

export function calcTaxAmount(costWithMarkup: number, pricing: PricingConfig): number {
  return (costWithMarkup * pricing.taxPercentage) / 100;
}

// ── Final Total ───────────────────────────────────────────────────────────────

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

/**
 * Master calculation — returns all derived values from a single state snapshot.
 * Call via useItineraryPricing() to get memoised results in React.
 */
export function calcPricingBreakdown(
  state: Pick<ItineraryState, "itinerary" | "hotels" | "flights" | "cabs" | "buses" | "pricing">
): PricingBreakdown {
  const { pricing } = state;

  const baseCost = calcBaseCost(state);
  const markupAmount = calcMarkupAmount(baseCost, pricing);
  const costWithMarkup = baseCost + markupAmount;
  const taxAmount = calcTaxAmount(costWithMarkup, pricing);
  const finalTotal = costWithMarkup + taxAmount;

  const totalPax = pricing.adultPax + pricing.childPax + pricing.infantPax;
  const perAdult = pricing.adultPax > 0 ? finalTotal / pricing.adultPax : finalTotal;
  const perChild = pricing.childPax > 0 ? finalTotal / pricing.childPax : 0;

  const currencySymbol = getCurrencySymbol(pricing.currency);

  const milestoneAmounts: MilestoneAmount[] = pricing.milestones.map((m) => ({
    ...m,
    amount: (finalTotal * m.percentage) / 100,
  }));

  return {
    baseCost,
    markupAmount,
    costWithMarkup,
    taxAmount,
    finalTotal,
    perAdult,
    perChild,
    totalPax,
    currencySymbol,
    milestoneAmounts,
  };
}

// ── Formatting Utility ─────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency: Currency,
  locale = "en-IN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
