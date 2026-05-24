// Thin orchestrator shell for The Lab wiring hooks and components together (<150 lines)
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import UniqueLoading from "@/components/ui/morph-loading";
import { ShiningText } from "@/components/ui/shining-text";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { updateItineraryStatus } from "@/lib/services/itinerary-status";
import { useClients } from "@/lib/hooks/use-clients";
import { formSchema, type TheLabFormValues, type ActiveLabTab } from "@/types/the-lab";
import { theLabSteps, loadingTexts, MAX_AI_OPTIMIZATIONS } from "@/constants/the-lab";
import { useItineraryGeneration } from "@/hooks/the-lab/useItineraryGeneration";
import { useItineraryPersistence } from "@/hooks/the-lab/useItineraryPersistence";
import { useItinerarySave } from "@/hooks/the-lab/useItinerarySave";
import { useBaseCostCalculator } from "@/hooks/the-lab/useBaseCostCalculator";

import TheLabForm from "./TheLabForm";
import TheLabHeader from "./TheLabHeader";
import TheLabSidebar from "./TheLabSidebar";
import TheLabMobileTabs from "./TheLabMobileTabs";
import TheLabSummaryPanel from "./TheLabSummaryPanel";
import TheLabHero from "./TheLabHero";
import TheLabTabContent from "./TheLabTabContent";
import { TheLabPdfPreview } from "./TheLabPdfPreview";
import type { PdfTheme } from "@/components/pdf-template";

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: any = {};

