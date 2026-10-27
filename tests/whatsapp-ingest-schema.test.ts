import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const ExtractWhatsAppLeadOutputSchema = z.object({
  clientName: z.string(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  startingLocation: z.string(),
  destinations: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  durationDays: z.number().nullable().optional(),
  adultPax: z.number().default(1),
  childPax: z.number().default(0),
  infantPax: z.number().default(0),
  tripType: z.enum(['adventurous', 'scenic', 'relaxed', 'cultural', 'romantic', 'family', 'foodie']).nullable().optional(),
  budget: z.number().nullable().optional(),
  currency: z.string().default('INR'),
  travelMethods: z.array(z.string()).default(['Flight']),
  mustInclude: z.string().nullable().optional(),
  avoid: z.string().nullable().optional(),
  hotelPreference: z.string().nullable().optional(),
  mealPlan: z.string().nullable().optional(),
  specialRequests: z.string().nullable().optional(),
  urgency: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  confidenceScore: z.number().min(0).max(100).default(85),
  keySummary: z.string(),
  suggestedWhatsAppReply: z.string(),
});

describe('WhatsApp Lead Extraction Schema', () => {
  it('validates a complete extracted lead payload', () => {
    const sample = {
      clientName: 'Vikram Malhotra',
      phone: '+91 9876543210',
      email: 'vikram@example.com',
      startingLocation: 'Mumbai',
      destinations: 'Bali (Ubud, Seminyak)',
      startDate: '2026-12-05',
      endDate: '2026-12-11',
      durationDays: 7,
      adultPax: 2,
      childPax: 0,
      infantPax: 0,
      tripType: 'romantic',
      budget: 250000,
      currency: 'INR',
      travelMethods: ['Flight', 'Cab'],
      mustInclude: 'Private pool villa in Ubud, beachfront resort in Seminyak, floating breakfast',
      avoid: 'Crowded group tours',
      hotelPreference: '4-star or luxury villa',
      mealPlan: 'CP (Breakfast Only)',
      specialRequests: 'Candlelight dinner setup on Day 2',
      urgency: 'high',
      confidenceScore: 95,
      keySummary: 'Honeymoon inquiry for Bali, 2 adults, 6 nights with luxury villas.',
      suggestedWhatsAppReply: 'Hi Vikram, congratulations! We are curating your bespoke Bali honeymoon itinerary now.',
    };

    const parsed = ExtractWhatsAppLeadOutputSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.clientName).toBe('Vikram Malhotra');
      expect(parsed.data.adultPax).toBe(2);
      expect(parsed.data.budget).toBe(250000);
      expect(parsed.data.tripType).toBe('romantic');
    }
  });

  it('handles optional fields with defaults safely', () => {
    const minimal = {
      clientName: 'Priya',
      phone: '9811223344',
      startingLocation: 'New Delhi',
      destinations: 'Kashmir',
      keySummary: 'Family inquiry for Kashmir.',
      suggestedWhatsAppReply: 'Hi Priya, we got your inquiry for Kashmir!',
    };

    const parsed = ExtractWhatsAppLeadOutputSchema.safeParse(minimal);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.adultPax).toBe(1);
      expect(parsed.data.currency).toBe('INR');
      expect(parsed.data.urgency).toBe('normal');
      expect(parsed.data.confidenceScore).toBe(85);
    }
  });
});
