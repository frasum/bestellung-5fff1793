-- Create storage bucket for portal logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-logos', 'portal-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos (admins/managers via app logic)
CREATE POLICY "Authenticated users can upload portal logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portal-logos');

-- Allow authenticated users to update their logos
CREATE POLICY "Authenticated users can update portal logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'portal-logos');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete portal logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'portal-logos');

-- Public read access for logos
CREATE POLICY "Portal logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'portal-logos');

-- Add logo_url column to supplier_portal_settings
ALTER TABLE public.supplier_portal_settings
ADD COLUMN IF NOT EXISTS logo_url text;