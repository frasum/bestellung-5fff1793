-- Add article list format field to email_templates
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS article_list_format text NOT NULL DEFAULT '- {article_name}{sku_suffix}: {quantity} {unit} à €{unit_price} = €{total_price}';