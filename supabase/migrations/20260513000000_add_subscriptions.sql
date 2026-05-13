-- Migration: Add Subscriptions Table for Razorpay
-- Description: Creates the subscriptions table and sets up RLS policies.

CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'created', 'authenticated', 'halted', 'pending');
CREATE TYPE public.plan_tier AS ENUM ('starter', 'pro', 'agency');

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_subscription_id TEXT UNIQUE,
    razorpay_customer_id TEXT,
    plan_type public.plan_tier NOT NULL DEFAULT 'starter',
    status public.subscription_status NOT NULL DEFAULT 'created',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_active_subscription_per_user UNIQUE (user_id)
);

-- Add plan_type to user_profiles for quick denormalized access
ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS plan_type public.plan_tier DEFAULT 'starter';

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role (server-side) can insert/update subscriptions based on webhooks
-- So we don't add public insert/update policies.

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to sync plan_type to user_profiles on subscription update
CREATE OR REPLACE FUNCTION sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF (NEW.status = 'active') THEN
            UPDATE public.user_profiles
            SET plan_type = NEW.plan_type
            WHERE id = NEW.user_id;
        ELSIF (NEW.status = 'cancelled' OR NEW.status = 'halted' OR NEW.status = 'past_due') THEN
            -- Revert to starter if subscription is no longer active
            UPDATE public.user_profiles
            SET plan_type = 'starter'
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_sync_subscription ON public.subscriptions;
CREATE TRIGGER trigger_sync_subscription
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_subscription_to_profile();
