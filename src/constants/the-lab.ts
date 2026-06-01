// Runtime constants for The Lab module

export const theLabSteps = [
  { id: 1, label: "Destinations", fields: ["startingLocation", "destinations", "endingLocation"] as const },
  { id: 2, label: "Dates", fields: ["startDate", "endDate"] as const },
  { id: 3, label: "Preferences", fields: ["tripType", "mustInclude", "avoid", "leisureTime", "leisureDay", "travelTimePreference"] as const },
];

export const MAX_AI_OPTIMIZATIONS = 3;

export const loadingTexts = [
  "Analyzing your preferences...",
  "Finding the best flights...",
  "Selecting premium hotels...",
  "Curating local experiences...",
  "Optimizing travel routes...",
  "Crafting your perfect itinerary...",
];

