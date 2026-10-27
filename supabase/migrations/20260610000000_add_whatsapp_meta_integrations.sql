-- Migration: Add whatsapp_meta_integrations table for WhatsApp & Meta lead ingestion
-- Allows travel agents to connect WhatsApp Business & Meta Lead Ads for automatic lead ingestion
-- without requiring manual curl or POST requests.

CREATE TABLE IF NOT EXISTS public.whatsapp_meta_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'meta_whatsapp',
    status TEXT NOT NULL DEFAULT 'connected',
    meta_page_name TEXT,
    meta_ad_account_id TEXT,
    meta_form_id TEXT,
    meta_access_token TEXT,
    waba_id TEXT,
    phone_number_id TEXT,
    verify_token TEXT,
    auto_sync BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 5,
    last_synced_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    leads_ingested_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_whatsapp_meta UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.whatsapp_meta_integrations ENABLE ROW LEVEL SECURITY;

-- Policies for user ownership
DROP POLICY IF EXISTS "Users can view their own whatsapp meta integration" ON public.whatsapp_meta_integrations;
CREATE POLICY "Users can view their own whatsapp meta integration"
    ON public.whatsapp_meta_integrations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own whatsapp meta integration" ON public.whatsapp_meta_integrations;
CREATE POLICY "Users can insert their own whatsapp meta integration"
    ON public.whatsapp_meta_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own whatsapp meta integration" ON public.whatsapp_meta_integrations;
CREATE POLICY "Users can update their own whatsapp meta integration"
    ON public.whatsapp_meta_integrations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own whatsapp meta integration" ON public.whatsapp_meta_integrations;
CREATE POLICY "Users can delete their own whatsapp meta integration"
    ON public.whatsapp_meta_integrations FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_whatsapp_meta_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_whatsapp_meta_integrations_updated_at ON public.whatsapp_meta_integrations;
CREATE TRIGGER trigger_whatsapp_meta_integrations_updated_at
    BEFORE UPDATE ON public.whatsapp_meta_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_meta_integrations_updated_at();

COMMENT ON TABLE public.whatsapp_meta_integrations IS
    'Stores WhatsApp Business and Meta Lead Ads connection credentials and sync settings for CRM lead ingestion.';
