
import defineNextJsHandler from '@genkit-ai/next';
import {ai} from '@/ai/genkit';

// Import flows to register them with the Genkit system.
import '@/ai/flows/generate-travel-itinerary';

// Expose the registered flows as Next.js API routes.
export const POST = defineNextJsHandler({} as any, undefined);
