-- Add Pipeline value and status fields to itineraries table
ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS expected_value numeric,
ADD COLUMN IF NOT EXISTS loss_reason text,
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Create itinerary_status_events table
CREATE TABLE IF NOT EXISTS public.itinerary_status_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    itinerary_id uuid not null references public.itineraries(id) on delete cascade,
    from_status text,
    to_status text not null,
    changed_by uuid references auth.users(id),
    notes text,
    changed_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE public.itinerary_status_events ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for itinerary_status_events
DROP POLICY IF EXISTS "Users can insert their own status events" ON public.itinerary_status_events;
CREATE POLICY "Users can insert their own status events"
    ON public.itinerary_status_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own status events" ON public.itinerary_status_events;
CREATE POLICY "Users can read their own status events"
    ON public.itinerary_status_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own status events" ON public.itinerary_status_events;
CREATE POLICY "Users can update their own status events"
    ON public.itinerary_status_events
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own status events" ON public.itinerary_status_events;
CREATE POLICY "Users can delete their own status events"
    ON public.itinerary_status_events
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Optional: trigger to update last_activity_at automatically when rows are modified in itineraries
CREATE OR REPLACE FUNCTION update_last_activity_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_itineraries_last_activity ON public.itineraries;
CREATE TRIGGER trigger_update_itineraries_last_activity
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW
    EXECUTE PROCEDURE update_last_activity_at();
