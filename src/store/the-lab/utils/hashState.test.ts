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

  // Test 6: Client mutation triggers dirty state and undo restores pristine state
  const clientMutatedState = {
    ...state,
    selectedClientId: "client-123",
  };
  const hashClient = computePdfDataHash(clientMutatedState);
  assertEqual(isStateDirty(hashClient, hash1), true, "Mutated selectedClientId marks state as dirty");
  const clientRestoredState = {
    ...clientMutatedState,
    selectedClientId: "none",
  };
  const hashClientRestored = computePdfDataHash(clientRestoredState);
  assertEqual(isStateDirty(hashClientRestored, hash1), false, "Undoing selectedClientId resets dirty state");

  // Test 7: Status mutation triggers dirty state
  const statusMutatedState = {
    ...state,
    selectedStatus: "confirmed",
  };
  const hashStatus = computePdfDataHash(statusMutatedState);
  assertEqual(isStateDirty(hashStatus, hash1), true, "Mutated selectedStatus marks state as dirty");

  // Test 9: Cabs and buses mutation triggers dirty state
  const cabsMutatedState = {
    ...state,
    cabs: [{ id: "c1", name: "Airport Pickup" } as any],
  };
  const hashCabs = computePdfDataHash(cabsMutatedState);
  assertEqual(isStateDirty(hashCabs, hash1), true, "Mutated cabs marks state as dirty");

  console.log("=== All hashState Unit Tests Passed Successfully ===");
}

runTests();
