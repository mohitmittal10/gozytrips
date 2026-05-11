"use client";

/**
 * itinerary-context.tsx
 *
 * The central store for all itinerary editing.
 * Wrap any subtree that needs to read/write itinerary data with <ItineraryProvider>.
 * Access via useItinerary() or useItineraryPricing() hooks — never via raw context.
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import type {
  ItineraryState,
  ItineraryAction,
  ItineraryContextValue,
  DayData,
} from "@/types/itinerary-store";
import { createDefaultState } from "@/types/itinerary-store";
import { validateItineraryState } from "@/lib/itinerary-validator";
import type { HotelInfo, FlightInfo, CabInfo, BusInfo } from "@/components/hotel-flight-editor";
import type { PricingConfig } from "@/types/pricing";
import { useAuth } from "./auth-context";

// ── Context ────────────────────────────────────────────────────────────────────

export const ItineraryContext = createContext<ItineraryContextValue | null>(null);

// ── Reducer ───────────────────────────────────────────────────────────────────

function withValidation(state: ItineraryState): ItineraryState {
  return { ...state, validationErrors: validateItineraryState(state) };
}

function itineraryReducer(state: ItineraryState, action: ItineraryAction): ItineraryState {
  switch (action.type) {
    // ── Full reset (e.g. when a new trip is loaded) ────────────────────────────
    case "RESET": {
      const next: ItineraryState = {
        ...createDefaultState(action.payload.tripId ?? state.tripId),
        ...action.payload,
        isDirty: false,
      };
      return withValidation(next);
    }

    // ── Itinerary days ─────────────────────────────────────────────────────────
    case "SET_ITINERARY":
      return withValidation({ ...state, itinerary: action.payload, isDirty: true });

    case "UPDATE_DAY": {
      const days = [...state.itinerary];
      days[action.payload.dayIndex] = action.payload.day;
      return withValidation({ ...state, itinerary: days, isDirty: true });
    }

    case "ADD_DAY":
      return withValidation({
        ...state,
        itinerary: [...state.itinerary, action.payload],
        isDirty: true,
      });

    case "REMOVE_DAY": {
      const days = state.itinerary
        .filter((_, i) => i !== action.payload.dayIndex)
        .map((d, i) => ({ ...d, day: i + 1 }));
      return withValidation({ ...state, itinerary: days, isDirty: true });
    }

    // ── Hotels ─────────────────────────────────────────────────────────────────
    case "SET_HOTELS":
      return withValidation({ ...state, hotels: action.payload, isDirty: true });

    case "ADD_HOTEL":
      return withValidation({
        ...state,
        hotels: [...state.hotels, action.payload],
        isDirty: true,
      });

    case "UPDATE_HOTEL": {
      const hotels = [...state.hotels];
      hotels[action.payload.index] = action.payload.hotel;
      return withValidation({ ...state, hotels, isDirty: true });
    }

    case "REMOVE_HOTEL": {
      const hotels = state.hotels.filter((_, i) => i !== action.payload.index);
      return withValidation({ ...state, hotels, isDirty: true });
    }

    // ── Flights ────────────────────────────────────────────────────────────────
    case "SET_FLIGHTS":
      return withValidation({ ...state, flights: action.payload, isDirty: true });

    case "ADD_FLIGHT":
      return withValidation({
        ...state,
        flights: [...state.flights, action.payload],
        isDirty: true,
      });

    case "UPDATE_FLIGHT": {
      const flights = [...state.flights];
      flights[action.payload.index] = action.payload.flight;
      return withValidation({ ...state, flights, isDirty: true });
    }

    case "REMOVE_FLIGHT": {
      const flights = state.flights.filter((_, i) => i !== action.payload.index);
      return withValidation({ ...state, flights, isDirty: true });
    }

    // ── Pricing ────────────────────────────────────────────────────────────────
    case "UPDATE_PRICING": {
      const pricing: PricingConfig = { ...state.pricing, ...action.payload };
      return withValidation({ ...state, pricing, isDirty: true });
    }

    // ── Persistence ────────────────────────────────────────────────────────────
    case "MARK_CLEAN":
      return { ...state, isDirty: false };

    case "SET_CABS":
      return withValidation({ ...state, cabs: action.payload, isDirty: true });

    case "SET_BUSES":
      return withValidation({ ...state, buses: action.payload, isDirty: true });

    default:
      return state;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────────

interface ItineraryProviderProps {
  children: React.ReactNode;
  /** Seed the store from a persisted trip. Pass null/undefined for a blank slate. */
  initialTrip?: {
    id?: string | null;
    itinerary?: DayData[];
    hotels?: HotelInfo[];
    flights?: FlightInfo[];
    cabs?: CabInfo[];
    buses?: BusInfo[];
    pricing?: PricingConfig;
  } | null;
}

export function ItineraryProvider({ children, initialTrip }: ItineraryProviderProps) {
  const { agencySettings } = useAuth();

  const initial = useMemo(() => {
    const defaultPricing = { ...createDefaultState().pricing };
    
    if (agencySettings) {
      const settings = agencySettings as any;
      if (settings.default_currency) defaultPricing.currency = settings.default_currency;
      if (settings.default_markup_value) defaultPricing.markupValue = settings.default_markup_value;
      if (settings.default_markup_type) defaultPricing.markupType = settings.default_markup_type;
      if (settings.default_payment_milestones) defaultPricing.milestones = settings.default_payment_milestones;
    }

    return createDefaultState(initialTrip?.id ?? null, {
      itinerary: initialTrip?.itinerary ?? [],
      hotels: initialTrip?.hotels ?? [],
      flights: initialTrip?.flights ?? [],
      cabs: initialTrip?.cabs ?? [],
      buses: initialTrip?.buses ?? [],
      pricing: {
        ...defaultPricing,
        ...initialTrip?.pricing,
        milestones: initialTrip?.pricing?.milestones ?? (initialTrip ? defaultPricing.milestones : defaultPricing.milestones),
      },
      isDirty: false,
    });
  }, [initialTrip, agencySettings]);

  const [state, dispatch] = useReducer(itineraryReducer, withValidation(initial));

  return (
    <ItineraryContext.Provider value={{ state, dispatch }}>
      {children}
    </ItineraryContext.Provider>
  );
}

// ── Raw context accessor (use hooks below instead) ─────────────────────────────

export function useItineraryContext(): ItineraryContextValue {
  const ctx = useContext(ItineraryContext);
  if (!ctx) {
    throw new Error(
      "useItineraryContext: component must be wrapped in <ItineraryProvider>"
    );
  }
  return ctx;
}

