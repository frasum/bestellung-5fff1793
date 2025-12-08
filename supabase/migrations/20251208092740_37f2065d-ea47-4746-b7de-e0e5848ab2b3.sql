-- Update default value for footer_text in email_templates
ALTER TABLE public.email_templates 
ALTER COLUMN footer_text SET DEFAULT 'Diese Bestellung wurde über Bestellung.pro aufgegeben.';

-- Update existing records that have the old default value
UPDATE public.email_templates 
SET footer_text = 'Diese Bestellung wurde über Bestellung.pro aufgegeben.'
WHERE footer_text = 'Diese Bestellung wurde über OrderFox.pro aufgegeben.';