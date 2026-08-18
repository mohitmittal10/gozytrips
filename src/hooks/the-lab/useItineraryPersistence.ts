// Handles debounced localized reading & writing of itinerary data using Supabase itineraries table
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import type { LoadedPersistenceData } from "@/types/the-lab";
import { createClient } from "@/lib/supabase/client";
import { calcPricingBreakdown } from "@/services/financial";
import { defaultPricingConfig, DEFAULT_CURRENCY } from "@/types/pricing";
import { useLabStore } from "@/store/the-lab/labStore";

export function buildComparisonPayload(data: Partial<LoadedPersistenceData>) {
  const pricingCfg = {
    ...defaultPricingConfig,
    ...(data.pricing || {}),
    manualOptions: data.pricing?.manualOptions ?? [],
    milestones: data.pricing?.milestones ?? defaultPricingConfig.milestones,
  };

  const itineraryData = {
    ...(data.itinerary || {}),
    hotels: data.hotels || [],
    flights: data.flights || [],
    cabs: data.cabs || [],
    buses: data.buses || [],
    pricing: pricingCfg,
    inclusions: data.inclusions !== undefined ? data.inclusions : "",
    exclusions: data.exclusions !== undefined ? data.exclusions : "",
    termsAndConditions: data.termsAndConditions !== undefined ? data.termsAndConditions : "",
    cancellationPolicy: data.cancellationPolicy !== undefined ? data.cancellationPolicy : "",
    paymentMethods: data.paymentMethods !== undefined ? data.paymentMethods : "",
  };

  const formValues = data.tripMetadata || {};
  const startLoc = formValues.startingLocation;
  const dests = formValues.destinations;

  let nightsDaysSuffix = "";
  if (formValues.startDate && formValues.endDate) {
    const s = new Date(formValues.startDate);
    const e = new Date(formValues.endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
      const totalDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      nightsDaysSuffix = ` ${totalDays}N ${totalDays + 1}D`;
    }
  }

  let generatedTitle = "Untitled Lab Draft";
  if (dests) {
    if (startLoc) {
      generatedTitle = `${startLoc} to ${dests}${nightsDaysSuffix}`;
    } else {
      generatedTitle = `Trip to ${dests}${nightsDaysSuffix}`;
    }
  }

  let startDate = null;
  let endDate = null;
  if (formValues.startDate) {
    const d = new Date(formValues.startDate);
    if (!isNaN(d.getTime())) startDate = format(d, "yyyy-MM-dd");
  }
  if (formValues.endDate) {
    const d = new Date(formValues.endDate);
    if (!isNaN(d.getTime())) endDate = format(d, "yyyy-MM-dd");
  }

  const { finalTotal } = calcPricingBreakdown({
    itinerary: (data.itinerary as any)?.itinerary || [],
    hotels: data.hotels || [],
    flights: data.flights || [],
    cabs: data.cabs || [],
    buses: data.buses || [],
    pricing: pricingCfg
  });

  const normalizedFormValues = {
    ...formValues,
    startDate: startDate,
    endDate: endDate,
  };

  return {
    title: generatedTitle,
    status: data.selectedStatus || "draft",
    starting_location: formValues.startingLocation || "In Preparation",
    ending_location: formValues.endingLocation || formValues.startingLocation || "In Preparation",
    destinations: dests || "TBD",
    start_date: startDate || "1970-01-01",
    end_date: endDate || "1970-01-01",
    budget: formValues.budget || null,
    adult_pax: Number(pricingCfg.adultPax || 2),
    child_pax: Number(pricingCfg.childPax || 0),
    infant_pax: Number(pricingCfg.infantPax || 0),
    markup_value: Number(pricingCfg.markupValue || 15),
    markup_type: pricingCfg.markupType || 'percentage',
    tax_percentage: Number(pricingCfg.taxPercentage || 0),
    client_price: finalTotal > 0 ? finalTotal : null,
    itinerary_data: itineraryData,
    generation_preferences: normalizedFormValues,
    client_id: data.selectedClientId === "none" ? null : data.selectedClientId,
    optimization_count: Number(data.optimizationCount || 0),
    show_timestamps: data.showTimestamps ?? true,
    selected_theme: data.selectedTheme || 'classic',
    pdf_overrides: data.pdfOverrides || {},
    draft_source_itinerary_id: data.draftSourceItineraryId || null,
    currency: pricingCfg.currency,
  };
}

