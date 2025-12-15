-- Create sequence for offer numbers
CREATE SEQUENCE IF NOT EXISTS b2b_offer_number_seq START 1;

-- Create function to generate offer numbers
CREATE OR REPLACE FUNCTION public.generate_b2b_offer_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := to_char(now(), 'YYYY-MM');
  seq_num := nextval('b2b_offer_number_seq');
  new_number := 'ANG-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Create offers table
CREATE TABLE public.supplier_b2b_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_number TEXT NOT NULL DEFAULT generate_b2b_offer_number(),
  supplier_account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  notes TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offer items table
CREATE TABLE public.supplier_b2b_offer_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES supplier_b2b_offers(id) ON DELETE CASCADE,
  article_id UUID REFERENCES supplier_b2b_articles(id) ON DELETE SET NULL,
  article_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Stk',
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_b2b_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_b2b_offer_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for offers
CREATE POLICY "Supplier owners can manage their offers"
ON public.supplier_b2b_offers
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Customers can view their offers"
ON public.supplier_b2b_offers
FOR SELECT
USING (is_b2b_customer(auth.uid(), supplier_account_id) AND customer_id = get_b2b_customer_id(auth.uid()));

-- RLS policies for offer items
CREATE POLICY "Supplier owners can manage offer items"
ON public.supplier_b2b_offer_items
FOR ALL
USING (EXISTS (
  SELECT 1 FROM supplier_b2b_offers o 
  WHERE o.id = offer_id AND is_b2b_supplier_owner(auth.uid(), o.supplier_account_id)
));

CREATE POLICY "Customers can view their offer items"
ON public.supplier_b2b_offer_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM supplier_b2b_offers o 
  WHERE o.id = offer_id 
  AND is_b2b_customer(auth.uid(), o.supplier_account_id) 
  AND o.customer_id = get_b2b_customer_id(auth.uid())
));

-- Add indexes
CREATE INDEX idx_b2b_offers_supplier_account ON supplier_b2b_offers(supplier_account_id);
CREATE INDEX idx_b2b_offers_customer ON supplier_b2b_offers(customer_id);
CREATE INDEX idx_b2b_offers_status ON supplier_b2b_offers(status);
CREATE INDEX idx_b2b_offer_items_offer ON supplier_b2b_offer_items(offer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_supplier_b2b_offers_updated_at
BEFORE UPDATE ON supplier_b2b_offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();