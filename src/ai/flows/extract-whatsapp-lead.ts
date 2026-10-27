'use server';

/**
 * @fileOverview AI Flow for extracting structured travel leads from WhatsApp chat transcripts or messages.
 * Uses Genkit with Gemini to turn unstructured WhatsApp conversations into actionable CRM leads
 * and pre-filled itinerary parameters for The Lab.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { logTokenUsage } from '@/lib/token-tracker';
import { sanitizeForPrompt, sanitizeText } from '@/lib/security/input-sanitizer';
import { assertNoInjection } from '@/lib/security/prompt-guard';
import { checkRateLimit } from '@/lib/security/rate-limiter';

// ── Input Schema ─────────────────────────────────────────────────────────────

const ExtractWhatsAppLeadInputSchema = z.object({
  rawChat: z.string().min(5).max(15000).describe('Raw WhatsApp chat message or exported conversation'),
  defaultPhone: z.string().max(30).optional().describe('Optional sender phone number if known'),
  defaultName: z.string().max(100).optional().describe('Optional sender name if known'),
});

export type ExtractWhatsAppLeadInput = z.infer<typeof ExtractWhatsAppLeadInputSchema>;

// ── Output Schema ────────────────────────────────────────────────────────────

const ExtractWhatsAppLeadOutputSchema = z.object({
  clientName: z.string().describe('Extracted traveler/client name. If unknown, use "Prospective Traveler" or contact name.'),
  phone: z.string().describe('Extracted phone number with country code if available. Fallback to defaultPhone or empty string.'),
  email: z.string().nullable().optional().describe('Extracted email address or null'),
  startingLocation: z.string().describe('Origin city or country. Default to "New Delhi" or "Mumbai" if unspecified.'),
  destinations: z.string().describe('Destination city, region, or countries, comma-separated.'),
  startDate: z.string().nullable().optional().describe('Trip start date in YYYY-MM-DD format if mentioned, or null'),
  endDate: z.string().nullable().optional().describe('Trip end date in YYYY-MM-DD format if mentioned, or null'),
  durationDays: z.number().nullable().optional().describe('Total duration in days (e.g. 6 for 5 nights / 6 days)'),
  adultPax: z.number().default(1).describe('Number of adult travelers (min 1)'),
  childPax: z.number().default(0).describe('Number of children (age 2-11)'),
  infantPax: z.number().default(0).describe('Number of infants (under 2)'),
  tripType: z.enum(['adventurous', 'scenic', 'relaxed', 'cultural', 'romantic', 'family', 'foodie']).nullable().optional().describe('Best matching trip vibe'),
  budget: z.number().nullable().optional().describe('Total budget amount as a pure number (e.g. 150000) or null'),
  currency: z.string().default('INR').describe('Currency code (e.g. INR, USD, EUR, AED, GBP)'),
  travelMethods: z.array(z.string()).default(['Flight']).describe('Preferred travel methods, e.g. ["Flight", "Cab"]'),
  mustInclude: z.string().nullable().optional().describe('Key activities, landmarks, or specific places that must be included'),
  avoid: z.string().nullable().optional().describe('Activities, hotels, or constraints to avoid'),
  hotelPreference: z.string().nullable().optional().describe('Hotel preferences e.g. "4-star", "5-star luxury", "Private pool villa", "Homestay"'),
  mealPlan: z.string().nullable().optional().describe('Meal plan preference e.g. "Breakfast Only (CP)", "Breakfast + Dinner (MAP)", "All Meals (AP)"'),
  specialRequests: z.string().nullable().optional().describe('Special requests (honeymoon decor, anniversary cake, vegetarian meals, wheelchair, infant crib)'),
  urgency: z.enum(['urgent', 'high', 'normal', 'low']).default('normal').describe('Urgency level based on travel date proximity or client tone'),
  confidenceScore: z.number().min(0).max(100).default(85).describe('Confidence score (0-100) of extraction quality'),
  keySummary: z.string().describe('A crisp 1-2 sentence executive summary of the lead for the travel agent.'),
  suggestedWhatsAppReply: z.string().describe('A polite, highly professional WhatsApp reply template that the agent can send back to the traveler.'),
});

export type ExtractWhatsAppLeadOutput = z.infer<typeof ExtractWhatsAppLeadOutputSchema>;

export type ExtractWhatsAppLeadResult =
  | { success: true; data: ExtractWhatsAppLeadOutput }
  | { success: false; error: string; code?: string };

// ── Prompt Definition ────────────────────────────────────────────────────────

const extractWhatsAppPrompt = ai.definePrompt({
  name: 'extractWhatsAppPrompt',
  model: googleAI.model('gemini-3.5-flash-lite'),
  input: { schema: ExtractWhatsAppLeadInputSchema },
  output: { schema: ExtractWhatsAppLeadOutputSchema },
  prompt: `
You are an expert AI Travel Operations Specialist for an agency CRM.
Your task is to analyze raw WhatsApp chat text (which may be a single forwarded inquiry message, an exported chat transcript with timestamps, or informal multi-turn messages in English or Hinglish), and accurately extract structured travel lead data.

RULES & EXTRACTION GUIDELINES:
1. CLIENT IDENTITY:
   - Extract the customer's real name. In WhatsApp exports like "[date, time] Rohan Sharma: ...", Rohan Sharma is the client.
   - If not explicit, check inside the message (e.g. "My name is Priya" or sign-offs) or use {{defaultName}} if provided.
   - Extract phone number if mentioned (e.g. "+91 98765 43210", "call me on 9811002233"). If not in text, use {{defaultPhone}}.
   - Extract email if mentioned.

2. ITINERARY & DESTINATIONS:
   - Identify destinations (e.g. "Kashmir (Srinagar, Gulmarg, Pahalgam)", "Bali (Ubud & Seminyak)", "Dubai & Abu Dhabi", "Switzerland").
   - Identify origin / starting city if mentioned (e.g. "from Mumbai", "flying from Bangalore"). Default to "New Delhi" or "Mumbai" if in India and unspecified.
   - If specific dates are mentioned (e.g. "15th Nov to 21st Nov 2026"), format as YYYY-MM-DD.
   - If relative dates or duration is mentioned (e.g. "5 nights 6 days in December"), set durationDays = 6.

3. TRAVEL GROUP (PAX):
   - Parse adults, children (with ages if mentioned), and infants.
   - E.g. "me and my wife" -> 2 adults, 0 children. "family of 4 (2 kids 6 & 9)" -> 2 adults, 2 children. Default adultPax to at least 1.

4. BUDGET & CURRENCY:
   - Recognize shorthand: "1.5L" or "1.5 Lakh" = 150000 INR; "50k" = 50000; "$2500" = 2500 USD; "2000 euro" = 2000 EUR.
   - Default currency is "INR" for Indian destinations/numbers, or currency symbol in text.

5. TRIP TYPE & PREFERENCES:
   - Map to: 'adventurous' | 'scenic' | 'relaxed' | 'cultural' | 'romantic' | 'family' | 'foodie'.
   - E.g. Honeymoon / anniversary -> 'romantic'. With kids -> 'family'. Trekking / scuba -> 'adventurous'.
   - Extract hotel preferences (e.g. "4-star", "5-star luxury", "pool villa", "houseboat").
   - Extract mustInclude (specific sightseeing, gondola rides, water sports, desert safari).
   - Extract avoid (e.g. "no long car travel", "avoid crowded spots", "no non-veg hotels").
   - Extract specialRequests (e.g. "Anniversary cake on Day 2", "Pure veg Jain food", "Late check-out").

6. URGENCY & CONFIDENCE:
   - If travel is within 7 days, urgency is 'urgent'. Within 30 days: 'high'. Otherwise: 'normal'.
   - Score confidence (0-100) based on how much clear information was provided.

7. SUGGESTED WHATSAPP REPLY:
   - Write a warm, professional, emoji-accented WhatsApp message acknowledging the inquiry, confirming the key details (destination, dates/duration, pax), and informing them that their bespoke itinerary is being prepared. Sign off as "Team Travel Architect".

RAW WHATSAPP CHAT TO ANALYZE:
<whatsapp_chat>
{{rawChat}}
</whatsapp_chat>
{{#if defaultPhone}}
DEFAULT PHONE OVERRIDE: {{defaultPhone}}
{{/if}}
{{#if defaultName}}
DEFAULT NAME OVERRIDE: {{defaultName}}
{{/if}}
`,
});

// ── Flow Definition ──────────────────────────────────────────────────────────

const extractWhatsAppLeadFlow = ai.defineFlow(
  {
    name: 'extractWhatsAppLeadFlow',
    inputSchema: ExtractWhatsAppLeadInputSchema,
    outputSchema: ExtractWhatsAppLeadOutputSchema,
  },
  async (input) => {
    const startTime = Date.now();
    const { output, response } = await extractWhatsAppPrompt(input);

    if (!output) {
      throw new Error('AI was unable to extract lead information from this message.');
    }

    // Track token usage
    const latencyMs = Date.now() - startTime;
    if (response?.usage) {
      await logTokenUsage({
        flow: 'extractWhatsAppLead',
        model: 'gemini-3.5-flash-lite',
        promptTokens: response.usage.inputTokens ?? 0,
        completionTokens: response.usage.outputTokens ?? 0,
        totalTokens: response.usage.totalTokens ?? 0,
        latencyMs,
        metadata: {
          clientName: output.clientName,
          destinations: output.destinations,
        },
      });
    }

    return output;
  }
);

// ── Exported Server Action ───────────────────────────────────────────────────

export async function extractWhatsAppLead(input: ExtractWhatsAppLeadInput): Promise<ExtractWhatsAppLeadResult> {
  try {
    // ── Security: Auth guard ───────────────────────────────────────────────────
    const { createServerComponentClient } = await import('@/lib/supabase/server');
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized: You must be logged in.' };
    }

    if (!input.rawChat || input.rawChat.trim().length < 5) {
      return { success: false, error: 'Please paste a valid WhatsApp message or chat excerpt.' };
    }

    // ── Security: Injection Guard ─────────────────────────────────────────────
    assertNoInjection({
      'WhatsApp Chat': input.rawChat,
    });

    // ── Security: Rate limiting ───────────────────────────────────────────────
    await checkRateLimit(user.id, 'whatsapp_lead_extraction', { maxCalls: 30, windowSeconds: 60 });

    // ── Security: Sanitize input for prompt ───────────────────────────────────
    const sanitizedInput: ExtractWhatsAppLeadInput = {
      rawChat: sanitizeForPrompt(input.rawChat, 10000),
      defaultPhone: input.defaultPhone ? sanitizeText(input.defaultPhone, 30) : undefined,
      defaultName: input.defaultName ? sanitizeText(input.defaultName, 100) : undefined,
    };

    const data = await extractWhatsAppLeadFlow(sanitizedInput);
    return { success: true, data };
  } catch (err: any) {
    const errorMsg = err?.message || String(err || 'Failed to extract WhatsApp lead.');
    console.error('[extractWhatsAppLead] error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
