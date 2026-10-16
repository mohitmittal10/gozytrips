-- Atomic rate-limit check + increment (fail-closed friendly)
-- Returns a single row: { allowed: boolean, call_count: int }

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_action text,
  p_window_start timestamptz,
  p_max_calls int
)
RETURNS TABLE(allowed boolean, call_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO rate_limits (user_id, action, window_start, call_count, updated_at)
  VALUES (p_user_id, p_action, p_window_start, 1, now())
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET
    call_count = rate_limits.call_count + 1,
    updated_at = now()
  WHERE rate_limits.call_count < p_max_calls
  RETURNING rate_limits.call_count INTO v_count;

  IF v_count IS NULL THEN
    -- Either at limit already, or conflict with no update (at/over limit)
    SELECT rl.call_count INTO v_count
    FROM rate_limits rl
    WHERE rl.user_id = p_user_id
      AND rl.action = p_action
      AND rl.window_start = p_window_start;

    RETURN QUERY SELECT false, COALESCE(v_count, p_max_calls);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(uuid, text, timestamptz, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, timestamptz, int) TO service_role;
