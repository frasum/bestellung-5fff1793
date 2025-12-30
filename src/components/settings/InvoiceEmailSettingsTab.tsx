import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Server, Lock, Inbox, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { 
  useOrganizationEmailSettings, 
  useUpdateEmailSettings, 
  useTestEmailConnection,
  type EmailSettingsFormData 
} from '@/hooks/useOrganizationEmailSettings';

const formSchema = z.object({
  imap_host: z.string().min(1, 'IMAP-Server ist erforderlich'),
  imap_port: z.coerce.number().min(1).max(65535).default(993),
  imap_user: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  imap_password: z.string().optional(),
  mailbox: z.string().min(1).default('INBOX'),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function InvoiceEmailSettingsTab() {
  const { data: settings, isLoading } = useOrganizationEmailSettings();
  const updateSettings = useUpdateEmailSettings();
  const testConnection = useTestEmailConnection();
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imap_host: '',
      imap_port: 993,
      imap_user: '',
      imap_password: '',
      mailbox: 'INBOX',
      is_active: true,
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        imap_host: settings.imap_host || '',
        imap_port: settings.imap_port || 993,
        imap_user: settings.imap_user || '',
        imap_password: '', // Never pre-fill password
        mailbox: settings.mailbox || 'INBOX',
        is_active: settings.is_active ?? true,
      });
      setHasExistingPassword(true);
    }
  }, [settings, form]);

  const onSubmit = async (values: FormValues) => {
    const data: EmailSettingsFormData = {
      imap_host: values.imap_host,
      imap_port: values.imap_port,
      imap_user: values.imap_user,
      mailbox: values.mailbox,
      is_active: values.is_active,
    };

    // Only include password if it was changed
    if (values.imap_password && values.imap_password.length > 0) {
      data.imap_password = values.imap_password;
    }

    await updateSettings.mutateAsync(data);
    setHasExistingPassword(true);
    form.setValue('imap_password', '');
  };

  const handleTestConnection = async () => {
    const values = form.getValues();
    const data: EmailSettingsFormData = {
      imap_host: values.imap_host,
      imap_port: values.imap_port,
      imap_user: values.imap_user,
      mailbox: values.mailbox,
      is_active: values.is_active,
    };

    // Include password if provided, otherwise the edge function will use stored password
    if (values.imap_password && values.imap_password.length > 0) {
      data.imap_password = values.imap_password;
    }

    await testConnection.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Rechnungs-E-Mail Postfach
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie das IMAP-Postfach für den automatischen Rechnungsabruf
            </CardDescription>
          </div>
          {settings && (
            <Badge variant={settings.is_active ? 'default' : 'secondary'}>
              {settings.is_active ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="imap_host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      IMAP-Server
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="mail.example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      z.B. mail.example.com oder imap.gmail.com
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imap_port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="993" {...field} />
                    </FormControl>
                    <FormDescription>
                      Standard: 993 (SSL/TLS)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="imap_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-Mail-Adresse / Benutzername
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="rechnungen@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imap_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Passwort
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={hasExistingPassword ? '••••••••' : 'Passwort eingeben'} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {hasExistingPassword 
                        ? 'Leer lassen um das aktuelle Passwort beizubehalten' 
                        : 'Das Passwort wird verschlüsselt gespeichert'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="mailbox"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Inbox className="h-4 w-4" />
                      Postfach
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="INBOX" {...field} />
                    </FormControl>
                    <FormDescription>
                      Standard: INBOX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Automatischer Abruf</FormLabel>
                      <FormDescription>
                        E-Mails automatisch abrufen und verarbeiten
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Status Section */}
            {settings?.last_checked_at && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    Letzter erfolgreicher Abruf:{' '}
                    <span className="font-medium text-foreground">
                      {format(new Date(settings.last_checked_at), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnection.isPending || !form.getValues('imap_host') || !form.getValues('imap_user')}
              >
                {testConnection.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Verbindung testen
              </Button>

              <Button 
                type="submit" 
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Einstellungen speichern
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
