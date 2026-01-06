-- Create retention_notifications table to track and deliver scheduled messages
CREATE TABLE public.retention_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('d7', 'd14', 'd30')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  cta_path TEXT NOT NULL DEFAULT '/home',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.retention_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.retention_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.retention_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_retention_notifications_user_id ON public.retention_notifications(user_id);
CREATE INDEX idx_retention_notifications_scheduled ON public.retention_notifications(scheduled_for, sent_at);
CREATE INDEX idx_retention_notifications_unread ON public.retention_notifications(user_id, read_at) WHERE read_at IS NULL;

-- Add created_at to profiles if not exists (for tracking registration date)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.retention_notifications;