import {
  isEntryCompleteForExport,
  validateLogisticsEntry,
  filterCompleteEntriesForExport,
} from "./logistics-validation";

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}: Expected ${expected}, got ${actual}`);
    process.exit(1);
  }
}

function runTests() {
  console.log("=== Running logistics-validation Unit Tests ===");

  // Test 1: Incomplete Hotel (missing address)
  const incompleteHotel = {
    id: "h1",
    name: "Grand Palace",
    address: "", // missing
    checkIn: "14:00",
    checkOut: "11:00",
    imageUrls: [], // optional
  };
  assertEqual(isEntryCompleteForExport(incompleteHotel, "hotel"), false, "Incomplete hotel returns false");
  assertEqual(validateLogisticsEntry(incompleteHotel, "hotel").errors.address, "Address / Location is required", "Address error message produced");

  // Test 2: Complete Hotel (even without photos)
  const completeHotel = {
    id: "h1",
    name: "Grand Palace",
    address: "123 Ocean Drive, Goa",
    checkIn: "14:00",
    checkOut: "11:00",
    imageUrls: [], // photo is optional!
  };
  assertEqual(isEntryCompleteForExport(completeHotel, "hotel"), true, "Complete hotel returns true");

  // Test 3: Flight completeness
  const completeFlight = {
    id: "f1",
    airline: "IndiGo",
    flightNumber: "6E-204",
    departure: "08:00 AM",
    arrival: "10:30 AM",
    departureAirport: "DEL",
    arrivalAirport: "BOM",
    flightType: "direct",
  };
  assertEqual(isEntryCompleteForExport(completeFlight, "flight"), true, "Complete flight returns true");

  const incompleteFlight = {
    ...completeFlight,
    flightNumber: "   ", // whitespace only
  };
  assertEqual(isEntryCompleteForExport(incompleteFlight, "flight"), false, "Whitespace flight number fails validation");

  // Test 4: Connecting flight dynamic fields
  const connectingFlight = {
    ...completeFlight,
    flightType: "connecting",
    connectingAirline: "Air India",
    // missing connectingFlightNumber
  };
  assertEqual(isEntryCompleteForExport(connectingFlight, "flight"), false, "Connecting flight missing connecting flight number fails");

  // Test 5: Cab completeness
  const completeCab = {
    id: "c1",
    vehicleType: "Innova Crysta",
    route: "Airport to Hotel",
    pickupTime: "11:00 AM",
    driverName: "Ramesh Singh",
    driverContact: "+91 9876543210",
  };
  assertEqual(isEntryCompleteForExport(completeCab, "cab"), true, "Complete cab returns true");

  // Test 6: Bus completeness
  const completeBus = {
    id: "b1",
    busType: "Volvo AC Sleeper",
    route: "Delhi to Manali",
    reportingTime: "08:30 PM",
    departureTime: "09:00 PM",
    pnr: "PNR-998877",
  };
  assertEqual(isEntryCompleteForExport(completeBus, "bus"), true, "Complete bus returns true");

  // Test 7: Array filtering for PDF export
  const mixedHotels = [completeHotel, incompleteHotel];
  const filteredHotels = filterCompleteEntriesForExport(mixedHotels, "hotel");
  assertEqual(filteredHotels.length, 1, "Filtering keeps only complete hotels for PDF export");
  assertEqual(filteredHotels[0].name, "Grand Palace", "Filtered list contains the valid hotel");

  console.log("=== All logistics-validation Unit Tests Passed Successfully ===");
}

runTests();
