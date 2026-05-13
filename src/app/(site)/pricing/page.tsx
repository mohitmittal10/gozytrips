"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ModernPricingPage, PricingCardProps } from "@/components/ui/animated-glassy-pricing";

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Best for beginners or solo explorers.',
    features: [
      '3 AI Itinerary generations / month',
      'Manage up to 5 clients',
      'Standard Wander Labs PDF theme',
      '2 AI-generated vendor enquiries / month',
      'Email support'
    ],
    buttonText: 'Current Plan',
    planType: 'starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹1,999',
    description: 'Best for professional independent travel agents.',
    features: [
      'Unlimited AI Itinerary generations',
      'Unlimited clients & financial tracking',
      'All premium PDF themes',
      'Remove Wander Labs watermark',
      'Custom company logo on PDFs',
      'Unlimited AI-generated enquiries',
      'Daily automated database backups',
      'Priority email support'
    ],
    buttonText: 'Upgrade to Pro',
    planType: 'pro',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '₹4,999',
    description: 'Best for growing travel agencies and boutique teams.',
    features: [
      'Everything in Pro',
      'Up to 5 team member sub-accounts',
      'Collaborative CRM & shared database',
      'Full white-labeling & brand customization',
      'Advanced agency analytics & metrics',
      '1-on-1 onboarding',
      'Dedicated account manager'
    ],
    buttonText: 'Upgrade to Agency',
    planType: 'agency',
    highlighted: false,
  }
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('plan_type')
          .eq('id', user.id)
          .single();
        if (data?.plan_type) setCurrentPlan(data.plan_type);
      }
    };
    fetchUserPlan();
  }, [supabase]);

  const handleSubscribe = async (planType: string) => {
    if (!isRazorpayLoaded) {
      toast({ title: 'Payment Gateway Loading', description: 'Please wait a moment and try again.' });
      return;
    }

    if (planType === 'starter') return;

    try {
      setLoadingPlan(planType);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push(`/auth/login?redirect=/pricing`);
         return;
      }

      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize subscription');
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'Wander Labs',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Subscription`,
        image: '/favicon.ico',
        handler: function (response: any) {
          toast({
            title: 'Payment Successful',
            description: 'Your subscription is being activated. Please wait...',
          });
          setTimeout(() => {
             router.push('/profile?payment=success');
          }, 3000);
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#191970'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any){
         toast({
            variant: "destructive",
            title: "Payment Failed",
            description: response.error.description || "An error occurred during payment."
         });
      });

      rzp.open();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Something went wrong',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const pricingPlans: PricingCardProps[] = TIERS.map(tier => ({
    planName: tier.name,
    description: tier.description,
    price: tier.price,
    features: tier.features,
    buttonText: tier.buttonText,
    isPopular: tier.highlighted,
    buttonVariant: tier.highlighted ? 'primary' : 'secondary',
    onClick: () => handleSubscribe(tier.planType),
    isLoading: loadingPlan === tier.planType,
    isCurrent: currentPlan === tier.planType
  }));

  return (
    <>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => setIsRazorpayLoaded(true)}
      />
      <ModernPricingPage
        title={
          <>
            Find the <span className="text-cyan-400">Perfect Plan</span> for Your Business
          </>
        }
        subtitle="Start for free, then grow with us. Flexible plans for projects of all sizes."
        plans={pricingPlans}
        showAnimatedBackground={true}
      />
    </>
  );
}
