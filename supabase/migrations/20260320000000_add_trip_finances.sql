-- Ensure the updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.trip_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    net_cost NUMERIC NOT NULL DEFAULT 0,
    markup_percentage NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.trip_line_items ENABLE ROW LEVEL SECURITY;

-- Policies for trip_line_items
-- Agents can manage their own line items by checking the parent itinerary
CREATE POLICY "Users can manage line items for their itineraries"
    ON public.trip_line_items
    USING (
        EXISTS (
            SELECT 1 FROM public.itineraries
            WHERE itineraries.id = trip_line_items.itinerary_id
            AND itineraries.user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER set_trip_line_items_updated_at
    BEFORE UPDATE ON public.trip_line_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_line_items_itinerary_id ON public.trip_line_items(itinerary_id);
