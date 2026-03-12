'use server';

/**
 * @fileOverview Generates a personalized and optimized travel itinerary.
 *
 * - generateTravelItinerary - A function that generates a travel itinerary.
 * - TravelItineraryInput - The input type for the generateTravelItinerary function.
 * - TravelItineraryOutput - The return type for the generateTravelItinerary function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { logTokenUsage } from '@/lib/token-tracker';

const TravelItineraryInputSchema = z.object({
  startingLocation: z.string().describe('The starting location/city for the trip.'),
  endingLocation: z.string().optional().describe('The ending location/city for the trip (if different from starting location).'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD format).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD format).'),
  destinations: z.string().describe('A comma-separated list of primary travel destinations to visit.'),
  budget: z.coerce.number().int().positive().optional().describe('The maximum budget per day in INR.'),
  walkingDistance: z.coerce.number().int().positive().optional().describe('The maximum preferred walking distance per day in kilometers.'),
  mustInclude: z.string().optional().describe('A comma-separated list of must-see attractions or experiences.'),
  avoid: z.string().optional().describe('A comma-separated list of things to skip or avoid.'),
  leisureTime: z.boolean().optional().describe('Whether to deliberately include unstructured leisure/free time.'),
  leisureDay: z.number().optional().describe('The specific day (1-indexed) to schedule the most leisure time. Only applies if leisureTime is true.'),
  travelTimePreference: z.enum([
    "no_preference",
    "avoid_night_travel",
    "prefer_morning_travel",
    "prefer_afternoon_travel",
    "prefer_night_travel"
  ]).default("no_preference").describe('User preferences for travel timing.'),
});
export type TravelItineraryInput = z.infer<typeof TravelItineraryInputSchema>;

const TravelItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      day: z.number(),
      date: z.string(),
      areaFocus: z.string(),
      imageSearchTerm: z.string().describe('A descriptive Unsplash search term for this day\'s main destination or highlight, e.g. "Taj Mahal sunrise", "Kerala houseboat backwaters", "Old Delhi street food market". Be specific and visual.'),
      timeline: z.array(
        z.object({
          time: z.string(),
          details: z.string(),
          cost: z.number().optional(),
        })
      ),
      dailyStats: z.object({
        totalCost: z.string(),
        walkingDistance: z.string(),
      }),
    })
  ),
});

export type TravelItineraryOutput = z.infer<typeof TravelItineraryOutputSchema>;

export async function generateTravelItinerary(input: TravelItineraryInput): Promise<TravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'travelItineraryPrompt',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: TravelItineraryInputSchema },
  output: { schema: TravelItineraryOutputSchema },
  prompt: `
  Generate an optimized travel itinerary from {{startingLocation}} to {{destinations}} that minimizes travel time and maximizes experiences. Keep descriptions for each activity brief and engaging (2-3 lines max).

  TRIP DETAILS:
  - Departure: {{startingLocation}} on {{startDate}}
  {{#if endingLocation}}- Return: {{endingLocation}} on {{endDate}}{{else}}- Return: {{startingLocation}} on {{endDate}}{{/if}}
  {{#if budget}}- Maximum daily budget: ₹{{budget}}{{/if}}
  {{#if walkingDistance}}- Maximum walking distance per day: {{walkingDistance}} km{{/if}}
  {{#if mustInclude}}- Must include: {{mustInclude}}{{/if}}
  {{#if avoid}}- Avoid: {{avoid}}{{/if}}
  {{#if leisureTime}}- Please block out a few hours of unstructured free/leisure time{{#if leisureDay}} specifically on Day {{leisureDay}}{{else}} throughout the trip{{/if}}.{{/if}}
  {{#if travelTimePreference}}
  CRITICAL TRAVEL TIMING RULE:
  The user has selected the following travel timing preference: "{{travelTimePreference}}".
  Based on this selection, you MUST strictly obey the matching rule below:
  
  - If "avoid_night_travel": STRATEGY: Maximize daytime safety and visibility. You MUST strictly obey this rule: DO NOT schedule any form of travel (flights, trains, driving between cities) after 6:00 PM. 
  - If "prefer_morning_travel": STRATEGY: Get travel out of the way early to enjoy the afternoon and evening at the destination. You MUST strictly obey this rule: PREFER to schedule major travel (flights, trains, driving between cities) between 6:00 AM and 12:00 PM (Noon). Avoid afternoon/evening travel if possible.
  - If "prefer_afternoon_travel": STRATEGY: Allow for a relaxed morning before traveling to the next destination. You MUST strictly obey this rule: PREFER to schedule major travel (flights, trains, driving between cities) between 12:00 PM (Noon) and 6:00 PM. Avoid early morning travel if possible.
  - If "prefer_night_travel": STRATEGY: Save precious daytime hours for sightseeing and activities. You MUST strictly obey this rule: PREFER to schedule major travel (flights, trains, long drives) OVERNIGHT (e.g. 10:00 PM to 6:00 AM). Do not waste daytime hours on long transit if it can be avoided.
  {{/if}}

  OPTIMIZATION GOALS:
  1. Group nearby attractions on the same day.
  2. Visit popular sites at off-peak hours.
  3. Sequence activities by opening/closing times.
  4. Account for day-of-week closures and local holidays.
  5. Position restaurants near midday/evening locations.
  6. Schedule rest after high-intensity activities.
  7. Reserve energy-intensive activities for the morning.
  8. Include travel time between destinations in the itinerary.

  For each timeline step, include: time, details (description), and cost.
  
  CRITICAL COST ESTIMATION RULES:
  1. ALL costs must be strictly predicted in Indian Rupees (INR) and represented as an integer (e.g. 500).
  2. You MUST provide highly accurate and realistic real-world price estimates. 
  3. Do NOT provide vague, arbitrarily high, or "0" costs unless an activity is genuinely free (like a public park). 
  4. Estimate costs based on ACTUAL average prices for: Entry tickets, Local Transport (cab/auto/metro), and average meal costs at good rated local restaurants.
  5. If user provides a budget, ensure the daily total aligns beautifully with the daily {{budget}} limit.

  IMPORTANT — For each day, include an 'imageSearchTerm'. This MUST be a real place name or landmark name that would return beautiful travel photos on a stock photo site. Use the format: "[Landmark/Place Name] [City/Region]". 
  GOOD examples: "Red Fort Delhi", "Hawa Mahal Jaipur", "Marina Beach Chennai", "Munnar tea plantation", "Varanasi ghats", "Goa beach Palolem", "Hampi ruins Karnataka".
  BAD examples (too vague/descriptive — DO NOT USE): "beautiful morning walk", "explore local culture", "day 1 adventure", "food market", "sunset view".
  Always use the ACTUAL name of the most iconic place visited that day.
  `,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: TravelItineraryInputSchema,
    outputSchema: TravelItineraryOutputSchema,
  },
  async input => {
    try {
      console.log('Starting itinerary generation for:', input.destinations);
      const { output, usage } = await prompt(input);

      // Log token usage if available
      if (usage) {
        await logTokenUsage(
          'generateTravelItineraryFlow',
          'gemini-2.5-flash-lite',
          usage.inputTokens || 0,
          usage.outputTokens || 0
        );
      }

      console.log('Itinerary generation successful');
      return output!;
    } catch (error) {
      // 🔴 CRITICAL LOGGING FOR VERCEL DEPLOYMENT 🔴
      console.error('------- AI GENERATION FAILED -------');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      console.error('Input payload:', JSON.stringify(input, null, 2));
      console.error('------------------------------------');
      throw error; // Re-throw so the frontend still catches it
    }
  }
);