-- Add column to control whether user can appear as highlighted in explore grid
ALTER TABLE public.profiles 
ADD COLUMN allow_highlight boolean DEFAULT true;