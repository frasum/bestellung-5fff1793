-- Add cc_emails column to email_templates table
ALTER TABLE email_templates 
ADD COLUMN cc_emails TEXT[] DEFAULT '{}';

-- Set default CC for existing templates to mail@bestellung.pro
UPDATE email_templates 
SET cc_emails = ARRAY['mail@bestellung.pro']
WHERE cc_emails = '{}';