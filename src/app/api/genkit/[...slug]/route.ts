
import {defineNextJsHandler} from '@genkit-ai/next';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize Genkit and export the 'ai' object.
// This is the required pattern for the Next.js handler.
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});

// Import flows AFTER 'ai' is exported. This ensures flows are registered.
import '@/ai/flows/generate-travel-itinerary';

export const {POST} = defineNextJsHandler();
