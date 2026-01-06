-- Add invisible_mode column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN invisible_mode boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.invisible_mode IS 'When true, user does not appear in other users discovery grid';