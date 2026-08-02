import type { PdfRelevantData, LabState } from "../types";

/**
 * Recursively canonicalizes an object by sorting keys and normalizing numbers.
 * Rounding floating point numbers to 4 decimal places eliminates false-positive
 * dirty state triggers caused by JavaScript floating point imprecision (e.g. Finance total calculations).
 */
export function canonicalizeAndNormalize(val: any): any {
  if (val === null || val === undefined) {
    return null;
  }

  if (typeof val === "number") {
    // Normalize floating point numbers to max 4 decimal places
    return Number(Math.round(Number(val + "e4")) + "e-4");
  }

  if (typeof val === "boolean" || typeof val === "string") {
    return val;
  }

  if (val instanceof Date) {
    return val.toISOString();
  }

  if (Array.isArray(val)) {
    return val.map(canonicalizeAndNormalize);
  }

  if (typeof val === "object") {
    const sortedKeys = Object.keys(val).sort();
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      // Ignore undefined values and functions to keep stringify deterministic
      if (val[key] !== undefined && typeof val[key] !== "function") {
        result[key] = canonicalizeAndNormalize(val[key]);
      }
    }
    return result;
  }

  return String(val);
}

/**
 * Computes a fast 32-bit FNV-1a hash of a canonicalized JSON string.
 */
export function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Convert to unsigned 32-bit hex representation
  return (hash >>> 0).toString(16);
}

/**
 * Extracts ONLY the data slices relevant to PDF generation.
 * Ephemeral UI states like active tab, drawer open state, loading flags,
 * and editing mode are explicitly excluded to prevent unnecessary PDF regenerations.
 */
export function extractPdfRelevantData(state: Partial<LabState>): PdfRelevantData {
  return {
    itinerary: state.itinerary || null,
    hotels: state.hotels || [],
    flights: state.flights || [],
    cabs: state.cabs || [],
    buses: state.buses || [],
    inclusions: state.inclusions || "",
    exclusions: state.exclusions || "",
    termsAndConditions: state.termsAndConditions || "",
    cancellationPolicy: state.cancellationPolicy || "",
    paymentMethods: state.paymentMethods || "",
    pricing: state.pricing,
    tripMetadata: state.tripMetadata || null,
    showTimestamps: state.showTimestamps ?? true,
    selectedTheme: state.selectedTheme || "classic",
    pdfOverrides: state.pdfOverrides || {},
  };
}

/**
 * Computes the structural hash for the PDF-relevant itinerary data.
 * Pure function — unit testable without React dependencies.
 */
export function computePdfDataHash(state: Partial<LabState>): string {
  const relevantData = extractPdfRelevantData(state);
  const canonicalized = canonicalizeAndNormalize(relevantData);
  const jsonString = JSON.stringify(canonicalized);
  return fnv1aHash(jsonString);
}

/**
 * Evaluates whether current itinerary state differs from last committed PDF hash.
 * Pure function — unit testable.
 */
export function isStateDirty(currentHash: string, lastCommittedHash: string | null): boolean {
  if (lastCommittedHash === null) return false;
  return currentHash !== lastCommittedHash;
}
