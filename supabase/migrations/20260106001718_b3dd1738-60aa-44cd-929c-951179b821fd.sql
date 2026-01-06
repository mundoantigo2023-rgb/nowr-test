-- Create boosts table for NowPick/ForYou boost feature
CREATE TABLE public.boosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('nowpick', 'for_you')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_boosts_user_id ON public.boosts(user_id);
CREATE INDEX idx_boosts_ends_at ON public.boosts(ends_at);

-- Enable Row Level Security
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boosts
-- Users can view all active boosts (needed for ForYou ranking)
CREATE POLICY "Users can view active boosts"
ON public.boosts
FOR SELECT
TO authenticated
USING (ends_at > now());

-- Users can create their own boosts
CREATE POLICY "Users can create their own boosts"
ON public.boosts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own boosts
CREATE POLICY "Users can delete their own boosts"
ON public.boosts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create analytics_events table for tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert their own events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own events
CREATE POLICY "Users can view their own events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for boosts (for live updates in ForYou)
ALTER PUBLICATION supabase_realtime ADD TABLE public.boosts;