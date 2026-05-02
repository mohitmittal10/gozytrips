-- Migration to add user_form_drafts table for cross-device persistence of unsaved form states
-- This prevents data loss when a user refreshes the page mid-edit.

CREATE TABLE IF NOT EXISTS public.user_form_drafts (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_key TEXT NOT NULL, -- e.g., 'client:new', 'client:<uuid>', 'booking:new', 'profile', 'crm_settings'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, form_key)
);

-- Enable RLS
ALTER TABLE public.user_form_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can manage their own drafts" ON public.user_form_drafts;
CREATE POLICY "Users can manage their own drafts"
    ON public.user_form_drafts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_form_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_user_form_drafts_updated_at ON public.user_form_drafts;
CREATE TRIGGER trigger_user_form_drafts_updated_at
    BEFORE UPDATE ON public.user_form_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_form_drafts_updated_at();

-- Comment on table for documentation
COMMENT ON TABLE public.user_form_drafts IS 'Stores unsaved form states to prevent data loss on refresh/crash.';
