"use client";

/**
 * use-itinerary.ts
 *
 * Master hook — gives components typed access to the itinerary store.
 * Exposes the raw state AND typed action dispatchers so callers never
 * write raw dispatch() calls inline.
 */

import { useItineraryContext } from "@/contexts/itinerary-context";
import type { DayData } from "@/types/itinerary-store";
import type { HotelInfo, FlightInfo } from "@/components/hotel-flight-editor";
import type { PricingConfig } from "@/types/pricing";

export function useItinerary() {
  const { state, dispatch } = useItineraryContext();

  // ── Itinerary actions ──────────────────────────────────────────────────────

  const setItinerary = (itinerary: DayData[]) =>
    dispatch({ type: "SET_ITINERARY", payload: itinerary });

  const updateDay = (dayIndex: number, day: DayData) =>
    dispatch({ type: "UPDATE_DAY", payload: { dayIndex, day } });

  const addDay = (day: DayData) =>
    dispatch({ type: "ADD_DAY", payload: day });

  const removeDay = (dayIndex: number) =>
    dispatch({ type: "REMOVE_DAY", payload: { dayIndex } });

  // ── Hotel actions ──────────────────────────────────────────────────────────

  const setHotels = (hotels: HotelInfo[]) =>
    dispatch({ type: "SET_HOTELS", payload: hotels });

  const addHotel = (hotel: HotelInfo) =>
    dispatch({ type: "ADD_HOTEL", payload: hotel });

  const updateHotel = (index: number, hotel: HotelInfo) =>
    dispatch({ type: "UPDATE_HOTEL", payload: { index, hotel } });

  const removeHotel = (index: number) =>
    dispatch({ type: "REMOVE_HOTEL", payload: { index } });

  // ── Flight actions ─────────────────────────────────────────────────────────

  const setFlights = (flights: FlightInfo[]) =>
    dispatch({ type: "SET_FLIGHTS", payload: flights });

  const addFlight = (flight: FlightInfo) =>
    dispatch({ type: "ADD_FLIGHT", payload: flight });

  const updateFlight = (index: number, flight: FlightInfo) =>
    dispatch({ type: "UPDATE_FLIGHT", payload: { index, flight } });

  const removeFlight = (index: number) =>
    dispatch({ type: "REMOVE_FLIGHT", payload: { index } });

  // ── Pricing actions ────────────────────────────────────────────────────────

  const updatePricing = (updates: Partial<PricingConfig>) =>
    dispatch({ type: "UPDATE_PRICING", payload: updates });

  // ── Persistence helpers ────────────────────────────────────────────────────

  const markClean = () => dispatch({ type: "MARK_CLEAN" });

  /** Returns the serialisable payload to persist to Supabase itinerary_data */
  const getSerializable = () => ({
    itinerary: state.itinerary,
    hotels: state.hotels,
    flights: state.flights,
    pricing: state.pricing,
  });

  return {
    // Raw state
    state,

    // Convenience accessors
    itinerary: state.itinerary,
    hotels: state.hotels,
    flights: state.flights,
    pricing: state.pricing,
    isDirty: state.isDirty,
    validationErrors: state.validationErrors,
    isValid: state.validationErrors.length === 0,

    // Actions
    setItinerary,
    updateDay,
    addDay,
    removeDay,
    setHotels,
    addHotel,
    updateHotel,
    removeHotel,
    setFlights,
    addFlight,
    updateFlight,
    removeFlight,
    updatePricing,
    markClean,
    getSerializable,
  };
}

