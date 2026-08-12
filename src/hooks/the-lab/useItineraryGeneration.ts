// Handles calling generateTravelItinerary and fetchItineraryImages
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateTravelItinerary, type TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { fetchItineraryImages } from "@/ai/flows/fetch-itinerary-images";
import { format } from "date-fns";
import type { TheLabFormValues, TripMetadata } from "@/types/the-lab";

export function useItineraryGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<TravelItineraryOutput | null>(null);
  const { toast } = useToast();

  const generate = useCallback(async (
    values: TheLabFormValues,
    feedback?: string,
    tripMetadata?: TripMetadata | null
  ) => {
    console.log("[useItineraryGeneration] generate called. values:", values, "feedback:", feedback, "tripMetadata:", tripMetadata);
    setIsGenerating(true);
    let effectiveValues = values;

    // Fallback to tripMetadata if feedback is present but dates are missing
    if (feedback && (!values.startDate || !values.endDate) && tripMetadata) {
      console.log("[useItineraryGeneration] Feedback mode & missing dates. Resolving effectiveValues using fallback tripMetadata...");
      effectiveValues = {
        ...tripMetadata,
        ...values,
        startDate: values.startDate || tripMetadata.startDate,
        endDate: values.endDate || tripMetadata.endDate,
        startingLocation: values.startingLocation || tripMetadata.startingLocation,
        destinations: values.destinations || tripMetadata.destinations,
      } as any;
    }

    try {
      let { startDate, endDate } = effectiveValues;
      console.log("[useItineraryGeneration] Parsing and validating dates. startDate:", startDate, "endDate:", endDate);

      if (startDate && !(startDate instanceof Date)) startDate = new Date(startDate);
      if (endDate && !(endDate instanceof Date)) endDate = new Date(endDate);

      if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error("[useItineraryGeneration] Invalid start date:", startDate);
        throw new Error("Invalid start date. Please ensure a valid date is selected.");
      }
      if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
        console.error("[useItineraryGeneration] Invalid end date:", endDate);
        throw new Error("Invalid end date. Please ensure a valid date is selected.");
      }

      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      console.log("[useItineraryGeneration] Calling generateTravelItinerary server action with inputs:", {
        startingLocation: effectiveValues.startingLocation,
        endingLocation: effectiveValues.endingLocation || effectiveValues.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        destinations: effectiveValues.destinations,
        tripType: effectiveValues.tripType,
        travelMethods: effectiveValues.travelMethods,
        mustInclude: effectiveValues.mustInclude || "",
        avoid: effectiveValues.avoid || "",
        leisureTime: !!effectiveValues.leisureTime,
        leisureDay: effectiveValues.leisureDay ?? undefined,
        travelTimePreference: effectiveValues.travelTimePreference,
        feedback: typeof feedback === 'string' ? feedback : "",
        daywiseDestinations: effectiveValues.daywiseDestinations || "",
        hotels: effectiveValues.hotels || [],
      });

      const result = await generateTravelItinerary({
        startingLocation: effectiveValues.startingLocation,
        endingLocation: effectiveValues.endingLocation || effectiveValues.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        destinations: effectiveValues.destinations,
        tripType: effectiveValues.tripType,
        travelMethods: effectiveValues.travelMethods,
        mustInclude: effectiveValues.mustInclude || "",
        avoid: effectiveValues.avoid || "",
        leisureTime: !!effectiveValues.leisureTime,
        leisureDay: effectiveValues.leisureDay ?? undefined,
        travelTimePreference: effectiveValues.travelTimePreference,
        feedback: typeof feedback === 'string' ? feedback : "",
        daywiseDestinations: effectiveValues.daywiseDestinations || "",
        hotels: effectiveValues.hotels || [],
        hotelsText: "",
      });
      console.log("[useItineraryGeneration] generateTravelItinerary response received:", result);

      // Fetch dynamic images — exactly ONE image per day from Unsplash
      try {
        const daySearchTerms = result.itinerary.map(day => day.imageSearchTerm || day.areaFocus);
        const dayAreaNames = result.itinerary.map(day => day.areaFocus);
        const dayImageUrls = await fetchItineraryImages(daySearchTerms, dayAreaNames);

        result.itinerary = result.itinerary.map((day, dIdx) => ({
          ...day,
          imageUrl: dayImageUrls[dIdx] || undefined,
        }));
      } catch (imgError) {
        console.warn('Failed to fetch dynamic day images, continuing with fallbacks:', imgError);
      }

      setItinerary(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred during generation';
      const code = (err as any)?.code;
      console.error(`[useItineraryGeneration] Generation failed${code ? ` [${code}]` : ''}:`, message);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: message,
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  return { isGenerating, itinerary, setItinerary, generate };
}


