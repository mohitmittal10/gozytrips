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
  mustInclude: z.string().default('').describe('A comma-separated list of must-see attractions or experiences.'),
  avoid: z.string().default('').describe('A comma-separated list of things to skip or avoid.'),
  leisureTime: z.boolean().default(false).describe('Whether to deliberately include unstructured leisure/free time.'),
  leisureDay: z.number().optional().describe('The specific day (1-indexed) to schedule the most leisure time. Only applies if leisureTime is true.'),
  travelTimePreference: z.enum([
    "no_preference",
    "avoid_night_travel",
    "prefer_morning_travel",
    "prefer_afternoon_travel",
    "prefer_night_travel"
  ]).default("no_preference").describe('User preferences for travel timing.'),
  feedback: z.string().optional().default('').describe('Actionable feedback from a previous optimization pass to refine the itinerary.'),
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
          imageSearchTerm: z.string().optional().describe('A specific Unsplash search term for this activity, e.g. "Eiffel Tower", "Statue of Liberty", "Sushi restaurant". Only include if highly relevant and visual.'),
        })
      ),
      dailyStats: z.object({
        totalCost: z.string(),
        walkingDistance: z.string().optional(),
      }),
    })
  ),
  optimizations: z.array(
    z.object({
      type: z.string().describe('The category of optimization (e.g., "Timing", "Cost", "Experience", "Leisure").'),
      message: z.string().describe('A concise, actionable optimization tip (max 60 chars).'),
      impact: z.string().describe('A short description of the benefit (e.g., "+15% Leisure", "Save 2,000", "Avoid Crowds").'),
    })
  ).describe('A list of 3-4 smart AI optimization insights for the trip.'),
});

export type TravelItineraryOutput = z.infer<typeof TravelItineraryOutputSchema>;

export async function generateTravelItinerary(input: TravelItineraryInput): Promise<TravelItineraryOutput> {
  console.log('--- SERVER ACTION: generateTravelItinerary ---');
  console.log('Input keys:', Object.keys(input));
  console.log('Input values:', JSON.stringify(input, null, 2));
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'travelItineraryPromptV2',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: TravelItineraryInputSchema },
  output: { schema: TravelItineraryOutputSchema },
  prompt: `
  Generate an optimized travel itinerary from {{startingLocation}} to {{destinations}} that minimizes travel time and maximizes experiences. Keep descriptions for each activity brief and engaging (2-3 lines max).

  TRIP DETAILS:
  - Departure: {{startingLocation}} on {{startDate}}
  {{#if endingLocation}}- Return: {{endingLocation}} on {{endDate}}{{else}}- Return: {{startingLocation}} on {{endDate}}{{/if}}
  {{#if budget}}- Maximum daily budget: {{budget}}{{/if}}
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
  3. Estimate costs based on ACTUAL average prices for: Entry tickets, Local Transport (cab/auto/metro), and average meal costs at good rated local restaurants.
  4. If user provides a budget, ensure the daily total aligns beautifully with the daily {{budget}} limit.

  CRITICAL IMAGE SEARCH RULES:
  1. For each DAY, provided a 'imageSearchTerm' (format: "[Landmark/Place Name] [City/Region]"). 
  2. For EACH TIMELINE STEP (activity), provide an 'imageSearchTerm' that is highly visual and specific to that activity (e.g., "Eiffel Tower", "Sushi restaurant Tokyo", "London Eye"). If a step is vague/generic, just use the place name.
  
  CRITICAL OPTIMIZATION RULES:
  1. Provide 3-4 "Optimization Insights" that add value to the trip.
  2. Examples: 
     - "Timing: Shift Morning Temple visit to 07:00 AM (Avoid Crowds)"
     - "Cost: Group Day 2 activities to save 1,200 on transport"
     - "Leisure: Add a 2-hour gap on Day 3 for spontaneous exploration"
  
  GOOD examples for search terms: "Red Fort Delhi", "Hawa Mahal Jaipur", "Marina Beach Chennai", "Munnar tea plantation", "Varanasi ghats", "Goa beach Palolem", "Hampi ruins Karnataka".
  BAD examples for search terms: "beautiful morning walk", "explore local culture", "day 1 adventure", "food market", "sunset view".
  REFINEMENT PASS (If applicable):
  If 'feedback' is provided: {{feedback}}
  You MUST prioritize applying these specific suggestions to the current itinerary. This is a refinement pass to make the trip even better. Ensure the final result reflects these improvements while maintaining the overall trip structure.
  `,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlowV2',
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