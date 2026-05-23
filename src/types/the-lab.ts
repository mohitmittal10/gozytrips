// Type definitions and Zod Schema for TheLab module
import { z } from "zod";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { type HotelInfo, type FlightInfo, type CabInfo, type BusInfo } from "@/components/hotel-flight-editor";
import { type PricingConfig } from "@/types/pricing";

export const formSchema = z.object({
  startingLocation: z.string().min(2, "Starting location is required."),
  endingLocation: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  destinations: z.string().min(2, "At least one destination is required."),
  budget: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().positive("Budget must be a positive number.").optional()
  ),
  strictBudget: z.boolean().default(false),
  travelMethods: z.array(z.string()).default([]),
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

export type TheLabFormValues = z.infer<typeof formSchema>;

export type ActiveLabTab = 'itinerary' | 'flights-hotels' | 'inclusions' | 'pricing' | 'history' | 'settings' | 'new';

export interface TripMetadata extends Partial<TheLabFormValues> {
  // Can carry any parsed metadata
}

export interface LoadedPersistenceData {
  itinerary: TravelItineraryOutput | null;
  hotels: HotelInfo[];
  flights: FlightInfo[];
  cabs: CabInfo[];
  buses: BusInfo[];
  pricing?: PricingConfig;
  optimizationCount: number;
  selectedClientId: string;
  selectedStatus: string;
  tripMetadata: TripMetadata | null;
  showTimestamps: boolean;
  showPrices: boolean;
  selectedTheme: string;
  pdfOverrides: Record<string, any>;
  draftSourceItineraryId?: string | null;
  inclusions?: string;
  exclusions?: string;
}

export interface SaveItineraryOptions {
  pricingOverride?: PricingConfig;
}

