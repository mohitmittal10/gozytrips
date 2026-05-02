-- Migration to decouple hardcoded options and add operational defaults

-- 1. Add operational defaults to agency_settings
ALTER TABLE public.agency_settings 
ADD COLUMN IF NOT EXISTS default_booking_currency text DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS default_hotel_check_in text DEFAULT '2:00 PM',
ADD COLUMN IF NOT EXISTS default_hotel_check_out text DEFAULT '11:00 AM',
ADD COLUMN IF NOT EXISTS default_hotel_star_rating integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS default_cab_vehicle_type text DEFAULT 'SUV',
ADD COLUMN IF NOT EXISTS default_bus_type text DEFAULT 'Volvo AC',
ADD COLUMN IF NOT EXISTS default_bus_reporting_time text DEFAULT '8:30 AM',
ADD COLUMN IF NOT EXISTS default_bus_departure_time text DEFAULT '9:00 AM',
ADD COLUMN IF NOT EXISTS default_meal_plan text DEFAULT 'MAP';

-- 2. Populate reference_options for booking_service_type
INSERT INTO public.reference_options (scope, value, label, sort_order) VALUES
('booking_service_type', 'flight', 'Flight', 1),
('booking_service_type', 'cab', 'Cab / Transfer', 2),
('booking_service_type', 'bus', 'Bus', 3),
('booking_service_type', 'train', 'Train', 4),
('booking_service_type', 'hotel', 'Hotel', 5)
ON CONFLICT DO NOTHING;

-- 3. Populate reference_options for booking_status
INSERT INTO public.reference_options (scope, value, label, sort_order) VALUES
('booking_status', 'draft', 'Draft', 1),
('booking_status', 'quoted', 'Quoted', 2),
('booking_status', 'confirmed', 'Confirmed', 3),
('booking_status', 'cancelled', 'Cancelled', 4)
ON CONFLICT DO NOTHING;

-- 4. Align vendor enquiry types (using the scope requested)
INSERT INTO public.reference_options (scope, value, label, sort_order, metadata) VALUES
('vendor_enquiry_type', 'hotel', 'Hotel', 1, '{"icon": "Building2", "color": "text-blue-400", "bg": "bg-blue-500/10", "border": "border-blue-500/20"}'),
('vendor_enquiry_type', 'transport', 'Transport', 2, '{"icon": "Car", "color": "text-emerald-400", "bg": "bg-emerald-500/10", "border": "border-emerald-500/20"}'),
('vendor_enquiry_type', 'activities', 'Activities', 3, '{"icon": "Compass", "color": "text-amber-400", "bg": "bg-amber-500/10", "border": "border-amber-500/20"}'),
('vendor_enquiry_type', 'visa', 'Visa', 4, '{"icon": "FileCheck", "color": "text-pink-400", "bg": "bg-pink-500/10", "border": "border-pink-500/20"}'),
('vendor_enquiry_type', 'insurance', 'Insurance', 5, '{"icon": "Shield", "color": "text-cyan-400", "bg": "bg-cyan-500/10", "border": "border-cyan-500/20"}')
ON CONFLICT DO NOTHING;

-- 5. Add insurance_coverage scope (duplicating coverage_type for consistency with request)
INSERT INTO public.reference_options (scope, value, label, sort_order) VALUES
('insurance_coverage', 'Comprehensive', 'Comprehensive', 1),
('insurance_coverage', 'Medical Only', 'Medical Only', 2),
('insurance_coverage', 'Trip Cancellation', 'Trip Cancellation', 3),
('insurance_coverage', 'Adventure Sports', 'Adventure Sports', 4)
ON CONFLICT DO NOTHING;
