import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

// Razorpay sends webhooks as POST requests
export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const isValid = verifyRazorpaySignature(bodyText, signature, secret);
    if (!isValid) {
      console.error('Invalid Razorpay signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    
    // We only care about subscription events
    if (event.startsWith('subscription.')) {
      const subscription = payload.payload.subscription.entity;
      
      const adminClient = createAdminClient();
      
      // Extract custom notes which should contain our userId
      const userId = subscription.notes?.userId;
      const planType = subscription.notes?.planType || 'starter';

      if (!userId) {
         console.warn('Webhook received without userId in notes. Sub ID:', subscription.id);
         return NextResponse.json({ received: true, note: 'No userId attached' });
      }

      // Map Razorpay status to our enum
      let status = subscription.status;
      // Razorpay uses: created, authenticated, active, pending, halted, cancelled, completed, expired.
      // We map these mostly 1:1, but 'completed' or 'expired' can map to 'cancelled' or we could add them to our enum.
      if (['completed', 'expired'].includes(status)) {
         status = 'cancelled';
      }

      // Upsert the subscription
      const { error } = await adminClient
        .from('subscriptions' as any)
        .upsert(
          {
            user_id: userId,
            razorpay_subscription_id: subscription.id,
            razorpay_customer_id: subscription.customer_id,
            plan_type: planType,
            status: status,
            current_period_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
            current_period_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error updating subscription in Supabase:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
