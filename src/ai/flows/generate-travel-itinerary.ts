'use server';

/**
 * @fileOverview Generates a personalized and optimized travel itinerary.
 *
 * - generateTravelItinerary - A function that generates a travel itinerary.
 * - TravelItineraryInput - The input type for the generateTravelItinerary function.
 * - TravelItineraryOutput - The return type for the generateTravelItinerary function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'zod';
import {logTokenUsage} from '@/lib/token-tracker';

// Extend Vercel serverless function timeout (default is 10s, which is too short for AI calls)
export const maxDuration = 60;

const TravelItineraryInputSchema = z.object({
  startingLocation: z.string().describe('The starting location/city for the trip.'),
  endingLocation: z.string().optional().describe('The ending location/city for the trip (if different from starting location).'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD format).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD format).'),
  startTime: z.string().describe('The departure/start time for the trip (e.g., "9:00 AM").'),
  endTime: z.string().describe('The typical end time for daily activities (e.g., "10:00 PM").'),
  destinations: z.string().describe('A comma-separated list of primary travel destinations to visit.'),
  budget: z.coerce.number().int().positive().optional().describe('The maximum budget per day in INR.'),
  walkingDistance: z.coerce.number().int().positive().optional().describe('The maximum preferred walking distance per day in kilometers.'),
  mustInclude: z.string().optional().describe('A comma-separated list of must-see attractions or experiences.'),
  avoid: z.string().optional().describe('A comma-separated list of things to skip or avoid.'),
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
  input: {schema: TravelItineraryInputSchema},
  output: {schema: TravelItineraryOutputSchema},
  prompt: `
  Generate an optimized travel itinerary from {{startingLocation}} to {{destinations}} that minimizes travel time and maximizes experiences. Keep descriptions for each activity brief and engaging (2-3 lines max).

  TRIP DETAILS:
  - Departure: {{startingLocation}} on {{startDate}} at {{startTime}}
  {{#if endingLocation}}- Return: {{endingLocation}} on {{endDate}}{{else}}- Return: {{startingLocation}} on {{endDate}}{{/if}}
  - Daily active hours: {{startTime}} to {{endTime}}
  {{#if budget}}- Maximum daily budget: ₹{{budget}}{{/if}}
  {{#if walkingDistance}}- Maximum walking distance per day: {{walkingDistance}} km{{/if}}
  {{#if mustInclude}}- Must include: {{mustInclude}}{{/if}}
  {{#if avoid}}- Avoid: {{avoid}}{{/if}}

  OPTIMIZATION GOALS:
  1. Group nearby attractions on the same day.
  2. Visit popular sites at off-peak hours.
  3. Sequence activities by opening/closing times.
  4. Account for day-of-week closures and local holidays.
  5. Position restaurants near midday/evening locations.
  6. Schedule rest after high-intensity activities.
  7. Reserve energy-intensive activities for the morning.
  8. Include travel time between destinations in the itinerary.

  For each timeline step, include: time, details (description).

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
    const {output, usage} = await prompt(input);
    
    // Log token usage if available
    if (usage) {
      await logTokenUsage(
        'generateTravelItineraryFlow',
        'gemini-2.5-flash-lite',
        usage.inputTokens || 0,
        usage.outputTokens || 0
      );
    }
    
    return output!;
  }
);