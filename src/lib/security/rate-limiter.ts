/**
 * @fileOverview Per-user, per-action rate limiter for AI server actions.
 *
 * Uses the `rate_limits` Supabase table to persist counts across serverless
 * invocations. Windows are fixed (e.g. per-minute, per-hour) and are keyed
 * by (user_id, action, window_start).
 *
 * Usage:
 *   await checkRateLimit(userId, 'ai_generation', { maxCalls: 30, windowSeconds: 60 });
 *   // Throws RateLimitError if limit exceeded.
 */

import { createClient } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  public retryAfterSeconds: number;
  constructor(action: string, retryAfterSeconds: number) {
    super(
      `Rate limit exceeded for "${action}". You've reached the maximum number of AI requests. ` +
      `Please wait ${retryAfterSeconds} seconds before trying again.`
    );
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RateLimitOptions {
  /** Maximum number of calls allowed in the window. */
  maxCalls: number;
  /** Duration of the rate-limit window in seconds. */
  windowSeconds: number;
}

// ── Defaults per action ───────────────────────────────────────────────────────

export const RATE_LIMIT_DEFAULTS: Record<string, RateLimitOptions> = {
  ai_generation:      { maxCalls: 30,  windowSeconds: 60  },  // 30 per minute
  day_regeneration:   { maxCalls: 20,  windowSeconds: 60  },  // 20 per minute
  client_update:      { maxCalls: 40,  windowSeconds: 60  },  // 40 per minute
  vendor_enquiry:     { maxCalls: 20,  windowSeconds: 60  },  // 20 per minute
  day_summaries:      { maxCalls: 30,  windowSeconds: 60  },  // 30 per minute
};

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Checks and increments the rate-limit counter for a given user + action.
 * Throws `RateLimitError` if the limit is exceeded.
 *
 * @param userId        - Supabase user UUID
 * @param action        - Action identifier (e.g. 'ai_generation')
 * @param options       - Override defaults
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  options?: Partial<RateLimitOptions>
): Promise<void> {
  const config = { ...RATE_LIMIT_DEFAULTS[action], ...options };

  if (!config.maxCalls || !config.windowSeconds) {
    // Unknown action — apply a safe default
    config.maxCalls = 20;
    config.windowSeconds = 60;
  }

  // Use service role client to bypass RLS for atomic upsert
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Compute window_start by truncating the current time to the window boundary
  const now = new Date();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const windowStartISO = windowStart.toISOString();

  // Fetch current count for this window
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, call_count')
    .eq('user_id', userId)
    .eq('action', action)
    .eq('window_start', windowStartISO)
    .maybeSingle();

  if (fetchError) {
    // If we can't read the table, fail open (don't block legitimate users)
    console.error('[RateLimiter] Failed to fetch rate limit row:', fetchError.message);
    return;
  }

  const currentCount = existing?.call_count ?? 0;

  if (currentCount >= config.maxCalls) {
    // Calculate seconds remaining in the window
    const windowEndMs = windowStart.getTime() + windowMs;
    const retryAfter = Math.ceil((windowEndMs - now.getTime()) / 1000);
    throw new RateLimitError(action, retryAfter);
  }

  // Increment (upsert)
  if (existing) {
    await supabase
      .from('rate_limits')
      .update({ call_count: currentCount + 1, updated_at: now.toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        action,
        window_start: windowStartISO,
        call_count: 1,
        updated_at: now.toISOString(),
      });
  }

  // Background cleanup: delete windows older than 24 hours for this user
  // Fire-and-forget — don't await so it doesn't slow down the request
  supabase
    .from('rate_limits')
    .delete()
    .eq('user_id', userId)
    .lt('window_start', new Date(now.getTime() - 86_400_000).toISOString())
    .then(() => {/* silent */});
}
