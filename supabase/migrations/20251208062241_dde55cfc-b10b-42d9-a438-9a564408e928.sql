-- Add design_style column to email_templates table
ALTER TABLE email_templates 
ADD COLUMN design_style text NOT NULL DEFAULT 'modern';

-- Add comment for clarity
COMMENT ON COLUMN email_templates.design_style IS 'Email design template: modern, classic, or minimalist';