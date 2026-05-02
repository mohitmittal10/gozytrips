-- Create reference_options table
CREATE TABLE IF NOT EXISTS public.reference_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    scope text NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reference_options ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view global and their own reference options"
    ON public.reference_options FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own reference options"
    ON public.reference_options FOR ALL
    USING (auth.uid() = user_id);

-- Add default_commission_rate to agency_settings
ALTER TABLE public.agency_settings 
ADD COLUMN IF NOT EXISTS default_commission_rate numeric DEFAULT 0;

-- Populate reference_options with defaults
INSERT INTO public.reference_options (scope, value, label, sort_order) VALUES
('currency', 'INR', 'Indian Rupee (INR)', 1),
('currency', 'USD', 'US Dollar (USD)', 2),
('currency', 'EUR', 'Euro (EUR)', 3),
('currency', 'GBP', 'British Pound (GBP)', 4),
('currency', 'AUD', 'Australian Dollar (AUD)', 5),
('currency', 'CAD', 'Canadian Dollar (CAD)', 6),
('currency', 'SGD', 'Singapore Dollar (SGD)', 7),
('currency', 'AED', 'UAE Dirham (AED)', 8),

('pricing_tier', 'Standard', 'Standard', 1),
('pricing_tier', 'Premium', 'Premium', 2),
('pricing_tier', 'Luxury', 'Luxury', 3),

('manual_cost_category', 'Flight', 'Flight', 1),
('manual_cost_category', 'Hotel', 'Hotel', 2),
('manual_cost_category', 'Transport', 'Transport', 3),
('manual_cost_category', 'Activity', 'Activity', 4),
('manual_cost_category', 'Visa', 'Visa', 5),
('manual_cost_category', 'Insurance', 'Insurance', 6),
('manual_cost_category', 'Other', 'Other', 7),

('payment_method', 'bank_transfer', 'Bank Transfer', 1),
('payment_method', 'upi', 'UPI', 2),
('payment_method', 'card', 'Card', 3),
('payment_method', 'cash', 'Cash', 4),
('payment_method', 'other', 'Other', 5),

('payment_type', 'advance', 'Advance', 1),
('payment_type', 'partial', 'Partial', 2),
('payment_type', 'balance', 'Balance', 3),
('payment_type', 'final', 'Final', 4),

('expense_category', 'hotel', 'Hotel', 1),
('expense_category', 'flight', 'Flight', 2),
('expense_category', 'transport', 'Transport', 3),
('expense_category', 'activity', 'Activity', 4),
('expense_category', 'visa', 'Visa', 5),
('expense_category', 'insurance', 'Insurance', 6),
('expense_category', 'food', 'Food', 7),
('expense_category', 'guide', 'Guide', 8),
('expense_category', 'other', 'Other', 9),

('markup_type', 'percentage', 'Percentage (%)', 1),
('markup_type', 'flat', 'Flat Fee', 2);
