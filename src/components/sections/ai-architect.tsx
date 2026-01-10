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
import { useState, useEffect } from "react";
import { generateTravelItinerary } from "@/ai/flows/generate-travel-itinerary";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { useToast } from "@/hooks/use-toast";
import ItineraryTimeline from "../itinerary-timeline";
import { ChevronDown, Sparkles } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    destinations: z.string().min(2, "At least one destination is required."),
    numberOfDays: z.coerce.number().int().min(1, "Must be at least 1 day.").max(14, "Cannot exceed 14 days."),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]( (AM|PM))?$/, "Invalid time format (e.g., 9:00 AM)."),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]( (AM|PM))?$/, "Invalid time format (e.g., 10:00 PM)."),
    budget: z.coerce.number().int().positive("Budget must be a positive number.").optional().or(z.literal('')),
    walkingDistance: z.coerce.number().int().positive("Distance must be a positive number.").optional().or(z.literal('')),
    mustInclude: z.string().optional(),
    avoid: z.string().optional(),
});

const AiArchitect = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<TravelItineraryOutput | null>(null);
  const { toast } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinations: "Paris, France",
      numberOfDays: 3,
      startTime: "9:00 AM",
      endTime: "10:00 PM",
      budget: 10000,
      walkingDistance: 10,
      mustInclude: "Eiffel Tower, Louvre Museum",
      avoid: "Tourist traps",
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setItinerary(null);
    try {
      // Filter out empty optional values before sending to the API
      const apiValues = {
        ...values,
        budget: values.budget || undefined,
        walkingDistance: values.walkingDistance || undefined,
        mustInclude: values.mustInclude || undefined,
        avoid: values.avoid || undefined,
      };
      const result = await generateTravelItinerary(apiValues);
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
                      name="destinations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Destinations (comma-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Paris, France, Rome, Italy" {...field} className="ai-architect-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="numberOfDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Trip Duration (days)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} className="ai-architect-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                                    <Input type="number" placeholder="Optional" {...field} className="ai-architect-input" />
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
                                    <Input type="number" placeholder="Optional" {...field} className="ai-architect-input" />
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
                                    <Textarea placeholder="e.g., Eiffel Tower, Louvre Museum (Optional)" {...field} className="ai-architect-input" />
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
                                    <Textarea placeholder="e.g., Overcrowded tourist traps (Optional)" {...field} className="ai-architect-input" />
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
            <ItineraryTimeline itinerary={itinerary?.itinerary || []} isLoading={isGenerating} />
        </div>
      )}
    </section>
  );
};

export default AiArchitect;
