
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState, useEffect, useRef, useMemo } from "react";
import { Pencil } from "lucide-react";
import { generateTravelItinerary } from "@/ai/flows/generate-travel-itinerary";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { fetchItineraryImages } from "@/ai/flows/fetch-itinerary-images";
import { useToast } from "@/hooks/use-toast";
import ItineraryTimeline from "../itinerary-timeline";
import HotelFlightEditor, { type HotelInfo, type FlightInfo } from "@/components/hotel-flight-editor";
import PricingModule from "@/components/pricing-module";
import { type PricingConfig } from "@/types/pricing";
import { ChevronDown, Sparkles, Calendar as CalendarIcon, Save, AlertCircle, Eye, Check, ArrowRight, ArrowLeft, Plane, Wallet, DollarSign, Settings, Shield, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { CrmSettings } from "@/components/crm-settings";
import { ItineraryProvider } from "@/contexts/itinerary-context";
import UniqueLoading from "@/components/ui/morph-loading";
import { ShiningText } from "@/components/ui/shining-text";
import { Textarea } from "../ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PdfTemplate, type PdfTheme } from "@/components/pdf-template";
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/lib/hooks/use-clients";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  startingLocation: z.string().min(2, "Starting location is required."),
  endingLocation: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  destinations: z.string().min(2, "At least one destination is required."),
  budget: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().positive("Budget must be a positive number.").optional()
  ),
  mustInclude: z.string().optional(),
  avoid: z.string().optional(),
  leisureTime: z.boolean().default(false),
  leisureDay: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().positive().optional()
  ),
  travelTimePreference: z.enum([
    "no_preference",
    "avoid_night_travel",
    "prefer_morning_travel",
    "prefer_afternoon_travel",
    "prefer_night_travel"
  ]).default("no_preference"),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

const aiArchitectSteps = [
  { id: 1, label: "Destinations", fields: ["startingLocation", "destinations", "endingLocation"] as const },
  { id: 2, label: "Dates", fields: ["startDate", "endDate"] as const },
  { id: 3, label: "Preferences", fields: ["budget", "mustInclude", "avoid", "leisureTime", "leisureDay", "travelTimePreference"] as const },
];

