/**
 * @fileOverview TypeScript types for the Client Enquiry Forms feature.
 *
 * These types align with the DB schema in:
 *   supabase/migrations/20260601000000_add_client_enquiry_forms.sql
 *
 * Response fields mirror TheLabFormValues (src/types/the-lab.ts) for 1:1
 * conversion into The Lab itinerary generation form.
 */

// ── DB Row types ───────────────────────────────────────────────────────────────

export type EnquiryFormStatus = 'draft' | 'active' | 'expired' | 'archived';
export type EnquiryResponseStatus = 'pending' | 'viewed' | 'converted' | 'archived';

export type TripType =
  | 'adventurous' | 'scenic' | 'relaxed' | 'cultural'
  | 'romantic' | 'family' | 'foodie';

export type TravelTimePreference =
  | 'no_preference' | 'avoid_night_travel'
  | 'prefer_morning_travel' | 'prefer_afternoon_travel' | 'prefer_night_travel';

export interface ClientEnquiryForm {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  share_token: string;
  status: EnquiryFormStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields (from API)
  client_name?: string | null;
  response_count?: number;
}

export interface ClientEnquiryResponse {
  id: string;
  form_id: string;
  client_user_id: string | null;
  client_id: string | null;
  client_email: string;
  client_name: string | null;
  status: EnquiryResponseStatus;
  // Itinerary fields (mirror TheLabFormValues)
  starting_location: string | null;
  destinations: string | null;
  ending_location: string | null;
  start_date: string | null;   // ISO date string "YYYY-MM-DD"
  end_date: string | null;
  adult_pax: number;
  child_pax: number;
  infant_pax: number;
  trip_type: TripType | null;
  travel_methods: string[];
  must_include: string | null;
  avoid: string | null;
  leisure_time: boolean;
  leisure_day: number | null;
  travel_time_preference: TravelTimePreference | null;
  // Client-only extras
  budget: number | null;
  currency: string;
  special_requests: string | null;
  raw_payload: Record<string, unknown> | null;
  // Timestamps
  submitted_at: string;
  viewed_at: string | null;
  converted_at: string | null;
  converted_itinerary_id: string | null;
}

// ── API request / response shapes ─────────────────────────────────────────────

export interface CreateEnquiryFormPayload {
  title: string;
  description?: string;
  client_id?: string;
  expires_at?: string;
  status?: EnquiryFormStatus;
}

export interface SubmitEnquiryResponsePayload {
  // Identity
  client_email: string;
  client_name?: string;
  // Itinerary
  starting_location?: string;
  destinations?: string;
  ending_location?: string;
  start_date?: string;
  end_date?: string;
  adult_pax?: number;
  child_pax?: number;
  infant_pax?: number;
  trip_type?: TripType;
  travel_methods?: string[];
  must_include?: string;
  avoid?: string;
  leisure_time?: boolean;
  leisure_day?: number;
  travel_time_preference?: TravelTimePreference;
  budget?: number;
  currency?: string;
  special_requests?: string;
}

// ── Client portal session (stored in httpOnly cookie) ─────────────────────────

export interface ClientPortalSession {
  userId: string;
  email: string;
  formId: string;
  exp: number; // epoch seconds
}

// ── Public form metadata (safe subset returned to the portal page) ─────────────

export interface PublicEnquiryFormMeta {
  id: string;
  title: string;
  description: string | null;
  status: EnquiryFormStatus;
  expires_at: string | null;
  // Agent brand info (non-sensitive)
  agent_brand_name: string | null;
  agent_avatar_url: string | null;
}
