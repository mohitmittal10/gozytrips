-- Persist AI Architect draft state in public.itineraries
ALTER TABLE public.itineraries
    ADD COLUMN IF NOT EXISTS generation_preferences JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS selected_theme TEXT DEFAULT 'classic',
    ADD COLUMN IF NOT EXISTS show_timestamps BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_prices BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS optimization_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pdf_overrides JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS draft_source_itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_itineraries_user_status_last_activity
    ON public.itineraries (user_id, status, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_itineraries_draft_source
    ON public.itineraries (draft_source_itinerary_id);
