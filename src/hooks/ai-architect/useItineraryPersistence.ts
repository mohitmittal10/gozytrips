// Handles debounced localized reading & writing of itinerary data using Supabase itineraries table
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import type { LoadedPersistenceData } from "@/types/ai-architect";
import { createClient } from "@/lib/supabase/client";
import { calcPricingBreakdown } from "@/lib/itinerary-calculator";
import { defaultPricingConfig, DEFAULT_CURRENCY } from "@/types/pricing";

export function useItineraryPersistence({
  currentTripId,
  setCurrentTripId
}: {
  currentTripId: string | null;
  setCurrentTripId: (id: string | null) => void;
}) {
  const [loadedData, setLoadedData] = useState<LoadedPersistenceData | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastPayloadRef = useRef<string>("");
  const supabase = createClient();
  const mounted = useRef(false);
  const initialized = useRef(false);

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
      try {
        const { data: { session } } = await supabase.auth.getSession();

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
          // ID is null
          // If we've already initialized once (mounted and finished first check),
          // it means the user explicitly wanted a "New Itinerary".
          if (initialized.current) {
            if (active) {
              setLoadedData(getEmptyData());
              lastPayloadRef.current = ""; // Reset payload ref to allow a fresh save
            }
            return;
          }
          // Initial mount with no ID -> Load the latest draft
          query = query.eq("status", "draft").order("last_activity_at", { ascending: false }).limit(1);
        }

        const { data, error } = await query.single();

        if (active && data) {
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
            pricing: { ...pricing, currency: data.currency || pricing?.currency || DEFAULT_CURRENCY },
            optimizationCount: data.optimization_count || 0,
            selectedClientId: data.client_id || "none",
            selectedStatus: data.status || "draft",
            tripMetadata: _tripMetadata,
            showTimestamps: data.show_timestamps ?? true,
            showPrices: data.show_prices ?? true,
            selectedTheme: data.selected_theme || 'classic',
            pdfOverrides: data.pdf_overrides || {},
            draftSourceItineraryId: data.draft_source_itinerary_id
          };

          // Seed the payload ref so we don't immediately re-save what we just loaded
          lastPayloadRef.current = JSON.stringify({
            status: newData.selectedStatus,
            itinerary_data: itineraryData,
            generation_preferences: data.generation_preferences || {},
            client_id: newData.selectedClientId === "none" ? null : newData.selectedClientId,
            optimization_count: newData.optimizationCount,
            show_timestamps: newData.showTimestamps,
            show_prices: newData.showPrices,
            selected_theme: newData.selectedTheme,
            pdf_overrides: newData.pdfOverrides,
            draft_source_itinerary_id: newData.draftSourceItineraryId
          });

          setLoadedData(newData);
        } else if (active) {
          setLoadedData(getEmptyData());
        }
      } catch (err) {
        console.warn("Failed to load itinerary from Supabase", err);
        if (active) setLoadedData(getEmptyData());
      } finally {
        initialized.current = true;
      }
    };

    loadDraft();

    return () => {
      active = false;
    };
  }, [currentTripId, supabase, setCurrentTripId]);

  const executeSave = useCallback(async (data: Partial<LoadedPersistenceData>, id: string | null, allowInsert = true) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const itineraryData = {
        ...(data.itinerary || {}),
        hotels: data.hotels || [],
        flights: data.flights || [],
        cabs: data.cabs || [],
        buses: data.buses || [],
        pricing: data.pricing
      };

      const formValues = data.tripMetadata || {};
      const startLoc = formValues.startingLocation;
      const endLoc = formValues.endingLocation || startLoc;
      const dests = formValues.destinations;
      
      // Compute nights/days suffix from form dates if available
      let nightsDaysSuffix = "";
      if (formValues.startDate && formValues.endDate) {
        const s = new Date(formValues.startDate);
        const e = new Date(formValues.endDate);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
          const totalDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
          const nights = totalDays;
          const days = totalDays + 1;
          nightsDaysSuffix = ` ${nights}N ${days}D`;
        }
      }

      let generatedTitle = "Untitled Architectural Draft";
      if (dests) {
        if (startLoc) {
          generatedTitle = `${startLoc} to ${dests}${nightsDaysSuffix}`;
        } else {
          generatedTitle = `Trip to ${dests}${nightsDaysSuffix}`;
        }
      }

      // Format dates if present
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

      const pricingCfg = { ...defaultPricingConfig, ...(data.pricing || {}) };

      const { finalTotal } = calcPricingBreakdown({
        itinerary: (data.itinerary as any)?.itinerary || [],
        hotels: data.hotels || [],
        flights: data.flights || [],
        cabs: data.cabs || [],
        buses: data.buses || [],
        pricing: pricingCfg
      });

      const finalClientPrice = finalTotal;

      const updatePayload: any = {
        user_id: session.user.id,
        title: generatedTitle,
        status: data.selectedStatus || "draft",
        starting_location: formValues.startingLocation || "In Preparation",
        ending_location: formValues.endingLocation || formValues.startingLocation || "In Preparation",
        destinations: dests || "TBD",
        start_date: startDate || format(new Date(), "yyyy-MM-dd"),
        end_date: endDate || format(new Date(), "yyyy-MM-dd"),
        budget: formValues.budget || null,
        // Strict casting for numeric fields to prevent 400 errors
        adult_pax: Number(pricingCfg.adultPax || 2),
        child_pax: Number(pricingCfg.childPax || 0),
        infant_pax: Number(pricingCfg.infantPax || 0),
        markup_value: Number(pricingCfg.markupValue || 15),
        markup_type: pricingCfg.markupType || 'percentage',
        tax_percentage: Number(pricingCfg.taxPercentage || 0),
        costing_type: pricingCfg.costingType || 'automatic',
        client_price: finalClientPrice > 0 ? finalClientPrice : null,
        itinerary_data: itineraryData || {},
        generation_preferences: formValues,
        client_id: data.selectedClientId === "none" ? null : data.selectedClientId,
        optimization_count: Number(data.optimizationCount || 0),
        show_timestamps: data.showTimestamps ?? true,
        show_prices: data.showPrices ?? true,
        selected_theme: data.selectedTheme || 'classic',
        pdf_overrides: data.pdfOverrides || {},
        draft_source_itinerary_id: data.draftSourceItineraryId,
        last_activity_at: new Date().toISOString(),
        currency: pricingCfg.currency,
        updated_financial_at: new Date().toISOString()
      };

      // Dirty check: only compare data payload (not the record ID) so that
      // switching between records always triggers an actual DB write even
      // if the data happens to look the same.
      const payloadString = JSON.stringify(updatePayload);
      
      // Dirty check: Only skip if payload matches AND we aren't trying to perform 
      // an initial insertion that was previously blocked by a background no-op (allowInsert=false).
      if (payloadString === lastPayloadRef.current && (id || !allowInsert)) {
        return id;
      }
      lastPayloadRef.current = payloadString;

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
  }, [supabase, setCurrentTripId]);

  // saveAll reads currentTripIdRef at *fire-time*, not at creation-time,
  // so it always uses the correct record ID even after an async INSERT.
  // allowInsert=false: background auto-save must NEVER create phantom empty records.
  const saveAll = useCallback((data: Partial<LoadedPersistenceData>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    // Capture data in the closure so the correct snapshot is used when the timer fires.
    const snapshot = data;
    saveTimer.current = setTimeout(() => executeSave(snapshot, currentTripIdRef.current, false), 1500);
  }, [executeSave]);

  const saveNow = useCallback((data: Partial<LoadedPersistenceData>, explicitId?: string | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const targetId = explicitId !== undefined ? explicitId : currentTripIdRef.current;
    // Immediately sync the ref so any concurrent saveAll timers use the correct ID.
    if (explicitId !== undefined) {
      currentTripIdRef.current = explicitId;
    }
    return executeSave(data, targetId, true);
  }, [executeSave]);

  // Cleanly resets persistence state for a new trip WITHOUT writing to the DB.
  // This cancels any pending auto-save timers and nulls the ref, ensuring
  // that no phantom records are created when the user clicks "New Itinerary"
  // or starts filling a form before generation.
  const resetForNewTrip = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    currentTripIdRef.current = null;
    lastPayloadRef.current = ""; // Reset dirty-check so next real save always writes
  }, []);

  return { loadedData, saveAll, saveNow, resetForNewTrip };
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
    showPrices: true,
    selectedTheme: 'classic',
    pdfOverrides: {},
    draftSourceItineraryId: null
  };
}
