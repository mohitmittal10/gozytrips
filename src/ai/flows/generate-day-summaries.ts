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
});

export type GenerateDaySummariesInput = z.infer<typeof GenerateDaySummariesInputSchema>;

const GenerateDaySummariesOutputSchema = z.object({
  summaries: z.array(z.string()),
});

export type GenerateDaySummariesOutput = z.infer<typeof GenerateDaySummariesOutputSchema>;

const daySummariesPrompt = ai.definePrompt({
  name: 'daySummariesPromptV1',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: GenerateDaySummariesInputSchema },
  output: { schema: GenerateDaySummariesOutputSchema },
  prompt: `
You are a travel copywriter writing a brief index for a trip itinerary PDF.

For EACH day listed below, write exactly ONE punchy sentence (maximum 20 words) that
captures the spirit and highlights of that day. The sentence should feel exciting and
descriptive — not generic.

Return your answer as a JSON object with a "summaries" array of strings, one string per day,
in the same order as the input. No explanations, no markdown.

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
      return { summaries };
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
