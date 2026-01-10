
import {defineNextJsHandler} from '@genkit-ai/next';
import '@/ai/flows/generate-travel-itinerary';
import { ai } from '@/ai/genkit';

// This export is necessary for Genkit to find the flows.
export {ai};

export const POST = defineNextJsHandler();
