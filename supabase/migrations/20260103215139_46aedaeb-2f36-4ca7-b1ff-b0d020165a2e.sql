-- Make private-albums bucket public for now (photos are stored as URLs)
UPDATE storage.buckets SET public = true WHERE id = 'private-albums';

-- Create storage policies for private-albums if they don't exist
DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Users can upload their own private photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own private photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own private photos" ON storage.objects;
  DROP POLICY IF EXISTS "Private photos are publicly accessible" ON storage.objects;
END $$;

-- Allow authenticated users to upload their own private photos
CREATE POLICY "Users can upload their own private photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own private photos
CREATE POLICY "Users can update their own private photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own private photos
CREATE POLICY "Users can delete their own private photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'private-albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to private album photos (access control via app logic)
CREATE POLICY "Private photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'private-albums');