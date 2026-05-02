-- Fix inconsistent currency defaults
ALTER TABLE standalone_bookings ALTER COLUMN currency SET DEFAULT 'INR';
ALTER TABLE itineraries ALTER COLUMN currency SET DEFAULT 'INR';
ALTER TABLE agency_settings ALTER COLUMN default_currency SET DEFAULT 'INR';

-- Optional: Update any existing bookings that were created with the old 'USD' default if they are still in draft
-- Note: This is a bit risky if some were intentionally USD, but given the issue report, they were likely accidental.
-- UPDATE standalone_bookings SET currency = 'INR' WHERE currency = 'USD' AND status = 'draft';
