import type { TravelItineraryOutput } from "@/ai/flows/generate-travel-itinerary";
import type { HotelInfo, FlightInfo, CabInfo, BusInfo } from "@/components/hotel-flight-editor";
import type { PricingConfig } from "@/types/pricing";
import type { TheLabFormValues, TripMetadata } from "@/types/the-lab";
import type { PdfTheme } from "@/components/pdf-template";

export interface TimelineSlice {
  itinerary: TravelItineraryOutput | null;
  isEditing: boolean;
  showTimestamps: boolean;
}

export interface LogisticsSlice {
  hotels: HotelInfo[];
  flights: FlightInfo[];
  cabs: CabInfo[];
  buses: BusInfo[];
}

export interface InclusionsSlice {
  inclusions: string;
  exclusions: string;
  termsAndConditions: string;
  cancellationPolicy: string;
  paymentMethods: string;
}

export interface FinanceSlice {
  pricing: PricingConfig | undefined;
}

export interface MetaSlice {
  currentTripId: string | null;
  tripMetadata: TripMetadata | null;
  selectedClientId: string;
  selectedStatus: string;
  selectedTheme: PdfTheme;
  pdfOverrides: Record<string, any>;
}

export type AutosaveStatus = "saving" | "saved" | "error" | "idle";

export interface AutosaveSlice {
  autosaveStatus: AutosaveStatus;
  isSaving: boolean;
  setAutosaveStatus: (status: AutosaveStatus) => void;
}

export interface DirtyTrackingSlice {
  currentHash: string;
  lastCommittedHash: string | null;
  isDirty: boolean;
}

export interface PdfRelevantData {
  itinerary: TravelItineraryOutput | null;
  hotels: HotelInfo[];
  flights: FlightInfo[];
  cabs: CabInfo[];
  buses: BusInfo[];
  inclusions: string;
  exclusions: string;
  termsAndConditions: string;
  cancellationPolicy: string;
  paymentMethods: string;
  pricing: PricingConfig | undefined;
  tripMetadata: TripMetadata | null;
  showTimestamps: boolean;
  selectedTheme: PdfTheme;
  pdfOverrides: Record<string, any>;
  selectedClientId: string;
  selectedStatus: string;
}

export interface LabState extends TimelineSlice, LogisticsSlice, InclusionsSlice, FinanceSlice, MetaSlice, DirtyTrackingSlice, AutosaveSlice {
  // Action Setters
  setItinerary: (itinerary: TravelItineraryOutput | null) => void;
  setIsEditing: (isEditing: boolean) => void;
  setShowTimestamps: (showTimestamps: boolean) => void;

  setHotels: (hotels: HotelInfo[]) => void;
  setFlights: (flights: FlightInfo[]) => void;
  setCabs: (cabs: CabInfo[]) => void;
  setBuses: (buses: BusInfo[]) => void;
  setLogistics: (logistics: Partial<LogisticsSlice>) => void;

  setInclusionsText: (inclusions: string) => void;
  setExclusionsText: (exclusions: string) => void;
  setTermsAndConditionsText: (termsAndConditions: string) => void;
  setCancellationPolicyText: (cancellationPolicy: string) => void;
  setPaymentMethodsText: (paymentMethods: string) => void;
  setInclusionsSlice: (slice: Partial<InclusionsSlice>) => void;

  setPricing: (pricing: PricingConfig | undefined) => void;

  setCurrentTripId: (currentTripId: string | null) => void;
  setTripMetadata: (tripMetadata: TripMetadata | null) => void;
  setSelectedClientId: (clientId: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedTheme: (theme: PdfTheme) => void;
  setPdfOverrides: (pdfOverrides: Record<string, any>) => void;

  // Batch & Lifecycle Actions
  loadStateFromPersistence: (data: Partial<LabState>) => void;
  resetStore: () => void;
  markPdfSynced: () => void;
  reevaluateDirtyState: () => void;
}
