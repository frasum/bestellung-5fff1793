-- Add is_worked_on field to system_feature_priorities
ALTER TABLE public.system_feature_priorities 
ADD COLUMN is_worked_on boolean DEFAULT false;

-- Create edge_function_registry table for dynamic Edge Functions tracking
CREATE TABLE public.edge_function_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text UNIQUE NOT NULL,
  label_de text NOT NULL,
  label_en text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on edge_function_registry
ALTER TABLE public.edge_function_registry ENABLE ROW LEVEL SECURITY;

-- Super admins can manage edge function registry
CREATE POLICY "Super admins can manage edge function registry"
ON public.edge_function_registry
FOR ALL
USING (is_super_admin(auth.uid()));

-- All authenticated users can view edge function registry
CREATE POLICY "Authenticated users can view edge function registry"
ON public.edge_function_registry
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Enable realtime for edge_function_registry
ALTER PUBLICATION supabase_realtime ADD TABLE public.edge_function_registry;

-- Insert all current 54 Edge Functions
INSERT INTO public.edge_function_registry (function_name, label_de, label_en) VALUES
  ('accept-b2b-customer-invitation', 'B2B Kundeneinladung akzeptieren', 'Accept B2B Customer Invitation'),
  ('accept-invitation', 'Einladung akzeptieren', 'Accept Invitation'),
  ('ai-import-helper', 'AI Import-Helfer', 'AI Import Helper'),
  ('confirm-order', 'Bestellung bestätigen', 'Confirm Order'),
  ('convert-demo-account', 'Demo-Account konvertieren', 'Convert Demo Account'),
  ('create-article-from-mobile', 'Artikel von Mobile erstellen', 'Create Article from Mobile'),
  ('create-articles-batch', 'Artikel-Batch erstellen', 'Create Articles Batch'),
  ('create-b2b-account-user', 'B2B Account-Benutzer erstellen', 'Create B2B Account User'),
  ('create-b2b-mobile-token', 'B2B Mobile-Token erstellen', 'Create B2B Mobile Token'),
  ('create-demo-account', 'Demo-Account erstellen', 'Create Demo Account'),
  ('create-photo-suggestion', 'Foto-Vorschlag erstellen', 'Create Photo Suggestion'),
  ('create-supplier-portal-token', 'Lieferantenportal-Token erstellen', 'Create Supplier Portal Token'),
  ('delete-demo-organization', 'Demo-Organisation löschen', 'Delete Demo Organization'),
  ('delete-employee-draft', 'Mitarbeiter-Entwurf löschen', 'Delete Employee Draft'),
  ('elevenlabs-conversation-token', 'ElevenLabs Konversations-Token', 'ElevenLabs Conversation Token'),
  ('elevenlabs-industry-token', 'ElevenLabs Industrie-Token', 'ElevenLabs Industry Token'),
  ('get-employee-drafts', 'Mitarbeiter-Entwürfe abrufen', 'Get Employee Drafts'),
  ('get-order-details', 'Bestelldetails abrufen', 'Get Order Details'),
  ('hash-employee-pin', 'Mitarbeiter-PIN hashen', 'Hash Employee PIN'),
  ('identify-article', 'Artikel identifizieren', 'Identify Article'),
  ('import-wine-data', 'Weindaten importieren', 'Import Wine Data'),
  ('invite-sponsored-account', 'Gesponserten Account einladen', 'Invite Sponsored Account'),
  ('manage-b2b-mobile-inventory', 'B2B Mobile-Inventar verwalten', 'Manage B2B Mobile Inventory'),
  ('manage-simple-order-favorites', 'Simple Order Favoriten verwalten', 'Manage Simple Order Favorites'),
  ('notify-preorder-received', 'Vorbestellung erhalten benachrichtigen', 'Notify Preorder Received'),
  ('populate-demo-data', 'Demo-Daten befüllen', 'Populate Demo Data'),
  ('request-new-magic-link', 'Neuen Magic-Link anfordern', 'Request New Magic Link'),
  ('research-wine', 'Wein recherchieren', 'Research Wine'),
  ('reset-b2b-customer-password', 'B2B Kunden-Passwort zurücksetzen', 'Reset B2B Customer Password'),
  ('scan-order-list', 'Bestellliste scannen', 'Scan Order List'),
  ('search-wine-image', 'Weinbild suchen', 'Search Wine Image'),
  ('send-b2b-customer-invitation', 'B2B Kundeneinladung senden', 'Send B2B Customer Invitation'),
  ('send-b2b-customer-purchase-order', 'B2B Kunden-Bestellung senden', 'Send B2B Customer Purchase Order'),
  ('send-b2b-offer', 'B2B Angebot senden', 'Send B2B Offer'),
  ('send-b2b-purchase-order', 'B2B Bestellung senden', 'Send B2B Purchase Order'),
  ('send-invitation-email', 'Einladungs-E-Mail senden', 'Send Invitation Email'),
  ('send-order-email', 'Bestell-E-Mail senden', 'Send Order Email'),
  ('send-supplier-magic-link', 'Lieferanten Magic-Link senden', 'Send Supplier Magic Link'),
  ('send-trial-reminders', 'Testzeit-Erinnerungen senden', 'Send Trial Reminders'),
  ('submit-b2b-order', 'B2B Bestellung absenden', 'Submit B2B Order'),
  ('submit-simple-order', 'Simple Order absenden', 'Submit Simple Order'),
  ('supplier-portal-articles', 'Lieferantenportal Artikel', 'Supplier Portal Articles'),
  ('transcribe-inventory', 'Inventar transkribieren', 'Transcribe Inventory'),
  ('transcribe-order', 'Bestellung transkribieren', 'Transcribe Order'),
  ('translate-wine-content', 'Wein-Inhalte übersetzen', 'Translate Wine Content'),
  ('update-article-image', 'Artikelbild aktualisieren', 'Update Article Image'),
  ('update-b2b-account-email', 'B2B Account-E-Mail aktualisieren', 'Update B2B Account Email'),
  ('update-employee-draft', 'Mitarbeiter-Entwurf aktualisieren', 'Update Employee Draft'),
  ('upgrade-b2b-customer', 'B2B Kunden upgraden', 'Upgrade B2B Customer'),
  ('verify-b2b-mobile-token', 'B2B Mobile-Token verifizieren', 'Verify B2B Mobile Token'),
  ('verify-employee-pin', 'Mitarbeiter-PIN verifizieren', 'Verify Employee PIN'),
  ('verify-photo-capture-token', 'Foto-Capture-Token verifizieren', 'Verify Photo Capture Token'),
  ('verify-simple-order-token', 'Simple Order Token verifizieren', 'Verify Simple Order Token'),
  ('verify-supplier-token', 'Lieferanten-Token verifizieren', 'Verify Supplier Token');