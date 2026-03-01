-- Migration to add travel agent fields to user_profiles

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS business_email text,
ADD COLUMN IF NOT EXISTS business_phone text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#0066cc';

-- Update RLS policies to ensure users can read/write their new fields
-- Existing policies on user_profiles should already cover these new columns
-- since RLS is applied at the row level, not the column level.
