
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {defineNextJsHandler} from '@genkit-ai/next';
import '@/ai/flows/generate-travel-itinerary';

genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});

export const POST = defineNextJsHandler();
