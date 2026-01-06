-- Add hide_activity_status column to profiles for privacy control
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hide_activity_status boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.hide_activity_status IS 'When true, hides the user activity status from other users';