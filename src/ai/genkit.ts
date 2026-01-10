
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This file is being kept for local development workflows that might still use it,
// but for Vercel deployment, the primary configuration is now in
// src/app/api/genkit/[...slug]/route.ts

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  model: 'googleai/gemini-2.5-flash',
});
