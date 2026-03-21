-- Migration to add backup settings to user_profiles

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_drive_folder_id text,
ADD COLUMN IF NOT EXISTS backup_frequency text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS last_backup_date timestamp with time zone;
