-- Add last_error column to track connection failures
ALTER TABLE organization_email_settings
ADD COLUMN IF NOT EXISTS last_error TEXT DEFAULT NULL;