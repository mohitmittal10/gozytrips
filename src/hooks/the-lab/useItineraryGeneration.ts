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
    setIsGenerating(true);
    let effectiveValues = values;

    // Fallback to tripMetadata if feedback is present but dates are missing
    if (feedback && (!values.startDate || !values.endDate) && tripMetadata) {
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

      if (startDate && !(startDate instanceof Date)) startDate = new Date(startDate);
      if (endDate && !(endDate instanceof Date)) endDate = new Date(endDate);

      if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
        throw new Error("Invalid start date. Please ensure a valid date is selected.");
      }
      if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
        throw new Error("Invalid end date. Please ensure a valid date is selected.");
      }

      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const result = await generateTravelItinerary({
        startingLocation: effectiveValues.startingLocation,
        endingLocation: effectiveValues.endingLocation || effectiveValues.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        destinations: effectiveValues.destinations,
        budget: effectiveValues.budget ?? undefined,
        mustInclude: effectiveValues.mustInclude || "",
        avoid: effectiveValues.avoid || "",
        leisureTime: !!effectiveValues.leisureTime,
        leisureDay: effectiveValues.leisureDay ?? undefined,
        travelTimePreference: effectiveValues.travelTimePreference,
        feedback: typeof feedback === 'string' ? feedback : "",
      });

      // Fetch dynamic images
      try {
        const daySearchTerms = result.itinerary.map(day => day.imageSearchTerm || day.areaFocus);
        const dayAreaNames = result.itinerary.map(day => day.areaFocus);
        const dayImageUrls = await fetchItineraryImages(daySearchTerms, dayAreaNames);

        const activitySteps = result.itinerary.flatMap((day, dIdx) =>
          day.timeline.map((step, sIdx) => ({
            dayIndex: dIdx,
            stepIndex: sIdx,
            searchTerm: step.imageSearchTerm || step.details.split('.')[0] || day.areaFocus,
            fallbackArea: day.areaFocus
          }))
        );

        const activitySearchTerms = activitySteps.map(s => s.searchTerm);
        const activityFallbacks = activitySteps.map(s => s.fallbackArea);
        const activityImageUrls = await fetchItineraryImages(activitySearchTerms, activityFallbacks);

        result.itinerary = result.itinerary.map((day, dIdx) => ({
          ...day,
          imageUrl: dayImageUrls[dIdx] || undefined,
          timeline: day.timeline.map((step, sIdx) => {
            const flatIdx = activitySteps.findIndex(as => as.dayIndex === dIdx && as.stepIndex === sIdx);
            return {
              ...step,
              imageUrl: activityImageUrls[flatIdx] || undefined
            };
          })
        }));
      } catch (imgError) {
        console.warn('Failed to fetch dynamic images, continuing with fallbacks:', imgError);
      }

      setItinerary(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred during generation';
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


