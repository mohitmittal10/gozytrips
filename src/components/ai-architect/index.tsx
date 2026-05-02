// Thin orchestrator shell for AiArchitect wiring hooks and components together (<150 lines)
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { formSchema, type AiArchitectFormValues, type ActiveArchitectTab } from "@/types/ai-architect";
import { aiArchitectSteps, loadingTexts, MAX_AI_OPTIMIZATIONS } from "@/constants/ai-architect";
import { useItineraryGeneration } from "@/hooks/ai-architect/useItineraryGeneration";
import { useItineraryPersistence } from "@/hooks/ai-architect/useItineraryPersistence";
import { useItinerarySave } from "@/hooks/ai-architect/useItinerarySave";
import { useBaseCostCalculator } from "@/hooks/ai-architect/useBaseCostCalculator";

import AiArchitectForm from "./AiArchitectForm";
import AiArchitectHeader from "./AiArchitectHeader";
import AiArchitectSidebar from "./AiArchitectSidebar";
import AiArchitectMobileTabs from "./AiArchitectMobileTabs";
import AiArchitectSummaryPanel from "./AiArchitectSummaryPanel";
import AiArchitectHero from "./AiArchitectHero";
import AiArchitectTabContent from "./AiArchitectTabContent";
import { AiArchitectBackConfirmDialog } from "./AiArchitectBackConfirmDialog";
import { AiArchitectPdfPreview } from "./AiArchitectPdfPreview";
import type { PdfTheme } from "@/components/pdf-template";

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: any = {};

export default function AiArchitect() {
  const searchParams = useSearchParams();
  const itineraryIdFromUrl = searchParams.get('itineraryId');
  const [activeArchitectTab, setActiveArchitectTab] = useState<ActiveArchitectTab>(itineraryIdFromUrl ? 'itinerary' : 'new');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');

  // Modular Hooks
  const { clients } = useClients();
  const { user } = useAuth();
  const supabase = createClient();
  const [currentTripId, setCurrentTripId] = useState<string | null>(itineraryIdFromUrl);
  const { loadedData, saveAll, saveNow, resetForNewTrip } = useItineraryPersistence({ currentTripId, setCurrentTripId });
  const { isGenerating, itinerary, setItinerary, generate } = useItineraryGeneration();

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

  const { saveItinerary, isSaving } = useItinerarySave({ currentTripId, setCurrentTripId });
  const { baseCost } = useBaseCostCalculator({ itinerary, flights, hotels, cabs, buses, pricing });

  const form = useForm<AiArchitectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { startingLocation: "", endingLocation: "", startDate: undefined, endDate: undefined, destinations: "", travelTimePreference: "no_preference", leisureTime: false },
  });

  // Hydrate from persistence
  useEffect(() => {
    if (loadedData) {
      if (loadedData.itinerary) setItinerary(loadedData.itinerary);
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
      if (loadedData.tripMetadata) {
        // Only reset if form is currently empty (initial load)
        const currentVals = form.getValues();
        if (!currentVals.startingLocation && !currentVals.destinations) {
          form.reset(loadedData.tripMetadata as any);
        }
      }
    }
  }, [loadedData, setItinerary, form]);

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
    saveAll({ itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, showTimestamps, showPrices, selectedTheme, pdfOverrides });
  }, [itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, showTimestamps, showPrices, selectedTheme, pdfOverrides, saveAll]);

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
    setItinerary(null); setTripMetadata(null); setHotels([]); setFlights([]); setCabs([]); setBuses([]); setPricing(undefined);
    setCurrentTripId(null); setSelectedClientId("none"); setSelectedStatus("draft"); setIsEditing(false); setCurrentStep(0); setOptimizationCount(0);
    // Reset persistence WITHOUT writing to DB. This cancels pending auto-save
    // timers and nulls the ref so no phantom records get created.
    resetForNewTrip();
    setActiveArchitectTab('new');
  }, [form, setItinerary, resetForNewTrip]);

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
    const fields = aiArchitectSteps[currentStep].fields;
    if (await form.trigger(fields as any) && currentStep < aiArchitectSteps.length - 1) setCurrentStep(c => c + 1);
  }, [currentStep, form]);

  const onSubmit = useCallback(async (values: AiArchitectFormValues, feedback?: string) => {
    setTripMetadata(values);
    
    if (!feedback) {
      // Fresh generation: decouple from any existing record.
      // resetForNewTrip cancels pending auto-save timers and nulls the ref,
      // but does NOT write to the DB. No phantom records are created.
      setCurrentTripId(null);
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
          pricing: pricing,
          tripMetadata: values,
          selectedStatus: 'draft',
          optimizationCount: 0,
        }, null); // explicitId=null → INSERT a new record
      }
      setActiveArchitectTab('itinerary');
    }
  }, [generate, tripMetadata, setCurrentTripId, saveNow, resetForNewTrip, pricing]);



  return (
    <section id="ai-architect" className="w-full mx-auto pt-0 pb-10 overflow-x-hidden">
<div className="w-full sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
<div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
      <AiArchitectHeader 
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
        handleCreateNew={handleCreateNew} 
        handleDownloadPdf={() => setIsPreviewOpen(true)} 
        handleSaveItinerary={() => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing, showTimestamps, showPrices, selectedTheme, optimizationCount })} 
        isSaving={isSaving} 
        setShowBackConfirm={setShowBackConfirm} 
        setItinerary={setItinerary}
        activeArchitectTab={activeArchitectTab}
      />
