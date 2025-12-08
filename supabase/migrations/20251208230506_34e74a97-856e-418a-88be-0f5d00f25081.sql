-- Create employee order submissions table
CREATE TABLE public.employee_order_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('photo', 'voice', 'manual')),
  source_data JSONB DEFAULT '{}'::jsonb,
  transcription TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee order items table
CREATE TABLE public.employee_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.employee_order_submissions(id) ON DELETE CASCADE,
  recognized_text TEXT,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  confidence NUMERIC,
  admin_corrected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employee_order_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_order_items ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_employee_order_submissions_org ON public.employee_order_submissions(organization_id);
CREATE INDEX idx_employee_order_submissions_status ON public.employee_order_submissions(status);
CREATE INDEX idx_employee_order_submissions_submitted_by ON public.employee_order_submissions(submitted_by);
CREATE INDEX idx_employee_order_items_submission ON public.employee_order_items(submission_id);

-- RLS Policies for employee_order_submissions

-- Users can view submissions in their organization
CREATE POLICY "Users can view submissions in their organization"
ON public.employee_order_submissions
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Users with purchaser, manager, or admin role can insert submissions
CREATE POLICY "Authorized users can create submissions"
ON public.employee_order_submissions
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND submitted_by = auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role) 
    OR has_role(auth.uid(), 'purchaser'::app_role)
  )
);

-- Admins and managers can update submissions (for approval/rejection)
CREATE POLICY "Admins and managers can update submissions"
ON public.employee_order_submissions
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.employee_order_submissions
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for employee_order_items

-- Users can view items for submissions in their organization
CREATE POLICY "Users can view items in their organization"
ON public.employee_order_items
FOR SELECT
USING (
  submission_id IN (
    SELECT id FROM public.employee_order_submissions 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

-- Service role can insert items (via edge function)
CREATE POLICY "Service role can insert items"
ON public.employee_order_items
FOR INSERT
WITH CHECK (true);

-- Admins and managers can update items (for corrections)
CREATE POLICY "Admins and managers can update items"
ON public.employee_order_items
FOR UPDATE
USING (
  submission_id IN (
    SELECT id FROM public.employee_order_submissions 
    WHERE organization_id = get_user_organization_id(auth.uid())
      AND (
        has_role(auth.uid(), 'admin'::app_role) 
        OR has_role(auth.uid(), 'manager'::app_role)
      )
  )
);

-- Admins can delete items
CREATE POLICY "Admins can delete items"
ON public.employee_order_items
FOR DELETE
USING (
  submission_id IN (
    SELECT id FROM public.employee_order_submissions 
    WHERE organization_id = get_user_organization_id(auth.uid())
      AND has_role(auth.uid(), 'admin'::app_role)
  )
);