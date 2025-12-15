import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Palette, Building2, ExternalLink, Copy, Check } from 'lucide-react';

interface B2BAccount {
  id: string;
  company_name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  subscription_tier: string;
  is_active: boolean;
}

interface B2BSettingsTabProps {
  account: B2BAccount;
  onUpdate: () => void;
}

const B2BSettingsTab = ({ account, onUpdate }: B2BSettingsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(account.company_name);
  const [primaryColor, setPrimaryColor] = useState(account.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(account.secondary_color);
  const [welcomeMessage, setWelcomeMessage] = useState(account.welcome_message || '');
  const [copied, setCopied] = useState(false);

  const portalUrl = `${window.location.origin}/b2b/portal/${account.subdomain}`;

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('supplier_b2b_accounts')
        .update({
          company_name: companyName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          welcome_message: welcomeMessage || null,
        })
        .eq('id', account.id);

      if (error) throw error;

      toast.success('Einstellungen gespeichert');
      onUpdate();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const copyPortalUrl = async () => {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success('URL kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Portal URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Portal-URL
          </CardTitle>
          <CardDescription>
            Teilen Sie diese URL mit Ihren Kunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={portalUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={copyPortalUrl}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={() => window.open(portalUrl, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Ihre Subdomain: <code className="bg-muted px-1 rounded">{account.subdomain}</code>
          </p>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Unternehmensdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Firmenname</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Willkommensnachricht</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Wird auf der Startseite Ihres Portals angezeigt"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Passen Sie das Erscheinungsbild Ihres Portals an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">Vorschau</p>
            <div className="flex gap-2">
              <Button style={{ backgroundColor: primaryColor }}>
                Primär-Button
              </Button>
              <Button variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>
                Outline-Button
              </Button>
            </div>
          </div>

          {/* Logo Upload - Placeholder */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Logo-Upload kommt bald...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Speichern...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
};

export default B2BSettingsTab;
