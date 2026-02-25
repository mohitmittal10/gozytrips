
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
import { useState, useEffect, useRef } from "react";
import { generateTravelItinerary } from "@/ai/flows/generate-travel-itinerary";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { useToast } from "@/hooks/use-toast";
import ItineraryTimeline from "../itinerary-timeline";
import { ChevronDown, Sparkles, Download, Calendar as CalendarIcon } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

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
        setItinerary(JSON.parse(savedItinerary));
      }
    } catch (error) {
      console.error("Failed to load itinerary from local storage", error);
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

  const handleDownloadPdf = async () => {
    const pdfElement = pdfTemplateRef.current;
    if (!pdfElement || !itinerary) return;

    toast({
      title: "Generating PDF...",
      description: "Your professional itinerary is being created.",
    });

    try {
      // Dynamically import html2pdf only on the client side
      const html2pdf = (await import("html2pdf.js")).default;

      // Temporarily show the element for pdf capture
      pdfElement.style.display = "block";

      const options = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: "OdysseyLuxe_Itinerary.pdf",
        image: { type: "jpeg", quality: 0.98 } as { type: "jpeg" | "png" | "webp", quality: number },
        html2canvas: { scale: 5, backgroundColor: "#ffffff", logging: false },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" as const },
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
          <div className="flex justify-end mb-4">
            {itinerary && !isGenerating && (
              <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
          <div ref={itineraryRef}>
            <ItineraryTimeline itinerary={itinerary?.itinerary || []} isLoading={isGenerating} />
          </div>

          {/* Hidden PDF Template */}
          <div ref={pdfTemplateRef} style={{ display: "none" }}>
            <PdfTemplate itinerary={itinerary} />
          </div>
        </div>
      )}
    </section>
  );
};

interface PdfTemplateProps {
  itinerary: TravelItineraryOutput | null;
}

const PdfTemplate = ({ itinerary }: PdfTemplateProps) => {
  if (!itinerary) return null;

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      backgroundColor: "#fff",
      color: "#333"
    }}>
      {/* Header */}
      <div style={{ borderBottom: "3px solid #0066cc", paddingBottom: "15px", marginBottom: "20px" }}>
        <h1 style={{ color: "#0066cc", fontSize: "28px", margin: "0 0 5px 0" }}>
          Your Travel Itinerary
        </h1>
        <p style={{ color: "#666", fontSize: "12px", margin: "0" }}>
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Overview */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ color: "#0066cc", fontSize: "16px", borderBottom: "2px solid #eee", paddingBottom: "8px" }}>
          Trip Overview
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "10px" }}>
          <div>
            <p style={{ margin: "5px 0", fontSize: "12px" }}>
              <strong>Duration:</strong> {itinerary.itinerary.length} days
            </p>
            <p style={{ margin: "5px 0", fontSize: "12px" }}>
              <strong>Total Walking Distance:</strong> {itinerary.itinerary[0]?.dailyStats?.walkingDistance || "N/A"} km
            </p>
          </div>
          <div>
            <p style={{ margin: "5px 0", fontSize: "12px" }}>
              <strong>Estimated Budget:</strong> ₹{itinerary.itinerary[0]?.dailyStats?.totalCost || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Itineraries */}
      {itinerary.itinerary.map((day, index) => (
        <div key={index} style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
          <h3 style={{
            color: "#fff",
            backgroundColor: "#0066cc",
            padding: "10px",
            margin: "0 0 10px 0",
            fontSize: "14px"
          }}>
            Day {index + 1}: {day.date} - {day.areaFocus}
          </h3>

          {day.timeline.map((step, stepIndex) => (
            <div key={stepIndex} style={{ marginBottom: "10px", paddingLeft: "10px", borderLeft: "3px solid #0066cc" }}>
              <p style={{ margin: "0 0 3px 0", fontWeight: "bold", fontSize: "12px", color: "#0066cc" }}>
                {step.time}
              </p>
              <p style={{ margin: "0", fontSize: "12px", color: "#333", lineHeight: "1.4" }}>
                {step.details}
              </p>
            </div>
          ))}

          <div style={{
            backgroundColor: "#f5f5f5",
            padding: "10px",
            marginTop: "10px",
            fontSize: "11px",
            borderRadius: "4px"
          }}>
            <p style={{ margin: "0", color: "#666" }}>
              <strong>Daily Stats:</strong> Walk {day.dailyStats?.walkingDistance || "N/A"} km | Budget ₹{day.dailyStats?.totalCost || "N/A"}
            </p>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: "30px",
        paddingTop: "15px",
        borderTop: "2px solid #eee",
        fontSize: "10px",
        color: "#999",
        textAlign: "center"
      }}>
        <p style={{ margin: "0" }}>OdysseyLuxe - Your Personal AI Travel Architect</p>
        <p style={{ margin: "5px 0 0 0" }}>www.odysseyluxe.com</p>
      </div>
    </div>
  );
};

export default AiArchitect;

    
