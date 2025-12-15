import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi, type Locale } from 'date-fns/locale';
import { CommunicationLog } from '@/hooks/useCommunicationLogs';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Mail, AlertCircle } from 'lucide-react';

const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  fr: fr,
  it: it,
  th: th,
  vi: vi,
};

interface CommunicationLogPreviewDialogProps {
  log: CommunicationLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunicationLogPreviewDialog({ log, open, onOpenChange }: CommunicationLogPreviewDialogProps) {
  const { t } = useTranslation();
  const currentLocale = localeMap[i18next.language] || de;

  if (!log) return null;

  const formattedDate = format(new Date(log.created_at), 'EEEE, dd. MMMM yyyy, HH:mm', { locale: currentLocale });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('settings.communicationLog.preview.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Email Header Info */}
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20 shrink-0">{t('settings.communicationLog.preview.to')}:</span>
            <span className="font-medium">{log.recipient_email}</span>
            {log.recipient_name && (
              <span className="text-muted-foreground">({log.recipient_name})</span>
            )}
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20 shrink-0">{t('settings.communicationLog.preview.from')}:</span>
            <span>Bestellung.pro &lt;noreply@bestellung.pro&gt;</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20 shrink-0">{t('settings.communicationLog.preview.subject')}:</span>
            <span className="font-medium">{log.subject}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-20 shrink-0">{t('settings.communicationLog.preview.date')}:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-muted-foreground w-20 shrink-0">{t('settings.communicationLog.preview.status')}:</span>
            <Badge variant={log.status === 'sent' || log.status === 'confirmed' ? 'default' : 'destructive'}>
              {log.confirmed_at ? t('settings.communicationLog.status.confirmed') : t(`settings.communicationLog.status.${log.status}`)}
            </Badge>
          </div>
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-auto border rounded-lg bg-background">
          {log.body_html ? (
            <iframe
              srcDoc={log.body_html}
              className="w-full h-full min-h-[400px] border-0"
              sandbox="allow-same-origin"
              title="Email Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t('settings.communicationLog.preview.noContent')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t('settings.communicationLog.preview.noContentHint')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
