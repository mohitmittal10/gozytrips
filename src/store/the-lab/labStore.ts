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
  autosaveStatus: "saved" as const,
  isSaving: false,
};

const initialHash = computePdfDataHash(initialData);

// Module-level timer for debounced hash updates (text fields).
// Using a module-level ref avoids needing it inside Zustand's closure.
let _hashDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useLabStore = create<LabState>((set, get) => {
  /**
   * Helper: immediately update state + recompute hash + dirty flag.
   * Use for structural changes (itinerary, hotels, pricing, etc.)
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

  /**
   * Helper: update state immediately (for fast UI feedback) but defer the
   * expensive hash recompute by 300 ms. Use ONLY for pure text/string fields
   * (inclusions, exclusions, terms, cancellation, payment) where the user
   * types continuously and we must not block the main thread per keystroke.
   */
  const updateTextFieldDebounced = (stateUpdate: Partial<LabState>) => {
    // Apply the text change immediately so the UI stays responsive
    set(stateUpdate);
    // Debounce the hash recompute — cancel any in-flight timer
    if (_hashDebounceTimer) clearTimeout(_hashDebounceTimer);
    _hashDebounceTimer = setTimeout(() => {
      const currentState = get();
      const newHash = computePdfDataHash(currentState);
      const lastHash = currentState.lastCommittedHash;
      set({
        currentHash: newHash,
        isDirty: isStateDirty(newHash, lastHash),
      });
    }, 300);
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
    // Text fields use debounced hash so rapid typing doesn't block the main thread
    setInclusionsText: (inclusions) => updateTextFieldDebounced({ inclusions }),
    setExclusionsText: (exclusions) => updateTextFieldDebounced({ exclusions }),
    setTermsAndConditionsText: (termsAndConditions) => updateTextFieldDebounced({ termsAndConditions }),
    setCancellationPolicyText: (cancellationPolicy) => updateTextFieldDebounced({ cancellationPolicy }),
    setPaymentMethodsText: (paymentMethods) => updateTextFieldDebounced({ paymentMethods }),
    setInclusionsSlice: (inclusionsSlice) => updateTextFieldDebounced(inclusionsSlice),

    // ─── Finance Actions ───────────────────────────────────────────────────
    setPricing: (pricing) => set((state) => updateHashAndDirty({ pricing })),

    // ─── Meta & Autosave Actions ──────────────────────────────────────────────
    setAutosaveStatus: (status) => set({ autosaveStatus: status, isSaving: status === "saving" }),
    setCurrentTripId: (currentTripId) => set({ currentTripId }),
    // tripMetadata is written from form.watch on every keystroke — use debounced hash
    setTripMetadata: (tripMetadata) => updateTextFieldDebounced({ tripMetadata }),
    setSelectedClientId: (selectedClientId) => set((state) => updateHashAndDirty({ selectedClientId })),
    setSelectedStatus: (selectedStatus) => set((state) => updateHashAndDirty({ selectedStatus })),
    setSelectedTheme: (selectedTheme) => set((state) => updateHashAndDirty({ selectedTheme })),
    setPdfOverrides: (pdfOverrides) => set((state) => updateHashAndDirty({ pdfOverrides })),

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
