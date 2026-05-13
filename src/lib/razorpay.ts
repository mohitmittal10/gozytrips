import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay SDK
// Note: We use process.env to ensure keys are loaded securely on the server
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

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
      
    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

// Map our internal plans to Razorpay Plan IDs (these should be created in Razorpay Dashboard)
export const RAZORPAY_PLANS = {
  pro: process.env.RAZORPAY_PLAN_ID_PRO || 'plan_pro_placeholder',
  agency: process.env.RAZORPAY_PLAN_ID_AGENCY || 'plan_agency_placeholder',
} as const;