const AiArchitect = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<TravelItineraryOutput | null>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
  const itineraryRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user, userProfile, agencySettings } = useAuth();
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const supabase = createClient();
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | undefined>(undefined);

  // CRM fields
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("draft");
  const [tripMetadata, setTripMetadata] = useState<any>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [activeArchitectTab, setActiveArchitectTab] = useState<'itinerary' | 'flights-hotels' | 'pricing' | 'settings'>('itinerary');

  const currencySymbol = useMemo(() => {
    const currency = pricing?.currency || agencySettings?.default_currency || 'INR';
    if (currency === 'INR') return '₹';
    if (currency === 'USD') return '$';
    if (currency === 'EUR') return '€';
    if (currency === 'GBP') return '£';
    return currency;
  }, [pricing, agencySettings]);

  const loadingTexts = [
    "Analyzing your preferences...",
    "Finding the best flights...",
    "Selecting premium hotels...",
    "Curating local experiences...",
    "Optimizing travel routes...",
    "Crafting your perfect itinerary...",
  ];
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isGenerating, loadingTexts.length]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startingLocation: "",
      endingLocation: "",
      startDate: undefined,
      endDate: undefined,
      destinations: "",
      budget: undefined,
      mustInclude: "",
      avoid: "",
      leisureTime: false,
      leisureDay: undefined,
      travelTimePreference: "no_preference",
    },
  });

  // Load itinerary from localStorage on component mount
  useEffect(() => {
    try {
      const savedItinerary = localStorage.getItem("travelItinerary");
      if (savedItinerary) {
        const parsed = JSON.parse(savedItinerary);
        if (Array.isArray(parsed)) {
          // Handle old saved sessions where only the array was stored
          setItinerary({ title: "Custom Itinerary", description: "Modified itinerary", itinerary: parsed } as any);
        } else {
          setItinerary(parsed);
        }
      }
      const savedHotels = localStorage.getItem("travelHotels");
      if (savedHotels) setHotels(JSON.parse(savedHotels));
      const savedFlights = localStorage.getItem("travelFlights");
      if (savedFlights) setFlights(JSON.parse(savedFlights));
      const savedPricing = localStorage.getItem("travelPricing");
      if (savedPricing) setPricing(JSON.parse(savedPricing));
    } catch (error) {
      console.error("Failed to load itinerary from local storage", error);
    }

    try {
      // Try to load auth related configs specifically if available, though they might not be part of the base save
      const savedClientId = localStorage.getItem('draft_client_id');
      if (savedClientId) setSelectedClientId(savedClientId);

      const savedStatus = localStorage.getItem('draft_status');
      if (savedStatus) setSelectedStatus(savedStatus);

      const savedMetadata = localStorage.getItem('travelMetadata');
      if (savedMetadata) {
        const parsed = JSON.parse(savedMetadata);
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        setTripMetadata(parsed);
      }
    } catch (error) {
      console.error("Failed to load metadata from local storage", error);
    }
  }, []);



  // Save itinerary to localStorage whenever it changes
  useEffect(() => {
    try {
      if (itinerary) {
        localStorage.setItem("travelItinerary", JSON.stringify(itinerary));
      } else {
        localStorage.removeItem("travelItinerary");
        localStorage.removeItem("travelMetadata");
      }
      if (tripMetadata) {
        localStorage.setItem("travelMetadata", JSON.stringify(tripMetadata));
      }
    } catch (error) {
      console.error("Failed to save itinerary to local storage", error);
    }
  }, [itinerary, tripMetadata]);

  // Save hotels/flights to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("travelHotels", JSON.stringify(hotels));
      localStorage.setItem("travelFlights", JSON.stringify(flights));
      if (pricing) {
        localStorage.setItem("travelPricing", JSON.stringify(pricing));
      } else {
        localStorage.removeItem("travelPricing");
      }
    } catch (error) {
      console.error("Failed to save hotels/flights/pricing to local storage", error);
    }
  }, [hotels, flights, pricing]);

  const baseCost = useMemo(() => {
    let cost = 0;

    // Activities cost
    if (itinerary) {
      itinerary.itinerary.forEach(day => {
        if (day.timeline) {
          day.timeline.forEach(step => {
            if (step.cost) cost += step.cost;
          });
        }
      });
    }

    const pax = {
      adult: pricing?.adultPax || 2,
      child: pricing?.childPax || 0,
      infant: pricing?.infantPax || 0
    };

    // Flights cost
    flights.forEach(f => {
      if (f.costAdult) cost += f.costAdult * pax.adult;
      if (f.costChild) cost += f.costChild * pax.child;
      if (f.costInfant) cost += f.costInfant * pax.infant;
    });

    // Hotels cost
    hotels.forEach(h => {
      if (h.costAdult) cost += h.costAdult * pax.adult;
      if (h.costChild) cost += h.costChild * pax.child;
      if (h.costInfant) cost += h.costInfant * pax.infant;
    });

    return cost;
  }, [itinerary, flights, hotels, pricing]);

  const handleDownloadPdf = () => {
    if (!itinerary) return;
    setIsPreviewOpen(true);
  };

  const handleSaveItinerary = async () => {
    console.log("🔍 handleSaveItinerary called");

    // Pre-validation checks
    if (!user) {
      console.warn("❌ No user found in auth context");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please sign in to save your itinerary.",
      });
      return;
    }

    if (!itinerary) {
      console.warn("❌ No itinerary found");
      toast({
        variant: "destructive",
        title: "Error",
        description: "No itinerary to save. Please generate one first.",
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log("📝 Getting form values...");
      let values = form.getValues();

      // Fallback to tripMetadata if form values are empty
      if (tripMetadata && (!values.startDate || !values.destinations || !values.startingLocation)) {
        console.log("🔄 Using trip metadata fallback due to empty form fields");
        values = { ...values, ...tripMetadata };
      }

      console.log("📝 Form values used for save:", {
        startDate: values.startDate,
        endDate: values.endDate,
        startingLocation: values.startingLocation,
        destinations: values.destinations,
      });

      // Validate dates exist
      if (!values.startDate) {
        console.warn("❌ No start date");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a start date.",
        });
        setIsSaving(false);
        return;
      }

      if (!values.endDate) {
        console.warn("❌ No end date");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select an end date.",
        });
        setIsSaving(false);
        return;
      }

      // Validate locations
      if (!values.startingLocation?.trim()) {
        console.warn("❌ No starting location");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a starting location.",
        });
        setIsSaving(false);
        return;
      }

      if (!values.destinations?.trim()) {
        console.warn("❌ No destinations");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter destinations.",
        });
        setIsSaving(false);
        return;
      }

      // Convert to Date objects if needed
      let startDate = values.startDate;
      let endDate = values.endDate;

      // Ensure they're Date objects
      if (!(startDate instanceof Date)) {
        console.log("📅 Converting start date to Date object");
        startDate = new Date(startDate);
      }
      if (!(endDate instanceof Date)) {
        console.log("📅 Converting end date to Date object");
        endDate = new Date(endDate);
      }

      // Validate dates are valid
      if (isNaN(startDate.getTime())) {
        console.warn("❌ Invalid start date");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid start date. Please select a valid date.",
        });
        setIsSaving(false);
        return;
      }

      if (isNaN(endDate.getTime())) {
        console.warn("❌ Invalid end date");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid end date. Please select a valid date.",
        });
        setIsSaving(false);
        return;
      }

      if (endDate <= startDate) {
        console.warn("❌ End date is not after start date");
        toast({
          variant: "destructive",
          title: "Error",
          description: "End date must be after start date.",
        });
        setIsSaving(false);
        return;
      }

      // Format dates to YYYY-MM-DD
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      // 🔐 CRITICAL: Verify session is valid before insert
      console.log("🔐 Verifying Supabase session before insert...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to verify session. Please try signing in again.",
        });
        setIsSaving(false);
        return;
      }

      if (!session?.user) {
        console.error("❌ No valid session found");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Your session has expired. Please sign in again.",
        });
        setIsSaving(false);
        return;
      }

      console.log("✅ Session verified. User ID:", session.user.id);

      const tripData = {
        user_id: session.user.id, // Use the freshly verified session user ID
        title: `Trip to ${values.destinations}`,
        description: values.mustInclude ? `Must include: ${values.mustInclude}` : null,
        starting_location: values.startingLocation,
        ending_location: values.endingLocation || values.startingLocation,
        destinations: values.destinations,
        start_date: startDateStr,
        end_date: endDateStr,
        budget: values.budget || null,
        client_id: selectedClientId === "none" ? null : selectedClientId,
        status: selectedStatus,
        itinerary_data: { ...itinerary, hotels, flights, pricing },
      };

      console.log("💾 Preparing to save to Supabase:", tripData);
      console.log("🔐 User ID from session:", session.user.id);
      console.log("📊 Access Token exists:", !!session.access_token);

      // Insert with error handling — get the ID back for trip_line_items seeding
      console.log("📤 Sending insert request to Supabase...");
      const { data: insertedRows, error } = await supabase
        .from("itineraries")
        .insert([tripData])
        .select("id");

      console.log("📥 Supabase response received");
      console.log("✅ Data:", insertedRows);
      console.log("❌ Error:", error);

      if (error) {
        console.error("🚨 Supabase error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        toast({
          variant: "destructive",
          title: "Database Error",
          description: `${error.message}${error.hint ? " - " + error.hint : ""}`,
        });
        setIsSaving(false);
        return;
      }

      console.log("✅ Itinerary saved successfully!");

      // ── Auto-seed trip_line_items so CRM Finance Sheet has data ──────────
      const savedTripId = insertedRows?.[0]?.id;
      if (savedTripId) {
        const pricingCfg = pricing || {};
        const currency = (pricingCfg as any).currency || "INR";
        const markupPct = (pricingCfg as any).markupValue || 0;
        const lineItems: {
          itinerary_id: string;
          title: string;
          category: string;
          net_cost: number;
          markup_percentage: number;
          currency: string;
        }[] = [];

        // Activities (per-day)
        if (itinerary?.itinerary) {
          itinerary.itinerary.forEach((day, dayIdx) => {
            if (Array.isArray(day.timeline)) {
              day.timeline.forEach((step: any) => {
                if (typeof step.cost === "number" && step.cost > 0) {
                  lineItems.push({
                    itinerary_id: savedTripId,
                    title: step.details?.slice(0, 80) || `Day ${dayIdx + 1} Activity`,
                    category: "activity",
                    net_cost: step.cost,
                    markup_percentage: markupPct,
                    currency,
                  });
                }
              });
            }
          });
        }

        // Hotels
        const pax = {
          adult: (pricingCfg as any).adultPax || 2,
          child: (pricingCfg as any).childPax || 0,
          infant: (pricingCfg as any).infantPax || 0,
        };
        if (hotels.length > 0) {
          hotels.forEach((h: any) => {
            const cost =
              (h.costAdult || 0) * pax.adult +
              (h.costChild || 0) * pax.child +
              (h.costInfant || 0) * pax.infant;
            if (cost > 0) {
              lineItems.push({
                itinerary_id: savedTripId,
                title: h.hotelName || "Hotel Accommodation",
                category: "hotel",
                net_cost: cost,
                markup_percentage: markupPct,
                currency,
              });
            }
          });
        }

        // Flights
        if (flights.length > 0) {
          flights.forEach((f: any) => {
            const cost =
              (f.costAdult || 0) * pax.adult +
              (f.costChild || 0) * pax.child +
              (f.costInfant || 0) * pax.infant;
            if (cost > 0) {
              lineItems.push({
                itinerary_id: savedTripId,
                title: `${f.from || "Dep"} → ${f.to || "Arr"} (${f.airline || "Flight"})`,
                category: "flight",
                net_cost: cost,
                markup_percentage: markupPct,
                currency,
              });
            }
          });
        }

        if (lineItems.length > 0) {
          const { error: liError } = await supabase
            .from("trip_line_items")
            .insert(lineItems);
          if (liError) {
            console.warn("⚠️ Failed to seed trip_line_items:", liError.message);
          } else {
            console.log(`✅ Seeded ${lineItems.length} line items for trip ${savedTripId}`);
          }
        }
      }

      toast({
        title: "Success!",
        description: "Your itinerary has been saved to your trips.",
      });

      // Reset the form and clear itinerary from local state after successful save
      form.reset({
        startingLocation: "",
        endingLocation: "",
        startDate: undefined,
        endDate: undefined,
        destinations: "",
        budget: undefined,
        mustInclude: "",
        avoid: "",
        leisureTime: false,
        leisureDay: undefined,
        travelTimePreference: "no_preference",
      });

      console.log("🔄 Form reset complete");
      setItinerary(null);
      setTripMetadata(null);
      setHotels([]);
      setFlights([]);
      setPricing(undefined);
      setSelectedClientId("none");
      setSelectedStatus("draft");
      localStorage.removeItem('draft_client_id');
      localStorage.removeItem('draft_status');
      localStorage.removeItem('travelMetadata');

    } catch (error) {
      console.error("💥 Catch block error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while saving.";
      console.error("Error details:", errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      console.log("🏁 Finally block - setting isSaving to false");
      setIsSaving(false);
    }
  };


  const handleNext = async () => {
    const currentFields = aiArchitectSteps[currentStep].fields;
    const isValid = await form.trigger(currentFields as any);
    if (isValid) {
      if (currentStep < aiArchitectSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>, feedback?: string) {
    setIsGenerating(true);
    if (!feedback) setItinerary(null); // Clear for fresh generation, keep for optimization to show transition
    setTripMetadata(values);
    try {
      // Format dates to YYYY-MM-DD
      const startDateStr = format(values.startDate, "yyyy-MM-dd");
      const endDateStr = format(values.endDate, "yyyy-MM-dd");

      const result = await generateTravelItinerary({
        startingLocation: values.startingLocation,
        endingLocation: values.endingLocation || values.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        destinations: values.destinations,
        budget: values.budget ?? undefined,
        mustInclude: values.mustInclude || "",
        avoid: values.avoid || "",
        leisureTime: !!values.leisureTime,
        leisureDay: values.leisureDay ?? undefined,
        travelTimePreference: values.travelTimePreference,
        feedback: (typeof feedback === 'string') ? feedback : "",
      });

      // Fetch dynamic images from Unsplash for days and activities
      try {
        // 1. Fetch images for each DAY
        const daySearchTerms = result.itinerary.map(day => day.imageSearchTerm || day.areaFocus);
        const dayAreaNames = result.itinerary.map(day => day.areaFocus);
        const dayImageUrls = await fetchItineraryImages(daySearchTerms, dayAreaNames);

        // 2. Fetch images for EACH ACTIVITY (timeline step)
        // We'll do this in parallel for all activities across all days
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

        // 3. Merge EVERYTHING back into the itinerary object
        result.itinerary = result.itinerary.map((day, dIdx) => ({
          ...day,
          imageUrl: dayImageUrls[dIdx] || undefined,
          timeline: day.timeline.map((step, sIdx) => {
            // Find the index in the flattened activityImageUrls array
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
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Sorry, we couldn't create your itinerary. Please try again or check the input fields.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section id="ai-architect" className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="max-w-5xl mx-auto">
        <div className={cn("transition-all duration-500 w-full", (isGenerating || itinerary) ? "hidden" : "block")}>
          <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tighter mb-4 uppercase">
              Odyssey <span className="text-gradient">Luxe</span>
            </h1>
            <p className="text-zinc-500 text-lg md:text-xl font-medium tracking-wide">
              Your Personal AI Travel Architect
            </p>
          </div>
          <Card className="glass-panel rounded-[2.5rem] shadow-2xl border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="font-serif text-2xl flex items-center gap-2 text-white uppercase tracking-tight">
                <Sparkles className="w-6 h-6 text-primary" />
                <span>Plan Your Next Escape</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.target instanceof HTMLInputElement &&
                      e.target.type !== "submit" &&
                      e.target.type !== "button"
                    ) {
                      e.preventDefault();
                      if (currentStep < aiArchitectSteps.length - 1) {
                        handleNext();
                      }
                    }
                  }}
                >
                  {/* Steps Indicator & Progress Bar */}
                  <div className="mb-10 flex items-center justify-center gap-3">
                    {aiArchitectSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (index < currentStep) setCurrentStep(index);
                          }}
                          disabled={index > currentStep}
                          className={cn(
                            "group relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-700 ease-out",
                            "disabled:cursor-not-allowed",
                            index < currentStep && "bg-foreground/10 text-foreground/60",
                            index === currentStep && "bg-foreground text-background shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)]",
                            index > currentStep && "bg-muted/50 text-muted-foreground/40",
                          )}
                        >
                          {index < currentStep ? (
                            <Check className="h-4 w-4 animate-in zoom-in duration-500" strokeWidth={2.5} />
                          ) : (
                            <span className="text-sm font-medium tabular-nums">{step.id}</span>
                          )}
                          {index === currentStep && (
                            <div className="absolute inset-0 rounded-full bg-foreground/20 blur-md animate-pulse" />
                          )}
                        </button>
                        {index < aiArchitectSteps.length - 1 && (
                          <div className="relative h-[1.5px] w-12 sm:w-16">
                            <div className="absolute inset-0 bg-[rgba(207,207,207,0.4)]" />
                            <div
                              className="absolute inset-0 bg-foreground/30 transition-all duration-700 ease-out origin-left"
                              style={{
                                transform: `scaleX(${index < currentStep ? 1 : 0})`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mb-8 overflow-hidden rounded-full bg-muted/30 h-[2px]">
                    <div
                      className="h-full bg-gradient-to-r from-foreground/60 to-foreground transition-all duration-1000 ease-out"
                      style={{ width: `${((currentStep + 1) / aiArchitectSteps.length) * 100}%` }}
                    />
                  </div>

                  {/* Step 1: Destinations */}
                  <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700", currentStep !== 0 && "hidden")}>
                    <FormField
                      control={form.control}
                      name="startingLocation"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-baseline justify-between mb-2">
                            <FormLabel className="text-lg font-medium tracking-tight">Starting Location</FormLabel>
                          </div>
                          <div className="relative group">
                            <FormControl>
                              <Input placeholder="e.g., New Delhi, India" autoFocus {...field} className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinations"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-baseline justify-between mb-2">
                            <FormLabel className="text-lg font-medium tracking-tight">Destinations to Visit (comma-separated)</FormLabel>
                          </div>
                          <div className="relative group">
                            <FormControl>
                              <Input placeholder="e.g., Paris, Rome, Florence" {...field} className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endingLocation"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-baseline justify-between mb-2">
                            <FormLabel className="text-lg font-medium tracking-tight">Ending Location (Optional)</FormLabel>
                          </div>
                          <div className="relative group">
                            <FormControl>
                              <Input placeholder="Leave empty to return to starting location" {...field} className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Step 2: Dates & Times */}
                  <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700", currentStep !== 1 && "hidden")}>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Trip Start Date</FormLabel>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal px-4 py-2.5 h-14 text-base border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur transition-all duration-500 rounded-lg",
                                      !field.value && "text-muted-foreground/70"
                                    )}
                                  >
                                    <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-foreground/60" />
                                    {field.value ? (
                                      <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span>
                                    ) : (
                                      <span>Select start date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border border-border/50 bg-background/95 backdrop-blur shadow-lg rounded-lg" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Trip End Date</FormLabel>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal px-4 py-2.5 h-14 text-base border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur transition-all duration-500 rounded-lg",
                                      !field.value && "text-muted-foreground/70"
                                    )}
                                  >
                                    <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-foreground/60" />
                                    {field.value ? (
                                      <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span>
                                    ) : (
                                      <span>Select end date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border border-border/50 bg-background/95 backdrop-blur shadow-lg rounded-lg" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    const startDate = form.getValues("startDate");
                                    return date < (startDate || new Date());
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Step 3: Preferences */}
                  <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700", currentStep !== 2 && "hidden")}>
                    <div className="grid md:grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Max Daily Budget (INR)</FormLabel>
                            </div>
                            <div className="relative group">
                              <FormControl>
                                <Input type="number" placeholder="Optional, e.g., 10000" {...field} className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="mustInclude"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Must-Include Attractions (comma-separated)</FormLabel>
                            </div>
                            <FormControl>
                              <Textarea placeholder="Optional, e.g., Eiffel Tower, Louvre Museum" {...field} className="min-h-[100px] text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur rounded-xl p-4 resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="avoid"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Things to Avoid (comma-separated)</FormLabel>
                            </div>
                            <FormControl>
                              <Textarea placeholder="Optional, e.g., Overcrowded tourist traps" {...field} className="min-h-[100px] text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur rounded-xl p-4 resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="leisureTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-background/50 backdrop-blur p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-lg font-medium tracking-tight">Include Leisure Time</FormLabel>
                              <div className="text-sm text-muted-foreground/80">Deliberately add unstructured time</div>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="leisureDay"
                        render={({ field }) => (
                          <FormItem className={cn("transition-opacity duration-300", !form.watch("leisureTime") && "opacity-50 pointer-events-none")}>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Leisure Day Preference</FormLabel>
                            </div>
                            <div className="relative group">
                              <FormControl>
                                <Input type="number" placeholder="Optional, e.g., 2" {...field} className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid md:grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="travelTimePreference"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between mb-2">
                              <FormLabel className="text-lg font-medium tracking-tight">Travel Timing Preference</FormLabel>
                            </div>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur">
                                  <SelectValue placeholder="Select a travel preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="no_preference">No specific preference</SelectItem>
                                <SelectItem value="avoid_night_travel">Avoid night travel (No travel after 6 PM)</SelectItem>
                                <SelectItem value="prefer_morning_travel">Prefer morning travel (Before 12 PM)</SelectItem>
                                <SelectItem value="prefer_afternoon_travel">Prefer afternoon travel (12 PM - 6 PM)</SelectItem>
                                <SelectItem value="prefer_night_travel">Prefer night travel (Overnight journeys)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="space-y-4 pt-4">
                    {currentStep < aiArchitectSteps.length - 1 ? (
                      <Button
                        key="continue-btn"
                        type="button"
                        onClick={handleNext}
                        className="w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 bg-primary text-white hover:bg-primary/90 rounded-xl"
                      >
                        <span className="flex items-center justify-center gap-2 font-medium">
                          Continue
                          <ArrowRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-300"
                            strokeWidth={2}
                          />
                        </span>
                      </Button>
                    ) : (
                      <Button
                        key="submit-btn"
                        type="submit"
                        disabled={isGenerating}
                        className="w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 bg-primary text-white hover:bg-primary/90 rounded-xl"
                      >
                        <span className="flex items-center justify-center gap-2 font-medium">
                          {isGenerating ? "Crafting Your Journey..." : "Generate Optimized Trip"}
                          {!isGenerating && <Check className="h-4 w-4 ml-1 transition-transform duration-300" strokeWidth={2} />}
                        </span>
                      </Button>
                    )}

                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="w-full text-center text-sm text-muted-foreground/60 hover:text-foreground/80 transition-all duration-300"
                      >
                        Go back
                      </button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {isGenerating && (
        <div className="max-w-5xl mx-auto mt-8">
          <Card className="ai-architect-page-card py-24 flex flex-col items-center justify-center min-h-[400px] space-y-12">
            <UniqueLoading variant="morph" size="lg" />
            <div className="h-8 overflow-hidden flex items-center justify-center">
              <ShiningText text={loadingTexts[loadingTextIndex]} />
            </div>
          </Card>
        </div>
      )}

      {(!isGenerating && itinerary) && (
        <div className="bg-obsidian-dark/60 backdrop-blur-md border-b border-white/5 py-3 shadow-xl sticky top-0 z-30 mb-6 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap items-center space-x-6">
              <button
                onClick={() => {
                  if (itinerary) {
                    setShowBackConfirm(true);
                  } else {
                    setItinerary(null);
                    setIsEditing(false);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                title="Return to form"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Client</label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="border-none bg-white/5 text-zinc-300 rounded-lg text-sm font-medium focus:ring-zinc-700 h-9 min-w-[180px]">
                    <SelectValue placeholder="No Client Assigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                    <SelectItem value="none">No Client Assigned</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="border-none bg-white/5 text-zinc-300 rounded-lg text-sm font-medium focus:ring-zinc-700 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-obsidian-dark border-white/5 text-zinc-300">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 px-2 py-1 rounded-md border border-white/5 bg-black/20">
                <Switch
                  id="show-timestamps"
                  checked={showTimestamps}
                  onCheckedChange={setShowTimestamps}
                  className="scale-75 origin-right"
                />
                <label htmlFor="show-timestamps" className="text-[10px] font-bold uppercase text-zinc-600 select-none whitespace-nowrap">
                  Time
                </label>
              </div>

              {/* Edit Itinerary Toggle */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "p-2 rounded-lg transition-all duration-300 flex items-center justify-center",
                  isEditing 
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,92,51,0.2)]" 
                    : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-zinc-300"
                )}
                title={isEditing ? "Editing Mode Active" : "Edit Itinerary"}
              >
                {isEditing ? (
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="animate-pulse"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                    <path d="M9 11c0 2-1 3-3 4-1.5.75-2 2-2 3s.5 2.25 2 3c1 0 1.5-.5 2-1s1-1.5 1-2" stroke="currentColor" fill="currentColor" fillOpacity="0.2" className="animate-bounce" />
                    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
                  </svg>
                ) : (
                  <Pencil className="w-[18px] h-[18px]" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-lg text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2 h-10"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={handleSaveItinerary}
                disabled={isSaving}
                className="px-6 py-2.5 aurora-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 h-10 border-none"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Itinerary"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {itinerary && (
        <>
          <div ref={itineraryRef} className="mt-0 max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-row gap-6">

              {/* Glassmorphism Icon Sidebar */}
              <div className="hidden lg:flex flex-col items-center w-16 shrink-0 sticky top-28 self-start h-[calc(100vh-8rem)]">
                <div className="flex flex-col items-center justify-between h-full py-4 px-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  {/* Top Navigation */}
                  <div className="flex flex-col items-center gap-1">
                    {[
                      { id: 'itinerary' as const, icon: CalendarIcon, label: 'Timeline' },
                      { id: 'flights-hotels' as const, icon: Plane, label: 'Logistics & Financials' },
                      { id: 'pricing' as const, icon: DollarSign, label: 'Financials' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveArchitectTab(item.id)}
                        className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                          activeArchitectTab === item.id
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                            : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
                        }`}
                        title={item.label}
                      >
                        <item.icon className="w-[18px] h-[18px]" />
                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                          {item.label}
                          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Separator */}
                  <div className="w-6 h-px bg-white/[0.08] my-2" />

                  {/* Bottom Navigation */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setActiveArchitectTab('settings')}
                      className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                        activeArchitectTab === 'settings'
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
                      }`}
                      title="Settings"
                    >
                      <Settings className="w-[18px] h-[18px]" />
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                        Settings
                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
                      </div>
                    </button>
                    <Link href="/security">
                      <button
                        className="relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 text-gray-500 hover:text-white hover:bg-white/[0.06]"
                        title="Security & Privacy"
                      >
                        <Shield className="w-[18px] h-[18px]" />
                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                          Security & Privacy
                          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-[#1a1a2e] border-l border-b border-white/10 rotate-45" />
                        </div>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mobile Sidebar (horizontal scrollable) */}
              <div className="lg:hidden w-full mb-4 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-2 p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl min-w-max">
                  {[
                    { id: 'itinerary' as const, icon: CalendarIcon, label: 'Timeline' },
                    { id: 'flights-hotels' as const, icon: Plane, label: 'Logistics' },
                    { id: 'pricing' as const, icon: DollarSign, label: 'Financials' },
                    { id: 'settings' as const, icon: Settings, label: 'Settings' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveArchitectTab(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeArchitectTab === item.id
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                          : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
                  {/* Main Content (Left) */}
                  <div className="lg:col-span-8 w-full min-w-0 order-2 lg:order-1">

                    {/* Itinerary Hero */}
                    <div className="relative rounded-2xl overflow-hidden h-40 shadow-xl group border border-white/10 mb-6">
                      <img
                        src={itinerary.itinerary[0]?.imageUrl || "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=2000&auto=format&fit=crop"}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.5]"
                        alt="Destination"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

                      <div className="absolute bottom-6 left-6 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="aurora-gradient text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Active Journey</span>
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tighter">Tropical Intelligence: <span className="text-gradient">{itinerary.itinerary[0]?.areaFocus?.split(',')[0] || "Ubud"}</span></h2>
                      </div>
                    </div>

                    {/* Tab Content - Timeline */}
                    {activeArchitectTab === 'itinerary' && (
                      <div className="relative rounded-2xl border border-white/[0.06] p-4 sm:p-6 backdrop-blur-sm overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(10,10,11,0.9) 0%, rgba(18,18,20,0.95) 50%, rgba(10,10,11,0.9) 100%)' }}>
                        <ItineraryTimeline
                          itinerary={itinerary?.itinerary || []}
                          isLoading={isGenerating}
                          editable={isEditing}
                          onEditingChange={setIsEditing}
                          onItineraryChange={(updatedItinerary) => {
                            if (itinerary) {
                              setItinerary({ ...itinerary, itinerary: updatedItinerary });
                            }
                          }}
                          hotels={hotels}
                          flights={flights}
                          showTimestamps={showTimestamps}
                        />
                      </div>
                    )}

                    {/* Tab Content - Logistics (Hotels & Flights) */}
                    {activeArchitectTab === 'flights-hotels' && !isGenerating && (
                      <HotelFlightEditor
                        hotels={hotels}
                        flights={flights}
                        totalDays={itinerary.itinerary.length}
                        onHotelsChange={setHotels}
                        onFlightsChange={setFlights}
                      />
                    )}

                    {/* Tab Content - Financials (Pricing) */}
                    {activeArchitectTab === 'pricing' && !isGenerating && (
                      <ItineraryProvider
                        key={JSON.stringify(itinerary?.itinerary?.length)}
                        initialTrip={{
                          itinerary: itinerary?.itinerary || [],
                          hotels,
                          flights,
                          pricing: pricing || (agencySettings ? {
                            currency: agencySettings.default_currency,
                            markupType: agencySettings.default_markup_type,
                            markupValue: agencySettings.default_markup_value,
                            taxPercentage: agencySettings.default_tax_percentage,
                            adultPax: 2,
                            childPax: 0,
                            infantPax: 0,
                            milestones: [],
                          } as any : undefined),
                        }}
                      >
                        <PricingModule />
                      </ItineraryProvider>
                    )}

                    {/* Tab Content - Settings */}
                    {activeArchitectTab === 'settings' && (
                      <div className="mt-4">
                        <CrmSettings />
                      </div>
                    )}
                  </div>

                  {/* Sidebar Summary (Right) */}
                  <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-32 order-1 lg:order-2">
                    <div className="glass-panel rounded-2xl p-3 mb-4 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-[68px] z-20 bg-obsidian-dark/80 backdrop-blur-lg">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Journey Summary</h3>
                        <div className="flex flex-wrap gap-4 sm:gap-8">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">Focus</span>
                            <span className="text-white text-xs font-bold leading-none">{itinerary?.itinerary[0]?.areaFocus?.split(',')[0] || 'Bali'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-secondary uppercase tracking-widest mb-0.5">Duration</span>
                            <span className="text-white text-xs font-bold leading-none">{itinerary?.itinerary.length} Days</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-0.5">Currency</span>
                            <span className="text-white text-xs font-bold leading-none">{currencySymbol ?? "₹"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="liquid-glass p-4 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-extrabold text-white text-base tracking-tight">AI Optimizer</h3>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                          <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                        </div>
                      </div>
                      {/* Optimization Items */}
                      <div className="space-y-3">
                        {itinerary?.optimizations && itinerary.optimizations.length > 0 ? (
                          itinerary.optimizations.map((opt, idx) => (
                            <div
                              key={idx}
                              style={{ animationDelay: `${100 + (idx * 100)}ms` }}
                              className="bg-white/5 rounded-xl p-3 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-primary/30 group cursor-pointer animate-in fade-in slide-in-from-right-4 fill-mode-both"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-[9px] uppercase font-black text-primary/70 tracking-[0.2em]">{opt.type}</p>
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded leading-none">
                                  {opt.impact}
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-white/90 leading-tight group-hover:text-white transition-colors">
                                {opt.message}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center space-y-2 opacity-50">
                            <div className="w-10 h-10 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                              <span className="material-symbols-outlined text-zinc-500">lightbulb</span>
                            </div>
                            <p className="text-[10px] font-medium text-zinc-500">Generating smart insights...</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (!itinerary?.optimizations) return;
                          const feedback = itinerary.optimizations.map(o => `${o.type}: ${o.message}`).join(". ");
                          onSubmit(form.getValues(), feedback);
                        }}
                        disabled={isGenerating || !itinerary}
                        className={cn(
                          "w-full py-2.5 rounded-lg aurora-gradient text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2",
                          (isGenerating || !itinerary) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className={cn("material-symbols-outlined text-[16px]", isGenerating && "animate-spin")}>
                          {isGenerating ? "cycle" : "bolt"}
                        </span>
                        {isGenerating ? "Refining..." : "Apply Optimizations"}
                      </button>
                    </div>

                    <div className="liquid-glass p-4 rounded-2xl">
                      <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Client Dossier</h5>
                      {(() => {
                        const selectedClient = clients.find(c => c.id === selectedClientId);
                        if (!selectedClient) {
                          return (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                                <span className="material-symbols-outlined text-[18px] text-zinc-600">person_off</span>
                              </div>
                              <p className="text-[11px] font-bold text-zinc-500">No Client Assigned</p>
                              <p className="text-[9px] text-zinc-600 mt-0.5">Assign a client from the dropdown above</p>
                            </div>
                          );
                        }
                        const initials = selectedClient.name
                          .split(' ')
                          .map(n => n.charAt(0))
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                        const memberSince = new Date(selectedClient.created_at).getFullYear();
                        // Parse tags for quick-info cards
                        const tagList = selectedClient.tags || [];
                        const dietaryTag = tagList.find(t => /vegan|vegetarian|halal|kosher|gluten|dietary|gf|non.?veg/i.test(t));
                        const paceTag = tagList.find(t => /relaxed|adventure|luxury|budget|fast|slow|moderate|pace/i.test(t));
                        return (
                          <>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 ring-2 ring-primary/40 flex items-center justify-center text-sm font-black text-white">
                                  {initials}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-white text-base truncate">{selectedClient.name}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                  Client since {memberSince}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {selectedClient.email && (
                                <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center col-span-2">
                                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Email</p>
                                  <p className="text-[10px] font-bold text-slate-300 truncate">{selectedClient.email}</p>
                                </div>
                              )}
                              {selectedClient.phone && (
                                <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center col-span-2">
                                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Phone</p>
                                  <p className="text-[10px] font-bold text-slate-300">{selectedClient.phone}</p>
                                </div>
                              )}
                              <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center">
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Dietary</p>
                                <p className="text-[10px] font-bold text-tertiary">{dietaryTag || "—"}</p>
                              </div>
                              <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-center">
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Pace</p>
                                <p className="text-[10px] font-bold text-tertiary">{paceTag || "—"}</p>
                              </div>
                            </div>
                            {selectedClient.notes && (
                              <div className="p-3 rounded-xl border border-white/5 bg-white/5">
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-3">{selectedClient.notes}</p>
                              </div>
                            )}
                            {tagList.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {tagList.map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-bold text-primary uppercase tracking-wider">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="rounded-2xl overflow-hidden shadow-xl h-32 relative border border-white/10 group cursor-pointer">
                      <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-xsOGndml_s9kwf08ODde8-KMQEdc7hOdy_VXgjwaTro4rMzYGe_9Y4VDhqf54Euy1V_gMHnEZlaZmkrkFT4LJaSjfte0TO0C_djYBte3XZ9j5oNeBFXizpz7mPN63ZZvd0aJWcOfnOwzKMotLKinl68YbvU-x01hJlqVxQYtl9KCj-7-kq0pGahQrUrgTS68l9Ene2wivXgm-sGiTl51WL9YeiNB-Fg3hYziTQDqDWangdgPLTYSv4s8EZiAyo0uFZQY2WHMNJ8" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-[0.5]" alt="Map Route" />
                      <div className="absolute inset-0 bg-secondary/10 backdrop-brightness-[0.7]"></div>
                      <div className="absolute bottom-3 left-3 glass-panel px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-white/20">
                        <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>explore</span>
                        Tracking
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PDF Preview & Export */}
          <PdfPreviewEditor
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            templateProps={{
              itinerary: itinerary,
              title: `Trip to ${itinerary?.itinerary[0]?.areaFocus?.split(',')[0] || 'Destination'}`,
              userProfile: userProfile,
              hotels: hotels,
              flights: flights,
              pricing: pricing,
              baseCost: baseCost,
            }}
            initialTheme={selectedTheme}
            filename="OdysseyLuxe_Itinerary.pdf"
          />
        </>
      )}
      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent className="glass-panel border-white/10 bg-black/90 text-white max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <AlertCircle className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-xl font-bold tracking-tight">Unsaved Journey</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
              You're about to return to the architect form. Would you like to save this itinerary first? Unsaved changes in Architect Mode will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={() => {
                  setItinerary(null);
                  setIsEditing(false);
                  setShowBackConfirm(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
              >
                Discard
              </button>
              <AlertDialogAction
                onClick={async () => {
                  await handleSaveItinerary();
                  setItinerary(null);
                  setIsEditing(false);
                  setShowBackConfirm(false);
                }}
                className="flex-1 aurora-gradient border-none text-white text-xs font-bold uppercase tracking-widest h-10"
              >
                Save & Exit
              </AlertDialogAction>
              <AlertDialogCancel className="sm:hidden text-zinc-500 border-none hover:text-zinc-300 bg-transparent">
                Cancel
              </AlertDialogCancel>
            </div>
          </AlertDialogFooter>
          <AlertDialogCancel className="hidden sm:block absolute top-4 right-4 text-zinc-500 border-none hover:text-zinc-300 bg-transparent">
             <span className="material-symbols-outlined text-[20px]">close</span>
          </AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default AiArchitect;
