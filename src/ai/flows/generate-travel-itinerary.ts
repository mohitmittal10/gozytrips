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

const TravelItineraryInputSchema = z.object({
  destinations: z.string().describe('A comma-separated list of primary travel destinations.'),
  numberOfDays: z.coerce.number().int().min(1).describe('The total duration of the trip in days.'),
  startTime: z.string().describe('The typical start time for daily activities (e.g., "9:00 AM").'),
  endTime: z.string().describe('The typical end time for daily activities (e.g., "10:00 PM").'),
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
      timeline: z.array(
        z.object({
          time: z.string(),
          details: z.string(),
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
  Generate an optimized travel itinerary for {{destinations}} that minimizes travel time and maximizes experiences. Keep descriptions for each activity brief and engaging (2-3 lines max).

  CONSTRAINTS:
  - Trip duration: {{numberOfDays}} days
  - Daily active hours: {{startTime}} to {{endTime}}
  {{#if budget}}- Maximum daily budget: ₹{{budget}}{{/if}}
  {{#if walkingDistance}}- Maximum walking distance per day: {{walkingDistance}} km{{/if}}
  {{#if mustInclude}}- Must include: {{mustInclude}}{{/if}}
  {{#if avoid}}- Avoid: {{avoid}}{{/if}}

  OPTIMIZATION GOALS:
  1. Group nearby attractions on the same day.
  2. Visit popular sites at off-peak hours.
  3. Sequence activities by opening/closing times.
  4. Account for day-of-week closures.
  5. Position restaurants near midday/evening locations.
  6. Schedule rest after high-intensity activities.
  7. Reserve energy-intensive activities for the morning.

  For each timeline step, include: time, details (description), and optionally activityName, rating (1-3), duration, cost, energyLevel, instagramWorthy, kidFriendly, and proTip.
  Your response must be a valid JSON object that adheres to the output schema.
  `,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: TravelItineraryInputSchema,
    outputSchema: TravelItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);