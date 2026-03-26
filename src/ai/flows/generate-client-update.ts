'use server';

/**
 * @fileOverview Generates contextual client update suggestions and emails for travel agents.
 * Analyzes trip status, dates, and context to provide smart update recommendations.
 *
 * - generateClientUpdate       - Generates a single client update email.
 * - generateUpdateSuggestions  - Generates multiple context-aware update suggestions.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { logTokenUsage } from '@/lib/token-tracker';

// ── Input Schema (for generating update suggestions) ─────────────────────────

const ClientUpdateContextSchema = z.object({
  clientName: z.string().describe('Name of the client.'),
  agentName: z.string().describe('Name of the travel agent.'),
  agentCompany: z.string().optional().describe('Agent company/agency name.'),
  tripStatus: z.string().describe('Current trip status: draft, proposed, sent, booked, confirmed, completed.'),
  destination: z.string().describe('Trip destination(s).'),
  travelDates: z.string().describe('Travel dates in readable format.'),
  tripDuration: z.string().optional().describe('Trip duration, e.g. "5D/4N".'),
  totalCost: z.string().optional().describe('Total trip cost for the client, e.g. "₹85,000".'),
  daysUntilTrip: z.number().optional().describe('Number of days until the trip starts. Negative means trip has passed.'),
  hotelNames: z.string().optional().describe('Comma-separated list of hotel names booked.'),
  hasFlights: z.boolean().optional().describe('Whether flights are included.'),
  customMessage: z.string().optional().describe('Agent-typed custom message to convert into a professional email.'),
});

export type ClientUpdateContext = z.infer<typeof ClientUpdateContextSchema>;

// ── Suggestions Output ───────────────────────────────────────────────────────

const UpdateSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string().describe('Unique identifier for this suggestion.'),
    title: z.string().describe('Short title for the suggestion card, e.g. "Send Booking Confirmation". Max 50 chars.'),
    preview: z.string().describe('1-line preview of what the email will say. Max 100 chars.'),
    category: z.enum(['booking', 'reminder', 'update', 'payment', 'custom'])
      .describe('Category of the update for icon/color styling.'),
  })).describe('List of 3-4 contextual update suggestions.'),
});

export type UpdateSuggestionsOutput = z.infer<typeof UpdateSuggestionsOutputSchema>;

// ── Single Email Output ──────────────────────────────────────────────────────

const ClientUpdateEmailOutputSchema = z.object({
  subject: z.string().describe('Email subject line. Must be under 100 characters.'),
  body: z.string().describe('Email body text. Must be under 1500 characters. Plain text only.'),
});

export type ClientUpdateEmailOutput = z.infer<typeof ClientUpdateEmailOutputSchema>;

// ── Exported Functions ───────────────────────────────────────────────────────

export async function generateUpdateSuggestions(input: ClientUpdateContext): Promise<UpdateSuggestionsOutput> {
  return generateSuggestionsFlow(input);
}

export async function generateClientUpdateEmail(
  input: ClientUpdateContext & { suggestionTitle: string }
): Promise<ClientUpdateEmailOutput> {
  return generateEmailFlow(input);
}

// ── Suggestions Prompt ───────────────────────────────────────────────────────

const suggestionsPrompt = ai.definePrompt({
  name: 'clientUpdateSuggestionsPrompt',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: ClientUpdateContextSchema },
  output: { schema: UpdateSuggestionsOutputSchema },
  prompt: `
You are an AI assistant for travel agents. Based on the trip context below, generate 3-4 smart, contextual email update suggestions that the agent might want to send to their client right now.

TRIP CONTEXT:
- Client: {{clientName}}
- Status: {{tripStatus}}
- Destination: {{destination}}
- Dates: {{travelDates}}
{{#if tripDuration}}- Duration: {{tripDuration}}{{/if}}
{{#if totalCost}}- Total Cost: {{totalCost}}{{/if}}
{{#if daysUntilTrip}}- Days until trip: {{daysUntilTrip}}{{/if}}
{{#if hotelNames}}- Hotels: {{hotelNames}}{{/if}}
{{#if hasFlights}}- Flights: Included{{/if}}

RULES:
1. Make suggestions contextually relevant to the CURRENT STATUS:
   - "draft" → suggest sharing initial proposal, asking for preferences
   - "proposed" → suggest follow-up, highlighting key attractions
   - "sent" → suggest confirmation reminder, answering questions
   - "booked"/"confirmed" → suggest sending final details, payment reminders, packing tips
   - "completed" → suggest feedback request, future trip ideas
2. If daysUntilTrip is 1-7, include an urgency-based reminder suggestion.
3. If daysUntilTrip is 1-3, include a final checklist / bon voyage message.
4. Each suggestion id should be a short kebab-case string.
5. Keep titles under 50 chars and previews under 100 chars.
6. Always include one "custom" category suggestion titled "Send Custom Update" at the end.

Generate the suggestions now.
`,
});

// ── Single Email Prompt ──────────────────────────────────────────────────────

const emailPrompt = ai.definePrompt({
  name: 'clientUpdateEmailPrompt',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: ClientUpdateContextSchema.extend({ suggestionTitle: z.string() }) },
  output: { schema: ClientUpdateEmailOutputSchema },
  prompt: `
You are a professional travel agent writing a client update email. Generate a warm, professional email based on the context and the specific update type.

CRITICAL RULES:
1. Email subject MUST be under 100 characters.
2. Email body MUST be under 1500 characters (hard limit — do NOT exceed).
3. Plain text only — NO HTML, NO markdown.
4. Be warm, professional, and reassuring.
5. Include relevant trip details naturally.
6. Sign off as the agent.

CONTEXT:
- Client: {{clientName}}
- Agent: {{agentName}}{{#if agentCompany}} ({{agentCompany}}){{/if}}
- Status: {{tripStatus}}
- Destination: {{destination}}
- Dates: {{travelDates}}
{{#if tripDuration}}- Duration: {{tripDuration}}{{/if}}
{{#if totalCost}}- Cost: {{totalCost}}{{/if}}
{{#if daysUntilTrip}}- Days until trip: {{daysUntilTrip}}{{/if}}
{{#if hotelNames}}- Hotels: {{hotelNames}}{{/if}}
{{#if hasFlights}}- Flights: Included{{/if}}

UPDATE TYPE: {{suggestionTitle}}
{{#if customMessage}}CUSTOM MESSAGE FROM AGENT: {{customMessage}}{{/if}}

Generate the email now.
`,
});

// ── Flows ─────────────────────────────────────────────────────────────────────

const generateSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateUpdateSuggestionsFlow',
    inputSchema: ClientUpdateContextSchema,
    outputSchema: UpdateSuggestionsOutputSchema,
  },
  async (input) => {
    try {
      console.log('Generating update suggestions for client:', input.clientName, '- Status:', input.tripStatus);
      const { output, usage } = await suggestionsPrompt(input);

      if (usage) {
        await logTokenUsage(
          'generateUpdateSuggestionsFlow',
          'gemini-2.5-flash-lite',
          usage.inputTokens || 0,
          usage.outputTokens || 0
        );
      }
      return output!;
    } catch (error) {
      console.error('------- UPDATE SUGGESTIONS GENERATION FAILED -------');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      console.error('----------------------------------------------------');
      throw error;
    }
  }
);

const generateEmailFlow = ai.defineFlow(
  {
    name: 'generateClientUpdateEmailFlow',
    inputSchema: ClientUpdateContextSchema.extend({ suggestionTitle: z.string() }),
    outputSchema: ClientUpdateEmailOutputSchema,
  },
  async (input) => {
    try {
      console.log('Generating client update email:', input.suggestionTitle);
      const { output, usage } = await emailPrompt(input);

      if (usage) {
        await logTokenUsage(
          'generateClientUpdateEmailFlow',
          'gemini-2.5-flash-lite',
          usage.inputTokens || 0,
          usage.outputTokens || 0
        );
      }

      let result = output!;
      if (result.subject.length > 100) {
        result = { ...result, subject: result.subject.substring(0, 97) + '...' };
      }
      if (result.body.length > 1500) {
        result = { ...result, body: result.body.substring(0, 1497) + '...' };
      }

      return result;
    } catch (error) {
      console.error('------- CLIENT UPDATE EMAIL GENERATION FAILED -------');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      console.error('-----------------------------------------------------');
      throw error;
    }
  }
);
