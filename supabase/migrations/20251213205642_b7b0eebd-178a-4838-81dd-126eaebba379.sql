-- Add image_url column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can upload article images for their organization
CREATE POLICY "Users can upload article images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
);

-- RLS Policy: Anyone can view article images (public bucket)
CREATE POLICY "Anyone can view article images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- RLS Policy: Users can update their org's article images
CREATE POLICY "Users can update article images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
);

-- RLS Policy: Users can delete their org's article images
CREATE POLICY "Users can delete article images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images' AND
  (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
);