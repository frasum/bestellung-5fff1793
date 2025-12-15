import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi, type Locale } from 'date-fns/locale';
import { useCommunicationLogs, CommunicationLog } from '@/hooks/useCommunicationLogs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Package, UserPlus, ClipboardList, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import i18next from 'i18next';

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
    icon: <Package className="h-4 w-4" />, 
    labelKey: 'settings.communicationLog.types.orderSent',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  order_confirmed: { 
    icon: <CheckCircle className="h-4 w-4" />, 
    labelKey: 'settings.communicationLog.types.orderConfirmed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  preorder_notification: { 
    icon: <ClipboardList className="h-4 w-4" />, 
    labelKey: 'settings.communicationLog.types.preorderNotification',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  },
  team_invitation: { 
    icon: <UserPlus className="h-4 w-4" />, 
    labelKey: 'settings.communicationLog.types.teamInvitation',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  confirmation_notification: { 
    icon: <Mail className="h-4 w-4" />, 
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: currentLocale });
  };

  const getEmailTypeDisplay = (type: string) => {
    const config = emailTypeConfig[type] || { 
      icon: <Mail className="h-4 w-4" />, 
      labelKey: 'settings.communicationLog.types.unknown',
      color: 'bg-gray-100 text-gray-800'
    };
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span>{t(config.labelKey)}</span>
      </div>
    );
  };

  const getStatusDisplay = (log: CommunicationLog) => {
    const status = log.confirmed_at ? 'confirmed' : log.status;
    const config = statusConfig[status] || statusConfig.sent;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {t(config.labelKey)}
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

      {logs && logs.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">{t('settings.communicationLog.columns.date')}</TableHead>
                <TableHead className="w-[160px]">{t('settings.communicationLog.columns.type')}</TableHead>
                <TableHead>{t('settings.communicationLog.columns.recipient')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('settings.communicationLog.columns.subject')}</TableHead>
                <TableHead className="w-[100px] text-right">{t('settings.communicationLog.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    {getEmailTypeDisplay(log.email_type)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {log.recipient_name && (
                        <span className="font-medium text-sm">{log.recipient_name}</span>
                      )}
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {log.recipient_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm truncate max-w-[300px] block">
                      {log.subject}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {getStatusDisplay(log)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
          <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t('settings.communicationLog.noLogs')}</p>
        </div>
      )}
    </div>
  );
}
