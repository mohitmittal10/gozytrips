import {
  canonicalizeAndNormalize,
  fnv1aHash,
  extractPdfRelevantData,
  computePdfDataHash,
  isStateDirty,
} from "./hashState";

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: Expected ${expected}, got ${actual}`);
    process.exit(1);
  }
}

function runTests() {
  console.log("=== Running hashState Unit Tests ===");

  // Test 1: Key canonicalization (order of keys shouldn't change hash)
  const objA = { b: 2, a: 1, c: { z: 10, y: 5 } };
  const objB = { a: 1, c: { y: 5, z: 10 }, b: 2 };
  assertEqual(
    JSON.stringify(canonicalizeAndNormalize(objA)),
    JSON.stringify(canonicalizeAndNormalize(objB)),
    "Key canonicalization order independence"
  );

  // Test 2: Floating point rounding normalization (prevents floating point drift false-positives)
  const floatNum1 = 100.00000000000003;
  const floatNum2 = 100.0;
  assertEqual(
    canonicalizeAndNormalize(floatNum1),
    canonicalizeAndNormalize(floatNum2),
    "Floating point drift normalization to 4 decimals"
  );

  // Test 3: Dirty state tracking (matching hash = not dirty)
  const state = {
    itinerary: { title: "Trip" } as any,
    hotels: [
      {
        id: "h1",
        dayIndex: 1,
        name: "Grand Hotel",
        address: "123 Main St",
        checkIn: "14:00",
        checkOut: "11:00",
        bookingRef: "REF123",
        costAdult: 250,
      } as any,
    ],
    flights: [],
    cabs: [],
    buses: [],
    inclusions: "Breakfast",
    exclusions: "Flights",
    termsAndConditions: "",
    cancellationPolicy: "",
    paymentMethods: "",
    pricing: undefined,
    tripMetadata: null,
    showTimestamps: true,
    selectedTheme: "classic" as const,
    pdfOverrides: {},
  };

  const hash1 = computePdfDataHash(state);
  assertEqual(isStateDirty(hash1, hash1), false, "Pristine state is not dirty");

  // Test 4: Data mutation triggers dirty state
  const mutatedState = {
    ...state,
    inclusions: "Breakfast & Dinner",
  };
  const hash2 = computePdfDataHash(mutatedState);
  assertEqual(isStateDirty(hash2, hash1), true, "Mutated data marks state as dirty");

  // Test 5: Undo mutation returns to non-dirty state
  const restoredState = {
    ...mutatedState,
    inclusions: "Breakfast",
  };
  const hash3 = computePdfDataHash(restoredState);
  assertEqual(hash3, hash1, "Restored state matches original hash");
  assertEqual(isStateDirty(hash3, hash1), false, "Undoing changes resets dirty state to false");

  console.log("=== All hashState Unit Tests Passed Successfully ===");
}

runTests();
