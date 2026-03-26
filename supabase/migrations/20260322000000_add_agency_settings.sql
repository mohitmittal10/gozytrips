-- Migration to add agency_settings table for dynamic CRM settings

CREATE TABLE IF NOT EXISTS public.agency_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    default_currency TEXT DEFAULT 'USD',
    default_markup_type TEXT DEFAULT 'percentage',
    default_markup_value NUMERIC DEFAULT 0,
    default_tax_percentage NUMERIC DEFAULT 0,
    gst_number TEXT,
    bank_details TEXT,
    terms_conditions TEXT,
    agent_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own agency settings"
    ON public.agency_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agency settings"
    ON public.agency_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agency settings"
    ON public.agency_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_agency_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_agency_settings_updated_at ON public.agency_settings;
CREATE TRIGGER trigger_agency_settings_updated_at
    BEFORE UPDATE ON public.agency_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_agency_settings_updated_at();

-- Add pre-inserted defaults for existing users (optional)
INSERT INTO public.agency_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
