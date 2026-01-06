-- Add show_age column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT true;

-- Update RLS policies if necessary (usually 'select' is open for profiles, but ensuring it's accessible)
-- (Existing policies likely cover 'select *', so explicit policy update might not be needed unless we want to hide it at DB level, 
-- but usually privacy settings like this are handled at application/client view level for simplicity in this context, 
-- or by a view. We'll stick to adding the column for now).
