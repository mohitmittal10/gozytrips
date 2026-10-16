/**
 * @fileOverview Per-user, per-action rate limiter for AI server actions.
 *
 * Uses the `rate_limits` Supabase table to persist counts across serverless
 * invocations. Prefers the atomic `check_and_increment_rate_limit` RPC when
 * available; falls back to a conditional update. Fail-closed for paid AI.
 */

import { createClient } from '@supabase/supabase-js';

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
  maxCalls: number;
  windowSeconds: number;
}

export const RATE_LIMIT_DEFAULTS: Record<string, RateLimitOptions> = {
  ai_generation:      { maxCalls: 30,  windowSeconds: 60  },
  day_regeneration:   { maxCalls: 20,  windowSeconds: 60  },
  client_update:      { maxCalls: 40,  windowSeconds: 60  },
  vendor_enquiry:     { maxCalls: 20,  windowSeconds: 60  },
  day_summaries:      { maxCalls: 30,  windowSeconds: 60  },
};

export async function checkRateLimit(
  userId: string,
  action: string,
  options?: Partial<RateLimitOptions>
): Promise<void> {
  const config = { ...RATE_LIMIT_DEFAULTS[action], ...options };

  if (!config.maxCalls || !config.windowSeconds) {
    config.maxCalls = 20;
    config.windowSeconds = 60;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new RateLimitError(action, 60);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const windowStartISO = windowStart.toISOString();
  const windowEndMs = windowStart.getTime() + windowMs;
  const retryAfter = Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1000));

  // Prefer atomic RPC (see migration 20260528120000_atomic_rate_limit.sql)
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'check_and_increment_rate_limit' as any,
    {
      p_user_id: userId,
      p_action: action,
      p_window_start: windowStartISO,
      p_max_calls: config.maxCalls,
    } as any
  );

  if (!rpcError && rpcResult != null) {
    const row = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    const allowed = row?.allowed ?? row?.check_and_increment_rate_limit?.allowed;
    if (allowed === false) {
      throw new RateLimitError(action, retryAfter);
    }
    if (allowed === true) {
      void Promise.resolve(
        supabase
          .from('rate_limits')
          .delete()
          .eq('user_id', userId)
          .lt('window_start', new Date(now.getTime() - 86_400_000).toISOString())
      ).catch(() => undefined);
      return;
    }
  }

  // Fallback: conditional increment (still better than fail-open)
  if (rpcError) {
    console.warn('[RateLimiter] RPC unavailable, using fallback:', rpcError.message);
  }

  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, call_count')
    .eq('user_id', userId)
    .eq('action', action)
    .eq('window_start', windowStartISO)
    .maybeSingle();

  if (fetchError) {
    console.error('[RateLimiter] Failed to fetch rate limit row — failing closed');
    throw new RateLimitError(action, retryAfter);
  }

  const currentCount = existing?.call_count ?? 0;

  if (currentCount >= config.maxCalls) {
    throw new RateLimitError(action, retryAfter);
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('rate_limits')
      .update({ call_count: currentCount + 1, updated_at: now.toISOString() })
      .eq('id', existing.id)
      .eq('call_count', currentCount) // optimistic lock
      .select('id')
      .maybeSingle();

    if (updateError || !updated) {
      // Lost race or DB error — fail closed
      throw new RateLimitError(action, retryAfter);
    }
  } else {
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        action,
        window_start: windowStartISO,
        call_count: 1,
        updated_at: now.toISOString(),
      });

    if (insertError) {
      // Unique conflict = concurrent first insert; treat as limited/retry
      throw new RateLimitError(action, retryAfter);
    }
  }

  void Promise.resolve(
    supabase
      .from('rate_limits')
      .delete()
      .eq('user_id', userId)
      .lt('window_start', new Date(now.getTime() - 86_400_000).toISOString())
  ).catch(() => undefined);
}
