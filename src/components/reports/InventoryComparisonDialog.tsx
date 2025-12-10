import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, Locale } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { InventorySessionWithStats, useInventoryItems } from '@/hooks/useInventory';

interface InventoryComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: InventorySessionWithStats[];
  currentSessionId: string | null;
}

interface ComparisonItem {
  articleId: string;
  articleName: string;
  supplierName: string;
  unit: string;
  oldQuantity: number;
  newQuantity: number;
  oldValue: number;
  newValue: number;
  quantityDiff: number;
  valueDiff: number;
}

export const InventoryComparisonDialog = ({
  open,
  onOpenChange,
  sessions,
  currentSessionId,
}: InventoryComparisonDialogProps) => {
  const { t, i18n } = useTranslation();
  const [oldSessionId, setOldSessionId] = useState<string>('');
  const [newSessionId, setNewSessionId] = useState<string>(currentSessionId || '');

  const getDateLocale = (): Locale => {
    const locales: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };
    return locales[i18n.language] || de;
  };

  const { data: oldItems } = useInventoryItems(oldSessionId || null);
  const { data: newItems } = useInventoryItems(newSessionId || null);

  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'completed');
  }, [sessions]);

  const comparison = useMemo((): ComparisonItem[] => {
    if (!oldItems || !newItems) return [];

    const allArticleIds = new Set([
      ...oldItems.map(i => i.article_id),
      ...newItems.map(i => i.article_id),
    ]);

    const result: ComparisonItem[] = [];

    allArticleIds.forEach(articleId => {
      const oldItem = oldItems.find(i => i.article_id === articleId);
      const newItem = newItems.find(i => i.article_id === articleId);

      const article = oldItem?.article || newItem?.article;
      if (!article) return;

      const oldQty = oldItem ? (oldItem.storage_1 || 0) + (oldItem.storage_2 || 0) : 0;
      const newQty = newItem ? (newItem.storage_1 || 0) + (newItem.storage_2 || 0) : 0;
      const oldPrice = oldItem?.unit_price || 0;
      const newPrice = newItem?.unit_price || 0;
      const oldVal = oldQty * oldPrice;
      const newVal = newQty * newPrice;

      if (oldQty !== newQty || oldVal !== newVal) {
        result.push({
          articleId,
          articleName: article.name,
          supplierName: article.supplier?.name || '-',
          unit: article.unit,
          oldQuantity: oldQty,
          newQuantity: newQty,
          oldValue: oldVal,
          newValue: newVal,
          quantityDiff: newQty - oldQty,
          valueDiff: newVal - oldVal,
        });
      }
    });

    return result.sort((a, b) => a.supplierName.localeCompare(b.supplierName, 'de'));
  }, [oldItems, newItems]);

  const summary = useMemo(() => {
    const totalOldValue = comparison.reduce((sum, item) => sum + item.oldValue, 0);
    const totalNewValue = comparison.reduce((sum, item) => sum + item.newValue, 0);
    const increased = comparison.filter(i => i.quantityDiff > 0).length;
    const decreased = comparison.filter(i => i.quantityDiff < 0).length;
    const unchanged = comparison.filter(i => i.quantityDiff === 0).length;

    return {
      totalOldValue,
      totalNewValue,
      valueDiff: totalNewValue - totalOldValue,
      increased,
      decreased,
      unchanged,
      totalChanges: comparison.length,
    };
  }, [comparison]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('inventory.compareTitle', 'Inventur-Vergleich')}</DialogTitle>
          <DialogDescription>
            {t('inventory.compareDescription', 'Vergleichen Sie zwei Inventursitzungen, um Differenzen zu sehen.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>{t('inventory.oldSession', 'Ältere Inventur')}</Label>
            <Select value={oldSessionId} onValueChange={setOldSessionId}>
              <SelectTrigger>
                <SelectValue placeholder={t('inventory.selectSession', 'Inventur auswählen...')} />
              </SelectTrigger>
              <SelectContent>
                {completedSessions
                  .filter(s => s.id !== newSessionId)
                  .map(session => (
                    <SelectItem key={session.id} value={session.id}>
                      <span className="truncate">{session.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        ({format(new Date(session.created_at), 'dd.MM.yy', { locale: getDateLocale() })})
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('inventory.newSession', 'Neuere Inventur')}</Label>
            <Select value={newSessionId} onValueChange={setNewSessionId}>
              <SelectTrigger>
                <SelectValue placeholder={t('inventory.selectSession', 'Inventur auswählen...')} />
              </SelectTrigger>
              <SelectContent>
                {completedSessions
                  .filter(s => s.id !== oldSessionId)
                  .map(session => (
                    <SelectItem key={session.id} value={session.id}>
                      <span className="truncate">{session.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        ({format(new Date(session.created_at), 'dd.MM.yy', { locale: getDateLocale() })})
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {oldSessionId && newSessionId && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.totalChanges}</div>
                <div className="text-xs text-muted-foreground">{t('inventory.changedArticles', 'Änderungen')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+{summary.increased}</div>
                <div className="text-xs text-muted-foreground">{t('inventory.increased', 'Erhöht')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">-{summary.decreased}</div>
                <div className="text-xs text-muted-foreground">{t('inventory.decreased', 'Reduziert')}</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${summary.valueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.valueDiff >= 0 ? '+' : ''}{formatCurrency(summary.valueDiff)}
                </div>
                <div className="text-xs text-muted-foreground">{t('inventory.valueDiff', 'Wertdifferenz')}</div>
              </div>
            </div>

            {/* Comparison List */}
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              {comparison.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t('inventory.noDifferences', 'Keine Differenzen gefunden.')}
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {comparison.map(item => (
                    <div
                      key={item.articleId}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.articleName}</div>
                        <div className="text-xs text-muted-foreground">{item.supplierName}</div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {formatNumber(item.oldQuantity)} {item.unit}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatNumber(item.newQuantity)} {item.unit}
                        </span>
                      </div>

                      <Badge
                        variant={item.quantityDiff > 0 ? 'default' : item.quantityDiff < 0 ? 'destructive' : 'secondary'}
                        className="min-w-[70px] justify-center"
                      >
                        {item.quantityDiff > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : item.quantityDiff < 0 ? (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        ) : (
                          <Minus className="w-3 h-3 mr-1" />
                        )}
                        {item.quantityDiff > 0 ? '+' : ''}{formatNumber(item.quantityDiff)}
                      </Badge>

                      <div className={`text-sm font-medium min-w-[80px] text-right ${
                        item.valueDiff > 0 ? 'text-green-600' : item.valueDiff < 0 ? 'text-red-600' : ''
                      }`}>
                        {item.valueDiff > 0 ? '+' : ''}{formatCurrency(item.valueDiff)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
