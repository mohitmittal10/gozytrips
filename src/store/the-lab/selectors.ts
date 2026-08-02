import { useShallow } from "zustand/shallow";
import { useLabStore } from "./labStore";
import type { LabState, TimelineSlice, LogisticsSlice, InclusionsSlice, FinanceSlice, MetaSlice } from "./types";
import { calcPricingBreakdown } from "@/services/financial/FinancialService";
import { getCurrencySymbol } from "@/lib/utils/currency";

// ─── Selector Hooks for Slices ──────────────────────────────────────────────

export function useTimelineSlice() {
  return useLabStore(
    useShallow((state): TimelineSlice & {
      setItinerary: LabState["setItinerary"];
      setIsEditing: LabState["setIsEditing"];
      setShowTimestamps: LabState["setShowTimestamps"];
    } => ({
      itinerary: state.itinerary,
      isEditing: state.isEditing,
      showTimestamps: state.showTimestamps,
      setItinerary: state.setItinerary,
      setIsEditing: state.setIsEditing,
      setShowTimestamps: state.setShowTimestamps,
    }))
  );
}

export function useLogisticsSlice() {
  return useLabStore(
    useShallow((state): LogisticsSlice & {
      setHotels: LabState["setHotels"];
      setFlights: LabState["setFlights"];
      setCabs: LabState["setCabs"];
      setBuses: LabState["setBuses"];
      setLogistics: LabState["setLogistics"];
    } => ({
      hotels: state.hotels,
      flights: state.flights,
      cabs: state.cabs,
      buses: state.buses,
      setHotels: state.setHotels,
      setFlights: state.setFlights,
      setCabs: state.setCabs,
      setBuses: state.setBuses,
      setLogistics: state.setLogistics,
    }))
  );
}

export function useInclusionsSlice() {
  return useLabStore(
    useShallow((state): InclusionsSlice & {
      setInclusionsText: LabState["setInclusionsText"];
      setExclusionsText: LabState["setExclusionsText"];
      setTermsAndConditionsText: LabState["setTermsAndConditionsText"];
      setCancellationPolicyText: LabState["setCancellationPolicyText"];
      setPaymentMethodsText: LabState["setPaymentMethodsText"];
      setInclusionsSlice: LabState["setInclusionsSlice"];
    } => ({
      inclusions: state.inclusions,
      exclusions: state.exclusions,
      termsAndConditions: state.termsAndConditions,
      cancellationPolicy: state.cancellationPolicy,
      paymentMethods: state.paymentMethods,
      setInclusionsText: state.setInclusionsText,
      setExclusionsText: state.setExclusionsText,
      setTermsAndConditionsText: state.setTermsAndConditionsText,
      setCancellationPolicyText: state.setCancellationPolicyText,
      setPaymentMethodsText: state.setPaymentMethodsText,
      setInclusionsSlice: state.setInclusionsSlice,
    }))
  );
}

export function useFinanceSlice() {
  return useLabStore(
    useShallow((state): FinanceSlice & {
      setPricing: LabState["setPricing"];
    } => ({
      pricing: state.pricing,
      setPricing: state.setPricing,
    }))
  );
}

export function useMetaSlice() {
  return useLabStore(
    useShallow((state): MetaSlice & {
      setCurrentTripId: LabState["setCurrentTripId"];
      setTripMetadata: LabState["setTripMetadata"];
      setSelectedClientId: LabState["setSelectedClientId"];
      setSelectedStatus: LabState["setSelectedStatus"];
      setSelectedTheme: LabState["setSelectedTheme"];
      setPdfOverrides: LabState["setPdfOverrides"];
      setOptimizationCount: LabState["setOptimizationCount"];
    } => ({
      currentTripId: state.currentTripId,
      tripMetadata: state.tripMetadata,
      selectedClientId: state.selectedClientId,
      selectedStatus: state.selectedStatus,
      selectedTheme: state.selectedTheme,
      pdfOverrides: state.pdfOverrides,
      optimizationCount: state.optimizationCount,
      setCurrentTripId: state.setCurrentTripId,
      setTripMetadata: state.setTripMetadata,
      setSelectedClientId: state.setSelectedClientId,
      setSelectedStatus: state.setSelectedStatus,
      setSelectedTheme: state.setSelectedTheme,
      setPdfOverrides: state.setPdfOverrides,
      setOptimizationCount: state.setOptimizationCount,
    }))
  );
}

export function useDirtyTracking() {
  return useLabStore(
    useShallow((state) => ({
      isDirty: state.isDirty,
      currentHash: state.currentHash,
      lastCommittedHash: state.lastCommittedHash,
      markPdfSynced: state.markPdfSynced,
    }))
  );
}

// ─── Computed Selectors ─────────────────────────────────────────────────────

export function selectBaseCost(state: LabState): number {
  const breakdown = calcPricingBreakdown({
    itinerary: state.itinerary?.itinerary || [],
    hotels: state.hotels || [],
    flights: state.flights || [],
    cabs: state.cabs || [],
    buses: state.buses || [],
    pricing: state.pricing as any,
  });
  return breakdown.baseCost;
}

export function selectFinalTotal(state: LabState): number {
  const breakdown = calcPricingBreakdown({
    itinerary: state.itinerary?.itinerary || [],
    hotels: state.hotels || [],
    flights: state.flights || [],
    cabs: state.cabs || [],
    buses: state.buses || [],
    pricing: state.pricing as any,
  });
  return breakdown.finalTotal;
}

export function selectCurrencySymbol(state: LabState): string {
  return getCurrencySymbol((state.pricing?.currency as any) || "INR");
}
