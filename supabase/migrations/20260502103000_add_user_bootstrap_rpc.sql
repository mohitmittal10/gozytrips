-- Create a function to bootstrap user data in a single round-trip
-- This combines Profile, Agency Settings, and User Preferences

CREATE OR REPLACE FUNCTION public.get_user_bootstrap_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_data JSONB;
    settings_data JSONB;
    preferences_data JSONB;
BEGIN
    -- 1. Get User Profile
    SELECT to_jsonb(p) INTO profile_data 
    FROM public.user_profiles p 
    WHERE p.id = target_user_id;
    
    -- 2. Get Agency Settings
    SELECT to_jsonb(s) INTO settings_data 
    FROM public.agency_settings s 
    WHERE s.user_id = target_user_id;
    
    -- 3. Get or Create User Preferences
    -- First try to get existing
    SELECT to_jsonb(pr) INTO preferences_data 
    FROM public.user_preferences pr 
    WHERE pr.user_id = target_user_id;
    
    -- If missing, insert default and select it
    IF preferences_data IS NULL THEN
        INSERT INTO public.user_preferences (user_id)
        VALUES (target_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        SELECT to_jsonb(pr) INTO preferences_data 
        FROM public.user_preferences pr 
        WHERE pr.user_id = target_user_id;
    END IF;

    -- Return consolidated object
    RETURN json_build_object(
        'profile', profile_data,
        'settings', settings_data,
        'preferences', preferences_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_bootstrap_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_bootstrap_data(UUID) TO service_role;

COMMENT ON FUNCTION public.get_user_bootstrap_data(UUID) IS 'Consolidates profile, agency settings, and preferences into a single round-trip for app bootstrap.';
