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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { generateTravelItinerary } from "@/ai/flows/generate-travel-itinerary";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { useToast } from "@/hooks/use-toast";
import ItineraryTimeline from "../itinerary-timeline";
import { Sparkles } from "lucide-react";

const formSchema = z.object({
  destination: z.string().min(2, "Destination must be at least 2 characters."),
  numberOfDays: z.coerce.number().int().min(1, "Must be at least 1 day.").max(14, "Cannot exceed 14 days."),
  vibe: z.string().min(1, "Please select a vibe."),
});

const AiArchitect = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<TravelItineraryOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: "",
      numberOfDays: 3,
      vibe: "Adventure",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setItinerary(null);
    try {
      const result = await generateTravelItinerary(values);
      setItinerary(result);
    } catch (error) {
        console.error("Failed to generate itinerary:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "Sorry, we couldn't create your itinerary. Please try again.",
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

      <div className="max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <span>Create Your Itinerary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-3 gap-6 items-end">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Paris, France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Days</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="14" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vibe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vibe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a travel style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background/80 backdrop-blur-lg">
                          <SelectItem value="Adventure">Adventure</SelectItem>
                          <SelectItem value="Chill">Chill</SelectItem>
                          <SelectItem value="Foodie">Foodie</SelectItem>
                          <SelectItem value="Cultural">Cultural</SelectItem>
                          <SelectItem value="Luxury">Luxury</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-3 text-center mt-4">
                  <Button type="submit" size="lg" disabled={isGenerating}>
                    {isGenerating ? "Crafting Your Journey..." : "Generate My Trip"}
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
