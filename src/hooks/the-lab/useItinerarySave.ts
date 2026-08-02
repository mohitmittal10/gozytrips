// Handles validating session, DB upserting, and saving trip to Supabase
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { buildLineItems } from "@/lib/helpers/trip-line-items";
import type { SaveItineraryOptions } from "@/types/the-lab";
import { calcPricingBreakdown } from "@/services/financial";
import { defaultPricingConfig } from "@/types/pricing";
import { useLabStore } from "@/store/the-lab/labStore";

export function useItinerarySave({
  currentTripId,
  setCurrentTripId,
}: {
  currentTripId: string | null;
  setCurrentTripId: (id: string | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const _upsertItinerary = async (tripData: any, activeTripId: string | null) => {
    if (activeTripId) {
      const { error } = await supabase.from("itineraries").update(tripData).eq("id", activeTripId);
      if (error) throw error;
      await supabase.from("trip_line_items").delete().eq("itinerary_id", activeTripId);
      return activeTripId;
    } else {
      const { data, error } = await supabase.from("itineraries").insert([tripData]).select("id");
      if (error) throw error;
      return data?.[0]?.id || null;
    }
  };

  const saveItinerary = useCallback(async (
    options: SaveItineraryOptions,
    formValues: any,
    itineraryState: any
  ) => {
    setIsSaving(true);
    useLabStore.getState().setAutosaveStatus("saving");
    let newlyCreatedTripId: string | null = null;
    try {
      if (!user) throw new Error("Please sign in to save your itinerary.");
      if (!itineraryState.itinerary) throw new Error("No itinerary to save. Please generate one first.");

      // ── Step 1: Verify session ──────────────────────────────────────────────
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error("Authentication failed or session expired. Sign in again.");

      // ── Step 2: Resolve trip metadata ───────────────────────────────────────
      // Priority order:
      //   1. Live form values (most up-to-date when user is actively editing)
      //   2. itineraryState.tripMetadata (in-memory state synced from form watcher)
      //   3. DB record (authoritative source for trips loaded from history)
      //
      // We always fetch from DB when currentTripId is set because the form/state
      // may not be hydrated yet (e.g. user clicked Save directly from the
      // pricing tab right after loading a trip from the archive).

      let dbRecord: any = null;
      if (currentTripId) {
        const { data: rec, error: recErr } = await supabase
          .from("itineraries")
          .select("start_date, end_date, starting_location, ending_location, destinations, generation_preferences, budget, title")
          .eq("id", currentTripId)
          .single();
        if (!recErr && rec) dbRecord = rec;
      }

      const meta = itineraryState.tripMetadata || {};
      const prefs = dbRecord?.generation_preferences || {};

      // Resolve each field from the best available source.
      // For dates: DB columns (start_date / end_date) are the authoritative
      // source for existing trips — they are always stored as plain yyyy-MM-dd
      // strings and are never affected by timezone serialisation quirks.
      // For NEW trips (no currentTripId / no DB record), fall back to form/meta.
      const rawStartDate: string | Date | null =
        dbRecord?.start_date ??        // authoritative DB column  (yyyy-MM-dd)
        formValues?.startDate ??       // live form Date object
        meta.startDate ??              // in-memory state Date object
        prefs.startDate ??             // generation_preferences (may be ISO string)
        null;

      const rawEndDate: string | Date | null =
        dbRecord?.end_date ??          // authoritative DB column  (yyyy-MM-dd)
        formValues?.endDate ??
        meta.endDate ??
        prefs.endDate ??
        null;

      const resolvedStartingLocation: string =
        formValues?.startingLocation ||
        meta.startingLocation ||
        prefs.startingLocation ||
        dbRecord?.starting_location || "";

      const resolvedEndingLocation: string =
        formValues?.endingLocation ||
        meta.endingLocation ||
        prefs.endingLocation ||
        dbRecord?.ending_location ||
        resolvedStartingLocation;

      const resolvedDestinations: string =
        formValues?.destinations ||
        meta.destinations ||
        prefs.destinations ||
        dbRecord?.destinations || "";

      const resolvedBudget =
        formValues?.budget ??
        meta.budget ??
        prefs.budget ??
        dbRecord?.budget ?? null;

      const resolvedMustInclude =
        formValues?.mustInclude ??
        meta.mustInclude ??
        prefs.mustInclude ?? null;

      // ── Step 3: Validate & parse dates ──────────────────────────────────────
      if (!rawStartDate) throw new Error("Start date is missing. Please open the trip form and set a start date.");
      if (!rawEndDate)   throw new Error("End date is missing. Please open the trip form and set an end date.");
      if (!resolvedStartingLocation.trim()) throw new Error("Starting location is missing. Please update the trip form.");
      if (!resolvedDestinations.trim())     throw new Error("Destination is missing. Please update the trip form.");

      // Parse dates in a timezone-safe way:
      // • If it's already a Date object → use as-is.
      // • If it's a plain yyyy-MM-dd string → append T00:00:00 so JS treats it
      //   as LOCAL time, not UTC midnight (avoids off-by-one day in IST/US timezones).
      // • Otherwise → let Date() do its best and validate the result.
      function parseDate(raw: string | Date): Date {
        if (raw instanceof Date) return raw;
        // plain date string: "2025-05-22"
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T00:00:00`);
        return new Date(raw);
      }

      const dtStart = parseDate(rawStartDate as string | Date);
      const dtEnd   = parseDate(rawEndDate   as string | Date);

      if (isNaN(dtStart.getTime())) throw new Error("Invalid start date. Please edit the trip form.");
      if (isNaN(dtEnd.getTime()))   throw new Error("Invalid end date. Please edit the trip form.");

      // Only enforce ordering for brand-new trips (existing trips may have been
      // created with legacy data; we must not block financial updates over it).
      if (!currentTripId && dtEnd <= dtStart) {
        throw new Error("End date must be after start date.");
      }

      // ── Step 4: Pricing ─────────────────────────────────────────────────────
      const pricingCfg = { ...defaultPricingConfig, ...(options.pricingOverride || itineraryState.pricing || {}) };

      const { finalTotal, markupAmount, taxAmount } = calcPricingBreakdown({
        itinerary: itineraryState.itinerary?.itinerary || [],
        hotels:    itineraryState.hotels    || [],
        flights:   itineraryState.flights   || [],
        cabs:      itineraryState.cabs      || [],
        buses:     itineraryState.buses     || [],
        pricing:   pricingCfg
      });

      const taxPct = pricingCfg.taxPercentage;
      const paxInfo = {
        adult:  pricingCfg.adultPax  || 2,
        child:  pricingCfg.childPax  || 0,
        infant: pricingCfg.infantPax || 0,
      };

      // ── Step 5: Build DB payload ─────────────────────────────────────────────
      const totalDays = Math.round((dtEnd.getTime() - dtStart.getTime()) / (1000 * 60 * 60 * 24));
      const generatedTitle = `${resolvedStartingLocation} to ${resolvedDestinations} ${totalDays}N ${totalDays + 1}D`;

      // Merge resolved values back into generation_preferences so future saves
      // always have the correct data even if the form is never opened again.
      const mergedPrefs = {
        ...prefs,
        ...meta,
        ...(formValues || {}),
        startingLocation: resolvedStartingLocation,
        endingLocation:   resolvedEndingLocation,
        destinations:     resolvedDestinations,
        startDate:        format(dtStart, "yyyy-MM-dd"),
        endDate:          format(dtEnd,   "yyyy-MM-dd"),
        budget:           resolvedBudget,
      };

      const tripData = {
        user_id:           session.user.id,
        title:             generatedTitle,
        description:       resolvedMustInclude ? `Must include: ${resolvedMustInclude}` : null,
        starting_location: resolvedStartingLocation,
        ending_location:   resolvedEndingLocation,
        destinations:      resolvedDestinations,
        start_date:        format(dtStart, "yyyy-MM-dd"),
        end_date:          format(dtEnd,   "yyyy-MM-dd"),
        budget:            resolvedBudget || null,
        client_id:         itineraryState.selectedClientId === "none" ? null : itineraryState.selectedClientId,
        status:            itineraryState.selectedStatus,
        itinerary_data: {
          ...itineraryState.itinerary,
          hotels:  itineraryState.hotels,
          flights: itineraryState.flights,
          cabs:    itineraryState.cabs,
          buses:   itineraryState.buses,
          pricing: pricingCfg,
          inclusions: itineraryState.inclusions,
          exclusions: itineraryState.exclusions,
          termsAndConditions: itineraryState.termsAndConditions,
          cancellationPolicy: itineraryState.cancellationPolicy,
          paymentMethods: itineraryState.paymentMethods,
        },
        generation_preferences: mergedPrefs,
        selected_theme:     itineraryState.selectedTheme || "classic",
        show_timestamps:    itineraryState.showTimestamps ?? true,
        optimization_count: itineraryState.optimizationCount || 0,
        pdf_overrides:      itineraryState.pdfOverrides || {},
        last_activity_at:   new Date().toISOString(),
        client_price:       finalTotal,
        markup_value:       pricingCfg.markupValue || 0,
        markup_type:        pricingCfg.markupType || "percentage",
        tax_percentage:     taxPct,
        adult_pax:          paxInfo.adult,
        child_pax:          paxInfo.child,
        infant_pax:         paxInfo.infant,

        commission_rate:    0,
        commission_amount:  0,
        currency:           pricingCfg.currency || "INR",
        updated_financial_at: new Date().toISOString(),
      };

      // ── Step 6: Upsert ──────────────────────────────────────────────────────
      const resolvedActiveTripId = await _upsertItinerary(tripData, currentTripId);
      if (resolvedActiveTripId) setCurrentTripId(resolvedActiveTripId);
      newlyCreatedTripId = resolvedActiveTripId;

      // ── Step 7: Line items ───────────────────────────────────────────────────
      if (resolvedActiveTripId) {
        const lineItems = buildLineItems({
          activeTripId: resolvedActiveTripId,
          itinerary:    itineraryState.itinerary,
          hotels:       itineraryState.hotels,
          flights:      itineraryState.flights,
          cabs:         itineraryState.cabs,
          buses:        itineraryState.buses,
          paxInfo,
          pricingCfg,
        });

        if (lineItems.length > 0) {
          const { error: liError } = await supabase.from("trip_line_items").insert(lineItems);
          if (liError) console.warn("Failed to seed trip_line_items:", liError.message);
        }
      }

      toast({ title: "Saved!", description: "Your itinerary has been saved." });
      useLabStore.getState().setAutosaveStatus("saved");
    } catch (err) {
      useLabStore.getState().setAutosaveStatus("error");
      const message = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSaving(false);
    }
  }, [user, currentTripId, setCurrentTripId, supabase, toast]);

  return { saveItinerary, isSaving };
}
