-- Add read column to messages table for tracking unread messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;

-- Create index for faster unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- Update existing messages to be marked as read
UPDATE public.messages SET read = true WHERE read IS NULL;