export function useItineraryPersistence({
  currentTripId,
  setCurrentTripId
}: {
  currentTripId: string | null;
  setCurrentTripId: (id: string | null) => void;
}) {
  const [loadedData, setLoadedData] = useState<LoadedPersistenceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastPayloadRef = useRef<string>("");
  const supabase = createClient();
  const mounted = useRef(false);
  const initialized = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  // Cached session ref — avoids async getSession() on every auto-save.
  // Refreshed when null or when the session has expired.
  const sessionRef = useRef<{ user: { id: string }; expires_at?: number } | null>(null);

  /** Returns a valid session, refreshing from Supabase only when necessary. */
  const getValidSession = useCallback(async () => {
    const now = Math.floor(Date.now() / 1000);
    // Use cached session if it exists and has at least 60 s of life remaining
    if (sessionRef.current && (sessionRef.current.expires_at === undefined || sessionRef.current.expires_at > now + 60)) {
      return sessionRef.current;
    }
    const { data: { session } } = await supabase.auth.getSession();
    sessionRef.current = session ?? null;
    return session ?? null;
  }, [supabase]);

  // Always-up-to-date ref so callbacks never capture stale closures.
  // This is the key fix: saveAll/saveNow read from this ref at call-time,
  // not from the closure-captured value at creation-time.
  const currentTripIdRef = useRef<string | null>(currentTripId);
  useEffect(() => {
    currentTripIdRef.current = currentTripId;
  }, [currentTripId]);

  // Update mounted ref
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Load purely on mount or when currentTripId changes
  useEffect(() => {
    let active = true;

    const loadDraft = async () => {
      // Prevent redundant fetches if we already fetched this exact ID
      if (currentTripId && lastFetchedIdRef.current === currentTripId) {
        return;
      }

      // If ID is null AND we've already initialized, we are making a "New Itinerary" (no DB fetch).
      if (!currentTripId && initialized.current) {
        if (active) {
          setLoadedData(getEmptyData());
          lastPayloadRef.current = ""; 
          lastFetchedIdRef.current = null;
        }
        return;
      }

      try {
        setIsLoading(true);
        const session = await getValidSession();

        // If not authenticated, we can't load from Supabase - default to empty state
        if (!session?.user) {
          if (active) setLoadedData(getEmptyData());
          return;
        }

        let query = supabase.from("itineraries").select("*").eq("user_id", session.user.id);

        if (currentTripId) {
          // Specific ID provided (from URL or navigation)
          query = query.eq("id", currentTripId);
        } else {
          // Initial mount with no ID -> Load the latest draft
          query = query.eq("status", "draft").order("last_activity_at", { ascending: false }).limit(1);
        }

        const { data, error } = await query.single();

        if (active && data) {
          lastFetchedIdRef.current = data.id;

          // Sync the ID if we just auto-loaded a draft
          if (!currentTripId) {
            currentTripIdRef.current = data.id;
            setCurrentTripId(data.id);
          }

          const itineraryData = data.itinerary_data || {};
          const { hotels, flights, cabs, buses, pricing, ...itineraryObj } = itineraryData;

          let _tripMetadata = data.generation_preferences || {};

          if (_tripMetadata.startDate) _tripMetadata.startDate = new Date(_tripMetadata.startDate);
          if (_tripMetadata.endDate) _tripMetadata.endDate = new Date(_tripMetadata.endDate);

          const newData = {
            itinerary: (itineraryObj.itinerary ? itineraryObj : null) as any,
            hotels: hotels || [],
            flights: flights || [],
            cabs: cabs || [],
            buses: buses || [],
            pricing: {
              ...defaultPricingConfig,
              ...pricing,
              // Ensure arrays are never undefined from old DB records
              manualOptions: pricing?.manualOptions ?? [],
              milestones: pricing?.milestones ?? defaultPricingConfig.milestones,

              // DB currency column always wins
              currency: data.currency || pricing?.currency || DEFAULT_CURRENCY,
            },
            optimizationCount: data.optimization_count || 0,
            selectedClientId: data.client_id || "none",
            selectedStatus: data.status || "draft",
            tripMetadata: _tripMetadata,
            showTimestamps: data.show_timestamps ?? true,
            selectedTheme: data.selected_theme || 'classic',
            pdfOverrides: data.pdf_overrides || {},
            draftSourceItineraryId: data.draft_source_itinerary_id,
            inclusions: itineraryData.inclusions || "",
            exclusions: itineraryData.exclusions || "",
            termsAndConditions: itineraryData.termsAndConditions || "",
            cancellationPolicy: itineraryData.cancellationPolicy || "",
            paymentMethods: itineraryData.paymentMethods || ""
          };

          // Seed the payload ref with canonical comparison structure so opening a draft doesn't trigger immediate re-save
          lastPayloadRef.current = JSON.stringify(buildComparisonPayload(newData));

          setLoadedData(newData);
        } else if (active) {
          setLoadedData(getEmptyData());
        }
      } catch (err) {
        console.warn("Failed to load itinerary from Supabase", err);
        if (active) {
          setLoadedData(getEmptyData());
          lastFetchedIdRef.current = null;
        }
      } finally {
        initialized.current = true;
        if (active) setIsLoading(false);
      }
    };

    loadDraft();

    return () => {
      active = false;
    };
  }, [currentTripId, supabase, setCurrentTripId]);

  const executeSave = useCallback(async (data: Partial<LoadedPersistenceData>, id: string | null, allowInsert = true) => {
    try {
      const session = await getValidSession();
      if (!session?.user) return null;

      const comparisonPayload = buildComparisonPayload(data);
      const payloadString = JSON.stringify(comparisonPayload);

      // Dirty check: Only skip if payload matches AND we aren't trying to perform 
      // an initial insertion that was previously blocked by a background no-op (allowInsert=false).
      if (payloadString === lastPayloadRef.current && (id || !allowInsert)) {
        return id;
      }
      lastPayloadRef.current = payloadString;

      const now = new Date().toISOString();
      const updatePayload: any = {
        user_id: session.user.id,
        ...comparisonPayload,
        start_date: comparisonPayload.start_date === "1970-01-01" ? format(new Date(), "yyyy-MM-dd") : comparisonPayload.start_date,
        end_date: comparisonPayload.end_date === "1970-01-01" ? format(new Date(), "yyyy-MM-dd") : comparisonPayload.end_date,
        ...(data.share_token !== undefined ? { share_token: data.share_token } : {}),
        ...(data.share_enabled !== undefined ? { share_enabled: data.share_enabled } : {}),
        last_activity_at: now,
        updated_financial_at: now
      };

      if (id) {
        // UPDATE existing record
        const { error } = await supabase.from("itineraries").update(updatePayload).eq("id", id);
        if (error) {
          console.error("[Persistence] Update failed:", error);
          throw error;
        }
        return id;
      } else if (allowInsert) {
        // INSERT new record — only when explicitly permitted (e.g. pre-generation saveNow)
        const { data: newRow, error } = await supabase
          .from("itineraries")
          .insert([{ ...updatePayload, trip_id: `DRF-${Date.now()}` }])
          .select("id")
          .single();

        if (error) {
          console.error("[Persistence] Insert failed:", error);
          throw error;
        }
        if (newRow?.id) {
          // Immediately update the ref so any pending saveAll timers pick it up
          currentTripIdRef.current = newRow.id;
          setCurrentTripId(newRow.id);
          return newRow.id;
        }
      }
      // allowInsert=false and id=null → no-op: don't create a phantom empty record
    } catch (err: any) {
      console.error("[Persistence] Supabase draft save failed", err);
    }
    return id;
  }, [supabase, getValidSession, setCurrentTripId]);

  // saveAll reads currentTripIdRef at *fire-time*, not at creation-time,
  // so it always uses the correct record ID even after an async INSERT.
  // allowInsert=false: background auto-save must NEVER create phantom empty records.
  const saveAll = useCallback((data: Partial<LoadedPersistenceData>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Capture data in the closure so the correct snapshot is used when the timer fires.
    const snapshot = data;
    saveTimer.current = setTimeout(async () => {
      useLabStore.getState().setAutosaveStatus("saving");
      try {
        await executeSave(snapshot, currentTripIdRef.current, false);
        useLabStore.getState().setAutosaveStatus("saved");
      } catch {
        useLabStore.getState().setAutosaveStatus("error");
      }
    }, 1500);
  }, [executeSave]);

  const saveNow = useCallback(async (data: Partial<LoadedPersistenceData>, explicitId?: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const targetId = explicitId !== undefined ? explicitId : currentTripIdRef.current;
    // Immediately sync the ref so any concurrent saveAll timers use the correct ID.
    if (explicitId !== undefined) {
      currentTripIdRef.current = explicitId;
    }
    useLabStore.getState().setAutosaveStatus("saving");
    try {
      const res = await executeSave(data, targetId, true);
      useLabStore.getState().setAutosaveStatus("saved");
      return res;
    } catch (err) {
      useLabStore.getState().setAutosaveStatus("error");
      throw err;
    }
  }, [executeSave]);

  // Cleanly resets persistence state for a new trip WITHOUT writing to the DB.
  // This cancels any pending auto-save timers and nulls the ref, ensuring
  // that no phantom records are created when the user clicks "New Itinerary"
  // or starts filling a form before generation.
  const resetForNewTrip = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    currentTripIdRef.current = null;
    lastPayloadRef.current = ""; // Reset dirty-check so next real save always writes
    lastFetchedIdRef.current = null; // Allow a fresh fetch if needed
    useLabStore.getState().setAutosaveStatus("saved");
  }, []);

  return { loadedData, isLoading, saveAll, saveNow, resetForNewTrip };
}

function getEmptyData(): LoadedPersistenceData {
  return {
    itinerary: null,
    hotels: [],
    flights: [],
    cabs: [],
    buses: [],
    pricing: undefined,
    optimizationCount: 0,
    selectedClientId: "none",
    selectedStatus: "draft",
    tripMetadata: null,
    showTimestamps: true,
    selectedTheme: 'classic',
    pdfOverrides: {},
    draftSourceItineraryId: null,
    inclusions: "",
    exclusions: "",
    termsAndConditions: "",
    cancellationPolicy: "",
    paymentMethods: ""
  };
}


