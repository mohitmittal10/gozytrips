// Type definitions and Zod Schema for TheLab module
import { z } from "zod";
import { sanitizeText } from "@/lib/security/input-sanitizer";
import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import { type HotelInfo, type FlightInfo, type CabInfo, type BusInfo } from "@/components/hotel-flight-editor";
import { type PricingConfig } from "@/types/pricing";

// Regex: location names — letters, numbers, spaces, commas, hyphens, apostrophes, dots, parentheses, ampersands, slashes
const LOCATION_REGEX = /^[a-zA-Z0-9\s,\.\-'\u00C0-\u024F\(\)\&\/\+]+$/;

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
  startDate: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? new Date(val) : val),
    z.date({ required_error: "Start date is required.", invalid_type_error: "Please enter a valid start date." })
      .refine((d) => !isNaN(d.getTime()), "Please enter a valid start date.")
  ),
  endDate: z.preprocess(
    (val) => (typeof val === "string" && val.trim() ? new Date(val) : val),
    z.date({ required_error: "End date is required.", invalid_type_error: "Please enter a valid end date." })
      .refine((d) => !isNaN(d.getTime()), "Please enter a valid end date.")
  ),
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
  mealPlan: z
    .string()
    .max(100, "Meal plan preference is too long.")
    .default("CP"),
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
  daywiseDestinations: z
    .string()
    .max(10000, "Day-wise plan is too long (max 10,000 characters).")
    .optional()
    .transform((v) => sanitizeText(v, 10000)),
  hotels: z.array(z.object({
    id: z.string().default(() => `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    dayIndex: z.coerce.number().default(0),
    dayIndices: z.array(z.coerce.number()).optional(),
    name: z.string().default(''),
    address: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    bookingRef: z.string().optional(),
    starRating: z.coerce.number().optional(),
    nights: z.coerce.number().optional(),
    costAdult: z.coerce.number().optional(),
    costChild: z.coerce.number().optional(),
    costInfant: z.coerce.number().optional(),
    imageUrls: z.array(z.string()).optional(),
  })).optional().default([]),
}).refine((data) => {
  const s = data.startDate instanceof Date ? data.startDate.getTime() : new Date(data.startDate).getTime();
  const e = data.endDate instanceof Date ? data.endDate.getTime() : new Date(data.endDate).getTime();
  return !isNaN(s) && !isNaN(e) && e > s;
}, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

export type TheLabFormValues = z.infer<typeof formSchema>;

export type ActiveLabTab = 'itinerary' | 'flights-hotels' | 'inclusions' | 'pricing' | 'history' | 'new';

export interface TripMetadata extends Partial<TheLabFormValues> {
  // Can carry any parsed metadata
  title?: string;
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
  selectedClientId: string;
  selectedStatus: string;
  tripMetadata: TripMetadata | null;
  showTimestamps: boolean;
  selectedTheme: string;
  pdfOverrides: Record<string, any>;
  draftSourceItineraryId?: string | null;
  share_token?: string | null;
  share_enabled?: boolean;
  inclusions?: string;
  exclusions?: string;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  paymentMethods?: string;
}

export interface SaveItineraryOptions {
  pricingOverride?: PricingConfig;
}

