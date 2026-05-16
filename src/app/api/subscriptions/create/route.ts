import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getRazorpay, RAZORPAY_PLANS } from '@/lib/razorpay';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType } = await req.json();

    if (planType !== 'pro' && planType !== 'agency') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const planId = RAZORPAY_PLANS[planType as keyof typeof RAZORPAY_PLANS];

    if (!planId || planId.includes('placeholder')) {
       console.error('Razorpay Plan ID not configured.');
       return NextResponse.json({ error: 'Configuration Error. Please contact support.' }, { status: 500 });
    }

    // 1. Create a Customer in Razorpay (optional but recommended)
    // We can skip this if we just want a standard subscription, 
    // but linking it helps track users in Razorpay dashboard.
    // For simplicity, we are directly creating a subscription here.
    
    // 2. Create the subscription
    const razorpay = getRazorpay();
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1, // Let Razorpay handle notifications
      total_count: 120, // Example: 10 years
      notes: {
        userId: user.id,
        planType: planType
      }
    });

    // We don't save the subscription to Supabase yet.
    // We will save it when the webhook fires 'subscription.activated' or 'subscription.created'

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error('Subscription creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
