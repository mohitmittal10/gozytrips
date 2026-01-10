
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
      day: z.number().int().min(1),
      date: z.string().describe('The date for this day of the itinerary.'),
      areaFocus: z.string().describe('The geographical area or neighborhood focus for the day.'),
      morningRoute: z.string().describe('A summary of the morning route.'),
      afternoonRoute: z.string().describe('A summary of the afternoon route.'),
      eveningRoute: z.string().describe('A summary of the evening route.'),
      timeline: z.array(
        z.object({
          time: z.string().describe('The specific time for the activity (e.g., "08:00 AM").'),
          details: z.string().describe('A short description of the step (e.g., "Depart Hotel", "Walk 10 min to [Location]").'),
          activity: z.object({
            name: z.string().describe('The name of the activity.'),
            rating: z.number().int().min(1).max(3).describe('Priority rating from 1 to 3 stars.'),
            duration: z.string().describe('Recommended duration for the activity (e.g., "90 min").'),
            cost: z.string().describe('Estimated cost of the activity (e.g., "₹2000").'),
            bookingInfo: z.string().describe('Information on booking tickets (e.g., "Book online 2 weeks in advance").'),
            energyLevel: z.enum(['Low', 'Medium', 'High']).describe('The physical energy level required.'),
            instagramWorthy: z.boolean().describe('Is it a great photo opportunity?'),
            kidFriendly: z.boolean().describe('Is it suitable for children?'),
            weatherDependent: z.boolean().describe('Is the activity dependent on good weather?'),
            whyNow: z.string().describe('Justification for visiting at this specific time (e.g., "Opens at 8 AM, crowds arrive by 10 AM").'),
            proTip: z.string().describe('An insider tip for the activity.'),
          }).optional(),
        })
      ),
      dailyStats: z.object({
        attractionsVisited: z.number().int().describe('Total number of attractions visited.'),
        totalCost: z.string().describe('Estimated total cost for the day.'),
        walkingDistance: z.string().describe('Total walking distance in km.'),
        transitRides: z.number().int().describe('Number of transit rides taken.'),
        activeTime: z.string().describe('Total active hours.'),
        restTime: z.string().describe('Total rest hours.'),
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
  model: googleAI.model('gemini-1.5-flash-latest'),
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

  Your response must be a valid JSON object that adheres to the output schema. For each day, provide a summary route, a detailed timeline, and daily stats. Each activity in the timeline must be fully detailed as per the schema.
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
