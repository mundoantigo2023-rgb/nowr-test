-- Create table to track screenshot events in chats
CREATE TABLE public.screenshot_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.screenshot_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own screenshot events
CREATE POLICY "Users can record their screenshot events"
ON public.screenshot_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view screenshot events for their matches
CREATE POLICY "Users can view screenshot events in their matches"
ON public.screenshot_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = screenshot_events.match_id
    AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
  )
);

-- Enable realtime for screenshot events
ALTER PUBLICATION supabase_realtime ADD TABLE public.screenshot_events;