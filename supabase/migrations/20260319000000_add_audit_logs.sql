-- ============================================
-- AUDIT LOGS TABLE
-- Records all sensitive actions for transparency
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,        -- e.g. 'LOGIN', 'DELETE_TRIP', 'EXPORT_CSV', 'STATUS_CHANGE', 'CREATE_CLIENT', 'UPDATE_PROFILE'
    entity_type TEXT,                 -- e.g. 'itinerary', 'client', 'profile'
    entity_id UUID,                   -- optional reference to the affected row
    description TEXT NOT NULL,        -- human-readable description
    metadata JSONB DEFAULT '{}',      -- additional technical details
    ip_address TEXT,                  -- optional IP for login events
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own audit logs
CREATE POLICY "Users can insert their own audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Nobody can update or delete audit logs (tamper-proof)
-- No UPDATE or DELETE policies = immutable log

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);

-- ============================================
-- AUTOMATIC TRIGGERS for critical actions
-- ============================================

-- Trigger: Log when an itinerary is deleted
CREATE OR REPLACE FUNCTION public.log_itinerary_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, description, metadata)
    VALUES (
        OLD.user_id,
        'DELETE_TRIP',
        'itinerary',
        OLD.id,
        'Itinerary "' || COALESCE(OLD.title, 'Untitled') || '" was deleted',
        jsonb_build_object('title', OLD.title, 'destination', OLD.destinations, 'status', OLD.status)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_itinerary_deleted
    BEFORE DELETE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION public.log_itinerary_delete();

-- Trigger: Log when a client is deleted
CREATE OR REPLACE FUNCTION public.log_client_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, description, metadata)
    VALUES (
        OLD.user_id,
        'DELETE_CLIENT',
        'client',
        OLD.id,
        'Client "' || COALESCE(OLD.name, 'Unknown') || '" was deleted',
        jsonb_build_object('name', OLD.name, 'email', OLD.email)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_client_deleted
    BEFORE DELETE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.log_client_delete();

-- Trigger: Log when itinerary status changes
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.audit_logs (user_id, action_type, entity_type, entity_id, description, metadata)
        VALUES (
            NEW.user_id,
            'STATUS_CHANGE',
            'itinerary',
            NEW.id,
            'Trip "' || COALESCE(NEW.title, 'Untitled') || '" status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'title', NEW.title)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_itinerary_status_changed
    AFTER UPDATE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION public.log_status_change();
