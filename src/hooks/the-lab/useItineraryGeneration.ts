import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateTravelItinerary, type TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { fetchItineraryImages } from "@/ai/flows/fetch-itinerary-images";
import { generateDaySummaries } from "@/ai/flows/generate-day-summaries";
import { useLabStore } from "@/store/the-lab/labStore";
import { format } from "date-fns";
import type { TheLabFormValues, TripMetadata } from "@/types/the-lab";
import { formatTitleCase } from "@/components/pdf/utils";

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

      const rawLeisureDay = effectiveValues.leisureDay as unknown;
      const parsedLeisureDay = rawLeisureDay !== undefined && rawLeisureDay !== null && rawLeisureDay !== ''
        ? Number(rawLeisureDay)
        : undefined;
      const validLeisureDay = parsedLeisureDay !== undefined && !isNaN(parsedLeisureDay) ? parsedLeisureDay : undefined;

      console.log("[useItineraryGeneration] Calling generateTravelItinerary server action with inputs:", {
        startingLocation: effectiveValues.startingLocation,
        endingLocation: effectiveValues.endingLocation || effectiveValues.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        destinations: effectiveValues.destinations,
        tripType: effectiveValues.tripType,
        mealPlan: effectiveValues.mealPlan || "CP",
        travelMethods: effectiveValues.travelMethods,
        mustInclude: effectiveValues.mustInclude || "",
        avoid: effectiveValues.avoid || "",
        leisureTime: !!effectiveValues.leisureTime,
        leisureDay: validLeisureDay,
        travelTimePreference: effectiveValues.travelTimePreference,
        feedback: typeof feedback === 'string' ? feedback : "",
        daywiseDestinations: effectiveValues.daywiseDestinations || "",
        hotels: (effectiveValues.hotels || []).map((h, i) => ({
          ...h,
          id: h.id || `h-${Date.now()}-${i}`,
          dayIndex: typeof h.dayIndex === 'number' ? h.dayIndex : i,
          name: h.name || '',
        })),
      });

      const res = await generateTravelItinerary({
        startingLocation: effectiveValues.startingLocation,
        endingLocation: effectiveValues.endingLocation || effectiveValues.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        destinations: effectiveValues.destinations,
        tripType: effectiveValues.tripType,
        mealPlan: effectiveValues.mealPlan || "CP",
        travelMethods: effectiveValues.travelMethods,
        mustInclude: effectiveValues.mustInclude || "",
        avoid: effectiveValues.avoid || "",
        leisureTime: !!effectiveValues.leisureTime,
        leisureDay: validLeisureDay,
        travelTimePreference: effectiveValues.travelTimePreference,
        feedback: typeof feedback === 'string' ? feedback : "",
        daywiseDestinations: effectiveValues.daywiseDestinations || "",
        hotels: (effectiveValues.hotels || []).map((h, i) => ({
          ...h,
          id: h.id || `h-${Date.now()}-${i}`,
          dayIndex: typeof h.dayIndex === 'number' ? h.dayIndex : i,
          name: h.name || '',
        })),
        hotelsText: "",
      });
      console.log("[useItineraryGeneration] generateTravelItinerary response received:", res);

      if (!res.success) {
        console.error(`[useItineraryGeneration] Generation failed${res.code ? ` [${res.code}]` : ''}:`, res.error);
        toast({
          variant: "destructive",
          title: res.code === 'UNAUTHORIZED' ? "Sign In Required" : "Generation Failed",
          description: res.error,
        });
        if (res.code === 'UNAUTHORIZED' && typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          }, 1500);
        }
        return null;
      }

      const result = res.data;

      // Fetch dynamic images — exactly ONE photo per day via Wikipedia/Commons pipeline
      try {
        const daySearchTerms = result.itinerary.map(day => day.imageSearchTerm || day.areaFocus);
        const dayAreaNames = result.itinerary.map(day => day.areaFocus);
        const dayImageUrls = await fetchItineraryImages(daySearchTerms, dayAreaNames);

        result.itinerary = result.itinerary.map((day, dIdx) => ({
          ...day,
          imageUrl: dayImageUrls[dIdx] || undefined,
        }));

        // Automatically archive generated photos to the photos database
        try {
          const photosToArchive = dayImageUrls
            .map((url, idx) => ({
              url,
              destination: dayAreaNames[idx],
              searchTerm: daySearchTerms[idx],
              title: daySearchTerms[idx] || dayAreaNames[idx],
              source: 'generated',
            }))
            .filter((p) => typeof p.url === 'string' && p.url.length > 0);

          if (photosToArchive.length > 0) {
            fetch('/api/photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photos: photosToArchive }),
            }).catch(e => console.warn('[useItineraryGeneration] Photo archive sync notice:', e));

            if (typeof window !== 'undefined') {
              const cached = JSON.parse(localStorage.getItem('gozy_local_photo_archive') || '[]');
              const existingUrls = new Set(cached.map((c: any) => c.url));
              const newItems = photosToArchive
                .filter(p => !existingUrls.has(p.url))
                .map(p => ({
                  ...p,
                  id: 'gen-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                  created_at: new Date().toISOString(),
                }));
              localStorage.setItem('gozy_local_photo_archive', JSON.stringify([...newItems, ...cached].slice(0, 100)));
            }
          }
        } catch (archiveErr) {
          console.warn('[useItineraryGeneration] Failed to queue photo archive:', archiveErr);
        }
      } catch (imgError) {
        console.warn('Failed to fetch dynamic day images, continuing with fallbacks:', imgError);
      }

      // Set Itinerary at a Glance (daySummaries) and aboutPlace generated by Gemini
      const aiSummaries =
        Array.isArray((result as any).daySummaries) && (result as any).daySummaries.length > 0
          ? (result as any).daySummaries
          : (result.itinerary || []).map((d: any) => d.summary).filter(Boolean);

      let initialPdfOverrides: any = {
        daySummaries: aiSummaries,
        aboutPlace: (result as any).aboutPlace ?? null,
      };

      // Fallback: If Gemini did not return daySummaries, run generateDaySummaries
      if (!aiSummaries || aiSummaries.length === 0) {
        try {
          const dest = result.itinerary[0]?.areaFocus?.split(",")[0] ?? effectiveValues.destinations?.split(",")[0] ?? "";
          const summaryResult = await generateDaySummaries({
            destination: dest,
            days: result.itinerary.map((d: any) => ({
              day: d.day,
              date: d.date,
              areaFocus: d.areaFocus,
              timeline: (d.timeline ?? []).map((t: any) => ({
                time: t.time,
                details: t.details,
              })),
            })),
          });

          initialPdfOverrides = {
            daySummaries: summaryResult.summaries,
            aboutPlace: summaryResult.aboutPlace ?? null,
          };
        } catch (sumError) {
          console.warn('[useItineraryGeneration] Fallback day summaries generation failed:', sumError);
        }
      }

      useLabStore.getState().setPdfOverrides(initialPdfOverrides);
      (result as any).pdfOverrides = initialPdfOverrides;
      (result as any).daySummaries = initialPdfOverrides.daySummaries;
      if (initialPdfOverrides.aboutPlace) {
        (result as any).aboutPlace = initialPdfOverrides.aboutPlace;
      }

      // Resolve AI-generated title (or fallback if empty)
      const startLoc = effectiveValues.startingLocation;
      const dests = effectiveValues.destinations;
      let finalTitle = (result as any).title?.trim();

      if (!finalTitle) {
        let fallbackTitle = dests ? (startLoc ? `${startLoc} to ${dests}` : `Trip to ${dests}`) : "Custom Travel Package";
        if (startDate && endDate && endDate > startDate) {
          const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          fallbackTitle += ` ${totalDays}N ${totalDays + 1}D`;
        }
        finalTitle = fallbackTitle;
      }

      const formattedTitle = formatTitleCase(finalTitle);
      (result as any).title = formattedTitle;
      (result as any).tripTitle = formattedTitle;

      // Update store's tripMetadata so the title is available across all tabs and persistence
      const currentMeta = useLabStore.getState().tripMetadata || {};
      useLabStore.getState().setTripMetadata({
        ...currentMeta,
        ...effectiveValues,
        title: formattedTitle,
      });

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


