import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Mail, TestTube, Save, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailSettings {
  id: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  mailbox: string;
  is_active: boolean;
  password_set: boolean;
  last_checked_at: string | null;
}

export const InvoiceEmailSettingsTab = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [formData, setFormData] = useState({
    imap_host: '',
    imap_port: 993,
    imap_user: '',
    imap_password: '',
    mailbox: 'INBOX',
    is_active: true,
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-settings', {
        body: { action: 'get' },
      });

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          imap_host: data.imap_host || '',
          imap_port: data.imap_port || 993,
          imap_user: data.imap_user || '',
          imap_password: '', // Never show password
          mailbox: data.mailbox || 'INBOX',
          is_active: data.is_active ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load email settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.imap_host || !formData.imap_user) {
      toast.error('Bitte Host und Benutzer ausfüllen');
      return;
    }

    // Require password for new settings
    if (!settings && !formData.imap_password) {
      toast.error('Passwort ist erforderlich');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-settings', {
        body: {
          action: 'save',
          ...formData,
          // Only send password if it was changed
          imap_password: formData.imap_password || undefined,
        },
      });

      if (error) throw error;

      toast.success(data.message || 'Einstellungen gespeichert');
      await loadSettings();
      setFormData(prev => ({ ...prev, imap_password: '' }));
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.imap_host || !formData.imap_user) {
      toast.error('Bitte Host und Benutzer ausfüllen');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-settings', {
        body: {
          action: 'test',
          imap_host: formData.imap_host,
          imap_port: formData.imap_port,
          imap_user: formData.imap_user,
          imap_password: formData.imap_password || undefined,
        },
      });

      if (error) throw error;

      setTestResult({
        success: data.success,
        message: data.message || data.error || 'Unbekannter Fehler',
      });

      if (data.success) {
        toast.success('Verbindung erfolgreich!');
      } else {
        toast.error(data.error || 'Verbindung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Test failed:', err);
      setTestResult({
        success: false,
        message: 'Verbindungstest fehlgeschlagen',
      });
      toast.error('Verbindungstest fehlgeschlagen');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('E-Mail-Einstellungen wirklich löschen?')) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-email-settings', {
        body: { action: 'delete' },
      });

      if (error) throw error;

      toast.success('Einstellungen gelöscht');
      setSettings(null);
      setFormData({
        imap_host: '',
        imap_port: 993,
        imap_user: '',
        imap_password: '',
        mailbox: 'INBOX',
        is_active: true,
      });
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Fehler beim Löschen');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          E-Mail-Einstellungen für Rechnungen
        </CardTitle>
        <CardDescription>
          Konfigurieren Sie das IMAP-Postfach, aus dem Rechnungen automatisch importiert werden.
          Das Passwort wird verschlüsselt gespeichert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* IMAP Host */}
        <div className="grid gap-2">
          <Label htmlFor="imap_host">IMAP Server</Label>
          <Input
            id="imap_host"
            placeholder="imap.gmail.com"
            value={formData.imap_host}
            onChange={(e) => setFormData(prev => ({ ...prev, imap_host: e.target.value }))}
          />
        </div>

        {/* IMAP Port */}
        <div className="grid gap-2">
          <Label htmlFor="imap_port">Port</Label>
          <Input
            id="imap_port"
            type="number"
            placeholder="993"
            value={formData.imap_port}
            onChange={(e) => setFormData(prev => ({ ...prev, imap_port: parseInt(e.target.value) || 993 }))}
          />
          <p className="text-xs text-muted-foreground">Standard: 993 (TLS/SSL)</p>
        </div>

        {/* Username */}
        <div className="grid gap-2">
          <Label htmlFor="imap_user">Benutzername (E-Mail-Adresse)</Label>
          <Input
            id="imap_user"
            type="email"
            placeholder="rechnungen@beispiel.de"
            value={formData.imap_user}
            onChange={(e) => setFormData(prev => ({ ...prev, imap_user: e.target.value }))}
          />
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <Label htmlFor="imap_password">
            Passwort
            {settings?.password_set && (
              <span className="ml-2 text-xs text-muted-foreground">(bereits gesetzt)</span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="imap_password"
              type={showPassword ? 'text' : 'password'}
              placeholder={settings?.password_set ? '••••••••' : 'Passwort eingeben'}
              value={formData.imap_password}
              onChange={(e) => setFormData(prev => ({ ...prev, imap_password: e.target.value }))}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {settings?.password_set 
              ? 'Nur ausfüllen, wenn Sie das Passwort ändern möchten'
              : 'Das Passwort wird verschlüsselt gespeichert'
            }
          </p>
        </div>

        {/* Mailbox */}
        <div className="grid gap-2">
          <Label htmlFor="mailbox">Postfach</Label>
          <Input
            id="mailbox"
            placeholder="INBOX"
            value={formData.mailbox}
            onChange={(e) => setFormData(prev => ({ ...prev, mailbox: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">Standard: INBOX</p>
        </div>

        {/* Active Switch */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label>Automatisches Scannen</Label>
            <p className="text-sm text-muted-foreground">
              E-Mails werden regelmäßig auf neue Rechnungen geprüft
            </p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`flex items-center gap-2 rounded-lg border p-4 ${
            testResult.success 
              ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400' 
              : 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400'
          }`}>
            {testResult.success ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Last Checked */}
        {settings?.last_checked_at && (
          <p className="text-sm text-muted-foreground">
            Letzte Prüfung: {new Date(settings.last_checked_at).toLocaleString('de-DE')}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleTest} disabled={isTesting || !formData.imap_host || !formData.imap_user}>
            {isTesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="mr-2 h-4 w-4" />
            )}
            Verbindung testen
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Speichern
          </Button>

          {settings && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
