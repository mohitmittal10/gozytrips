-- Migration: Add missing operational and financial columns to agency_settings
-- Description: Ensures all fields in the CRM Settings UI have corresponding database columns.

ALTER TABLE public.agency_settings 
    ADD COLUMN IF NOT EXISTS default_booking_currency TEXT DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS default_hotel_check_in TEXT DEFAULT '2:00 PM',
    ADD COLUMN IF NOT EXISTS default_hotel_check_out TEXT DEFAULT '11:00 AM',
    ADD COLUMN IF NOT EXISTS default_hotel_star_rating INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS default_cab_vehicle_type TEXT DEFAULT 'SUV',
    ADD COLUMN IF NOT EXISTS default_bus_type TEXT DEFAULT 'Volvo AC',
    ADD COLUMN IF NOT EXISTS default_bus_reporting_time TEXT DEFAULT '8:30 AM',
    ADD COLUMN IF NOT EXISTS default_bus_departure_time TEXT DEFAULT '9:00 AM',
    ADD COLUMN IF NOT EXISTS default_meal_plan TEXT DEFAULT 'MAP',
    ADD COLUMN IF NOT EXISTS default_commission_rate NUMERIC DEFAULT 0;

-- Backfill defaults for existing rows if they are NULL
UPDATE public.agency_settings SET default_booking_currency = 'INR' WHERE default_booking_currency IS NULL;
UPDATE public.agency_settings SET default_hotel_check_in = '2:00 PM' WHERE default_hotel_check_in IS NULL;
UPDATE public.agency_settings SET default_hotel_check_out = '11:00 AM' WHERE default_hotel_check_out IS NULL;
UPDATE public.agency_settings SET default_hotel_star_rating = 3 WHERE default_hotel_star_rating IS NULL;
UPDATE public.agency_settings SET default_cab_vehicle_type = 'SUV' WHERE default_cab_vehicle_type IS NULL;
UPDATE public.agency_settings SET default_bus_type = 'Volvo AC' WHERE default_bus_type IS NULL;
UPDATE public.agency_settings SET default_bus_reporting_time = '8:30 AM' WHERE default_bus_reporting_time IS NULL;
UPDATE public.agency_settings SET default_bus_departure_time = '9:00 AM' WHERE default_bus_departure_time IS NULL;
UPDATE public.agency_settings SET default_meal_plan = 'MAP' WHERE default_meal_plan IS NULL;
UPDATE public.agency_settings SET default_commission_rate = 0 WHERE default_commission_rate IS NULL;
