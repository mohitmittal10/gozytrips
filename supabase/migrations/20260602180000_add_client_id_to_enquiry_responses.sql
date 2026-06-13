-- Migration: Add client_id to client_enquiry_responses
-- Created: 2026-06-02
-- Purpose: Links client enquiry responses to the clients table.

ALTER TABLE client_enquiry_responses
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_cer_client_id
ON client_enquiry_responses (client_id)
WHERE client_id IS NOT NULL;
