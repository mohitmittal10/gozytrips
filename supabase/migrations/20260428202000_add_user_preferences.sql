-- Migration to add user_preferences table for cross-device persistence
-- This table stores user-specific UI preferences like column visibility, filters, and onboarding states.

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    crm_visible_columns JSONB DEFAULT '[]'::jsonb,
    crm_sort JSONB DEFAULT '{}'::jsonb,
    crm_filters JSONB DEFAULT '{}'::jsonb,
    crm_filter_presets JSONB DEFAULT '[]'::jsonb,
    crm_last_viewed_activity_at TIMESTAMP WITH TIME ZONE,
    crm_deadline_range INTEGER DEFAULT 7,
    default_pdf_theme TEXT DEFAULT 'classic',
    my_trips_preferences JSONB DEFAULT '{}'::jsonb,
    backup_prompt_dismissed BOOLEAN DEFAULT false,
    pending_import_backup BOOLEAN DEFAULT false,
    pdf_preview_zoom NUMERIC DEFAULT 1.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Add default preferences for existing users
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
