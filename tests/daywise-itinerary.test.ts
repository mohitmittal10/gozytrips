import { describe, it, expect } from 'vitest';
import { formSchema } from '@/types/the-lab';

describe('Daywise plan validation and 300-char per day limit', () => {
  it('defaults mealPlan to CP when omitted and accepts MAP, AP, EP', () => {
    const baseData = {
      startingLocation: 'Delhi',
      endingLocation: 'Delhi',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-06'),
      destinations: 'Jaipur, Rajasthan',
    };

    const parsedDefault = formSchema.safeParse(baseData);
    expect(parsedDefault.success).toBe(true);
    if (parsedDefault.success) {
      expect(parsedDefault.data.mealPlan).toBe('CP');
    }

    const parsedMap = formSchema.safeParse({ ...baseData, mealPlan: 'MAP' });
    expect(parsedMap.success).toBe(true);
    if (parsedMap.success) {
      expect(parsedMap.data.mealPlan).toBe('MAP');
    }

    const parsedAp = formSchema.safeParse({ ...baseData, mealPlan: 'AP' });
    expect(parsedAp.success).toBe(true);
    if (parsedAp.success) {
      expect(parsedAp.data.mealPlan).toBe('AP');
    }

    const parsedEp = formSchema.safeParse({ ...baseData, mealPlan: 'EP' });
    expect(parsedEp.success).toBe(true);
    if (parsedEp.success) {
      expect(parsedEp.data.mealPlan).toBe('EP');
    }
  });

  it('accepts daywise plan with 300 characters for multiple days exceeding previous 1000 limit', () => {
    // 5 days with 250 characters each = 1,250 characters + day headers
    const singleDayText = 'Morning visit to historic heritage sites with guided tour, followed by authentic lunch at local market eatery. Afternoon exploration of artisan workshops and textile bazaars, concluding with sunset views from the panoramic hillside terrace and dinner at iconic culinary landmark.';
    expect(singleDayText.length).toBeLessThanOrEqual(300);

    const multiDayPlan = [
      `Day 1: ${singleDayText}`,
      `Day 2: ${singleDayText}`,
      `Day 3: ${singleDayText}`,
      `Day 4: ${singleDayText}`,
      `Day 5: ${singleDayText}`,
    ].join('\n');

    expect(multiDayPlan.length).toBeGreaterThan(1000);

    const validData = {
      startingLocation: 'Delhi',
      endingLocation: 'Delhi',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-06'),
      destinations: 'Jaipur, Rajasthan',
      tripType: 'relaxed' as const,
      travelMethods: ['Cab'],
      daywiseDestinations: multiDayPlan,
    };

    const parsed = formSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.daywiseDestinations).toContain('Day 1:');
      expect(parsed.data.daywiseDestinations).toContain('Day 5:');
    }
  });

  it('rejects daywise plan exceeding 10,000 characters', () => {
    const hugePlan = 'A'.repeat(10001);
    const data = {
      startingLocation: 'Delhi',
      endDate: new Date('2026-11-06'),
      startDate: new Date('2026-11-01'),
      destinations: 'Jaipur',
      daywiseDestinations: hugePlan,
    };

    const parsed = formSchema.safeParse(data);
    expect(parsed.success).toBe(false);
  });
});

describe('Itinerary bullet formatting and stayCity/meals support', () => {
  it('renders multiline text with pre-line whitespace via renderFormattedText', async () => {
    const { renderFormattedText } = await import('@/components/pdf/utils');
    const plainText = 'Arrival at hotel.\nCheck-in and evening rest.';
    const result = renderFormattedText(plainText) as any;
    expect(result).toBeDefined();
    expect(result?.props?.style?.whiteSpace).toBe('pre-line');
    expect(result?.props?.children).toBe(plainText);
  });

  it('renders structured bullet points into distinct elements via renderFormattedText', async () => {
    const { renderFormattedText } = await import('@/components/pdf/utils');
    const bulletText = '• Highlights:\n  - Amber Fort Sheesh Mahal\n• Tips:\n  - Reach by 09:30 AM';
    const result = renderFormattedText(bulletText) as any;
    expect(result).toBeDefined();
    expect(Array.isArray(result?.props?.children)).toBe(true);
  });
});

describe('AI Trip Title & Itinerary at a Glance', () => {
  it('formats normal and understandable trip titles correctly with formatTitleCase', async () => {
    const { formatTitleCase } = await import('@/components/pdf/utils');
    expect(formatTitleCase('5 days trip to jaipur & udaipur')).toBe('5 Days Trip to Jaipur & Udaipur');
    expect(formatTitleCase('kerala tour: munnar & alleppey')).toBe('Kerala Tour: Munnar & Alleppey');
    expect(formatTitleCase('goa beach holiday')).toBe('Goa Beach Holiday');
    expect(formatTitleCase('golden triangle tour: delhi, agra & jaipur')).toBe('Golden Triangle Tour: Delhi, Agra & Jaipur');
  });

  it('preserves clean sanitized title without overriding with generic formula', async () => {
    const { getSanitizedTitle } = await import('@/components/pdf/utils');
    const title = '5 Days Trip to Jaipur & Udaipur';
    const fakeItinerary = {
      title,
      itinerary: [{ day: 1, date: '2026-11-01', areaFocus: 'Jaipur', stayCity: 'Jaipur', meals: 'Breakfast', timeline: [] }]
    } as any;
    expect(getSanitizedTitle(title, fakeItinerary)).toBe('5 Days Trip to Jaipur & Udaipur');
  });
});
