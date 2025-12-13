-- Add can_capture_photos permission to employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS can_capture_photos BOOLEAN DEFAULT false;

-- Add image_url to suggested_articles for storing captured photos
ALTER TABLE public.suggested_articles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.can_capture_photos IS 'Whether employee can capture photos for articles in Easy Order';
COMMENT ON COLUMN public.suggested_articles.image_url IS 'URL of photo captured by employee during article suggestion';