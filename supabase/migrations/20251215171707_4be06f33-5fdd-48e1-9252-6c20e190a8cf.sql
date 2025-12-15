-- Create communication_logs table for tracking all system emails
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Email details
  email_type TEXT NOT NULL, -- 'order_sent', 'order_confirmed', 'preorder_notification', 'team_invitation', 'employee_confirmation'
  direction TEXT NOT NULL DEFAULT 'outgoing',
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  
  -- Context references (optional)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Users can view logs in their organization
CREATE POLICY "Users can view communication logs in their organization"
ON public.communication_logs
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Service role can insert logs (from Edge Functions)
CREATE POLICY "Service role can insert communication logs"
ON public.communication_logs
FOR INSERT
WITH CHECK (true);

-- Service role can update logs (for confirmations)
CREATE POLICY "Service role can update communication logs"
ON public.communication_logs
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_communication_logs_org_created ON public.communication_logs(organization_id, created_at DESC);
CREATE INDEX idx_communication_logs_order ON public.communication_logs(order_id) WHERE order_id IS NOT NULL;