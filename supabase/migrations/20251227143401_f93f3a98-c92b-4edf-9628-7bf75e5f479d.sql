-- Create organization_email_settings table for encrypted IMAP credentials
CREATE TABLE organization_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  imap_host text NOT NULL,
  imap_port integer DEFAULT 993,
  imap_user text NOT NULL,
  -- Encrypted password (AES-256-GCM via Edge Function)
  imap_password_encrypted text NOT NULL,
  -- Mailbox to scan (default: INBOX)
  mailbox text DEFAULT 'INBOX',
  -- Whether automatic scanning is active
  is_active boolean DEFAULT true,
  -- Last check timestamp
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organization_email_settings ENABLE ROW LEVEL SECURITY;

-- Only admins of their own organization can read/write
CREATE POLICY "Admins can manage own org email settings" 
  ON organization_email_settings FOR ALL
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Service role can manage all settings (for edge functions)
CREATE POLICY "Service role can manage all email settings"
  ON organization_email_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add update trigger
CREATE TRIGGER update_organization_email_settings_updated_at
  BEFORE UPDATE ON organization_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();