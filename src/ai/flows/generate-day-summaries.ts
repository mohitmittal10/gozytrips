'use server';

/**
 * @fileOverview Generates brief one-sentence AI summaries for each day of an
 * itinerary, called lazily when the PDF preview dialog opens so the summaries
 * always reflect the latest (possibly manually-edited) itinerary state.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const DayInputSchema = z.object({
  day: z.number(),
  date: z.string(),
  areaFocus: z.string(),
  timeline: z.array(
    z.object({
      time: z.string(),
      details: z.string(),
    })
  ),
});

const GenerateDaySummariesInputSchema = z.object({
  days: z.array(DayInputSchema),
  destination: z.string().optional(),
});

export type GenerateDaySummariesInput = z.infer<typeof GenerateDaySummariesInputSchema>;

const GenerateDaySummariesOutputSchema = z.object({
  summaries: z.array(z.string()),
  aboutPlace: z.object({
    title: z.string(),
    description: z.string(),
    highlights: z.array(z.string()),
  }).optional(),
});

export type GenerateDaySummariesOutput = z.infer<typeof GenerateDaySummariesOutputSchema>;

const daySummariesPrompt = ai.definePrompt({
  name: 'daySummariesPromptV1',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: GenerateDaySummariesInputSchema },
  output: { schema: GenerateDaySummariesOutputSchema },
  prompt: `
You are a travel copywriter writing a brief index for a trip itinerary PDF.

1. For EACH day listed below, write exactly ONE punchy sentence (maximum 20 words) that
captures the spirit and highlights of that day. The sentence should feel exciting and
descriptive — not generic.

2. If destination information is provided, write an "aboutPlace" section describing the main destination. Include a catchy title, a 2-3 sentence evocative description, and 3-5 short bullet-point highlights (key experiences or landmarks).

Return your answer as a JSON object with a "summaries" array of strings, and an optional "aboutPlace" object with "title", "description", and "highlights" array of strings. No explanations, no markdown.

Context:
Destination: {{destination}}

Days:
{{#each days}}
Day {{day}} — {{areaFocus}} ({{date}}):
  Activities: {{#each timeline}}{{details}}{{#unless @last}}; {{/unless}}{{/each}}
{{/each}}
`,
});

const generateDaySummariesFlow = ai.defineFlow(
  {
    name: 'generateDaySummariesFlowV1',
    inputSchema: GenerateDaySummariesInputSchema,
    outputSchema: GenerateDaySummariesOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await daySummariesPrompt(input);
      if (!output || !Array.isArray(output.summaries)) {
        // Return empty strings as fallback — the UI has its own fallback chain
        return { summaries: input.days.map(() => '') };
      }
      // Ensure the count matches — pad or trim if the model returned wrong count
      const summaries = input.days.map((_, i) => output.summaries[i] ?? '');
      return { summaries, aboutPlace: output.aboutPlace };
    } catch (err) {
      console.error('[generateDaySummaries] failed:', err);
      // Graceful degradation — return empty strings
      return { summaries: input.days.map(() => '') };
    }
  }
);

/**
 * Public server action. No auth guard — this is a lightweight formatting call
 * triggered from the client PDF preview dialog.
 */
export async function generateDaySummaries(
  input: GenerateDaySummariesInput
): Promise<GenerateDaySummariesOutput> {
  if (!input.days || input.days.length === 0) {
    return { summaries: [] };
  }
  return generateDaySummariesFlow(input);
}
