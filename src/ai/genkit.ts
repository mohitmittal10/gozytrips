
'use server';

/**
 * @fileOverview Initializes and exports the global Genkit 'ai' object.
 * This file centralizes the Genkit configuration for the application.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize the 'ai' object with plugins.
// This object is imported by other parts of the application to define and use AI flows.
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});
