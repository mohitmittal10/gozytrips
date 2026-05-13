import { createServerComponentClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

type PlanTier = Database['public']['Enums']['plan_tier'];

export const PLAN_LIMITS = {
  starter: {
    maxItinerariesPerMonth: 3,
    maxVendorEnquiriesPerMonth: 2,
    hasPremiumPdf: false,
    hasCustomBranding: false,
    hasCrmAdvanced: false,
    maxClients: 5,
  },
  pro: {
    maxItinerariesPerMonth: Infinity,
    maxVendorEnquiriesPerMonth: Infinity,
    hasPremiumPdf: true,
    hasCustomBranding: true,
    hasCrmAdvanced: true,
    maxClients: Infinity,
  },
  agency: {
    maxItinerariesPerMonth: Infinity,
    maxVendorEnquiriesPerMonth: Infinity,
    hasPremiumPdf: true,
    hasCustomBranding: true,
    hasCrmAdvanced: true,
    maxClients: Infinity,
    // Add agency specific features later like sub-accounts
  }
};

/**
 * Validates if the user can perform a specific action based on their subscription tier and usage
 */
export async function checkSubscriptionAccess(userId: string) {
  const supabase = await createServerComponentClient();
  
  // Get user's plan type
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan_type')
    .eq('id', userId)
    .single();

  const planType: PlanTier = profile?.plan_type || 'starter';
  const limits = PLAN_LIMITS[planType];

  // Helper function to check if the user can generate an itinerary this month
  const canGenerateItinerary = async () => {
    if (limits.maxItinerariesPerMonth === Infinity) return true;

    // Check usage for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('itineraries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    return (count || 0) < limits.maxItinerariesPerMonth;
  };

  const canUsePremiumPdf = () => limits.hasPremiumPdf;
  const canRemoveWatermark = () => limits.hasCustomBranding;

  return {
    planType,
    limits,
    canGenerateItinerary,
    canUsePremiumPdf,
    canRemoveWatermark,
  };
}
