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
  destinations: z.string().describe('The desired travel destinations, can be a single place or a comma-separated list.'),
  numberOfDays: z.number().int().min(1).describe('The number of days for the trip.'),
  vibe: z.string().describe('The desired vibe of the trip (e.g., chill, adventure, foodie).'),
});
export type TravelItineraryInput = z.infer<typeof TravelItineraryInputSchema>;

const TravelItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      day: z.number().int().min(1).describe('The day number in the itinerary.'),
      title: z.string().describe("A catchy and descriptive title for the day's theme or main event."),
      activities: z.array(z.object({
        description: z.string().describe('An engaging, persuasive description of the activity that sells the experience. Use different font styles or markdown to make it more appealing.'),
      })).describe('A list of activities for the day.'),
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
  prompt: `You are a world-class travel expert and storyteller who crafts irresistible, personalized travel itineraries. Your goal is to make the user dream about the trip.

  Generate a {{numberOfDays}}-day travel itinerary for a trip to the following destinations: {{destinations}}, with a "{{vibe}}" vibe.

  For each day:
  1.  Create a catchy, thematic title (e.g., "A Day of Parisian Romance," "Secrets of the Roman Forum").
  2.  Write engaging, persuasive descriptions for each activity. Don't just list places; sell the experience. Keep the description concise and exciting, around 2-3 lines. Use evocative language and various font styles (like bold or italics using markdown) to make the text exciting.

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
