-- Add nowpik_image_url and nowpik_duration to messages for temporary content
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS nowpik_image_url TEXT,
ADD COLUMN IF NOT EXISTS nowpik_duration INTEGER,
ADD COLUMN IF NOT EXISTS nowpik_viewed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nowpik_viewed_at TIMESTAMP WITH TIME ZONE;

-- Create storage bucket for nowpik images
INSERT INTO storage.buckets (id, name, public)
VALUES ('nowpik-images', 'nowpik-images', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for nowpik-images bucket
CREATE POLICY "Users can upload nowpik images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'nowpik-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view nowpik images in their matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'nowpik-images'
  AND (
    -- Check if user is part of the match (folder structure: user_id/match_id/filename)
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id::text = (storage.foldername(name))[2]
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
    )
  )
);

CREATE POLICY "Users can delete their own nowpik images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'nowpik-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);