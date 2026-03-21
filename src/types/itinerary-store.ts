/**
 * itinerary-store.ts
 *
 * Single Source of Truth type definitions for the itinerary state management system.
 * All components consume this shape — no component holds its own parallel copy.
 */

import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import type { HotelInfo, FlightInfo } from "@/components/hotel-flight-editor";
import type { PricingConfig } from "@/types/pricing";
import { defaultPricingConfig } from "@/types/pricing";

export type DayData = TravelItineraryOutput["itinerary"][number];

// ── Core State Shape ───────────────────────────────────────────────────────────

export interface ItineraryState {
  /** Supabase trip id — null for unsaved/AI-generated trips */
  tripId: string | null;

  /** The ordered day-by-day itinerary */
  itinerary: DayData[];

  /** Hotel bookings (linked to days by checkIn/checkOut) */
  hotels: HotelInfo[];

  /** Flight bookings */
  flights: FlightInfo[];

  /** All pricing configuration: pax, currency, markup, tax, milestones */
  pricing: PricingConfig;

  /** True if there are unsaved changes since last save/load */
  isDirty: boolean;

  /** Validation error messages — empty array means state is valid */
  validationErrors: string[];
}

// ── Action Discriminated Union ─────────────────────────────────────────────────

export type ItineraryAction =
  | { type: "RESET"; payload: Partial<ItineraryState> }
  | { type: "SET_ITINERARY"; payload: DayData[] }
  | { type: "UPDATE_DAY"; payload: { dayIndex: number; day: DayData } }
  | { type: "ADD_DAY"; payload: DayData }
  | { type: "REMOVE_DAY"; payload: { dayIndex: number } }
  | { type: "SET_HOTELS"; payload: HotelInfo[] }
  | { type: "ADD_HOTEL"; payload: HotelInfo }
  | { type: "UPDATE_HOTEL"; payload: { index: number; hotel: HotelInfo } }
  | { type: "REMOVE_HOTEL"; payload: { index: number } }
  | { type: "SET_FLIGHTS"; payload: FlightInfo[] }
  | { type: "ADD_FLIGHT"; payload: FlightInfo }
  | { type: "UPDATE_FLIGHT"; payload: { index: number; flight: FlightInfo } }
  | { type: "REMOVE_FLIGHT"; payload: { index: number } }
  | { type: "UPDATE_PRICING"; payload: Partial<PricingConfig> }
  | { type: "MARK_CLEAN" };

// ── Context Value ──────────────────────────────────────────────────────────────

export interface ItineraryContextValue {
  state: ItineraryState;
  dispatch: React.Dispatch<ItineraryAction>;
}

// ── Default State Factory ──────────────────────────────────────────────────────

export function createDefaultState(
  tripId: string | null = null,
  overrides: Partial<ItineraryState> = {}
): ItineraryState {
  return {
    tripId,
    itinerary: [],
    hotels: [],
    flights: [],
    pricing: defaultPricingConfig,
    isDirty: false,
    validationErrors: [],
    ...overrides,
  };
}
