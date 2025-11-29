-- Create team_invitations table for pending invites
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_invitations
CREATE POLICY "Admins can view invitations in their organization"
ON public.team_invitations FOR SELECT
USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'admin')
  AND invited_by = auth.uid()
);

CREATE POLICY "Admins can delete invitations"
ON public.team_invitations FOR DELETE
USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'admin')
);