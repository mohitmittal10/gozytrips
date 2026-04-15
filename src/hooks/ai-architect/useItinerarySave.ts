// Handles validating session, DB upserting, and saving trip to Supabase
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generateTripId } from "@/types/financial";
import { buildLineItems } from "@/lib/helpers/trip-line-items";
import type { SaveItineraryOptions } from "@/types/ai-architect";

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
      const newTripId = generateTripId();
      const { data, error } = await supabase.from("itineraries").insert([{ ...tripData, trip_id: newTripId }]).select("id");
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

      const pricingCfg = options.pricingOverride || itineraryState.pricing || {};
      const markupValue = (pricingCfg as any).markupValue || 0;
      const markupType = (pricingCfg as any).markupType || 'percentage';
      const taxPct = (pricingCfg as any).taxPercentage || 0;
      const paxInfo = {
        adult: (pricingCfg as any).adultPax || 2,
        child: (pricingCfg as any).childPax || 0,
        infant: (pricingCfg as any).infantPax || 0,
      };

      // Calculate total base cost
      let totalBaseCost = 0;
      if (itineraryState.itinerary?.itinerary) {
        itineraryState.itinerary.itinerary.forEach((day: any) => {
          if (day.timeline) day.timeline.forEach((step: any) => { if (step.cost) totalBaseCost += step.cost; });
        });
      }
      itineraryState.hotels.forEach((h: any) => { totalBaseCost += (h.costAdult || 0) * paxInfo.adult + (h.costChild || 0) * paxInfo.child + (h.costInfant || 0) * paxInfo.infant; });
      itineraryState.flights.forEach((f: any) => { totalBaseCost += (f.costAdult || 0) * paxInfo.adult + (f.costChild || 0) * paxInfo.child + (f.costInfant || 0) * paxInfo.infant; });
      itineraryState.cabs.forEach((c: any) => { if (c.totalCost) totalBaseCost += c.totalCost; });
      itineraryState.buses.forEach((b: any) => { totalBaseCost += (b.costAdult || 0) * paxInfo.adult + (b.costChild || 0) * paxInfo.child + (b.costInfant || 0) * paxInfo.infant; });

      const markupAmount = markupType === 'percentage' ? (totalBaseCost * markupValue) / 100 : markupValue;
      const costWithMarkup = totalBaseCost + markupAmount;
      const clientPrice = costWithMarkup + (costWithMarkup * taxPct) / 100;

      const tripData = {
        user_id: session.user.id,
        title: `Trip to ${destinations}`,
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
        client_price: clientPrice,
        markup_value: markupValue,
        markup_type: markupType,
        tax_percentage: taxPct,
        adult_pax: paxInfo.adult,
        child_pax: paxInfo.child,
        infant_pax: paxInfo.infant,
        costing_type: (pricingCfg as any).costingType || 'automatic',
        commission_rate: 0,
        commission_amount: 0,
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
