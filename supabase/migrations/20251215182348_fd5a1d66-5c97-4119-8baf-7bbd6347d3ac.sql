-- Add body_html column to store email content for preview
ALTER TABLE public.communication_logs ADD COLUMN body_html TEXT;