
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
import { ChevronDown, Sparkles, Download, Calendar as CalendarIcon, Save, AlertCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PdfTemplate, type PdfTheme } from "@/components/pdf-template";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/lib/hooks/use-clients";

const formSchema = z.object({
  startingLocation: z.string().min(2, "Starting location is required."),
  endingLocation: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]( (AM|PM))?$/, "Invalid time format (e.g., 9:00 AM)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]( (AM|PM))?$/, "Invalid time format (e.g., 10:00 PM)."),
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
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

const AiArchitect = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<TravelItineraryOutput | null>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>('classic');
  const itineraryRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startingLocation: "",
      endingLocation: "",
      startDate: undefined,
      endDate: undefined,
      startTime: "9:00 AM",
      endTime: "10:00 PM",
      destinations: "",
      budget: undefined,
      walkingDistance: undefined,
      mustInclude: "",
      avoid: "",
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
          setItinerary({ title: "Custom Itinerary", description: "Modified itinerary", itinerary: parsed });
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
      }
    } catch (error) {
      console.error("Failed to save itinerary to local storage", error);
    }
  }, [itinerary]);

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

  const handleDownloadPdf = async () => {
    if (!itinerary) return;

    setIsDownloading(true);
    toast({
      title: "Generating PDF...",
      description: "Your professional itinerary is being created.",
    });

    // Use a small timeout to allow the conditional PdfTemplate to mount in the DOM
    setTimeout(async () => {
      const pdfElement = pdfTemplateRef.current;
      if (!pdfElement) {
        setIsDownloading(false);
        return;
      }

      try {
        // Dynamically import html2pdf only on the client side
        const html2pdf = (await import("html2pdf.js")).default;

        // Temporarily show the element for pdf capture
        pdfElement.style.display = "block";

        const options = {
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename: "OdysseyLuxe_Itinerary.pdf",
          image: { type: "jpeg", quality: 0.95 } as { type: "jpeg" | "png" | "webp", quality: number },
          html2canvas: { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true },
          jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" as const },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        await html2pdf().set(options).from(pdfElement).save();

        // Hide element again
        pdfElement.style.display = "none";

        toast({
          title: "Success!",
          description: "Your itinerary PDF has been downloaded.",
        });
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        pdfElement.style.display = "none"; // Ensure it's hidden even on error
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Sorry, we couldn't download your itinerary. Please try again.",
        });
      } finally {
        setIsDownloading(false);
      }
    }, 100); // 100ms timeout to ensure the DOM is painted
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
      const values = form.getValues();
      console.log("📝 Form values:", {
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
        startTime: "9:00 AM",
        endTime: "10:00 PM",
        destinations: "",
        budget: undefined,
        walkingDistance: undefined,
        mustInclude: "",
        avoid: "",
      });

      console.log("🔄 Form reset complete");
      setItinerary(null);
      setHotels([]);
      setFlights([]);
      setPricing(undefined);
      setSelectedClientId("none");
      setSelectedStatus("draft");
      localStorage.removeItem('draft_client_id');
      localStorage.removeItem('draft_status');

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


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setItinerary(null);
    try {
      // Format dates to YYYY-MM-DD
      const startDateStr = format(values.startDate, "yyyy-MM-dd");
      const endDateStr = format(values.endDate, "yyyy-MM-dd");

      const result = await generateTravelItinerary({
        startingLocation: values.startingLocation,
        endingLocation: values.endingLocation || values.startingLocation,
        startDate: startDateStr,
        endDate: endDateStr,
        startTime: values.startTime,
        endTime: values.endTime,
        destinations: values.destinations,
        budget: values.budget,
        walkingDistance: values.walkingDistance,
        mustInclude: values.mustInclude,
        avoid: values.avoid,
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="startingLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Starting Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., New Delhi, India" {...field} className="ai-architect-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Destinations to Visit (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Paris, Rome, Florence" {...field} className="ai-architect-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endingLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Ending Location (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Leave empty to return to starting location" {...field} className="ai-architect-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Trip Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal px-4 py-2.5 h-auto border border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 rounded-lg",
                                    !field.value && "text-gray-400",
                                    field.value && "text-white border-primary/30 bg-primary/5"
                                  )}
                                >
                                  <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                                  {field.value ? (
                                    <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span>
                                  ) : (
                                    <span>Select start date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border border-gray-700 bg-gray-950 shadow-lg rounded-lg" align="start">
                              <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </div>
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
                          <FormLabel className="text-gray-300">Trip End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal px-4 py-2.5 h-auto border border-gray-700 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 rounded-lg",
                                    !field.value && "text-gray-400",
                                    field.value && "text-white border-primary/30 bg-primary/5"
                                  )}
                                >
                                  <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                                  {field.value ? (
                                    <span className="font-medium">{format(field.value, "MMM dd, yyyy")}</span>
                                  ) : (
                                    <span>Select end date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border border-gray-700 bg-gray-950 shadow-lg rounded-lg" align="start">
                              <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg">
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
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Daily Start Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 9:00 AM" {...field} className="ai-architect-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Daily End Time</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 10:00 PM" {...field} className="ai-architect-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="space-y-4">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isAdvancedOpen && "rotate-180")} />
                      <span>Advanced Filters</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 pt-4 animate-in fade-in-0 zoom-in-95">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Max Daily Budget (INR)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Optional, e.g., 10000" {...field} className="ai-architect-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="walkingDistance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Max Walking Distance (km per day)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Optional, e.g., 10" {...field} className="ai-architect-input" />
                            </FormControl>
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
                            <FormLabel className="text-gray-300">Must-Include Attractions (comma-separated)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Optional, e.g., Eiffel Tower, Louvre Museum" {...field} className="ai-architect-input" />
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
                            <FormLabel className="text-gray-300">Things to Avoid (comma-separated)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Optional, e.g., Overcrowded tourist traps" {...field} className="ai-architect-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="text-center pt-4">
                  <Button type="submit" size="lg" disabled={isGenerating}>
                    {isGenerating ? "Crafting Your Journey..." : "Generate Optimized Trip"}
                  </Button>
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
                    disabled={isDownloading}
                    className="flex-1 glass-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? "Downloading..." : "Download PDF"}
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

          {/* Hidden PDF Template */}
          <div ref={pdfTemplateRef} style={{ display: "none" }}>
            <PdfTemplate
              itinerary={itinerary}
              title={`Trip to ${itinerary?.itinerary[0]?.areaFocus?.split(',')[0] || 'Destination'}`}
              userProfile={userProfile}
              theme={selectedTheme}
              hotels={hotels}
              flights={flights}
              pricing={pricing}
              baseCost={baseCost}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default AiArchitect;
