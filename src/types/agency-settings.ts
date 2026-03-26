export interface AgencySettings {
  id: string;
  user_id: string;
  default_currency: string;
  default_markup_type: 'percentage' | 'flat';
  default_markup_value: number;
  default_tax_percentage: number;
  gst_number: string | null;
  bank_details: string | null;
  terms_conditions: string | null;
  agent_signature: string | null;
  created_at: string;
  updated_at: string;
}
