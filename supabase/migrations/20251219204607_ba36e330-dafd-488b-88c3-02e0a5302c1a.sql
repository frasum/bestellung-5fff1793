-- Create price_watch_settings table for organization-specific settings
CREATE TABLE public.price_watch_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  min_savings_percent INTEGER NOT NULL DEFAULT 5,
  search_radius_km INTEGER NOT NULL DEFAULT 50,
  categories JSONB NOT NULL DEFAULT '["Fleisch", "Fisch", "Spirituosen", "Wein", "Softdrinks", "Milchprodukte", "Gemüse", "Obst"]'::jsonb,
  search_frequency TEXT NOT NULL DEFAULT 'daily',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  last_search_at TIMESTAMP WITH TIME ZONE,
  last_search_results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.price_watch_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_watch_settings
CREATE POLICY "Admins can manage price watch settings"
  ON public.price_watch_settings
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can view price watch settings"
  ON public.price_watch_settings
  FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

-- Create price_watch_results table for found prices
CREATE TABLE public.price_watch_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  article_name TEXT NOT NULL,
  article_category TEXT,
  search_query TEXT NOT NULL,
  found_price NUMERIC NOT NULL,
  found_supplier TEXT NOT NULL,
  source_url TEXT,
  current_price NUMERIC NOT NULL,
  savings_percent NUMERIC NOT NULL,
  savings_amount NUMERIC NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_watch_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_watch_results
CREATE POLICY "Users can view price watch results in their organization"
  ON public.price_watch_results
  FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage price watch results"
  ON public.price_watch_results
  FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY "Service role can manage all price watch results"
  ON public.price_watch_results
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create price_watch_alerts table for user notifications
CREATE TABLE public.price_watch_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  result_id UUID NOT NULL REFERENCES public.price_watch_results(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_watch_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_watch_alerts
CREATE POLICY "Users can view their own alerts"
  ON public.price_watch_alerts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own alerts"
  ON public.price_watch_alerts
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all alerts"
  ON public.price_watch_alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_price_watch_results_org ON public.price_watch_results(organization_id);
CREATE INDEX idx_price_watch_results_article ON public.price_watch_results(article_id);
CREATE INDEX idx_price_watch_results_searched_at ON public.price_watch_results(searched_at DESC);
CREATE INDEX idx_price_watch_alerts_user ON public.price_watch_alerts(user_id);
CREATE INDEX idx_price_watch_alerts_unread ON public.price_watch_alerts(user_id, is_read) WHERE is_read = false;

-- Create trigger for updated_at on settings
CREATE TRIGGER update_price_watch_settings_updated_at
  BEFORE UPDATE ON public.price_watch_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_watch_alerts;