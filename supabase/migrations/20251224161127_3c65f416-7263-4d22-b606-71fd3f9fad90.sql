-- Add source reference columns to article_price_history
ALTER TABLE public.article_price_history 
ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create indexes for efficient queries
CREATE INDEX idx_article_price_history_invoice_id ON public.article_price_history(invoice_id);
CREATE INDEX idx_article_price_history_order_id ON public.article_price_history(order_id);