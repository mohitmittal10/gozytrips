-- Migration: Protect plan_type column in user_profiles from client-side updates
-- Description: Adds a BEFORE UPDATE trigger to public.user_profiles that blocks client-side requests (authenticated/anon roles) from changing the plan_type.

CREATE OR REPLACE FUNCTION public.protect_user_profile_plan_type()
RETURNS TRIGGER AS $$
BEGIN
    -- If the database role making the update is 'authenticated' or 'anon' (representing client-side requests),
    -- and they try to change the plan_type column, revert it to the old plan_type.
    IF (current_setting('role', true) IN ('authenticated', 'anon')) AND NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN
        NEW.plan_type := OLD.plan_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_protect_profile_plan_type ON public.user_profiles;
CREATE TRIGGER trigger_protect_profile_plan_type
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_user_profile_plan_type();
