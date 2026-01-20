import { useTranslation } from 'react-i18next';
import { format, Locale } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Trash2 } from 'lucide-react';

interface InventorySession {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: InventorySession[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  sessions,
  onLoadSession,
  onDeleteSession,
}: InventoryHistoryDialogProps) {
  const { t, i18n } = useTranslation();
  
  const getDateLocale = (): Locale => {
    const locales: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };
    return locales[i18n.language] || de;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('inventory.sessionHistory')}</DialogTitle>
          <DialogDescription>
            {t('inventory.sessionHistoryDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ClipboardList className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{session.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.created_at), 'dd.MM.yyyy HH:mm', {
                          locale: getDateLocale(),
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-8 sm:pl-0">
                    <Badge
                      variant={session.status === 'completed' ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {session.status === 'completed'
                        ? t('inventory.completed')
                        : t('inventory.inProgress')}
                    </Badge>
                    <Button
                      variant="ghost"
                      onClick={() => onLoadSession(session.id)}
                      className="h-10 sm:h-8 flex-1 sm:flex-initial"
                    >
                      {t('inventory.load')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSession(session.id)}
                      className="h-10 w-10 sm:h-8 sm:w-8 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('inventory.noHistory')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
