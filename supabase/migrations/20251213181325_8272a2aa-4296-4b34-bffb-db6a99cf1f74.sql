-- Phase 1A: Extend suggested_articles for employee sources
ALTER TABLE public.suggested_articles 
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'supplier',
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

-- Update existing entries as supplier suggestions
UPDATE public.suggested_articles SET source = 'supplier' WHERE source IS NULL;

-- Phase 1B: Extend employees with can_add_free_items permission
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS can_add_free_items boolean DEFAULT false;

-- Phase 1C: Extend order_items for free text items
ALTER TABLE public.order_items 
  ALTER COLUMN article_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS is_free_text_item boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_text_description text;

-- Phase 1D: Extend cart_draft_items for free text items
ALTER TABLE public.cart_draft_items 
  ALTER COLUMN article_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS is_free_text_item boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_text_name text,
  ADD COLUMN IF NOT EXISTS free_text_unit text DEFAULT 'Stk',
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_suggested_articles_source ON public.suggested_articles(source);
CREATE INDEX IF NOT EXISTS idx_suggested_articles_employee ON public.suggested_articles(employee_id);

-- Update RLS policies for cart_draft_items to handle supplier_id
-- (existing policies should work since they check draft_id ownership)