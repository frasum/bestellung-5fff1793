-- Create employee_notifications table for order confirmation notifications
CREATE TABLE public.employee_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'order_confirmed',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policy: Service role can manage all notifications
CREATE POLICY "Service role can manage employee notifications"
ON public.employee_notifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_notifications;

-- Create function to notify employee when order is confirmed
CREATE OR REPLACE FUNCTION public.notify_employee_on_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'confirmed' and employee_id exists
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') AND NEW.employee_id IS NOT NULL THEN
    INSERT INTO public.employee_notifications (employee_id, order_id, type, message)
    VALUES (
      NEW.employee_id,
      NEW.id,
      'order_confirmed',
      'Bestellung ' || NEW.order_number || ' wurde vom Lieferanten bestätigt!'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
CREATE TRIGGER trigger_notify_employee_on_confirmation
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_employee_on_order_confirmation();