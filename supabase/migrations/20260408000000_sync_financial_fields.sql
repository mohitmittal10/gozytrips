-- Migration: Sync Financial and Pricing Fields to Database
-- Description: Adds detailed financial columns to itineraries and creates tables for payments/expenses.

-- 1. Update itineraries table with new financial and pricing columns
ALTER TABLE public.itineraries
    ADD COLUMN IF NOT EXISTS trip_id TEXT,
    ADD COLUMN IF NOT EXISTS client_price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS markup_value NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage',
    ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS adult_pax INT DEFAULT 2,
    ADD COLUMN IF NOT EXISTS child_pax INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS infant_pax INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS costing_type TEXT DEFAULT 'automatic';

-- 2. Create trip_payments table
CREATE TABLE IF NOT EXISTS public.trip_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    method TEXT NOT NULL DEFAULT 'bank_transfer',
    type TEXT NOT NULL DEFAULT 'partial',
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create trip_expenses table (Vendor Costs)
CREATE TABLE IF NOT EXISTS public.trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'other',
    vendor TEXT,
    description TEXT,
    amount NUMERIC NOT NULL DEFAULT 0,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable RLS
ALTER TABLE public.trip_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;

-- 5. Policies for trip_payments
CREATE POLICY "Users can manage payments for their itineraries"
    ON public.trip_payments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries
            WHERE itineraries.id = trip_payments.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

-- 6. Policies for trip_expenses
CREATE POLICY "Users can manage expenses for their itineraries"
    ON public.trip_expenses
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries
            WHERE itineraries.id = trip_expenses.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

-- 7. Add triggers for updated_at
CREATE TRIGGER set_trip_payments_updated_at
    BEFORE UPDATE ON public.trip_payments
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_trip_expenses_updated_at
    BEFORE UPDATE ON public.trip_expenses
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_payments_itinerary_id ON public.trip_payments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_itinerary_id ON public.trip_expenses(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);
