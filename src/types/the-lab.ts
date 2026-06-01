// Type definitions and Zod Schema for TheLab module
import { z } from "zod";
import { sanitizeText } from "@/lib/security/input-sanitizer";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { type HotelInfo, type FlightInfo, type CabInfo, type BusInfo } from "@/components/hotel-flight-editor";
import { type PricingConfig } from "@/types/pricing";

// Regex: location names — letters, spaces, commas, hyphens, apostrophes, dots
const LOCATION_REGEX = /^[a-zA-Z\s,\.\-'\u00C0-\u024F]+$/;

export const formSchema = z.object({
  startingLocation: z
    .string()
    .min(2, "Starting location is required.")
    .max(100, "Starting location is too long (max 100 characters).")
    .refine((v) => LOCATION_REGEX.test(v.trim()), "Location names should only contain letters, spaces, and punctuation."),
  endingLocation: z
    .string()
    .max(100, "Ending location is too long (max 100 characters).")
    .optional()
    .refine((v) => !v || LOCATION_REGEX.test(v.trim()), "Location names should only contain letters, spaces, and punctuation."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  destinations: z
    .string()
    .min(2, "At least one destination is required.")
    .max(300, "Destinations list is too long (max 300 characters).")
    .transform((v) => sanitizeText(v, 300)),
  tripType: z.enum([
    "adventurous",
    "scenic",
    "relaxed",
    "cultural",
    "romantic",
    "family",
    "foodie"
  ]).default("relaxed"),
  travelMethods: z.array(z.string()).default([]),
  mustInclude: z
    .string()
    .max(500, "Must-include list is too long (max 500 characters).")
    .optional()
    .transform((v) => sanitizeText(v, 500)),
  avoid: z
    .string()
    .max(500, "Avoid list is too long (max 500 characters).")
    .optional()
    .transform((v) => sanitizeText(v, 500)),
  leisureTime: z.boolean().default(false),
  leisureDay: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().positive().max(30, "Day number is too large.").optional()
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

export type ActiveLabTab = 'itinerary' | 'flights-hotels' | 'inclusions' | 'pricing' | 'history' | 'new';

export interface TripMetadata extends Partial<TheLabFormValues> {
  // Can carry any parsed metadata
  budget?: number | null;
  strictBudget?: boolean;
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
  selectedTheme: string;
  pdfOverrides: Record<string, any>;
  draftSourceItineraryId?: string | null;
  inclusions?: string;
  exclusions?: string;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  paymentMethods?: string;
}

export interface SaveItineraryOptions {
  pricingOverride?: PricingConfig;
}

