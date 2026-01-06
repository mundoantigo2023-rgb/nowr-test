-- Create storage bucket for private photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-albums', 'private-albums', false);

-- Create table to track album access requests/permissions
CREATE TABLE public.album_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (owner_id, requester_id)
);

-- Enable RLS
ALTER TABLE public.album_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access requests (sent or received)
CREATE POLICY "Users can view their album access records"
ON public.album_access
FOR SELECT
USING (auth.uid() = owner_id OR auth.uid() = requester_id);

-- Users can request access to others' albums
CREATE POLICY "Users can request album access"
ON public.album_access
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Album owners can update access status (grant/deny)
CREATE POLICY "Owners can update access status"
ON public.album_access
FOR UPDATE
USING (auth.uid() = owner_id);

-- Users can delete their own requests
CREATE POLICY "Users can delete their requests"
ON public.album_access
FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = owner_id);

-- Storage policies for private albums
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own private photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users with granted access can view private photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'private-albums' 
  AND EXISTS (
    SELECT 1 FROM public.album_access
    WHERE owner_id::text = (storage.foldername(name))[1]
    AND requester_id = auth.uid()
    AND status = 'granted'
  )
);

CREATE POLICY "Users can delete their own private photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own private photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add private_photos column to profiles
ALTER TABLE public.profiles
ADD COLUMN private_photos TEXT[] DEFAULT '{}'::TEXT[];