import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyRazorpaySignature } from '@/lib/razorpay';

describe('verifyRazorpaySignature', () => {
  const secret = 'whsec_test_secret';
  const body = '{"event":"payment.captured"}';

  it('accepts a valid HMAC signature', () => {
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyRazorpaySignature(body, signature, secret)).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const bad = signature.replace(/0/g, '1').replace(/a/g, 'b');
    expect(verifyRazorpaySignature(body, bad, secret)).toBe(false);
  });

  it('rejects unequal-length signatures without throwing', () => {
    expect(verifyRazorpaySignature(body, 'short', secret)).toBe(false);
  });
});
