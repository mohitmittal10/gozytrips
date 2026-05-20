'use server';

/**
 * @fileOverview Generates a personalized and optimized travel itinerary.
 *
 * - generateTravelItinerary - A function that generates a travel itinerary.
 * - TravelItineraryInput - The input type for the generateTravelItinerary function.
 * - TravelItineraryOutput - The return type for the generateTravelItinerary function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { logTokenUsage } from '@/lib/token-tracker';

const TravelItineraryInputSchema = z.object({
  startingLocation: z.string().describe('The starting location/city for the trip.'),
  endingLocation: z.string().optional().describe('The ending location/city for the trip (if different from starting location).'),
  startDate: z.string().describe('The start date of the trip (YYYY-MM-DD format).'),
  endDate: z.string().describe('The end date of the trip (YYYY-MM-DD format).'),
  destinations: z.string().describe('A comma-separated list of primary travel destinations to visit.'),
  budget: z.coerce.number().int().positive().optional().describe('The total trip budget in INR.'),
  strictBudget: z.boolean().default(false).describe('If true, strictly enforce the budget constraint.'),
  travelMethods: z.array(z.string()).default([]).describe('Selected modes of transport (e.g. Flight, Train, Bus, Cab).'),
  mustInclude: z.string().default('').describe('A comma-separated list of must-see attractions or experiences.'),
  avoid: z.string().default('').describe('A comma-separated list of things to skip or avoid.'),
  leisureTime: z.boolean().default(false).describe('Whether to deliberately include unstructured leisure/free time.'),
  leisureDay: z.number().optional().describe('The specific day (1-indexed) to schedule the most leisure time. Only applies if leisureTime is true.'),
  travelTimePreference: z.enum([
    "no_preference",
    "avoid_night_travel",
    "prefer_morning_travel",
    "prefer_afternoon_travel",
    "prefer_night_travel"
  ]).default("no_preference").describe('User preferences for travel timing.'),
  feedback: z.string().optional().default('').describe('Actionable feedback from a previous optimization pass to refine the itinerary.'),
});
export type TravelItineraryInput = z.infer<typeof TravelItineraryInputSchema>;

const TravelItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      day: z.number(),
      date: z.string(),
      areaFocus: z.string(),
      imageSearchTerm: z.string().describe('A descriptive Unsplash search term for this day\'s main destination or highlight, e.g. "Taj Mahal sunrise", "Kerala houseboat backwaters", "Old Delhi street food market". Be specific and visual.'),
      timeline: z.array(
        z.object({
          time: z.string(),
          details: z.string(),
          cost: z.number().optional(),
          imageSearchTerm: z.string().optional().describe('A specific Unsplash search term for this activity, e.g. "Eiffel Tower", "Statue of Liberty", "Sushi restaurant". Only include if highly relevant and visual.'),
        })
      ),
    })
  ),
  optimizations: z.array(
    z.object({
      type: z.string().describe('The category of optimization (e.g., "Timing", "Cost", "Experience", "Leisure").'),
      message: z.string().describe('A concise, actionable optimization tip (max 60 chars).'),
      impact: z.string().describe('A short description of the benefit (e.g., "+15% Leisure", "Save 2,000", "Avoid Crowds").'),
    })
  ).describe('A list of 3-4 smart AI optimization insights for the trip.'),
});

export type TravelItineraryOutput = z.infer<typeof TravelItineraryOutputSchema>;

export async function generateTravelItinerary(input: TravelItineraryInput): Promise<TravelItineraryOutput> {
  console.log('--- SERVER ACTION: generateTravelItinerary ---');
  
  // Dynamic import to avoid circular dependency issues at the top level if any
  const { createServerComponentClient } = await import('@/lib/supabase/server');
  const { checkSubscriptionAccess } = await import('@/lib/subscription-check');
  
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: You must be logged in to generate itineraries.');
  }

  const { canGenerateItinerary, planType } = await checkSubscriptionAccess(user.id);
  const isAllowed = await canGenerateItinerary();

  if (!isAllowed) {
    throw new Error(`Plan limit reached: Your ${planType} plan has reached its monthly AI itinerary limit. Please upgrade to Pro for unlimited generations.`);
  }

  console.log('Input keys:', Object.keys(input));
  console.log('Input values:', JSON.stringify(input, null, 2));
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'travelItineraryPromptV3',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: TravelItineraryInputSchema },
  output: { schema: TravelItineraryOutputSchema },
  prompt: `
You are an expert travel planner. Generate a detailed, day-by-day travel itinerary using ONLY the information provided below. Keep each activity description brief and engaging (2–3 sentences max).

═══════════════════════════════════════════════════════
  AUTHORITATIVE TRIP INPUTS — TREAT THESE AS LAW
═══════════════════════════════════════════════════════
  Departure city  : {{startingLocation}}
  {{#if endingLocation}}Return city     : {{endingLocation}}{{else}}Return city     : {{startingLocation}}{{/if}}
  Trip start date : {{startDate}}
  Trip end date   : {{endDate}}
  DESTINATIONS    : {{destinations}}
  {{#if budget}}Total budget    : INR {{budget}} (for the entire trip){{#if strictBudget}} - STRICTLY ENFORCED{{else}} - Flexible/Soft target{{/if}}{{/if}}
  {{#if travelMethods}}Preferred Transport : {{travelMethods}}{{/if}}
  {{#if mustInclude}}Must include    : {{mustInclude}}{{/if}}
  {{#if avoid}}Avoid           : {{avoid}}{{/if}}

══════════════════════════════════════════════════════
  RULE 1 — DESTINATION LOCK (MOST IMPORTANT RULE)
══════════════════════════════════════════════════════
  - You MUST ONLY plan activities, hotels, and routes for the EXACT destinations listed above.
  - DO NOT add, substitute, or mention any city, town, village, or landmark that is NOT in the destinations list.
  - DO NOT replace a listed destination with a "nearby", "similar", or "more famous" alternative. If the user said "Coorg", plan for Coorg — not Ooty, not Wayanad.
  - The "areaFocus" for every day MUST be one of the stated destinations (or a district/neighbourhood clearly within it).
  - If a destination is unfamiliar to you, still plan EXACTLY for that place — never silently swap it.

{{#if travelTimePreference}}
══════════════════════════════════════════════════════
  RULE 2 — TRAVEL TIMING PREFERENCE
══════════════════════════════════════════════════════
  User selected: "{{travelTimePreference}}"

  Apply the matching rule strictly:
  - "avoid_night_travel"      → NEVER schedule inter-city travel after 18:00. All transit starts and ends in daylight.
  - "prefer_morning_travel"   → Schedule major inter-city travel between 06:00–12:00. Avoid afternoon/evening transit.
  - "prefer_afternoon_travel" → Schedule major inter-city travel between 12:00–18:00. Avoid early-morning transit.
  - "prefer_night_travel"     → Schedule major inter-city travel overnight (22:00–06:00) to preserve full days for sightseeing.
  - "no_preference"           → No timing constraint; optimise purely for experience quality.
{{/if}}

{{#if leisureTime}}
══════════════════════════════════════════════════════
  RULE 3 — LEISURE / FREE TIME
══════════════════════════════════════════════════════
  Block out unstructured free/leisure time{{#if leisureDay}} specifically on Day {{leisureDay}}{{else}} spread thoughtfully across the trip{{/if}}.
  Label these slots clearly in the timeline (e.g. "Free time — explore at your own pace").
{{/if}}

══════════════════════════════════════════════════════
  SCHEDULING PRINCIPLES
══════════════════════════════════════════════════════
  1. Group geographically close attractions on the same day to minimise travel time.
  2. Schedule popular landmarks during off-peak hours (early morning or late afternoon).
  3. Sequence activities by opening/closing times; factor in queue times for major sites.
  4. Account for day-of-week closures and regional public holidays.
  5. Place meals near midday and evening activity locations.
  6. Schedule rest or lighter activities after physically intensive ones.
  7. Reserve high-energy activities for the morning.
  8. Include realistic inter-location transit time as explicit timeline steps.
  9. First and last day must logically begin from {{startingLocation}} and end at {{#if endingLocation}}{{endingLocation}}{{else}}{{startingLocation}}{{/if}}.

══════════════════════════════════════════════════════
  COST ESTIMATION & TRANSPORT (ALL VALUES IN INR)
══════════════════════════════════════════════════════
  3. Every cost value MUST be an integer number (e.g. 500, not "₹500" or "500 INR").
  4. Use realistic, current prices: entry tickets, local transport (cab/auto/metro/bus), and meals at well-reviewed local restaurants.
{{#if budget}}
{{#if strictBudget}}
  5. STRICT BUDGET RULE: The SUM of all activity costs MUST NEVER EXCEED the total budget of INR {{budget}}. This is a hard limit.
{{else}}
  5. BUDGET RULE: The SUM of all activity costs should roughly align with the total budget of INR {{budget}}, but you may exceed it if necessary for a better experience.
{{/if}}
{{/if}}
{{#if travelMethods}}
  6. Ensure the itinerary utilizes the following preferred modes of inter-city transport when scheduling travel: {{travelMethods}}.
{{/if}}

══════════════════════════════════════════════════════
  IMAGE SEARCH TERMS (for Unsplash)
══════════════════════════════════════════════════════
  Per-day  : "[Specific Landmark or Area], [City]" — e.g. "Amber Fort Jaipur", "Marine Drive Mumbai night".
  Per-step : Specific and visual — e.g. "Mysore Palace interior", "Alleppey houseboat Kerala sunset".
  NEVER use vague terms like: "beautiful morning", "cultural experience", "day 2 highlights", "food market", "scenic view".

══════════════════════════════════════════════════════
  OPTIMISATION INSIGHTS (exactly 3–4)
══════════════════════════════════════════════════════
  Provide 3–4 concise, actionable insights specific to THIS trip. Format: "Category: Tip (Impact)".
  Examples:
  - "Timing: Visit Amber Fort at 08:00 to beat crowds (Avoid Queues)"
  - "Cost: Use the metro on Day 3 instead of cabs (Save ₹800)"
  - "Leisure: Add 2 free hours on Day 4 afternoon (Spontaneous Exploration)"

{{#if feedback}}
══════════════════════════════════════════════════════
  REFINEMENT PASS — APPLY THIS USER FEEDBACK
══════════════════════════════════════════════════════
  {{feedback}}

  Prioritise incorporating this feedback. Maintain the overall trip structure and the destination lock from Rule 1.
{{/if}}

══════════════════════════════════════════════════════
  SELF-CHECK BEFORE RESPONDING
══════════════════════════════════════════════════════
  Before returning your output, verify:
  ✓ Every "areaFocus" and every activity is in one of these exact destinations: {{destinations}}
  ✓ No city, region, or landmark outside of {{destinations}} appears anywhere in your response
  ✓ Dates run correctly from {{startDate}} to {{endDate}}
  ✓ Departure and return align with {{startingLocation}}{{#if endingLocation}} / {{endingLocation}}{{/if}}
  ✓ All cost values are plain integers in INR
  ✓ Exactly 3–4 optimisation insights are included
  `,
});

async function callPromptWithFallback<I, O>(
  promptFn: any,
  input: I,
  fallbackModelName: string = 'gemini-2.5-flash'
): Promise<{ output: O; usage: any }> {
  try {
    return await promptFn(input);
  } catch (error: any) {
    const errorStr = String(error?.message || error || '').toUpperCase();
    const isServiceUnavailable =
      errorStr.includes('503') ||
      errorStr.includes('UNAVAILABLE') ||
      errorStr.includes('HIGH DEMAND') ||
      errorStr.includes('LIMIT') ||
      errorStr.includes('QUOTA');
      
    if (isServiceUnavailable) {
      console.warn(`Primary model failed with temporary API error. Falling back to ${fallbackModelName}...`);
      try {
        return await promptFn(input, { model: googleAI.model(fallbackModelName) });
      } catch (fallbackError) {
        console.error(`Fallback model ${fallbackModelName} also failed:`, fallbackError);
        throw error;
      }
    }
    throw error;
  }
}

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlowV3',
    inputSchema: TravelItineraryInputSchema,
    outputSchema: TravelItineraryOutputSchema,
  },
  async input => {
    try {
      console.log('Starting itinerary generation for:', input.destinations);
      const { output, usage } = await callPromptWithFallback<TravelItineraryInput, TravelItineraryOutput>(prompt, input);

      // Log token usage if available
      if (usage) {
        await logTokenUsage(
          'generateTravelItineraryFlow',
          'gemini-2.5-flash-lite',
          usage.inputTokens || 0,
          usage.outputTokens || 0
        );
      }

      console.log('Itinerary generation successful');
      return output!;
    } catch (error) {
      // 🔴 CRITICAL LOGGING FOR VERCEL DEPLOYMENT 🔴
      console.error('------- AI GENERATION FAILED -------');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
      console.error('Input payload:', JSON.stringify(input, null, 2));
      console.error('------------------------------------');
      throw error; // Re-throw so the frontend still catches it
    }
  }
);

// ── Day Regeneration Flow ──

const RegenerateDayInputSchema = z.object({
  day: z.number().describe('The day number.'),
  destinations: z.string().describe('The trip destinations.'),
  currentDayData: z.object({
    day: z.number(),
    date: z.string(),
    areaFocus: z.string(),
    timeline: z.array(
      z.object({
        time: z.string(),
        details: z.string(),
        cost: z.number().optional(),
      })
    ),
  }),
  prompt: z.string().describe('The regeneration prompt from the user.'),
  otherDaysSummary: z.string().optional().describe('Summary of other days to avoid duplicates.'),
});

export type RegenerateDayInput = z.infer<typeof RegenerateDayInputSchema>;

const RegenerateDayOutputSchema = z.object({
  day: z.number(),
  date: z.string(),
  areaFocus: z.string(),
  imageSearchTerm: z.string(),
  timeline: z.array(
    z.object({
      time: z.string(),
      details: z.string(),
      cost: z.number().optional(),
      imageSearchTerm: z.string().optional(),
    })
  ),
});

export type RegenerateDayOutput = z.infer<typeof RegenerateDayOutputSchema>;

const regenerateDayPrompt = ai.definePrompt({
  name: 'regenerateDayPromptV1',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: RegenerateDayInputSchema },
  output: { schema: RegenerateDayOutputSchema },
  prompt: `
You are an expert travel planner. You need to regenerate Day {{currentDayData.day}} of a travel itinerary to {{destinations}} based on the user prompt: "{{prompt}}".

Use this prompt to reshape this day's activities. For example, if the prompt says "make it more relaxed", add more leisure time. If it says "include a visit to X", schedule X at a logical time.

═══════════════════════════════════════════════════════
  CURRENT DAY DATA (USE AS BASE / CONTEXT)
═══════════════════════════════════════════════════════
  Current Area Focus: {{currentDayData.areaFocus}}
  Current Activities:
  {{#each currentDayData.timeline}}
  - {{time}}: {{details}} {{#if cost}}(Cost: {{cost}}){{/if}}
  {{/each}}

═══════════════════════════════════════════════════════
  OTHER DAYS CONTEXT (DO NOT DUPLICATE THESE)
═══════════════════════════════════════════════════════
  {{#if otherDaysSummary}}
  To prevent duplicate activities, here is what is planned on other days:
  {{otherDaysSummary}}
  {{/if}}

═══════════════════════════════════════════════════════
  RULES & GUIDELINES
  - Keep each activity description brief and engaging (2–3 sentences max).
  - Use realistic prices in INR and output them as plain integers.
  - Generate 3-5 logical timeline steps for the day.
  - The "areaFocus" should remain relevant to {{destinations}}.
  - Output Unsplash search terms for the day ("imageSearchTerm") and optionally for activities.
═══════════════════════════════════════════════════════
  `,
});

export async function regenerateItineraryDay(input: RegenerateDayInput): Promise<RegenerateDayOutput> {
  console.log('--- SERVER ACTION: regenerateItineraryDay ---');
  
  const { createServerComponentClient } = await import('@/lib/supabase/server');
  const { checkSubscriptionAccess } = await import('@/lib/subscription-check');
  
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized: You must be logged in to regenerate itineraries.');
  }

  const { canGenerateItinerary, planType } = await checkSubscriptionAccess(user.id);
  const isAllowed = await canGenerateItinerary();

  if (!isAllowed) {
    throw new Error(`Plan limit reached: Your ${planType} plan has reached its monthly AI itinerary limit.`);
  }

  return regenerateItineraryDayFlow(input);
}

const regenerateItineraryDayFlow = ai.defineFlow(
  {
    name: 'regenerateItineraryDayFlowV1',
    inputSchema: RegenerateDayInputSchema,
    outputSchema: RegenerateDayOutputSchema,
  },
  async input => {
    try {
      console.log('Starting day regeneration for day:', input.currentDayData.day);
      const { output, usage } = await callPromptWithFallback<RegenerateDayInput, RegenerateDayOutput>(regenerateDayPrompt, input);

      if (usage) {
        await logTokenUsage(
          'regenerateItineraryDayFlow',
          'gemini-2.5-flash-lite',
          usage.inputTokens || 0,
          usage.outputTokens || 0
        );
      }

      console.log('Day regeneration successful');
      return output!;
    } catch (error) {
      console.error('------- AI DAY REGENERATION FAILED -------');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
);

