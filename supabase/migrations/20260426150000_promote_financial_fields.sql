-- Migration: Promote Currency and Financial Timestamp
-- Description: Adds normalized currency and updated_financial_at columns to itineraries to act as the single source of truth for financial calculations.

ALTER TABLE public.itineraries
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS updated_financial_at TIMESTAMPTZ;

-- Backfill existing records with currency from itinerary_data.pricing.currency if available
UPDATE public.itineraries
SET currency = COALESCE(
    itinerary_data->'pricing'->>'currency',
    'INR'
)
WHERE currency = 'INR';
