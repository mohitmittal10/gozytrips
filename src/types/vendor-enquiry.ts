import { LucideIcon } from "lucide-react";

export type EnquiryType = string;

export interface VendorEnquiryPayload {
  destination: string;
  travelDates: string;
  adults: string;
  children: string;
  infants: string;
  specialRequests: string;
  hotelName?: string;
  roomType?: string;
  numberOfRooms?: string;
  mealPlan?: string;
  vehicleType?: string;
  route?: string;
  pickupLocation?: string;
  activityName?: string;
  destinationCountry?: string;
  nationality?: string;
  coverageType?: string;
}

export interface VendorEnquiry {
  id: string;
  user_id: string;
  client_id: string | null;
  itinerary_id: string | null;
  enquiry_type: EnquiryType;
  vendor_email: string;
  payload: VendorEnquiryPayload;
  subject: string;
  body: string;
  status: "draft" | "sent";
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnquiryTypeOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}
