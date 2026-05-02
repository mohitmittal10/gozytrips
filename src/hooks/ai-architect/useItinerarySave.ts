// Handles validating session, DB upserting, and saving trip to Supabase
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { buildLineItems } from "@/lib/helpers/trip-line-items";
import type { SaveItineraryOptions } from "@/types/ai-architect";
import { calcPricingBreakdown } from "@/lib/itinerary-calculator";
import { defaultPricingConfig } from "@/types/pricing";

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
    let newlyCreatedTripId: string | null = null;
    try {
      if (!user) throw new Error("Please sign in to save your itinerary.");
      if (!itineraryState.itinerary) throw new Error("No itinerary to save. Please generate one first.");
      
      const { startDate, endDate, startingLocation, destinations, mustInclude, budget } = formValues;

      if (!startDate) throw new Error("Please select a start date.");
      if (!endDate) throw new Error("Please select an end date.");
      if (!startingLocation?.trim()) throw new Error("Please enter a starting location.");
      if (!destinations?.trim()) throw new Error("Please enter destinations.");

      let dtStart = startDate instanceof Date ? startDate : new Date(startDate);
      let dtEnd = endDate instanceof Date ? endDate : new Date(endDate);
      
      if (isNaN(dtStart.getTime())) throw new Error("Invalid start date.");
      if (isNaN(dtEnd.getTime())) throw new Error("Invalid end date.");
      if (dtEnd <= dtStart) throw new Error("End date must be after start date.");

      // Check Session Details directly before inserting
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error("Authentication failed or session expired. Sign in again.");

      const pricingCfg = { ...defaultPricingConfig, ...(options.pricingOverride || itineraryState.pricing || {}) };

      // Use the centralized calculation engine
      const { finalTotal, markupAmount, taxAmount } = calcPricingBreakdown({
        itinerary: itineraryState.itinerary?.itinerary || [],
        hotels: itineraryState.hotels || [],
        flights: itineraryState.flights || [],
        cabs: itineraryState.cabs || [],
        buses: itineraryState.buses || [],
        pricing: pricingCfg
      });

      const clientPrice = finalTotal;
      const markupVal = markupAmount;
      const taxPct = pricingCfg.taxPercentage;
      const paxInfo = {
        adult: pricingCfg.adultPax || 2,
        child: pricingCfg.childPax || 0,
        infant: pricingCfg.infantPax || 0
      };

      const tripData = {
        user_id: session.user.id,
        title: (() => {
          const totalDays = Math.round((dtEnd.getTime() - dtStart.getTime()) / (1000 * 60 * 60 * 24));
          const nights = totalDays;
          const days = totalDays + 1;
          return `${startingLocation} to ${destinations} ${nights}N ${days}D`;
        })(),
        description: mustInclude ? `Must include: ${mustInclude}` : null,
        starting_location: startingLocation,
        ending_location: formValues.endingLocation || startingLocation,
        destinations,
        start_date: format(dtStart, "yyyy-MM-dd"),
        end_date: format(dtEnd, "yyyy-MM-dd"),
        budget: budget || null,
        client_id: itineraryState.selectedClientId === "none" ? null : itineraryState.selectedClientId,
        status: itineraryState.selectedStatus,
        itinerary_data: { 
          ...itineraryState.itinerary, 
          hotels: itineraryState.hotels, 
          flights: itineraryState.flights, 
          cabs: itineraryState.cabs, 
          buses: itineraryState.buses, 
          pricing: pricingCfg 
        },
        generation_preferences: formValues,
        selected_theme: itineraryState.selectedTheme || 'classic',
        show_timestamps: itineraryState.showTimestamps ?? true,
        show_prices: itineraryState.showPrices ?? true,
        optimization_count: itineraryState.optimizationCount || 0,
        pdf_overrides: itineraryState.pdfOverrides || {},
        last_activity_at: new Date().toISOString(),
        client_price: clientPrice,
        markup_value: pricingCfg.markupValue || 0,
        markup_type: pricingCfg.markupType || 'percentage',
        tax_percentage: taxPct,
        adult_pax: paxInfo.adult,
        child_pax: paxInfo.child,
        infant_pax: paxInfo.infant,
        costing_type: pricingCfg.costingType || 'automatic',
        commission_rate: 0,
        commission_amount: 0,
        currency: pricingCfg.currency || "INR",
        updated_financial_at: new Date().toISOString()
      };

      const resolvedActiveTripId = await _upsertItinerary(tripData, currentTripId);
      if (resolvedActiveTripId) setCurrentTripId(resolvedActiveTripId);
      newlyCreatedTripId = resolvedActiveTripId;

      if (resolvedActiveTripId) {
        const lineItems = buildLineItems({
          activeTripId: resolvedActiveTripId,
          itinerary: itineraryState.itinerary,
          hotels: itineraryState.hotels,
          flights: itineraryState.flights,
          cabs: itineraryState.cabs,
          buses: itineraryState.buses,
          paxInfo,
          pricingCfg
        });

        if (lineItems.length > 0) {
          const { error: liError } = await supabase.from("trip_line_items").insert(lineItems);
          if (liError) console.warn("Failed to seed trip_line_items:", liError.message);
        }
      }

      toast({ title: "Success!", description: "Your itinerary has been saved to your trips." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSaving(false);
    }
  }, [user, currentTripId, setCurrentTripId, supabase, toast]);

  return { saveItinerary, isSaving };
}
