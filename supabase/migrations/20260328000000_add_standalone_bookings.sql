-- Create ENUM types for Standalone Bookings
CREATE TYPE booking_service_type AS ENUM ('flight', 'cab', 'bus', 'train', 'hotel');
CREATE TYPE booking_status AS ENUM ('draft', 'quoted', 'confirmed', 'cancelled');

-- Create Standalone Bookings Table
CREATE TABLE standalone_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    service_type booking_service_type NOT NULL,
    status booking_status DEFAULT 'draft',
    
    -- Schemaless JSON field for flexibility across flights/cabs/trains
    booking_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Financials linked to this specific booking
    net_cost NUMERIC(10,2) DEFAULT 0,
    markup_percentage NUMERIC(5,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE standalone_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own standalone bookings"
    ON standalone_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own standalone bookings"
    ON standalone_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own standalone bookings"
    ON standalone_bookings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own standalone bookings"
    ON standalone_bookings FOR DELETE
    USING (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_standalone_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_standalone_bookings_updated_at
    BEFORE UPDATE ON standalone_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_standalone_bookings_updated_at();
