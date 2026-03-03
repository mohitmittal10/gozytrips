
import defineNextJsHandler from '@genkit-ai/next';
import {ai} from '@/ai/genkit';

// Import flows to register them with the Genkit system.
import '@/ai/flows/generate-travel-itinerary';

// Extend Vercel serverless function timeout (default is 10s, too short for AI calls)
export const maxDuration = 60;

// Expose the registered flows as Next.js API routes.
export const POST = defineNextJsHandler({} as any, undefined);