</div>
</div>

      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-20 sm:pb-10">
        <AiArchitectMobileTabs activeArchitectTab={activeArchitectTab} setActiveArchitectTab={setActiveArchitectTab} clients={clients} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} selectedStatus={selectedStatus} setSelectedStatus={handleStatusChangeAction} handleCreateNew={handleCreateNew} />
        
        <div className="flex flex-row items-start gap-4 lg:gap-6">
          <AiArchitectSidebar 
            isSidebarExpanded={isSidebarExpanded} 
            setIsSidebarExpanded={setIsSidebarExpanded} 
            activeArchitectTab={activeArchitectTab} 
            setActiveArchitectTab={setActiveArchitectTab} 
            isEditing={isEditing} 
            setShowBackConfirm={setShowBackConfirm} 
            setItinerary={setItinerary} 
            setCurrentStep={setCurrentStep}
            handleCreateNew={handleCreateNew}
            // Props for the integrated form
            form={form}
            currentStep={currentStep}
            onNext={handleNext}
            onSubmit={onSubmit}
            isGenerating={isGenerating}
          />
          
          <div className={['history','settings'].includes(activeArchitectTab) ? "flex-1 min-w-0 flex flex-col" : "flex-1 min-w-0 flex flex-col lg:grid lg:grid-cols-12 gap-4"}>
            <div className={['history','settings'].includes(activeArchitectTab) ? "w-full" : "lg:col-span-8 order-2 lg:order-1"}>
              {isGenerating && !itinerary ? (
                <div className="py-24 flex flex-col items-center min-h-[400px] space-y-12">
                  <UniqueLoading variant="morph" size="lg" />
                  <div className="h-8"><ShiningText text={loadingTexts[loadingTextIndex]} /></div>
                </div>
              ) : (
                <>
                  {itinerary && !['history','settings'].includes(activeArchitectTab) && <AiArchitectHero itinerary={itinerary} />}
                  <AiArchitectTabContent 
                    activeArchitectTab={activeArchitectTab} 
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
                    handleSaveItinerary={() => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing, showTimestamps, showPrices, selectedTheme, optimizationCount })} 
                    isSaving={isSaving} 
                    setCurrentTripId={setCurrentTripId} 
                    setActiveArchitectTab={setActiveArchitectTab} 
                    // Form props
                    form={form}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                    onNext={handleNext}
                    onSubmit={onSubmit}
                    handleCreateNew={handleCreateNew}
                  />
                </>
              )}
            </div>
            
            {itinerary && !['history','settings'].includes(activeArchitectTab) && (
              <AiArchitectSummaryPanel 
                itinerary={itinerary} 
                selectedStatus={selectedStatus} 
                clients={clients} 
                selectedClientId={selectedClientId} 
                optimizationCount={optimizationCount} 
                isGenerating={isGenerating} 
                onOptimize={(feedback) => { onSubmit(form.getValues(), feedback); setOptimizationCount(p => p + 1); }} 
              />
            )}
          </div>
        </div>
      </div>

      <AiArchitectPdfPreview isPreviewOpen={isPreviewOpen} setIsPreviewOpen={setIsPreviewOpen} itinerary={itinerary} hotels={hotels} flights={flights} pricing={pricing} baseCost={baseCost} />
      <AiArchitectBackConfirmDialog showBackConfirm={showBackConfirm} setShowBackConfirm={setShowBackConfirm} setItinerary={setItinerary} setIsEditing={setIsEditing} handleSaveItinerary={() => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing, showTimestamps, showPrices, selectedTheme, optimizationCount })} />
    </section>
  );
}
