// Thin orchestrator shell for AiArchitect wiring hooks and components together (<150 lines)
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import UniqueLoading from "@/components/ui/morph-loading";
import { ShiningText } from "@/components/ui/shining-text";
import { cn } from "@/lib/utils";

import { useClients } from "@/lib/hooks/use-clients";
import { formSchema, type AiArchitectFormValues, type ActiveArchitectTab } from "@/types/ai-architect";
import { aiArchitectSteps, loadingTexts } from "@/constants/ai-architect";
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

export default function AiArchitect() {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeArchitectTab, setActiveArchitectTab] = useState<ActiveArchitectTab>('itinerary');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTheme] = useState<PdfTheme>('classic');

  // Modular Hooks
  const { clients } = useClients();
  const { loadedData, saveAll } = useItineraryPersistence();
  const { isGenerating, itinerary, setItinerary, generate } = useItineraryGeneration();

  // Local state mapped from loadedData
  const [hotels, setHotels] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [cabs, setCabs] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(undefined);
  const [optimizationCount, setOptimizationCount] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState("none");
  const [selectedStatus, setSelectedStatus] = useState("draft");
  const [tripMetadata, setTripMetadata] = useState<any>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);

  const { saveItinerary, isSaving } = useItinerarySave({ currentTripId, setCurrentTripId });
  const { baseCost } = useBaseCostCalculator({ itinerary, flights, hotels, cabs, buses, pricing });

  const form = useForm<AiArchitectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { startingLocation: "", endingLocation: "", startDate: undefined, endDate: undefined, destinations: "", travelTimePreference: "no_preference", leisureTime: false },
  });

  // Hydrate from localStorage
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
    }
  }, [loadedData, setItinerary]);

  // Sync to localStorage
  useEffect(() => {
    saveAll({ itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata });
  }, [itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, saveAll]);

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
  }, [form, setItinerary]);

  const handleNext = useCallback(async () => {
    const fields = aiArchitectSteps[currentStep].fields;
    if (await form.trigger(fields as any) && currentStep < aiArchitectSteps.length - 1) setCurrentStep(c => c + 1);
  }, [currentStep, form]);

  const onSubmit = useCallback(async (values: AiArchitectFormValues, feedback?: string) => {
    setTripMetadata(values);
    const res = await generate(values, feedback, tripMetadata);
    if (!feedback) setOptimizationCount(0);
  }, [generate, tripMetadata]);

  return (
    <section id="ai-architect" className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 overflow-x-hidden">
      {/* 1. Form View */}
      {(!itinerary && !isGenerating) && (
        <div className="w-full max-w-5xl mx-auto block transition-all duration-500">
          <div className="text-center mb-8 animate-in mt-12">
            <h1 className="font-serif font-bold text-white uppercase text-4xl mb-3 relative z-10 w-full block">Odyssey Luxe</h1>
            <p className="text-zinc-500">Your Personal AI Travel Architect</p>
          </div>
          <Card className="glass-panel rounded-[2.5rem] shadow-2xl border-white/5">
            <CardHeader className="border-b border-white/5"><CardTitle className="flex gap-2 text-white uppercase"><Sparkles className="w-5 h-5 text-primary"/>Plan Your Next Escape</CardTitle></CardHeader>
            <CardContent className="pt-8"><AiArchitectForm form={form} currentStep={currentStep} setCurrentStep={setCurrentStep} onNext={handleNext} onSubmit={onSubmit} isGenerating={isGenerating} /></CardContent>
          </Card>
        </div>
      )}

      {/* 2. Loading State */}
      {isGenerating && !itinerary && (
        <Card className="max-w-5xl mx-auto mt-8 py-24 flex flex-col items-center min-h-[400px] space-y-12">
          <UniqueLoading variant="morph" size="lg" />
          <div className="h-8"><ShiningText text={loadingTexts[loadingTextIndex]} /></div>
        </Card>
      )}

      {/* 3. Rendered View */}
      {(!isGenerating && itinerary) && (
        <>
          <AiArchitectHeader itinerary={itinerary} clients={clients} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} showTimestamps={showTimestamps} setShowTimestamps={setShowTimestamps} showPrices={showPrices} setShowPrices={setShowPrices} isEditing={isEditing} setIsEditing={setIsEditing} handleCreateNew={handleCreateNew} handleDownloadPdf={() => setIsPreviewOpen(true)} handleSaveItinerary={() => saveItinerary({}, form.getValues(), {itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing})} isSaving={isSaving} setShowBackConfirm={setShowBackConfirm} setItinerary={setItinerary} />
          <div className="w-full max-w-[1500px] mx-auto px-0 sm:px-2 md:px-4 lg:px-8">
            <AiArchitectMobileTabs activeArchitectTab={activeArchitectTab} setActiveArchitectTab={setActiveArchitectTab} clients={clients} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} />
            <div className="flex flex-row gap-4 lg:gap-6">
              <AiArchitectSidebar isSidebarExpanded={isSidebarExpanded} setIsSidebarExpanded={setIsSidebarExpanded} activeArchitectTab={activeArchitectTab} setActiveArchitectTab={setActiveArchitectTab} isEditing={isEditing} setShowBackConfirm={setShowBackConfirm} setItinerary={setItinerary} setCurrentStep={setCurrentStep} />
              <div className="flex-1 min-w-0 flex flex-col lg:grid lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 order-2 lg:order-1">
                  <AiArchitectHero itinerary={itinerary} />
                  <AiArchitectTabContent activeArchitectTab={activeArchitectTab} isGenerating={isGenerating} itinerary={itinerary} setItinerary={setItinerary} isEditing={isEditing} setIsEditing={setIsEditing} hotels={hotels} setHotels={setHotels} flights={flights} setFlights={setFlights} cabs={cabs} setCabs={setCabs} buses={buses} setBuses={setBuses} showTimestamps={showTimestamps} showPrices={showPrices} pricing={pricing} setPricing={setPricing} agencySettings={null} handleSaveItinerary={() => saveItinerary({}, form.getValues(), {itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing})} isSaving={isSaving} />
                </div>
                <AiArchitectSummaryPanel itinerary={itinerary} selectedStatus={selectedStatus} clients={clients} selectedClientId={selectedClientId} optimizationCount={optimizationCount} isGenerating={isGenerating} onOptimize={(feedback) => { onSubmit(form.getValues(), feedback); setOptimizationCount(p=>p+1); }} />
              </div>
            </div>
          </div>
          <AiArchitectPdfPreview isPreviewOpen={isPreviewOpen} setIsPreviewOpen={setIsPreviewOpen} itinerary={itinerary} hotels={hotels} flights={flights} pricing={pricing} baseCost={baseCost} />
        </>
      )}
      <AiArchitectBackConfirmDialog showBackConfirm={showBackConfirm} setShowBackConfirm={setShowBackConfirm} setItinerary={setItinerary} setIsEditing={setIsEditing} handleSaveItinerary={() => saveItinerary({}, form.getValues(), {itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing})} />
    </section>
  );
}
