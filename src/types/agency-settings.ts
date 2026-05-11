export interface AgencySettings {
  id: string;
  user_id: string;
  default_currency: string;
  default_markup_type: 'percentage' | 'flat';
  default_markup_value: number;
  default_tax_percentage: number;
  default_commission_rate: number | null;
  gst_number: string | null;
  bank_details: string | null;
  terms_conditions: string | null;
  agent_signature: string | null;
  brand_name: string | null;
  default_pdf_filename_template: string | null;
  
  // Operational Defaults
  default_booking_currency: string;
  default_hotel_check_in: string;
  default_hotel_check_out: string;
  default_hotel_star_rating: number;
  default_cab_vehicle_type: string;
  default_bus_type: string;
  default_bus_reporting_time: string;
  default_bus_departure_time: string;
  default_meal_plan: string;

  created_at: string;
  updated_at: string;
}

