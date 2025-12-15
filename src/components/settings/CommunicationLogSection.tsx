import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi, type Locale } from 'date-fns/locale';
import { useCommunicationLogs, CommunicationLog } from '@/hooks/useCommunicationLogs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mail, Package, UserPlus, ClipboardList, CheckCircle, AlertCircle, Clock, ChevronDown, Eye } from 'lucide-react';
import i18next from 'i18next';
import { CommunicationLogPreviewDialog } from './CommunicationLogPreviewDialog';

const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  fr: fr,
  it: it,
  th: th,
  vi: vi,
};

const emailTypeConfig: Record<string, { icon: React.ReactNode; labelKey: string; color: string }> = {
  order_sent: { 
    icon: <Package className="h-3.5 w-3.5" />, 
    labelKey: 'settings.communicationLog.types.orderSent',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  order_confirmed: { 
    icon: <CheckCircle className="h-3.5 w-3.5" />, 
    labelKey: 'settings.communicationLog.types.orderConfirmed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  preorder_notification: { 
    icon: <ClipboardList className="h-3.5 w-3.5" />, 
    labelKey: 'settings.communicationLog.types.preorderNotification',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  team_invitation: { 
    icon: <UserPlus className="h-3.5 w-3.5" />, 
    labelKey: 'settings.communicationLog.types.teamInvitation',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  confirmation_notification: { 
    icon: <Mail className="h-3.5 w-3.5" />, 
    labelKey: 'settings.communicationLog.types.confirmationNotification',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
  },
};

const statusConfig: Record<string, { icon: React.ReactNode; labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  sent: { 
    icon: <CheckCircle className="h-3 w-3" />, 
    labelKey: 'settings.communicationLog.status.sent',
    variant: 'default'
  },
  confirmed: { 
    icon: <CheckCircle className="h-3 w-3" />, 
    labelKey: 'settings.communicationLog.status.confirmed',
    variant: 'default'
  },
  pending: { 
    icon: <Clock className="h-3 w-3" />, 
    labelKey: 'settings.communicationLog.status.pending',
    variant: 'secondary'
  },
  failed: { 
    icon: <AlertCircle className="h-3 w-3" />, 
    labelKey: 'settings.communicationLog.status.failed',
    variant: 'destructive'
  },
};

export function CommunicationLogSection() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const { data: logs, isLoading } = useCommunicationLogs(filter);
  const currentLocale = localeMap[i18next.language] || de;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    if (!logs) return {};
    return logs.reduce((groups, log) => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
      return groups;
    }, {} as Record<string, CommunicationLog[]>);
  }, [logs]);

  // Get sorted date keys (newest first)
  const sortedDates = useMemo(() => {
    return Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));
  }, [groupedLogs]);

  // Initialize open groups (first group open by default)
  useMemo(() => {
    if (sortedDates.length > 0 && Object.keys(openGroups).length === 0) {
      setOpenGroups({ [sortedDates[0]]: true });
    }
  }, [sortedDates]);

  const toggleGroup = (date: string) => {
    setOpenGroups(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const formatDateHeader = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, dd. MMMM yyyy', { locale: currentLocale });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: currentLocale });
  };

  const getEmailTypeDisplay = (type: string) => {
    const config = emailTypeConfig[type] || { 
      icon: <Mail className="h-3.5 w-3.5" />, 
      labelKey: 'settings.communicationLog.types.unknown',
      color: 'bg-muted text-muted-foreground'
    };
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span className="hidden sm:inline">{t(config.labelKey)}</span>
      </div>
    );
  };

  const getStatusDisplay = (log: CommunicationLog) => {
    const status = log.confirmed_at ? 'confirmed' : log.status;
    const config = statusConfig[status] || statusConfig.sent;
    return (
      <Badge variant={config.variant} className="gap-1 text-xs">
        {config.icon}
        <span className="hidden sm:inline">{t(config.labelKey)}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('settings.communicationLog.description')}
        </p>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('settings.communicationLog.filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('settings.communicationLog.filterAll')}</SelectItem>
            <SelectItem value="order_sent">{t('settings.communicationLog.types.orderSent')}</SelectItem>
            <SelectItem value="order_confirmed">{t('settings.communicationLog.types.orderConfirmed')}</SelectItem>
            <SelectItem value="preorder_notification">{t('settings.communicationLog.types.preorderNotification')}</SelectItem>
            <SelectItem value="team_invitation">{t('settings.communicationLog.types.teamInvitation')}</SelectItem>
            <SelectItem value="confirmation_notification">{t('settings.communicationLog.types.confirmationNotification')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedDates.length > 0 ? (
        <div className="space-y-2">
          {sortedDates.map((date) => {
            const logsForDate = groupedLogs[date];
            const isOpen = openGroups[date] ?? false;

            return (
              <Collapsible key={date} open={isOpen} onOpenChange={() => toggleGroup(date)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-muted/50 hover:bg-muted rounded-lg border transition-colors">
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                    <span className="font-medium">{formatDateHeader(date)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {logsForDate.length} {logsForDate.length === 1 ? 'E-Mail' : 'E-Mails'}
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-1 border rounded-lg overflow-hidden divide-y divide-border">
                    {logsForDate.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedLog(log);
                          setPreviewOpen(true);
                        }}
                      >
                        {/* Time */}
                        <span className="text-sm text-muted-foreground font-mono w-12 shrink-0">
                          {formatTime(log.created_at)}
                        </span>

                        {/* Type Badge */}
                        <div className="shrink-0">
                          {getEmailTypeDisplay(log.email_type)}
                        </div>

                        {/* Recipient */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {log.recipient_name && (
                              <span className="font-medium text-sm truncate">{log.recipient_name}</span>
                            )}
                            <span className="text-sm text-muted-foreground truncate">
                              {log.recipient_email}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {log.subject}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="shrink-0">
                          {getStatusDisplay(log)}
                        </div>

                        {/* Preview Icon */}
                        <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
          <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t('settings.communicationLog.noLogs')}</p>
        </div>
      )}

      <CommunicationLogPreviewDialog
        log={selectedLog}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
