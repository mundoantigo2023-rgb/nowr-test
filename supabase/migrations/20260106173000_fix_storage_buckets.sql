-- Create private-albums bucket (Public for now as code uses getPublicUrl)
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-albums', 'private-albums', true)
ON CONFLICT (id) DO NOTHING;

-- Create nowpik-images bucket (Private as code uses createSignedUrl)
INSERT INTO storage.buckets (id, name, public)
VALUES ('nowpik-images', 'nowpik-images', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for private-albums
CREATE POLICY "Users can upload their own private photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'private-albums' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view private photos (public bucket but restricted by path if needed, strictly reliance on filename obscurity for now given public bucket setting)"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'private-albums');

CREATE POLICY "Users can delete their own private photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'private-albums' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for nowpik-images
CREATE POLICY "Users can upload nowpik images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'nowpik-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view nowpik images (signed url enforce ownership or match participation? signed url bypasses RLS if created by owner, so this might be redundant or for owner viewing)"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'nowpik-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete nowpik images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'nowpik-images' AND auth.uid()::text = (storage.foldername(name))[1]);
