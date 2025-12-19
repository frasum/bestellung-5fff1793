-- Create system_feature_priorities table for tracking feature priorities
CREATE TABLE public.system_feature_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('green', 'yellow', 'red')),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE (organization_id, category, feature_key)
);

-- Enable RLS
ALTER TABLE public.system_feature_priorities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view feature priorities"
ON public.system_feature_priorities
FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can insert feature priorities"
ON public.system_feature_priorities
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update feature priorities"
ON public.system_feature_priorities
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete feature priorities"
ON public.system_feature_priorities
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for faster lookups
CREATE INDEX idx_system_feature_priorities_org ON public.system_feature_priorities(organization_id);