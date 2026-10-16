import { describe, it, expect } from 'vitest';
import { RateLimitError, RATE_LIMIT_DEFAULTS } from '@/lib/security/rate-limiter';

describe('rate limiter exports', () => {
  it('defines defaults for AI actions', () => {
    expect(RATE_LIMIT_DEFAULTS.ai_generation.maxCalls).toBeGreaterThan(0);
    expect(RATE_LIMIT_DEFAULTS.vendor_enquiry.windowSeconds).toBe(60);
  });

  it('RateLimitError includes retryAfterSeconds', () => {
    const err = new RateLimitError('ai_generation', 42);
    expect(err.name).toBe('RateLimitError');
    expect(err.retryAfterSeconds).toBe(42);
    expect(err.message).toContain('ai_generation');
  });
});
