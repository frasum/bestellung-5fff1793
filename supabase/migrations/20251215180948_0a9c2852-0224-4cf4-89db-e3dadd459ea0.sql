-- Add DELETE policy for communication_logs
CREATE POLICY "Admins and managers can delete communication logs"
ON public.communication_logs
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);