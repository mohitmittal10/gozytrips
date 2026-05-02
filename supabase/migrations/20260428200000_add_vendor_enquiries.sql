-- Create vendor_enquiries table
CREATE TABLE IF NOT EXISTS public.vendor_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE SET NULL,
    enquiry_type TEXT NOT NULL,
    vendor_email TEXT,
    payload JSONB NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.vendor_enquiries ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own vendor enquiries"
        ON public.vendor_enquiries FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own vendor enquiries"
        ON public.vendor_enquiries FOR INSERT
        WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own vendor enquiries"
        ON public.vendor_enquiries FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete their own vendor enquiries"
        ON public.vendor_enquiries FOR DELETE
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Updated at trigger
DROP TRIGGER IF EXISTS set_vendor_enquiries_updated_at ON public.vendor_enquiries;
CREATE TRIGGER set_vendor_enquiries_updated_at
    BEFORE UPDATE ON public.vendor_enquiries
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_user_id ON public.vendor_enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_client_id ON public.vendor_enquiries(client_id);
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_itinerary_id ON public.vendor_enquiries(itinerary_id);
