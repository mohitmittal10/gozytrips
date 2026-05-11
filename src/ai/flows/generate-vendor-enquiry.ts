'use server';

/**
 * @fileOverview Generates professional vendor enquiry emails for travel agents.
 * Supports: Hotel, Transport, Activities/Tours, Visa, Travel Insurance.
 *
 * - generateVendorEnquiry - Generates a vendor enquiry email.
 * - VendorEnquiryInput  - The input type.
 * - VendorEnquiryOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { logTokenUsage } from '@/lib/token-tracker';

// ── Input Schema ─────────────────────────────────────────────────────────────

const VendorEnquiryInputSchema = z.object({
  enquiryType: z.enum(['hotel', 'transport', 'activities', 'visa', 'insurance'])
    .describe('The type of vendor being enquired.'),
  
  // Common fields
  agentName: z.string().describe('Name of the travel agent sending the enquiry.'),
  agentCompany: z.string().optional().describe('Company/agency name of the travel agent.'),
  destination: z.string().describe('Travel destination city/region.'),
  travelDates: z.string().describe('Travel dates in human-readable format, e.g. "15 Apr 2026 - 22 Apr 2026".'),
  numberOfAdults: z.number().describe('Number of adult travellers.'),
  numberOfChildren: z.number().optional().describe('Number of child travellers.'),
  numberOfInfants: z.number().optional().describe('Number of infant travellers.'),

  // Hotel-specific
  hotelName: z.string().optional().describe('Name of the hotel being enquired about.'),
  roomType: z.string().optional().describe('Preferred room type, e.g. Deluxe, Suite, Standard.'),
  numberOfRooms: z.number().optional().describe('Number of rooms required.'),
  mealPlan: z.string().optional().describe('Preferred meal plan: CP, MAP, AP, EP.'),
  
  // Transport-specific
  vehicleType: z.string().optional().describe('Type of vehicle needed: Sedan, SUV, Tempo Traveller, Bus.'),
  route: z.string().optional().describe('Route details, e.g. "Delhi to Agra round trip".'),
  pickupLocation: z.string().optional().describe('Pickup location or airport.'),
  
  // Activities-specific
  activityName: z.string().optional().describe('Name of the activity or tour.'),
  
  // Visa-specific
  destinationCountry: z.string().optional().describe('Country for visa application.'),
  nationality: z.string().optional().describe('Nationality of the travellers.'),
  
  // Insurance-specific
  coverageType: z.string().optional().describe('Type of coverage: Comprehensive, Medical Only, Trip Cancellation.'),
  
  // General
  specialRequests: z.string().optional().describe('Any special requests or additional notes.'),
  vendorEmail: z.string().optional().describe('Vendor email address for the TO field.'),
});

export type VendorEnquiryInput = z.infer<typeof VendorEnquiryInputSchema>;

// ── Output Schema ────────────────────────────────────────────────────────────

const VendorEnquiryOutputSchema = z.object({
  subject: z.string().describe('Email subject line. Must be under 100 characters.'),
  body: z.string().describe('Email body text. Must be under 1500 characters. Plain text, no HTML.'),
});

export type VendorEnquiryOutput = z.infer<typeof VendorEnquiryOutputSchema>;

// ── Exported function ────────────────────────────────────────────────────────

export async function generateVendorEnquiry(input: VendorEnquiryInput): Promise<VendorEnquiryOutput> {
  return generateVendorEnquiryFlow(input);
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const prompt = ai.definePrompt({
  name: 'vendorEnquiryPrompt',
  model: googleAI.model('gemini-2.5-flash-lite'),
  input: { schema: VendorEnquiryInputSchema },
  output: { schema: VendorEnquiryOutputSchema },
  prompt: `
You are an expert travel industry email writer. Generate a professional, concise vendor enquiry email for a travel agent.

CRITICAL RULES:
1. The email subject MUST be under 100 characters.
2. The email body MUST be under 1500 characters (including spaces). This is a hard limit — do NOT exceed it.
3. Use plain text only — NO HTML, NO markdown, NO special formatting.
4. Be professional, polite, and to the point.
5. Include all relevant details from the input.
6. End with a clear call to action asking for rates/availability.
7. Sign off with the agent's name and company.

ENQUIRY TYPE: {{enquiryType}}
AGENT: {{agentName}}{{#if agentCompany}} from {{agentCompany}}{{/if}}

TRIP DETAILS:
- Destination: {{destination}}
- Travel Dates: {{travelDates}}
- Adults: {{numberOfAdults}}{{#if numberOfChildren}}, Children: {{numberOfChildren}}{{/if}}{{#if numberOfInfants}}, Infants: {{numberOfInfants}}{{/if}}

{{#if hotelName}}HOTEL: {{hotelName}}{{/if}}
{{#if roomType}}Room Type: {{roomType}}{{/if}}
{{#if numberOfRooms}}Rooms Required: {{numberOfRooms}}{{/if}}
{{#if mealPlan}}Meal Plan: {{mealPlan}}{{/if}}

{{#if vehicleType}}Vehicle: {{vehicleType}}{{/if}}
{{#if route}}Route: {{route}}{{/if}}
{{#if pickupLocation}}Pickup: {{pickupLocation}}{{/if}}

{{#if activityName}}Activity/Tour: {{activityName}}{{/if}}

{{#if destinationCountry}}Visa Country: {{destinationCountry}}{{/if}}
{{#if nationality}}Nationality: {{nationality}}{{/if}}

{{#if coverageType}}Insurance Coverage: {{coverageType}}{{/if}}

{{#if specialRequests}}Special Requests: {{specialRequests}}{{/if}}

TYPE-SPECIFIC INSTRUCTIONS (use ONLY the section matching the enquiry type above):
- For hotel: Ask about room availability, best rates for the dates, group discounts (if 3+ rooms), meal plan options and rates, early check-in/late check-out possibility, cancellation policy, complimentary inclusions, and any ongoing promotions.
- For transport: Ask about vehicle availability, per-day and per-km rates, toll and parking inclusions, driver allowance, AC/Non-AC options, airport transfer rates, and cancellation terms.
- For activities: Ask about group booking rates, availability for the dates, what's included (guide, equipment, meals), minimum/maximum group size, duration, pickup and drop service, cancellation policy, and child-specific pricing.
- For visa: Ask about processing time (regular and express), fees per applicant, required documents checklist, group application discounts, interview requirements, success rate for this nationality, and any recent policy changes.
- For insurance: Ask about coverage details and limits, premium per person, group rates, pre-existing condition coverage, adventure sports coverage, COVID coverage, claim process, and policy documents.

Generate the subject and body now.
`,
});

// ── Flow ──────────────────────────────────────────────────────────────────────

const generateVendorEnquiryFlow = ai.defineFlow(
  {
    name: 'generateVendorEnquiryFlow',
    inputSchema: VendorEnquiryInputSchema,
    outputSchema: VendorEnquiryOutputSchema,
  },
  async (input) => {
    try {
      console.log('Generating vendor enquiry email for:', input.enquiryType, input.destination);
      const { output, usage } = await prompt(input);

      if (usage) {
        await logTokenUsage(
          'generateVendorEnquiryFlow',
          'gemini-2.5-flash-lite',
          usage.inputTokens || 0,
          usage.outputTokens || 0
        );
      }

      // Enforce character limits
      let result = output!;
      if (result.subject.length > 100) {
        result = { ...result, subject: result.subject.substring(0, 97) + '...' };
      }
      if (result.body.length > 1500) {
        result = { ...result, body: result.body.substring(0, 1497) + '...' };
      }

      console.log('Vendor enquiry email generated successfully');
      return result;
    } catch (error) {
      console.error('------- VENDOR ENQUIRY GENERATION FAILED -------');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('Stack:', error.stack);
      }
      console.error('Input:', JSON.stringify(input, null, 2));
      console.error('------------------------------------------------');
      throw error;
    }
  }
);

