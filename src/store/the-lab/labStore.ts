import { create } from "zustand";
import type { LabState, LogisticsSlice, InclusionsSlice } from "./types";
import { computePdfDataHash, isStateDirty } from "./utils/hashState";

const initialData = {
  itinerary: null,
  isEditing: false,
  showTimestamps: true,

  hotels: [],
  flights: [],
  cabs: [],
  buses: [],

  inclusions: "",
  exclusions: "",
  termsAndConditions: "",
  cancellationPolicy: "",
  paymentMethods: "",

  pricing: undefined,

  currentTripId: null,
  tripMetadata: null,
  selectedClientId: "none",
  selectedStatus: "draft",
  selectedTheme: "classic" as const,
  pdfOverrides: {},
  optimizationCount: 0,
  autosaveStatus: "saved" as const,
  isSaving: false,
};

const initialHash = computePdfDataHash(initialData);

export const useLabStore = create<LabState>((set, get) => {
  /**
   * Helper function to evaluate new hash and update dirty flag after any state mutation.
   */
  const updateHashAndDirty = (stateUpdate: Partial<LabState>) => {
    const currentState = get();
    const updatedState = { ...currentState, ...stateUpdate };
    const newHash = computePdfDataHash(updatedState);
    const lastHash = currentState.lastCommittedHash;
    const isDirty = isStateDirty(newHash, lastHash);

    return {
      ...stateUpdate,
      currentHash: newHash,
      isDirty,
    };
  };

  return {
    ...initialData,
    currentHash: initialHash,
    lastCommittedHash: initialHash,
    isDirty: false,

    // ─── Timeline Actions ───────────────────────────────────────────────────
    setItinerary: (itinerary) => set((state) => updateHashAndDirty({ itinerary })),
    setIsEditing: (isEditing) => set({ isEditing }), // Ephemeral — does not affect hash
    setShowTimestamps: (showTimestamps) => set((state) => updateHashAndDirty({ showTimestamps })),

    // ─── Logistics Actions ──────────────────────────────────────────────────
    setHotels: (hotels) => set((state) => updateHashAndDirty({ hotels })),
    setFlights: (flights) => set((state) => updateHashAndDirty({ flights })),
    setCabs: (cabs) => set((state) => updateHashAndDirty({ cabs })),
    setBuses: (buses) => set((state) => updateHashAndDirty({ buses })),
    setLogistics: (logisticsSlice) => set((state) => updateHashAndDirty(logisticsSlice)),

    // ─── Inclusions Actions ─────────────────────────────────────────────────
    setInclusionsText: (inclusions) => set((state) => updateHashAndDirty({ inclusions })),
    setExclusionsText: (exclusions) => set((state) => updateHashAndDirty({ exclusions })),
    setTermsAndConditionsText: (termsAndConditions) => set((state) => updateHashAndDirty({ termsAndConditions })),
    setCancellationPolicyText: (cancellationPolicy) => set((state) => updateHashAndDirty({ cancellationPolicy })),
    setPaymentMethodsText: (paymentMethods) => set((state) => updateHashAndDirty({ paymentMethods })),
    setInclusionsSlice: (inclusionsSlice) => set((state) => updateHashAndDirty(inclusionsSlice)),

    // ─── Finance Actions ───────────────────────────────────────────────────
    setPricing: (pricing) => set((state) => updateHashAndDirty({ pricing })),

    // ─── Meta & Autosave Actions ──────────────────────────────────────────────
    setAutosaveStatus: (status) => set({ autosaveStatus: status, isSaving: status === "saving" }),
    setCurrentTripId: (currentTripId) => set({ currentTripId }),
    setTripMetadata: (tripMetadata) => set((state) => updateHashAndDirty({ tripMetadata })),
    setSelectedClientId: (selectedClientId) => set((state) => updateHashAndDirty({ selectedClientId })),
    setSelectedStatus: (selectedStatus) => set((state) => updateHashAndDirty({ selectedStatus })),
    setSelectedTheme: (selectedTheme) => set((state) => updateHashAndDirty({ selectedTheme })),
    setPdfOverrides: (pdfOverrides) => set((state) => updateHashAndDirty({ pdfOverrides })),
    setOptimizationCount: (optimizationCount) => set((state) => updateHashAndDirty({ optimizationCount })),

    // ─── Lifecycle & Sync Actions ──────────────────────────────────────────
    loadStateFromPersistence: (data) =>
      set((state) => {
        const merged = { ...state, ...data };
        const newHash = computePdfDataHash(merged);
        return {
          ...data,
          currentHash: newHash,
          // Set lastCommittedHash to newHash on hydration so initial load is pristine
          lastCommittedHash: newHash,
          isDirty: false,
        };
      }),

    resetStore: () =>
      set(() => {
        const resetHash = computePdfDataHash(initialData);
        return {
          ...initialData,
          currentHash: resetHash,
          lastCommittedHash: resetHash,
          isDirty: false,
        };
      }),

    markPdfSynced: () =>
      set((state) => ({
        lastCommittedHash: state.currentHash,
        isDirty: false,
      })),

    reevaluateDirtyState: () =>
      set((state) => {
        const currentHash = computePdfDataHash(state);
        return {
          currentHash,
          isDirty: isStateDirty(currentHash, state.lastCommittedHash),
        };
      }),
  };
});
