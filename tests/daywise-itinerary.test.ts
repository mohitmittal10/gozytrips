import { describe, it, expect } from 'vitest';
import { formSchema } from '@/types/the-lab';

describe('Daywise plan validation and 300-char per day limit', () => {
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
  it('renders multiline bullet points with pre-line whitespace via renderFormattedText', async () => {
    const { renderFormattedText } = await import('@/components/pdf/utils');
    const bulletText = '• Highlights:\n  - Amber Fort Sheesh Mahal\n• Tips:\n  - Reach by 09:30 AM';
    const result = renderFormattedText(bulletText) as any;
    expect(result).toBeDefined();
    // Verify it returns a React element preserving pre-line style
    expect(result?.props?.style?.whiteSpace).toBe('pre-line');
    expect(result?.props?.children).toBe(bulletText);
  });
});
