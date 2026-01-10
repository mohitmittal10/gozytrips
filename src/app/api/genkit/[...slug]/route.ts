
import {defineNextJsHandler} from '@genkit-ai/next';
import '@/ai/flows/generate-travel-itinerary';
import {ai} from '@/ai/genkit';

export {ai};

export const {POST} = defineNextJsHandler();
