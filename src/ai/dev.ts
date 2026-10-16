/**
 * Genkit local developer entrypoint.
 * Flows are registered for the Genkit CLI / Dev UI.
 * Production traffic must use authenticated server actions — not /api/genkit.
 */
import '@/ai/flows/generate-travel-itinerary';
import '@/ai/flows/generate-vendor-enquiry';
import '@/ai/flows/generate-client-update';
import '@/ai/flows/generate-day-summaries';

console.log('[genkit:dev] Flows registered. Prefer server actions in the app.');
