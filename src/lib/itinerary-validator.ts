/**
 * itinerary-validator.ts
 *
 * Pure validation layer — called by the reducer on every state mutation.
 * Returns string[] of human-readable errors. Empty array = valid.
 */

import type { ItineraryState } from "@/types/itinerary-store";

export function validateItineraryState(state: ItineraryState): string[] {
  const errors: string[] = [];
  const { pricing } = state;

  // ── Pax ──────────────────────────────────────────────────────────────────────
  if (pricing.adultPax < 1) {
    errors.push("At least 1 adult passenger is required.");
  }
  if (pricing.childPax < 0) {
    errors.push("Child count cannot be negative.");
  }
  if (pricing.infantPax < 0) {
    errors.push("Infant count cannot be negative.");
  }

  // ── Markup ────────────────────────────────────────────────────────────────────
  if (pricing.markupValue < 0) {
    errors.push("Markup value cannot be negative.");
  }
  if (pricing.markupType === "percentage" && pricing.markupValue > 999) {
    errors.push("Markup percentage exceeds 999% — double check your value.");
  }

  // ── Tax ───────────────────────────────────────────────────────────────────────
  if (pricing.taxPercentage < 0) {
    errors.push("Tax percentage cannot be negative.");
  }
  if (pricing.taxPercentage > 100) {
    errors.push("Tax percentage cannot exceed 100%.");
  }

  // ── Milestones ────────────────────────────────────────────────────────────────
  if (pricing?.milestones && pricing.milestones.length > 0) {
    const totalMilestonePercent = pricing.milestones.reduce(
      (sum, m) => sum + (m?.percentage || 0),
      0
    );
    if (totalMilestonePercent > 100) {
      errors.push(
        `Payment milestone percentages total ${totalMilestonePercent}% — must not exceed 100%.`
      );
    }
    for (const m of pricing.milestones) {
      if (m && m.percentage < 0) {
        errors.push(`Milestone "${m.name}" has a negative percentage.`);
      }
      if (m && !m.name?.trim()) {
        errors.push("A payment milestone has no name.");
      }
    }
  }

  // ── Activity Costs ────────────────────────────────────────────────────────────
  for (const day of state.itinerary) {
    for (const step of day.timeline) {
      const c = Number(step.cost);
      if (step.cost !== undefined && !isNaN(c) && c < 0) {
        errors.push(
          `Negative cost detected in Day ${day.day}: "${step.details?.slice(0, 40)}".`
        );
      }
    }
  }

  // ── Hotels ────────────────────────────────────────────────────────────────────
  for (const hotel of state.hotels) {
    if (hotel.costAdult !== undefined && Number(hotel.costAdult) < 0) {
      errors.push(`Hotel "${hotel.name}" has a negative adult cost.`);
    }
  }

  // ── Flights ───────────────────────────────────────────────────────────────────
  for (const flight of state.flights) {
    if (flight.costAdult !== undefined && Number(flight.costAdult) < 0) {
      errors.push(
        `Flight "${flight.airline} ${flight.flightNumber}" has a negative adult cost.`
      );
    }
  }

  return errors;
}

