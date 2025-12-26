import { Badge } from '@/components/ui/badge';
import { UserPlus, Plus, TrendingUp, Link, AlertTriangle, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface ProcessingStats {
  supplierCreated: boolean;
  supplierName?: string | null;
  articlesCreated: number;
  articlesUpdated: number;
  articlesMerged?: number;
  totalItems?: number;
  matchedOrderId?: string | null;
  discrepanciesFound?: number;
}

interface InvoiceProcessingSummaryProps {
  parsedData: { processingStats?: ProcessingStats } | null;
  matchedOrderNumber?: string | null;
  discrepancyCount?: number;
  className?: string;
}

export function InvoiceProcessingSummary({ 
  parsedData, 
  matchedOrderNumber,
  discrepancyCount = 0,
  className 
}: InvoiceProcessingSummaryProps) {
  const { t } = useTranslation();
  const stats = parsedData?.processingStats;
  
  if (!stats) return null;

  const badges: React.ReactNode[] = [];

  // New supplier badge
  if (stats.supplierCreated) {
    badges.push(
      <Badge 
        key="supplier" 
        variant="secondary" 
        className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs"
      >
        <UserPlus className="h-3 w-3 mr-1" />
        {t('invoices.newSupplier', 'Neuer Lieferant')}
      </Badge>
    );
  }

  // New articles badge
  if (stats.articlesCreated > 0) {
    badges.push(
      <Badge 
        key="articles" 
        variant="secondary" 
        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        {stats.articlesCreated} {t('invoices.newArticles', 'neue Artikel')}
      </Badge>
    );
  }

  // Price updates badge
  if (stats.articlesUpdated > 0) {
    badges.push(
      <Badge 
        key="prices" 
        variant="secondary" 
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs"
      >
        <TrendingUp className="h-3 w-3 mr-1" />
        {stats.articlesUpdated} {t('invoices.priceUpdates', 'Preisänderungen')}
      </Badge>
    );
  }

  // Merged/matched articles badge
  if (stats.articlesMerged && stats.articlesMerged > 0) {
    badges.push(
      <Badge 
        key="merged" 
        variant="secondary" 
        className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs"
      >
        <Layers className="h-3 w-3 mr-1" />
        {stats.articlesMerged} {t('invoices.articlesMerged', 'zugeordnet')}
      </Badge>
    );
  }

  // Matched order badge
  if (matchedOrderNumber) {
    badges.push(
      <Badge 
        key="order" 
        variant="secondary" 
        className="bg-primary/10 text-primary border-primary/20 text-xs"
      >
        <Link className="h-3 w-3 mr-1" />
        {t('invoices.matchedOrder', 'Bestellung')} #{matchedOrderNumber}
      </Badge>
    );
  }

  // Discrepancies badge (if any)
  if (discrepancyCount > 0) {
    badges.push(
      <Badge 
        key="discrepancies" 
        variant="destructive" 
        className="text-xs"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {discrepancyCount} {t('invoices.discrepancies', 'Abweichungen')}
      </Badge>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges}
    </div>
  );
}
