-- Migration: Add agent_signature to agency_settings
-- Description: Adds a column for the agent's email signature which can be used in communications.

ALTER TABLE public.agency_settings
    ADD COLUMN IF NOT EXISTS agent_signature TEXT;
