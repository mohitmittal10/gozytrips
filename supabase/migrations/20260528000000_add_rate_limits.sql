-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: Add rate_limits table for per-user AI generation throttling
-- Created: 2026-05-28
-- Purpose: Prevents AI quota abuse by tracking per-user, per-action call counts
--          in configurable time windows.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,           -- e.g. 'ai_generation', 'day_regeneration'
  window_start TIMESTAMPTZ NOT NULL,  -- start of the current time window
  call_count  INTEGER NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per (user, action, window_start) combination
  CONSTRAINT rate_limits_user_action_window_unique UNIQUE (user_id, action, window_start)
);

-- Index for fast lookups by user + action
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action
  ON rate_limits (user_id, action, window_start DESC);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rate limit rows
CREATE POLICY "rate_limits_own_rows" ON rate_limits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all rows (for server-side upserts)
CREATE POLICY "rate_limits_service_role" ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup: delete rows older than 24 hours (prevents table bloat)
-- This is handled at the application level via the rate-limiter utility,
-- but add a comment for future cron job setup.
COMMENT ON TABLE rate_limits IS
  'Per-user AI action rate limiting. Rows older than the window_start + window_duration can be pruned.';

COMMENT ON COLUMN rate_limits.action IS
  'Identifies the rate-limited action. Current values: ai_generation, day_regeneration, client_update, vendor_enquiry, day_summaries';

COMMENT ON COLUMN rate_limits.window_start IS
  'Truncated timestamp representing the start of the rate limit window (e.g. truncated to the minute for per-minute limits).';
