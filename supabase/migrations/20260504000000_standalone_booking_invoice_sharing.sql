-- Migration: add secure invoice sharing to standalone_bookings

ALTER TABLE public.standalone_bookings
ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS share_enabled boolean DEFAULT false;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_standalone_bookings_share_token ON public.standalone_bookings(share_token);
