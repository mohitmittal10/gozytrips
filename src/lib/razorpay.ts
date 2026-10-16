import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay SDK lazily to avoid Next.js build errors when env vars are missing
export const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay API keys are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Verifies a Razorpay webhook or payment signature using HMAC-SHA256
 *
 * @param body The raw request body as a string
 * @param signature The signature from the 'x-razorpay-signature' header
 * @param secret The secret used to sign the payload (either webhook secret or key secret)
 * @returns boolean indicating if the signature is valid
 */
export function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expected = Buffer.from(expectedSignature);
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length) {
      return false;
    }
    return crypto.timingSafeEqual(expected, provided);
  } catch (error) {
    console.error('Error verifying Razorpay signature');
    return false;
  }
}

function requirePlanId(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`${envName} is not configured. Create the plan in Razorpay and set the env var.`);
  }
  return value;
}

/** Lazily resolved so missing env fails at call time, not module load. */
export const RAZORPAY_PLANS = {
  get pro() {
    return requirePlanId('RAZORPAY_PLAN_ID_PRO');
  },
  get agency() {
    return requirePlanId('RAZORPAY_PLAN_ID_AGENCY');
  },
} as const;
