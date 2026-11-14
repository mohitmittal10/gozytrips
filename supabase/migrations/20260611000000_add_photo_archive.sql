-- Migration: Add photo_archive table for saving generated and uploaded travel photos
-- Enables agents to build a reusable photo archive and swap itinerary photos effortlessly.

CREATE TABLE IF NOT EXISTS public.photo_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    destination TEXT,
    search_term TEXT,
    source TEXT NOT NULL DEFAULT 'generated' CHECK (source IN ('generated', 'uploaded', 'manual')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_photo_url UNIQUE(user_id, url)
);

-- Indexes for lightning-fast archive lookups and filtering
CREATE INDEX IF NOT EXISTS idx_photo_archive_user_created 
    ON public.photo_archive (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_archive_user_dest 
    ON public.photo_archive (user_id, destination);

CREATE INDEX IF NOT EXISTS idx_photo_archive_user_search 
    ON public.photo_archive (user_id, search_term);

-- Enable Row Level Security
ALTER TABLE public.photo_archive ENABLE ROW LEVEL SECURITY;

-- Policies for user ownership & viewing global/own photos
DROP POLICY IF EXISTS "Users can view their own and global photos" ON public.photo_archive;
CREATE POLICY "Users can view their own and global photos"
    ON public.photo_archive FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own photos" ON public.photo_archive;
CREATE POLICY "Users can insert their own photos"
    ON public.photo_archive FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own photos" ON public.photo_archive;
CREATE POLICY "Users can update their own photos"
    ON public.photo_archive FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photo_archive;
CREATE POLICY "Users can delete their own photos"
    ON public.photo_archive FOR DELETE
    USING (auth.uid() = user_id);

-- Explicit grants for PostgREST Data API
GRANT ALL ON TABLE public.photo_archive TO authenticated;
GRANT ALL ON TABLE public.photo_archive TO service_role;
GRANT SELECT ON TABLE public.photo_archive TO anon;
