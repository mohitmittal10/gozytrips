-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: Client Enquiry Forms Feature
-- Created: 2026-06-01
-- Purpose: Enables agents to create shareable enquiry forms for clients.
--          Clients sign up with a lightweight Supabase account (email + password),
--          fill in their travel preferences, and agents convert responses into
--          pre-filled itinerary generation forms in The Lab.
-- ──────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────
-- TABLE 1: client_enquiry_forms
-- Agent-owned form definitions. Each form has a
-- unique share_token used in the public portal URL.
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_enquiry_forms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL DEFAULT 'Travel Enquiry Form',
  description     TEXT,
  share_token     TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('draft', 'active', 'expired', 'archived')),
  expires_at      TIMESTAMPTZ,       -- NULL = never expires
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for client_enquiry_forms
CREATE INDEX IF NOT EXISTS idx_cef_user_id
  ON client_enquiry_forms (user_id);

CREATE INDEX IF NOT EXISTS idx_cef_share_token
  ON client_enquiry_forms (share_token)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_cef_client_id
  ON client_enquiry_forms (client_id)
  WHERE client_id IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_client_enquiry_forms_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cef_updated_at
  BEFORE UPDATE ON client_enquiry_forms
  FOR EACH ROW EXECUTE FUNCTION update_client_enquiry_forms_updated_at();


-- ─────────────────────────────────────────────────
-- TABLE 2: client_enquiry_responses
-- Stores a client's submitted travel preferences.
-- client_user_id → the client's Supabase Auth account
-- (Option B: lightweight client accounts).
-- All itinerary fields mirror TheLabFormValues exactly
-- so they map 1:1 into The Lab form on conversion.
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_enquiry_responses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id                 UUID NOT NULL REFERENCES client_enquiry_forms(id) ON DELETE CASCADE,
  client_user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- lightweight client account
  client_email            TEXT NOT NULL,
  client_name             TEXT,
  status                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'viewed', 'converted', 'archived')),

  -- ── Itinerary fields (mirror TheLabFormValues) ──────────────────
  starting_location       TEXT,
  destinations            TEXT,
  ending_location         TEXT,
  start_date              DATE,
  end_date                DATE,
  adult_pax               INT NOT NULL DEFAULT 1 CHECK (adult_pax >= 0),
  child_pax               INT NOT NULL DEFAULT 0 CHECK (child_pax >= 0),
  infant_pax              INT NOT NULL DEFAULT 0 CHECK (infant_pax >= 0),
  trip_type               TEXT CHECK (trip_type IN (
                            'adventurous','scenic','relaxed','cultural',
                            'romantic','family','foodie'
                          )),
  travel_methods          TEXT[] DEFAULT '{}',
  must_include            TEXT,
  avoid                   TEXT,
  leisure_time            BOOLEAN NOT NULL DEFAULT FALSE,
  leisure_day             INT CHECK (leisure_day BETWEEN 1 AND 30),
  travel_time_preference  TEXT CHECK (travel_time_preference IN (
                            'no_preference','avoid_night_travel',
                            'prefer_morning_travel','prefer_afternoon_travel',
                            'prefer_night_travel'
                          )),
  -- ── Additional client-only fields ──────────────────────────────
  budget                  NUMERIC(12, 2),
  currency                TEXT NOT NULL DEFAULT 'INR',
  special_requests        TEXT,      -- free-form notes from client
  raw_payload             JSONB,     -- full form snapshot (forward compat)

  -- ── Timestamps & conversion tracking ──────────────────────────
  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at               TIMESTAMPTZ,
  converted_at            TIMESTAMPTZ,
  converted_itinerary_id  UUID REFERENCES itineraries(id) ON DELETE SET NULL
);

-- Indexes for client_enquiry_responses
CREATE INDEX IF NOT EXISTS idx_cer_form_id
  ON client_enquiry_responses (form_id);

CREATE INDEX IF NOT EXISTS idx_cer_client_user_id
  ON client_enquiry_responses (client_user_id)
  WHERE client_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cer_status
  ON client_enquiry_responses (form_id, status);

CREATE INDEX IF NOT EXISTS idx_cer_submitted_at
  ON client_enquiry_responses (form_id, submitted_at DESC);


-- ─────────────────────────────────────────────────
-- RLS: client_enquiry_forms
-- ─────────────────────────────────────────────────
ALTER TABLE client_enquiry_forms ENABLE ROW LEVEL SECURITY;

-- Agents: full control over their own forms
CREATE POLICY "cef_agent_all"
  ON client_enquiry_forms
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public (anon/authenticated): read active forms by share_token only.
-- The API route does the share_token lookup and returns only safe fields.
-- This policy allows the Supabase client to query by share_token from
-- the public client portal (no agent auth required).
CREATE POLICY "cef_public_read_active"
  ON client_enquiry_forms
  FOR SELECT
  USING (
    status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Service role: unrestricted (for admin API routes)
CREATE POLICY "cef_service_role"
  ON client_enquiry_forms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────
-- RLS: client_enquiry_responses
-- ─────────────────────────────────────────────────
ALTER TABLE client_enquiry_responses ENABLE ROW LEVEL SECURITY;

-- Agents: read/update responses that belong to their forms
CREATE POLICY "cer_agent_read_own_form_responses"
  ON client_enquiry_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_enquiry_forms f
      WHERE f.id = form_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "cer_agent_update_own_form_responses"
  ON client_enquiry_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_enquiry_forms f
      WHERE f.id = form_id
        AND f.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_enquiry_forms f
      WHERE f.id = form_id
        AND f.user_id = auth.uid()
    )
  );

-- Clients (authenticated): read only their own responses
CREATE POLICY "cer_client_read_own"
  ON client_enquiry_responses
  FOR SELECT
  USING (auth.uid() = client_user_id);

-- Public insert: anyone with a valid form context can submit.
-- Token/session validation is enforced in the API route (server-side).
CREATE POLICY "cer_public_insert"
  ON client_enquiry_responses
  FOR INSERT
  WITH CHECK (true);

-- Service role: unrestricted
CREATE POLICY "cer_service_role"
  ON client_enquiry_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────
-- GRANTS: expose tables to the Data API
-- ─────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON client_enquiry_forms     TO authenticated;
GRANT SELECT, INSERT                  ON client_enquiry_forms     TO anon;
GRANT SELECT, INSERT, UPDATE          ON client_enquiry_responses TO authenticated;
GRANT INSERT                          ON client_enquiry_responses TO anon;


-- ─────────────────────────────────────────────────
-- COMMENTS (documentation)
-- ─────────────────────────────────────────────────
COMMENT ON TABLE client_enquiry_forms IS
  'Agent-created enquiry form templates shared with clients via a unique share_token URL.';

COMMENT ON TABLE client_enquiry_responses IS
  'Client-submitted travel preference responses. Fields mirror TheLabFormValues for 1:1 conversion into The Lab itinerary form.';

COMMENT ON COLUMN client_enquiry_responses.raw_payload IS
  'Full JSON snapshot of the submitted form for forward compatibility when new fields are added.';

COMMENT ON COLUMN client_enquiry_responses.converted_itinerary_id IS
  'Set when the agent converts this response into an itinerary via The Lab one-click flow.';
