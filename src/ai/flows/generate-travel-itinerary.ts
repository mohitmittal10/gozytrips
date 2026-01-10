'use server';

/**
 * @fileOverview Generates a personalized travel itinerary based on destination, number of days, and vibe.
 *
 * - generateTravelItinerary - A function that generates a travel itinerary.
 * - TravelItineraryInput - The input type for the generateTravelItinerary function.
 * - TravelItineraryOutput - The return type for the generateTravelItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TravelItineraryInputSchema = z.object({
  destination: z.string().describe('The desired travel destination.'),
  numberOfDays: z.number().int().positive().describe('The number of days for the trip.'),
  vibe: z.string().describe('The desired vibe of the trip (e.g., chill, adventure, foodie).'),
});
export type TravelItineraryInput = z.infer<typeof TravelItineraryInputSchema>;

const TravelItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      day: z.number().int().min(1).describe('The day number in the itinerary.'),
      activities: z.array(z.string()).describe('A list of activities for the day.'),
    })
  ).describe('A detailed travel itinerary for each day.'),
});
export type TravelItineraryOutput = z.infer<typeof TravelItineraryOutputSchema>;

export async function generateTravelItinerary(input: TravelItineraryInput): Promise<TravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'travelItineraryPrompt',
  input: {schema: TravelItineraryInputSchema},
  output: {schema: TravelItineraryOutputSchema},
  prompt: `You are a travel expert who specializes in creating personalized travel itineraries.

  Generate a {{numberOfDays}}-day travel itinerary for {{destination}} with a {{vibe}} vibe.

  The itinerary should include a list of activities for each day.

  Format the output as a JSON array of objects, where each object represents a day in the itinerary.
  Each day object should have a "day" field (an integer representing the day number) and an "activities" field (an array of strings describing the activities for that day).

  For example:
  [
    {
      "day": 1,
      "activities": ["Visit the Eiffel Tower", "Take a Seine River cruise", "Enjoy a French dinner"]
    },
    {
      "day": 2,
      "activities": ["Explore the Louvre Museum", "Walk through the Tuileries Garden", "Shop on the Champs-Élysées"]
    }
  ]
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
