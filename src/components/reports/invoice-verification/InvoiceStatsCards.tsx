import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { InvoiceStats } from './types';

interface InvoiceStatsCardsProps {
  stats: InvoiceStats;
}

export function InvoiceStatsCards({ stats }: InvoiceStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{t('invoices.totalInvoices', 'Rechnungen gesamt')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">{t('invoices.pending', 'Ausstehend')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-destructive">{stats.discrepancies}</div>
          <div className="text-xs text-muted-foreground">{t('invoices.withDiscrepancies', 'Mit Abweichungen')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-success">{stats.approved}</div>
          <div className="text-xs text-muted-foreground">{t('invoices.approved', 'Freigegeben')}</div>
        </CardContent>
      </Card>
    </div>
  );
}
