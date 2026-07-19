// Thin orchestrator shell for The Lab wiring hooks and components together (<150 lines)
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, X, Zap } from "lucide-react";
import UniqueLoading from "@/components/ui/morph-loading";
import { ShiningText } from "@/components/ui/shining-text";
import { cn } from "@/lib/utils";
import type { ClientEnquiryResponse } from "@/types/enquiry";

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
import type { PdfPreviewEditorRef } from "@/components/pdf-preview-editor";
import type { PdfTheme } from "@/components/pdf-template";
import { PdfRenderOverlay } from "@/components/ui/pdf-render-overlay";

const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: any = {};

export default function TheLab() {
  const searchParams = useSearchParams();
  const itineraryIdFromUrl = searchParams.get('itineraryId');
  const queryFromUrl = searchParams.get('q');
  const enquiryIdFromUrl = searchParams.get('enquiry');

  const [activeLabTab, setActiveLabTabState] = useState<ActiveLabTab>(itineraryIdFromUrl ? 'itinerary' : 'new');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab") as ActiveLabTab | null;
    const storedTab = localStorage.getItem("the_lab_active_tab") as ActiveLabTab | null;
    const validTabs: ActiveLabTab[] = ['new', 'itinerary', 'history'];
    
    if (urlTab && validTabs.includes(urlTab)) {
      setActiveLabTabState(urlTab);
    } else if (storedTab && validTabs.includes(storedTab)) {
      setActiveLabTabState(storedTab);
    }
  }, []);

  const setActiveLabTab = (tab: ActiveLabTab) => {
    activeLabTabRef.current = tab;
    setActiveLabTabState(tab);
    localStorage.setItem("the_lab_active_tab", tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };
  const [enquiryBanner, setEnquiryBanner] = useState<{ clientName: string; responseId: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');

  // PDF pre-render state (overlay shown before dialog opens)
  const previewRef = useRef<PdfPreviewEditorRef>(null);
  const [isPreRendering, setIsPreRendering] = useState(false);
  const [preRenderProgress, setPreRenderProgress] = useState(0);
  const [preRenderStage, setPreRenderStage] = useState('');

  // Modular Hooks
  const { clients, fetchClients } = useClients();
  const { user, agencySettings } = useAuth();
  const supabase = createClient();
  const [currentTripId, setCurrentTripId] = useState<string | null>(itineraryIdFromUrl);
  const { loadedData, isLoading, saveAll, saveNow, resetForNewTrip } = useItineraryPersistence({ currentTripId, setCurrentTripId });
  const { isGenerating, itinerary, setItinerary, generate } = useItineraryGeneration();

  // Tracks which trip ID was last synced into the form so we only call
  // form.reset() when the user switches to a genuinely different trip.
  // undefined = form has never been reset for any trip yet.
  const formSyncedForIdRef = useRef<string | null | undefined>(undefined);
  // Always-current ref for activeLabTab — lets effects read the current tab
  // without adding it to their dep arrays (keeps dep array size constant).
  const activeLabTabRef = useRef<ActiveLabTab>(activeLabTab);

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
  const [termsAndConditions, setTermsAndConditions] = useState<string>("");
  const [cancellationPolicy, setCancellationPolicy] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<string>("");

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

  const clientName = useMemo(() => {
    return clients.find(c => c.id === selectedClientId)?.name || "";
  }, [clients, selectedClientId]);

  const form = useForm<TheLabFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { startingLocation: "", endingLocation: "", startDate: undefined, endDate: undefined, destinations: "", travelTimePreference: "no_preference", leisureTime: false, daywiseDestinations: "", hotels: [] },
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
      if (loadedData.selectedTheme) setSelectedTheme(loadedData.selectedTheme as PdfTheme);
      if (loadedData.pdfOverrides) setPdfOverrides(loadedData.pdfOverrides);
      setInclusions(loadedData.inclusions || "");
      setExclusions(loadedData.exclusions || "");
      setTermsAndConditions(loadedData.termsAndConditions || "");
      setCancellationPolicy(loadedData.cancellationPolicy || "");
      setPaymentMethods(loadedData.paymentMethods || "");
      if (loadedData.tripMetadata && currentTripId && currentTripId !== formSyncedForIdRef.current) {
        // Only reset the form when the user has navigated to a DIFFERENT specific
        // trip from history. This prevents the new-trip form from being prefilled
        // on initial auto-load and avoids wiping user edits on re-renders.
        form.reset({
          ...loadedData.tripMetadata,
          hotels: loadedData.hotels || [],
        } as any);
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

  // Pre-fill form from ?enquiry=<responseId> (client enquiry → itinerary one-click flow)
  useEffect(() => {
    if (!enquiryIdFromUrl) return;

    const prefillFromEnquiry = async () => {
      try {
        // Fetch the response — the agent must be authenticated (existing session)
        // We use the client_enquiry_responses table indirectly via the public API.
        // Since only the agent reads this, we need their own API.
        const res = await fetch(`/api/enquiry-responses/${enquiryIdFromUrl}/prefill`);
        if (!res.ok) return;
        const { response }: { response: ClientEnquiryResponse } = await res.json();

        // Map response fields → TheLabFormValues
        const prefillValues: Partial<any> = {
          startingLocation: response.starting_location || "",
          destinations: response.destinations || "",
          endingLocation: response.ending_location || "",
          startDate: response.start_date ? new Date(response.start_date) : undefined,
          endDate: response.end_date ? new Date(response.end_date) : undefined,
          tripType: response.trip_type || "relaxed",
          travelMethods: response.travel_methods || [],
          mustInclude: response.must_include || "",
          avoid: response.avoid || "",
          leisureTime: response.leisure_time ?? false,
          leisureDay: response.leisure_day ?? undefined,
          travelTimePreference: response.travel_time_preference || "no_preference",
          daywiseDestinations: "",
        };

        form.reset(prefillValues as any);
        setEnquiryBanner({
          clientName: response.client_name || response.client_email,
          responseId: enquiryIdFromUrl,
        });
        if (response.client_id) {
          setSelectedClientId(response.client_id);
        }
      } catch (err) {
        console.error("[TheLab] Failed to pre-fill from enquiry:", err);
      }
    };

    prefillFromEnquiry();
  }, [enquiryIdFromUrl, form, setSelectedClientId]);

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
    saveAll({ itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, showTimestamps, selectedTheme, pdfOverrides, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods });
  }, [itinerary, hotels, flights, cabs, buses, pricing, optimizationCount, selectedClientId, selectedStatus, tripMetadata, showTimestamps, selectedTheme, pdfOverrides, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods, saveAll]);

  // Auto-sync form changes to persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      setTripMetadata(values);
      if (values.hotels) {
        // Only update if they are different to prevent loop
        const formHotelsJson = JSON.stringify(values.hotels);
        const stateHotelsJson = JSON.stringify(hotels);
        if (formHotelsJson !== stateHotelsJson) {
          setHotels(values.hotels as any);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, hotels]);

  // Sync hotels state from logistics tab back into the form.
  // IMPORTANT: Skip this sync when the user is on the 'new' tab (actively filling
  // the wizard). The StepStayOptions component uses useFieldArray to append hotel
  // slots based on selected dates. If hotels state is [] (from a previous reset)
  // and we sync it into the form, it wipes out the freshly appended slots before
  // the user can submit — causing the Generate button to fail at step 5.
  // We read activeLabTab via a ref so the dep array size stays constant (2 items).
  useEffect(() => {
    if (activeLabTabRef.current === 'new') return;
    const formHotelsJson = JSON.stringify(form.getValues("hotels") || []);
    const stateHotelsJson = JSON.stringify(hotels);
    if (formHotelsJson !== stateHotelsJson) {
      form.setValue("hotels", hotels, { shouldDirty: true });
    }
  }, [hotels, form]);

  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingTextIndex(prev => (prev + 1) % loadingTexts.length), 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleCreateNew = useCallback(() => {
    form.reset({
      startingLocation: "", endingLocation: "", startDate: undefined, endDate: undefined, destinations: "", travelTimePreference: "no_preference", tripType: "relaxed", leisureTime: false, daywiseDestinations: "", hotels: []
    });
    formSyncedForIdRef.current = null; // allow next history trip to reset the form
    setItinerary(null); setTripMetadata(null); setHotels([]); setFlights([]); setCabs([]); setBuses([]); setPricing(undefined);
    setInclusions(""); setExclusions(""); setTermsAndConditions(""); setCancellationPolicy(""); setPaymentMethods("");
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
    console.log("[TheLab index.tsx] onSubmit called. values:", values, "feedback:", feedback);
    setTripMetadata(values);
    
    if (!feedback) {
      console.log("[TheLab index.tsx] Fresh generation. Resetting state values...");
      // Fresh generation: decouple from any existing record.
      // resetForNewTrip cancels pending auto-save timers and nulls the ref,
      // but does NOT write to the DB. No phantom records are created.
      setCurrentTripId(null);
      setHotels(values.hotels || []);
      setFlights([]);
      setCabs([]);
      setBuses([]);
      setPricing(undefined);
      setInclusions("");
      setExclusions("");
      setTermsAndConditions("");
      setCancellationPolicy("");
      setPaymentMethods("");
      resetForNewTrip();
    }
    
    // Run AI generation — no DB writes happen during this.
    console.log("[TheLab index.tsx] Triggering AI generation (calling generate)...");
    const res = await generate(values, feedback, tripMetadata);
    console.log("[TheLab index.tsx] AI generation result (res):", res);
    if (!feedback) setOptimizationCount(0);
    
    if (res) {
      console.log("[TheLab index.tsx] Generation succeeded. Post-processing response...");
      if (!feedback) {
        let resolvedClientId = "none";
        let shareToken = "";
        
        if (typeof window !== 'undefined') {
          shareToken = window.crypto?.randomUUID ? window.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }

        if (enquiryBanner?.responseId && user?.id) {
          try {
            // 1. Fetch enquiry response to get client email and name
            const { data: respData, error: respErr } = await supabase
              .from("client_enquiry_responses")
              .select("client_email, client_name, client_id")
              .eq("id", enquiryBanner.responseId)
              .single();

            if (respErr) throw respErr;

            if (respData?.client_id) {
              resolvedClientId = respData.client_id;
            } else if (respData?.client_email) {
              const email = respData.client_email.trim().toLowerCase();

              // 2. Check if client already exists by email and user_id (agent)
              const { data: existingClient, error: clientErr } = await supabase
                .from("clients")
                .select("id")
                .eq("email", email)
                .eq("user_id", user.id)
                .maybeSingle();

              if (clientErr) throw clientErr;

              if (existingClient) {
                resolvedClientId = existingClient.id;
              } else {
                // 3. Client doesn't exist, let's create one automatically
                const name = respData.client_name || email.split('@')[0] || "Unnamed Client";
                const { data: newClient, error: insertErr } = await supabase
                  .from("clients")
                  .insert([{
                    name,
                    email,
                    user_id: user.id
                  }])
                  .select("id")
                  .single();

                if (insertErr) throw insertErr;
                if (newClient) {
                  resolvedClientId = newClient.id;
                  await fetchClients(); // Refresh local list of clients
                }
              }
            }
          } catch (err) {
            console.error("Error auto-resolving client in The Lab generation:", err);
          }
        }

        console.log("[TheLab index.tsx] Calling saveNow to insert new itinerary. values.hotels count:", values.hotels?.length || 0);
        const newTripId = await saveNow({
          itinerary: res,
          hotels: (values.hotels || []).map(h => ({
            id: h.id,
            dayIndex: h.dayIndex,
            dayIndices: h.dayIndices?.length ? h.dayIndices : [h.dayIndex],
            name: h.name,
            address: h.address || "",
            checkIn: h.checkIn || "2:00 PM",
            checkOut: h.checkOut || "11:00 AM",
            bookingRef: h.bookingRef || "",
            starRating: h.starRating || 3,
            nights: h.nights || 1,
            costAdult: h.costAdult,
            costChild: h.costChild,
            costInfant: h.costInfant,
            imageUrls: h.imageUrls,
          })),
          flights: [],
          cabs: [],
          buses: [],
          pricing: undefined,
          tripMetadata: values,
          selectedStatus: 'draft',
          optimizationCount: 0,
          selectedClientId: resolvedClientId,
          share_token: shareToken || null,
          share_enabled: shareToken ? true : undefined,
          inclusions: "",
          exclusions: "",
          termsAndConditions: "",
          cancellationPolicy: "",
          paymentMethods: "",
        }, null); // explicitId=null → INSERT a new record
        console.log("[TheLab index.tsx] saveNow completed. newTripId:", newTripId);

        if (resolvedClientId !== "none") {
          setSelectedClientId(resolvedClientId);
        }

        if (newTripId && enquiryBanner?.responseId) {
          try {
            const shareUrl = shareToken ? `${window.location.origin}/invoice/${shareToken}` : null;
            await supabase
              .from("client_enquiry_responses")
              .update({
                converted_itinerary_id: newTripId,
                status: "converted",
                converted_at: new Date().toISOString(),
                workflow_status: "submitted",
                client_id: resolvedClientId === "none" ? null : resolvedClientId,
                ...(shareUrl ? { itinerary_share_url: shareUrl } : {})
              })
              .eq("id", enquiryBanner.responseId);
          } catch (err) {
            console.error("Failed to link generated itinerary to enquiry response:", err);
          }
        }
      }
      console.log("[TheLab index.tsx] Switching active tab to 'itinerary'");
      setActiveLabTab('itinerary');
    } else {
      console.warn("[TheLab index.tsx] Generation did not return a result.");
    }
  }, [generate, tripMetadata, setCurrentTripId, saveNow, resetForNewTrip, setHotels, setFlights, setCabs, setBuses, setPricing, setInclusions, setExclusions, enquiryBanner, fetchClients, user, supabase, setSelectedClientId]);


  const isDesigningNew = activeLabTab === 'new';
  const isViewingItinerary = ['itinerary', 'flights-hotels', 'pricing', 'inclusions'].includes(activeLabTab);

  return (
    <section id="the-lab" className="w-full mx-auto pt-0 pb-10">
      {/* Enquiry pre-fill banner */}
      {enquiryBanner && (
        <div className="w-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-b border-purple-500/30 px-4 py-2.5">
          <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-gray-200">
                Form pre-filled from{" "}
                <span className="text-purple-300 font-semibold">{enquiryBanner.clientName}</span>'s enquiry —{" "}
                <span className="text-gray-400">review and click Generate!</span>
              </span>
            </div>
            <button
              onClick={() => setEnquiryBanner(null)}
              className="text-gray-500 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
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
              isEditing={isEditing} 
              setIsEditing={setIsEditing} 
              handleDownloadPdf={async () => {
                // If cache is already valid, open dialog instantly
                if (previewRef.current?.hasValidCache()) {
                  setIsPreviewOpen(true);
                  return;
                }
                // Otherwise: show blur overlay, pre-render, then open
                setIsPreRendering(true);
                setPreRenderProgress(0);
                setPreRenderStage('Initializing\u2026');
                try {
                  await previewRef.current?.preRender((progress, stage) => {
                    setPreRenderProgress(progress);
                    setPreRenderStage(stage);
                  });
                } finally {
                  setIsPreRendering(false);
                }
                setIsPreviewOpen(true);
              }} 
              handleSaveItinerary={() => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing, showTimestamps, selectedTheme, optimizationCount, tripMetadata, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods })} 
              isSaving={isSaving} 
              activeLabTab={activeLabTab}
            />
          </div>
        </div>
      )}

      <div className={cn(
        "w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-10",
        isDesigningNew ? "mt-4 lg:mt-0 lg:pt-4" : "mt-4 lg:mt-8"
      )}>
        <TheLabMobileTabs activeLabTab={activeLabTab} setActiveLabTab={setActiveLabTab} clients={clients} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} selectedStatus={selectedStatus} setSelectedStatus={handleStatusChangeAction} handleCreateNew={handleCreateNew} />
        
        <div className="flex flex-row items-start gap-4 lg:gap-6 w-full">
          <div className={cn("transition-all duration-500 shrink-0 sticky top-24 self-start z-40", isEditing && "blur-[1px] opacity-40 pointer-events-none")}>
            <TheLabSidebar 
              isSidebarExpanded={isSidebarExpanded} 
              setIsSidebarExpanded={setIsSidebarExpanded} 
              activeLabTab={activeLabTab} 
              setActiveLabTab={setActiveLabTab} 
              handleCreateNew={handleCreateNew}
              isGenerating={isGenerating}
              isLoading={isLoading}
            />
          </div>
          
          <div className={cn(
            "flex-1 min-w-0 flex flex-col",
            isDesigningNew || !itinerary || ['history'].includes(activeLabTab) ? "items-center justify-center" : "lg:grid lg:grid-cols-12 gap-4"
          )}>
            <div className={cn(
              ['history'].includes(activeLabTab) ? "w-full" : 
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
                    pricing={pricing} 
                    setPricing={setPricing} 
                    agencySettings={null} 
                    handleSaveItinerary={(latestPricing?: any) => saveItinerary({}, form.getValues(), { itinerary, selectedClientId, selectedStatus, hotels, flights, cabs, buses, pricing: latestPricing || pricing, showTimestamps, selectedTheme, optimizationCount, tripMetadata, inclusions, exclusions, termsAndConditions, cancellationPolicy, paymentMethods })} 
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
                    termsAndConditions={termsAndConditions}
                    setTermsAndConditions={setTermsAndConditions}
                    cancellationPolicy={cancellationPolicy}
                    setCancellationPolicy={setCancellationPolicy}
                    paymentMethods={paymentMethods}
                    setPaymentMethods={setPaymentMethods}
                  />
                </>
              )}
            </div>
            
            {isViewingItinerary && itinerary && (
              <div className={cn("lg:col-span-4 order-1 lg:order-2 transition-all duration-500", isEditing && "blur-[1px] opacity-40 pointer-events-none")}>
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
                  tripMetadata={tripMetadata}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <TheLabPdfPreview
        ref={previewRef}
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        itinerary={itinerary}
        hotels={hotels}
        flights={flights}
        pricing={pricing}
        baseCost={baseCost}
        tripTitle={tripTitle}
        clientName={clientName}
        showTimestamps={showTimestamps}
        inclusions={inclusions}
        exclusions={exclusions}
        termsAndConditions={termsAndConditions}
        cancellationPolicy={cancellationPolicy}
        paymentMethods={paymentMethods}
        agencySettings={agencySettings}
        itineraryId={currentTripId}
        pdfOverrides={pdfOverrides}
        onPdfOverridesChange={setPdfOverrides}
        theme={selectedTheme}
        onThemeChange={setSelectedTheme}
      />

      {/* Full-page blur overlay while PDF pre-renders before dialog opens */}
      <PdfRenderOverlay
        visible={isPreRendering}
        progress={preRenderProgress}
        stage={preRenderStage}
      />

    </section>
  );
}


