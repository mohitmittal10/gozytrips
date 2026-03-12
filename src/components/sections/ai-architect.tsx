
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
import { generateTravelItinerary } from "@/ai/flows/generate-travel-itinerary";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { fetchItineraryImages } from "@/ai/flows/fetch-itinerary-images";
import { useToast } from "@/hooks/use-toast";
import ItineraryTimeline from "../itinerary-timeline";
import HotelFlightEditor, { type HotelInfo, type FlightInfo } from "@/components/hotel-flight-editor";
import PricingModule from "@/components/pricing-module";
import type { PricingConfig } from "@/types/pricing";
import { ChevronDown, Sparkles, Calendar as CalendarIcon, Save, AlertCircle, Eye, Check, ArrowRight } from "lucide-react";
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
  walkingDistance: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().positive("Distance must be a positive number.").optional()
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
  { id: 3, label: "Preferences", fields: ["budget", "walkingDistance", "mustInclude", "avoid", "leisureTime", "leisureDay", "travelTimePreference"] as const },
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
  const { user, userProfile } = useAuth();
  const supabase = createClient();
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [flights, setFlights] = useState<FlightInfo[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | undefined>(undefined);

  // CRM fields
  const { clients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [selectedStatus, setSelectedStatus] = useState<string>("draft");
  const [tripMetadata, setTripMetadata] = useState<any>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startingLocation: "",
      endingLocation: "",
      startDate: undefined,
      endDate: undefined,
      destinations: "",
      budget: undefined,
      walkingDistance: undefined,
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

      // Insert with error handling
      console.log("📤 Sending insert request to Supabase...");
      const { data, error } = await supabase
        .from("itineraries")
        .insert([tripData]);

      console.log("📥 Supabase response received");
      console.log("✅ Data:", data);
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
        walkingDistance: undefined,
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setItinerary(null);
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
        budget: values.budget,
        walkingDistance: values.walkingDistance,
        mustInclude: values.mustInclude,
        avoid: values.avoid,
        leisureTime: values.leisureTime,
        leisureDay: values.leisureDay,
        travelTimePreference: values.travelTimePreference,
      });

      // Fetch destination images from Unsplash
      try {
        const searchTerms = result.itinerary.map(day => day.imageSearchTerm || day.areaFocus);
        const areaNames = result.itinerary.map(day => day.areaFocus);
        const imageUrls = await fetchItineraryImages(searchTerms, areaNames);
        // Merge image URLs into each day
        result.itinerary = result.itinerary.map((day, i) => ({
          ...day,
          imageUrl: imageUrls[i] || undefined,
        }));
      } catch (imgError) {
        console.warn('Failed to fetch destination images, continuing without them:', imgError);
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
    <section id="ai-architect" className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Your Personal AI Travel Architect</h2>
        <p className="mt-4 max-w-2xl mx-auto text-foreground/80">
          Describe your dream trip, and let our AI craft a personalized, day-by-day itinerary just for you.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <Card className="ai-architect-page-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2 text-white">
              <Sparkles className="w-6 h-6 text-primary" />
              <span>Create Your Optimized Itinerary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <div className="grid md:grid-cols-2 gap-6">
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
                    <FormField
                      control={form.control}
                      name="walkingDistance"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-baseline justify-between mb-2">
                            <FormLabel className="text-lg font-medium tracking-tight">Max Walking Distance (km/day)</FormLabel>
                          </div>
                          <div className="relative group">
                            <FormControl>
                              <Input type="number" placeholder="Optional, e.g., 10" {...field} className="h-14 text-base transition-all duration-500 border-border/50 focus:border-foreground/20 bg-background/50 backdrop-blur" />
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
                      className="w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 bg-foreground text-background hover:bg-foreground/90"
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
                      className="w-full h-12 group relative transition-all duration-300 hover:shadow-lg hover:shadow-foreground/5 bg-foreground text-background hover:bg-foreground/90"
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

      {(isGenerating || itinerary) && (
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {itinerary && !isGenerating && (
              <>
                <Button
                  onClick={handleSaveItinerary}
                  disabled={isSaving}
                  className="flex-1 glass-button bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save to My Trips"}
                </Button>

                <div className="flex-1 flex gap-2">
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Assign Client (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Client Assigned --</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex gap-2">
                  <Select defaultValue="classic" onValueChange={(value) => setSelectedTheme(value as PdfTheme)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic (Default)</SelectItem>
                      <SelectItem value="editorial">Editorial (Magazine)</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={!itinerary}
                    className="flex-1 glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview & Export
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    console.log("🧪 Running diagnostic check...");
                    const { data: { session } } = await supabase.auth.getSession();
                    console.log("Session:", session);
                    console.log("User:", user);
                    console.log("Itinerary exists:", !!itinerary);
                  }}
                  className="text-xs"
                >
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Debug
                </Button>
              </>
            )}
          </div>

          {itinerary && !isGenerating && (
            <div className="flex justify-end mb-4">
              <div className="flex items-center space-x-2 bg-background/50 backdrop-blur px-4 py-2 rounded-lg border border-border/50">
                <Switch
                  id="show-timestamps"
                  checked={showTimestamps}
                  onCheckedChange={setShowTimestamps}
                />
                <label
                  htmlFor="show-timestamps"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show Timestamps
                </label>
              </div>
            </div>
          )}

          <div ref={itineraryRef}>
            {/* Hotel & Flight Editor */}
            {itinerary && !isGenerating && (
              <HotelFlightEditor
                hotels={hotels}
                flights={flights}
                totalDays={itinerary.itinerary.length}
                onHotelsChange={setHotels}
                onFlightsChange={setFlights}
              />
            )}
            <ItineraryTimeline
              itinerary={itinerary?.itinerary || []}
              isLoading={isGenerating}
              editable={true}
              onItineraryChange={(updatedItinerary) => {
                if (itinerary) {
                  setItinerary({ ...itinerary, itinerary: updatedItinerary });
                }
              }}
              hotels={hotels}
              flights={flights}
              showTimestamps={showTimestamps}
            />
            {/* Pricing Module */}
            {itinerary && !isGenerating && (
              <PricingModule
                pricing={pricing}
                onChange={setPricing}
                baseCost={baseCost}
              />
            )}
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
        </div>
      )}
    </section>
  );
};

export default AiArchitect;
