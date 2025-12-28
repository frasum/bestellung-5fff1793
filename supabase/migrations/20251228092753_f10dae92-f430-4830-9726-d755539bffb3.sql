-- Add is_new_article column to invoice_items table
ALTER TABLE public.invoice_items ADD COLUMN is_new_article BOOLEAN NOT NULL DEFAULT false;