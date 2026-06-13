-- Migration: Add itinerary push-to-client columns
-- Adds two fields to client_enquiry_responses:
--   itinerary_visible_to_client: agent explicitly enables this to show itinerary in client portal
--   itinerary_last_pushed_at:    timestamp of when agent last pushed the itinerary update

ALTER TABLE client_enquiry_responses
  ADD COLUMN IF NOT EXISTS itinerary_visible_to_client boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS itinerary_last_pushed_at timestamptz;

COMMENT ON COLUMN client_enquiry_responses.itinerary_visible_to_client IS
  'When true, the itinerary tab is visible to the client in their portal dashboard. Agent must explicitly push.';

COMMENT ON COLUMN client_enquiry_responses.itinerary_last_pushed_at IS
  'Timestamp of the last time the agent pushed an itinerary update to the client dashboard.';