export default function TheLab() {
  const searchParams = useSearchParams();
  const itineraryIdFromUrl = searchParams.get('itineraryId');
  const queryFromUrl = searchParams.get('q');
  
  const [activeLabTab, setActiveLabTab] = useState<ActiveLabTab>(itineraryIdFromUrl ? 'itinerary' : 'new');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');

  // Modular Hooks
  const { clients } = useClients();
  const { user, agencySettings } = useAuth();
  const supabase = createClient();
  const [currentTripId, setCurrentTripId] = useState<string | null>(itineraryIdFromUrl);
  const { loadedData, isLoading, saveAll, saveNow, resetForNewTrip } = useItineraryPersistence({ currentTripId, setCurrentTripId });
  const { isGenerating, itinerary, setItinerary, generate } = useItineraryGeneration();

  // Tracks which trip ID was last synced into the form so we only call
  // form.reset() when the user switches to a genuinely different trip.
  // undefined = form has never been reset for any trip yet.
  const formSyncedForIdRef = useRef<string | null | undefined>(undefined);

  // Local state mapped from loadedData
  const [hotels, setHotels] = useState<any[]>(EMPTY_ARRAY);
  const [flights, setFlights] = useState<any[]>(EMPTY_ARRAY);
  const [cabs, setCabs] = useState<any[]>(EMPTY_ARRAY);
  const [buses, setBuses] = useState<any[]>(EMPTY_ARRAY);
  const [pricing, setPricing] = useState<any>(undefined);
  const [optimizationCount, setOptimizationCount] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState("none");
  const [selectedStatus, setSelectedStatus] = useState("draft");
  const [tripMetadata, setTripMetadata] = useState<any>(null);
  const [pdfOverrides, setPdfOverrides] = useState<any>(EMPTY_OBJECT);
  const [inclusions, setInclusions] = useState<string>("");
  const [exclusions, setExclusions] = useState<string>("");

  const { saveItinerary, isSaving } = useItinerarySave({ currentTripId, setCurrentTripId });
  const { baseCost, finalTotal, currencySymbol } = useBaseCostCalculator({ itinerary, flights, hotels, cabs, buses, pricing });

  const tripTitle = useMemo(() => {
    if (!tripMetadata) return `Trip to ${itinerary?.itinerary?.[0]?.areaFocus?.split(',')[0] || 'Destination'}`;
    const startLoc = tripMetadata.startingLocation;
    const dests = tripMetadata.destinations;
    let title = dests ? (startLoc ? `${startLoc} to ${dests}` : `Trip to ${dests}`) : "Untitled Lab Draft";
    
    if (tripMetadata.startDate && tripMetadata.endDate) {
      const s = new Date(tripMetadata.startDate);
      const e = new Date(tripMetadata.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
        const totalDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        title += ` ${totalDays}N ${totalDays + 1}D`;
      }
    }
    return title;
  }, [tripMetadata, itinerary]);

  const form = useForm<TheLabFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { startingLocation: "", endingLocation: "", startDate: undefined, endDate: undefined, destinations: "", travelTimePreference: "no_preference", leisureTime: false },
  });

  // Hydrate from persistence
  useEffect(() => {
    if (loadedData) {
      setItinerary(loadedData.itinerary);
      setHotels(loadedData.hotels || []);
      setFlights(loadedData.flights || []);
      setCabs(loadedData.cabs || []);
      setBuses(loadedData.buses || []);
      setPricing(loadedData.pricing);
      setOptimizationCount(loadedData.optimizationCount);
      setSelectedClientId(loadedData.selectedClientId);
      setSelectedStatus(loadedData.selectedStatus);
      setTripMetadata(loadedData.tripMetadata);
      setShowTimestamps(loadedData.showTimestamps ?? true);
      setShowPrices(loadedData.showPrices ?? true);
      if (loadedData.selectedTheme) setSelectedTheme(loadedData.selectedTheme as PdfTheme);
      if (loadedData.pdfOverrides) setPdfOverrides(loadedData.pdfOverrides);
      setInclusions(loadedData.inclusions || "");
      setExclusions(loadedData.exclusions || "");
      if (loadedData.tripMetadata && currentTripId && currentTripId !== formSyncedForIdRef.current) {
        // Only reset the form when the user has navigated to a DIFFERENT specific
        // trip from history. This prevents the new-trip form from being prefilled
        // on initial auto-load and avoids wiping user edits on re-renders.
        form.reset(loadedData.tripMetadata as any);
        formSyncedForIdRef.current = currentTripId;
      }
    } else if (queryFromUrl) {
      // Pre-fill from 'q' parameter if no persistence data
      const currentVals = form.getValues();
      if (!currentVals.destinations) {
        form.setValue('destinations', queryFromUrl);
      }
    }
  }, [loadedData, setItinerary, form, queryFromUrl]);

  // Cleanup legacy localStorage keys one-time
  useEffect(() => {
    const legacyKeys = [
      'travelItinerary', 'travelHotels', 'travelFlights', 'travelCabs',
      'travelBuses', 'travelPricing', 'optimizationCount', 'draft_client_id',
      'draft_status', 'travelMetadata'
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  }, []);

  useEffect(() => {
    saveAll({ itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, showTimestamps, showPrices, selectedTheme, pdfOverrides, inclusions, exclusions });
  }, [itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, showTimestamps, showPrices, selectedTheme, pdfOverrides, inclusions, exclusions, saveAll]);

  // Auto-sync form changes to persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      setTripMetadata(values);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingTextIndex(prev => (prev + 1) % loadingTexts.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleCreateNew = useCallback(() => {
    form.reset();
    formSyncedForIdRef.current = null; // allow next history trip to reset the form
    setItinerary(null); setTripMetadata(null); setHotels([]); setFlights([]); setCabs([]); setBuses([]); setPricing(undefined);
    setInclusions(""); setExclusions("");
    setCurrentTripId(null); setSelectedClientId("none"); setSelectedStatus("draft"); setIsEditing(false); setCurrentStep(0); setOptimizationCount(0);
    // Reset persistence WITHOUT writing to DB. This cancels pending auto-save
    // timers and nulls the ref so no phantom records get created.
    resetForNewTrip();
    setActiveLabTab('new');
  }, [form, setItinerary, resetForNewTrip, setInclusions, setExclusions]);

  const handleStatusChangeAction = useCallback(async (newStatus: string) => {
    setSelectedStatus(newStatus);
    if (currentTripId && user?.id) {
       try {
         await updateItineraryStatus(currentTripId, newStatus, supabase, user.id);
       } catch (err) {
         console.error("Centralized status update fail:", err);
       }
    }
  }, [currentTripId, user?.id, supabase]);

  const handleNext = useCallback(async () => {
    const fields = theLabSteps[currentStep].fields;
    if (await form.trigger(fields as any) && currentStep < theLabSteps.length - 1) setCurrentStep(c => c + 1);
  }, [currentStep, form]);

  const onSubmit = useCallback(async (values: TheLabFormValues, feedback?: string) => {
    setTripMetadata(values);
    
    if (!feedback) {
      // Fresh generation: decouple from any existing record.
      // resetForNewTrip cancels pending auto-save timers and nulls the ref,
      // but does NOT write to the DB. No phantom records are created.
      setCurrentTripId(null);
      setHotels([]);
      setFlights([]);
      setCabs([]);
      setBuses([]);
      setPricing(undefined);
      setInclusions("");
      setExclusions("");
      resetForNewTrip();
    }
    
    // Run AI generation — no DB writes happen during this.
    const res = await generate(values, feedback, tripMetadata);
    if (!feedback) setOptimizationCount(0);
    
    if (res) {
      if (!feedback) {
        // Generation succeeded for a NEW itinerary.
        // NOW insert the record with the full itinerary data.
        await saveNow({
          itinerary: res,
          hotels: [],
          flights: [],
          cabs: [],
          buses: [],
          pricing: undefined,
          tripMetadata: values,
          selectedStatus: 'draft',
          optimizationCount: 0,
          inclusions: "",
          exclusions: "",
        }, null); // explicitId=null → INSERT a new record
      }
      setActiveLabTab('itinerary');
    }
  }, [generate, tripMetadata, setCurrentTripId, saveNow, resetForNewTrip, setHotels, setFlights, setCabs, setBuses, setPricing, setInclusions, setExclusions]);


  const isDesigningNew = activeLabTab === 'new';
  const isViewingItinerary = ['itinerary', 'flights-hotels', 'pricing', 'inclusions'].includes(activeLabTab);

  return (
    <section id="the-lab" className="w-full mx-auto pt-0 pb-10">
      {isViewingItinerary && (itinerary?.itinerary?.length ?? 0) > 0 && (
        <div className="w-full sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <TheLabHeader 
              itinerary={itinerary} 
              clients={clients} 
              selectedClientId={selectedClientId} 
              setSelectedClientId={setSelectedClientId} 
              selectedStatus={selectedStatus} 
              setSelectedStatus={handleStatusChangeAction} 
              showTimestamps={showTimestamps} 
              setShowTimestamps={setShowTimestamps} 
              showPrices={showPrices} 
              setShowPrices={setShowPrices} 
              isEditing={isEditing} 
              setIsEditing={setIsEditing} 
              handleDownloadPdf={() => setIsPreviewOpen(true)} 
              handleSaveItinerary={() => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing, showTimestamps, showPrices, selectedTheme, optimizationCount, tripMetadata, inclusions, exclusions })} 
              isSaving={isSaving} 
              activeLabTab={activeLabTab}
            />
          </div>
        </div>
      )}

      <div className={cn(
        "w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-10",
        isDesigningNew ? "pt-4" : "mt-8"
      )}>
        {!isDesigningNew && (
          <TheLabMobileTabs activeLabTab={activeLabTab} setActiveLabTab={setActiveLabTab} clients={clients} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} selectedStatus={selectedStatus} setSelectedStatus={handleStatusChangeAction} handleCreateNew={handleCreateNew} />
        )}
        
        <div className="flex flex-row items-start gap-4 lg:gap-6">
          <TheLabSidebar 
            isSidebarExpanded={isSidebarExpanded} 
            setIsSidebarExpanded={setIsSidebarExpanded} 
            activeLabTab={activeLabTab} 
            setActiveLabTab={setActiveLabTab} 
            handleCreateNew={handleCreateNew}
            isGenerating={isGenerating}
            isLoading={isLoading}
          />
          
          <div className={cn(
            "flex-1 min-w-0 flex flex-col",
            isDesigningNew || !itinerary || ['history', 'settings'].includes(activeLabTab) ? "items-center justify-center" : "lg:grid lg:grid-cols-12 gap-4"
          )}>
            <div className={cn(
              ['history','settings'].includes(activeLabTab) ? "w-full" : 
              (isDesigningNew || !itinerary ? "w-full max-w-5xl" : "lg:col-span-8 order-2 lg:order-1")
            )}>
              {(isGenerating && !itinerary) || (isLoading) ? (
                <div className="py-24 flex flex-col items-center min-h-[400px] justify-center space-y-12">
                  <UniqueLoading variant="morph" size="lg" />
                  <div className="h-8"><ShiningText text={isLoading ? "Restoring from Archive..." : loadingTexts[loadingTextIndex]} /></div>
                </div>
              ) : (
                <>
                  {isViewingItinerary && (itinerary?.itinerary?.length ?? 0) > 0 && <TheLabHero itinerary={itinerary} />}
                  <TheLabTabContent 
                    activeLabTab={activeLabTab} 
                    isGenerating={isGenerating} 
                    itinerary={itinerary} 
                    setItinerary={setItinerary} 
                    isEditing={isEditing} 
                    setIsEditing={setIsEditing} 
                    hotels={hotels} 
                    setHotels={setHotels} 
                    flights={flights} 
                    setFlights={setFlights} 
                    cabs={cabs} 
                    setCabs={setCabs} 
                    buses={buses} 
                    setBuses={setBuses} 
                    showTimestamps={showTimestamps} 
                    showPrices={showPrices} 
                    pricing={pricing} 
                    setPricing={setPricing} 
                    agencySettings={null} 
                    handleSaveItinerary={() => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing, showTimestamps, showPrices, selectedTheme, optimizationCount, tripMetadata, inclusions, exclusions })} 
                    isSaving={isSaving} 
                    setCurrentTripId={setCurrentTripId} 
                    setActiveLabTab={setActiveLabTab} 
                    form={form}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    onNext={handleNext}
                    onSubmit={onSubmit}
                    handleCreateNew={handleCreateNew}
                    inclusions={inclusions}
                    setInclusions={setInclusions}
                    exclusions={exclusions}
                    setExclusions={setExclusions}
                  />
                </>
              )}
            </div>
            
            {isViewingItinerary && itinerary && (
              <TheLabSummaryPanel 
                itinerary={itinerary} 
                selectedStatus={selectedStatus} 
                clients={clients} 
                selectedClientId={selectedClientId} 
                optimizationCount={optimizationCount} 
                isGenerating={isGenerating} 
                onOptimize={(feedback) => { onSubmit(form.getValues(), feedback); setOptimizationCount(p => p + 1); }} 
                finalTotal={finalTotal}
                currencySymbol={currencySymbol}
              />
            )}
          </div>
        </div>
      </div>

      <TheLabPdfPreview
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        itinerary={itinerary}
        hotels={hotels}
        flights={flights}
        pricing={pricing}
        baseCost={baseCost}
        tripTitle={tripTitle}
        showTimestamps={showTimestamps}
        showPrices={showPrices}
        inclusions={inclusions}
        exclusions={exclusions}
        agencySettings={agencySettings}
        itineraryId={currentTripId}
        pdfOverrides={pdfOverrides}
        onPdfOverridesChange={setPdfOverrides}
        theme={selectedTheme}
        onThemeChange={setSelectedTheme}
      />

    </section>
  );
}


