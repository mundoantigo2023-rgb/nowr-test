-- Create profile_views table to track who viewed which profiles
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID NOT NULL,
  viewed_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate entries, we'll update timestamp instead
  UNIQUE (viewer_id, viewed_id)
);

-- Enable Row Level Security
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own views
CREATE POLICY "Users can record profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Policy: Users can update their own views (for updating timestamp)
CREATE POLICY "Users can update their views"
ON public.profile_views
FOR UPDATE
USING (auth.uid() = viewer_id);

-- Policy: Users can see who viewed their profile (for the viewed user)
CREATE POLICY "Users can see their profile visitors"
ON public.profile_views
FOR SELECT
USING (auth.uid() = viewed_id);

-- Index for faster lookups
CREATE INDEX idx_profile_views_viewed_id ON public.profile_views(viewed_id);
CREATE INDEX idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX idx_profile_views_viewed_at ON public.profile_views(viewed_at DESC);

-- Enable realtime for profile_views
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_views;