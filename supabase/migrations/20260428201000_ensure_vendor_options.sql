-- Ensure standard reference options for vendor enquiries exist
-- This ensures the UI dropdowns are not empty without hardcoding values in the frontend.

-- Add unique constraint if it doesn't exist to allow ON CONFLICT
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reference_options_scope_value_key') THEN
        ALTER TABLE public.reference_options ADD CONSTRAINT reference_options_scope_value_key UNIQUE (scope, value);
    END IF;
END $$;

-- 1. Meal Plans
INSERT INTO public.reference_options (scope, value, label, sort_order)
VALUES 
    ('meal_plan', 'EP', 'EP (Room Only)', 1),
    ('meal_plan', 'CP', 'CP (Breakfast)', 2),
    ('meal_plan', 'MAP', 'MAP (Breakfast + Dinner)', 3),
    ('meal_plan', 'AP', 'AP (All Meals)', 4)
ON CONFLICT (scope, value) DO NOTHING;

-- 2. Vehicle Types
INSERT INTO public.reference_options (scope, value, label, sort_order)
VALUES 
    ('vehicle_type', 'Sedan', 'Sedan (4 seater)', 1),
    ('vehicle_type', 'SUV', 'SUV (6-7 seater)', 2),
    ('vehicle_type', 'Tempo Traveller', 'Tempo Traveller (12-16 seater)', 3),
    ('vehicle_type', 'Mini Bus', 'Mini Bus (20-25 seater)', 4),
    ('vehicle_type', 'Bus', 'Bus (40+ seater)', 5)
ON CONFLICT (scope, value) DO NOTHING;

-- 3. Insurance Coverage Types
INSERT INTO public.reference_options (scope, value, label, sort_order)
VALUES 
    ('insurance_coverage', 'Comprehensive', 'Comprehensive', 1),
    ('insurance_coverage', 'Medical Only', 'Medical Only', 2),
    ('insurance_coverage', 'Trip Cancellation', 'Trip Cancellation', 3),
    ('insurance_coverage', 'Adventure Sports', 'Adventure Sports', 4)
ON CONFLICT (scope, value) DO NOTHING;

-- Also add 'coverage_type' as an alias just in case
INSERT INTO public.reference_options (scope, value, label, sort_order)
VALUES 
    ('coverage_type', 'Comprehensive', 'Comprehensive', 1),
    ('coverage_type', 'Medical Only', 'Medical Only', 2),
    ('coverage_type', 'Trip Cancellation', 'Trip Cancellation', 3),
    ('coverage_type', 'Adventure Sports', 'Adventure Sports', 4)
ON CONFLICT (scope, value) DO NOTHING;

-- 4. Vendor Enquiry Types
INSERT INTO public.reference_options (scope, value, label, sort_order, metadata)
VALUES 
    ('vendor_enquiry_type', 'hotel', 'Hotel', 1, '{"icon": "Building2", "color": "text-blue-400", "bg": "bg-blue-500/10", "border": "border-blue-500/20"}'),
    ('vendor_enquiry_type', 'transport', 'Transport', 2, '{"icon": "Car", "color": "text-orange-400", "bg": "bg-orange-500/10", "border": "border-orange-500/20"}'),
    ('vendor_enquiry_type', 'activities', 'Activities', 3, '{"icon": "Compass", "color": "text-emerald-400", "bg": "bg-emerald-500/10", "border": "border-emerald-500/20"}'),
    ('vendor_enquiry_type', 'visa', 'Visa', 4, '{"icon": "FileCheck", "color": "text-fuchsia-400", "bg": "bg-fuchsia-500/10", "border": "border-fuchsia-500/20"}'),
    ('vendor_enquiry_type', 'insurance', 'Insurance', 5, '{"icon": "Shield", "color": "text-blue-500", "bg": "bg-blue-600/10", "border": "border-blue-600/20"}')
ON CONFLICT (scope, value) DO NOTHING;
