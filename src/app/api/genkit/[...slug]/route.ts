
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {defineNextJsHandler} from '@genkit-ai/next';
import '@/ai/flows/generate-travel-itinerary';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});

export const POST = defineNextJsHandler();
