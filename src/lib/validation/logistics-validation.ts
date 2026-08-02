import type { HotelInfo, FlightInfo, CabInfo, BusInfo } from "@/components/hotel-flight-editor";

export type LogisticsEntityType = "hotel" | "flight" | "cab" | "bus";

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
}

/**
 * Single source of truth for required fields per entity type.
 * Photo/image uploads are explicitly NOT required and excluded from completeness checks.
 */
export const LOGISTICS_REQUIRED_FIELDS: Record<LogisticsEntityType, FieldDefinition[]> = {
  hotel: [
    { key: "name", label: "Hotel Name", required: true },
    { key: "address", label: "Address / Location", required: true },
    { key: "checkIn", label: "Check In Time", required: true },
    { key: "checkOut", label: "Check Out Time", required: true },
    // Optional: imageUrls, bookingRef, starRating, costAdult, costChild, costInfant, nights
  ],
  flight: [
    { key: "airline", label: "Airline", required: true },
    { key: "flightNumber", label: "Flight Number", required: true },
    { key: "departure", label: "Departure Time", required: true },
    { key: "arrival", label: "Arrival Time", required: true },
    { key: "departureAirport", label: "Departure Airport", required: true },
    { key: "arrivalAirport", label: "Arrival Airport", required: true },
    // Optional: pnr, terminal, layover, costAdult, costChild, costInfant
    // Connecting flight required fields are evaluated dynamically when flightType === 'connecting'
  ],
  cab: [
    { key: "vehicleType", label: "Vehicle Type", required: true },
    { key: "route", label: "Route", required: true },
    { key: "pickupTime", label: "Pickup Time", required: true },
    { key: "driverName", label: "Driver Name", required: true },
    { key: "driverContact", label: "Driver Contact", required: true },
    // Optional: bookingRef, totalCost
  ],
  bus: [
    { key: "busType", label: "Bus Type / Name", required: true },
    { key: "route", label: "Route / Destination", required: true },
    { key: "reportingTime", label: "Reporting Time", required: true },
    { key: "departureTime", label: "Departure Time", required: true },
    { key: "pnr", label: "PNR / Ticket No.", required: true },
    // Optional: costAdult, costChild, costInfant
  ],
};

/**
 * Returns required field definitions for a given entity type, accounting for dynamic rules
 * (such as connecting flights requiring additional fields).
 */
export function getRequiredFields(entry: any, entityType: LogisticsEntityType): FieldDefinition[] {
  const baseFields = LOGISTICS_REQUIRED_FIELDS[entityType] || [];
  if (entityType === "flight" && entry?.flightType === "connecting") {
    return [
      ...baseFields,
      { key: "connectingAirline", label: "Connecting Airline", required: true },
      { key: "connectingFlightNumber", label: "Connecting Flight Number", required: true },
      { key: "connectingDeparture", label: "Connecting Departure", required: true },
      { key: "connectingArrival", label: "Connecting Arrival", required: true },
      { key: "connectingDepartureAirport", label: "Connecting Departure Airport", required: true },
      { key: "connectingArrivalAirport", label: "Connecting Arrival Airport", required: true },
    ];
  }
  return baseFields;
}

/**
 * Validates a single entry against its required fields schema.
 * Returns { isValid, errors } with field-specific error messages.
 */
export function validateLogisticsEntry(
  entry: any,
  entityType: LogisticsEntityType
): { isValid: boolean; errors: Record<string, string> } {
  if (!entry) return { isValid: false, errors: { _general: "Entry is missing" } };

  const requiredFields = getRequiredFields(entry, entityType);
  const errors: Record<string, string> = {};

  for (const field of requiredFields) {
    const val = entry[field.key];
    if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
      errors[field.key] = `${field.label} is required`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Evaluates whether an entry has ALL mandatory fields filled in.
 * Only complete entries are eligible for PDF export.
 * Photo/image upload fields are explicitly NOT checked here.
 */
export function isEntryCompleteForExport(entry: any, entityType: LogisticsEntityType): boolean {
  return validateLogisticsEntry(entry, entityType).isValid;
}

/**
 * Filters an array of entries, returning ONLY those that pass the mandatory fields completeness check.
 * Used during PDF generation to ensure incomplete drafts are silently excluded.
 */
export function filterCompleteEntriesForExport<T = any>(
  entries: T[] | undefined | null,
  entityType: LogisticsEntityType
): T[] {
  if (!entries || !Array.isArray(entries)) return [];
  return entries.filter((entry) => isEntryCompleteForExport(entry, entityType));
}
