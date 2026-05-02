-- Create sequence for Trip IDs starting at 1001
CREATE SEQUENCE IF NOT EXISTS trip_id_seq START 1001;

-- Function to generate human-readable Trip ID (GT-XXXX)
CREATE OR REPLACE FUNCTION generate_trip_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'GT-' || nextval('trip_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set trip_id on insert if null
CREATE OR REPLACE FUNCTION set_trip_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trip_id IS NULL THEN
        NEW.trip_id := generate_trip_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to itineraries table
DROP TRIGGER IF EXISTS trg_set_trip_id ON itineraries;
CREATE TRIGGER trg_set_trip_id
    BEFORE INSERT ON itineraries
    FOR EACH ROW
    EXECUTE FUNCTION set_trip_id();

-- Migrate existing null trip_ids (one-time)
-- We use a loop or a simple update if we want to ensure sequentiality for existing records
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id FROM itineraries WHERE trip_id IS NULL ORDER BY created_at ASC LOOP
        UPDATE itineraries SET trip_id = generate_trip_id() WHERE id = rec.id;
    END LOOP;
END;
$$;

-- Add unique index to trip_id
-- We use a unique index instead of a constraint to allow for potential future flexibility 
-- if we ever need to "soft delete" or similar, though a unique constraint is also fine.
CREATE UNIQUE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
