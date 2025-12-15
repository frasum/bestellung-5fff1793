-- Create storage bucket for B2B portal logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('b2b-portal-logos', 'b2b-portal-logos', true);

-- RLS Policy for upload (authenticated users)
CREATE POLICY "Authenticated users can upload b2b logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'b2b-portal-logos');

-- RLS Policy for public viewing
CREATE POLICY "Public can view b2b logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'b2b-portal-logos');

-- RLS Policy for delete (authenticated users)
CREATE POLICY "Authenticated users can delete b2b logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'b2b-portal-logos');

-- RLS Policy for update (authenticated users)
CREATE POLICY "Authenticated users can update b2b logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'b2b-portal-logos');