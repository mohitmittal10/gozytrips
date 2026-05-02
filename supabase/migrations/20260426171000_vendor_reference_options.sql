-- Add additional reference options for vendor enquiry
INSERT INTO public.reference_options (scope, value, label, sort_order, metadata) VALUES
-- Enquiry Types
('enquiry_type', 'hotel', 'Hotel', 1, '{"icon": "Building2", "color": "text-blue-400", "bg": "bg-blue-500/10", "border": "border-blue-500/20"}'),
('enquiry_type', 'transport', 'Transport', 2, '{"icon": "Car", "color": "text-emerald-400", "bg": "bg-emerald-500/10", "border": "border-emerald-500/20"}'),
('enquiry_type', 'activities', 'Activities', 3, '{"icon": "Compass", "color": "text-amber-400", "bg": "bg-amber-500/10", "border": "border-amber-500/20"}'),
('enquiry_type', 'visa', 'Visa', 4, '{"icon": "FileCheck", "color": "text-pink-400", "bg": "bg-pink-500/10", "border": "border-pink-500/20"}'),
('enquiry_type', 'insurance', 'Insurance', 5, '{"icon": "Shield", "color": "text-cyan-400", "bg": "bg-cyan-500/10", "border": "border-cyan-500/20"}'),

-- Meal Plans
('meal_plan', 'EP', 'EP (Room Only)', 1, '{}'),
('meal_plan', 'CP', 'CP (Breakfast)', 2, '{}'),
('meal_plan', 'MAP', 'MAP (Breakfast + Dinner)', 3, '{}'),
('meal_plan', 'AP', 'AP (All Meals)', 4, '{}'),

-- Vehicle Types
('vehicle_type', 'Sedan', 'Sedan (4 seater)', 1, '{}'),
('vehicle_type', 'SUV', 'SUV (6-7 seater)', 2, '{}'),
('vehicle_type', 'Tempo Traveller', 'Tempo Traveller (12-16 seater)', 3, '{}'),
('vehicle_type', 'Mini Bus', 'Mini Bus (20-25 seater)', 4, '{}'),
('vehicle_type', 'Bus', 'Bus (40+ seater)', 5, '{}'),

-- Coverage Types
('coverage_type', 'Comprehensive', 'Comprehensive', 1, '{}'),
('coverage_type', 'Medical Only', 'Medical Only', 2, '{}'),
('coverage_type', 'Trip Cancellation', 'Trip Cancellation', 3, '{}'),
('coverage_type', 'Adventure Sports', 'Adventure Sports', 4, '{}');
