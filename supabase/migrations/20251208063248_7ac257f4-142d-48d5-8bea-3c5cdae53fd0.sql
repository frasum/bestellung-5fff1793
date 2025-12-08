-- Add footer customization fields to email_templates
ALTER TABLE public.email_templates
ADD COLUMN footer_text text DEFAULT 'Diese Bestellung wurde über OrderFox.pro aufgegeben.',
ADD COLUMN footer_logo_url text DEFAULT NULL,
ADD COLUMN show_powered_by boolean DEFAULT true;