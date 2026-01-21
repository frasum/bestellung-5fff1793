import { useTranslation } from 'react-i18next';
import { Article } from '@/hooks/useArticles';
import { InventoryItem } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, FileSpreadsheet, Save, CheckCircle, ClipboardList } from 'lucide-react';
import { format, Locale } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { SupplierInventoryCard } from './SupplierInventoryCard';
import { SupplierGroup, SessionStats, LocalInventoryItem } from './types';
import { generateInventoryListPdf, exportInventoryToExcel } from '@/lib/inventoryListPdf';

interface InventoryTabContentProps {
  activeSession: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    completed_at?: string | null;
  } | null | undefined;
  groupedInventoryArticles: SupplierGroup[];
  sessionStats: SessionStats;
  openInventorySuppliers: Set<string>;
  toggleInventorySupplier: (supplierId: string) => void;
  getItemValues: (articleId: string) => { storage_1: number; storage_2: number; total: number };
  onItemChange: (articleId: string, field: 'storage_1' | 'storage_2', value: string) => void;
  savingArticleIds: Set<string>;
  savedArticleIds: Set<string>;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onComplete: () => void;
  onAddArticle: (supplierId: string) => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (articleId: string) => void;
  onMergeArticles: (supplierId: string) => void;
  filteredArticles: Article[];
  localItems: Map<string, LocalInventoryItem>;
  supplierFilter: string;
  suppliers?: { id: string; name: string }[];
  articlesLoading: boolean;
}

export function InventoryTabContent({
  activeSession,
  groupedInventoryArticles,
  sessionStats,
  openInventorySuppliers,
  toggleInventorySupplier,
  getItemValues,
  onItemChange,
  savingArticleIds,
  savedArticleIds,
  hasChanges,
  isSaving,
  onSave,
  onComplete,
  onAddArticle,
  onEditArticle,
  onDeleteArticle,
  onMergeArticles,
  filteredArticles,
  localItems,
  supplierFilter,
  suppliers,
  articlesLoading,
}: InventoryTabContentProps) {
  const { t, i18n } = useTranslation();

  const getDateLocale = (): Locale => {
    const locales: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };
    return locales[i18n.language] || de;
  };

  const handleExportPdf = () => {
    const supplierName =
      supplierFilter && supplierFilter !== 'all'
        ? suppliers?.find((s) => s.id === supplierFilter)?.name
        : undefined;

    const itemsMap = new Map<string, InventoryItem>();
    localItems.forEach((item, key) => {
      itemsMap.set(key, {
        ...item,
        total: item.storage_1 + item.storage_2,
      } as InventoryItem);
    });

    generateInventoryListPdf(filteredArticles, supplierName, itemsMap);
  };

  const handleExportExcel = () => {
    const supplierName =
      supplierFilter && supplierFilter !== 'all'
        ? suppliers?.find((s) => s.id === supplierFilter)?.name
        : undefined;

    const itemsMap = new Map<string, InventoryItem>();
    localItems.forEach((item, key) => {
      itemsMap.set(key, {
        ...item,
        total: item.storage_1 + item.storage_2,
      } as InventoryItem);
    });

    exportInventoryToExcel(filteredArticles, itemsMap, supplierName);
  };

  if (!activeSession) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            {t('inventory.selectOrCreateSession', 'Wählen Sie eine Inventur aus oder erstellen Sie eine neue.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isReadOnly = activeSession.status === 'completed';

  return (
    <Card>
      <CardHeader className="pb-3 px-4 lg:px-6">
        {/* Read-only notice for completed sessions */}
        {isReadOnly && (
          <div className="mb-3 p-2 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {t('inventory.viewingCompleted', 'Sie sehen eine abgeschlossene Inventur (nur Ansicht).')}
          </div>
        )}
        
        {/* Mobile View */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">{activeSession.name}</CardTitle>
                <Badge variant={isReadOnly ? 'default' : 'secondary'} className="text-xs">
                  {isReadOnly ? t('inventory.completed') : t('inventory.inProgress')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isReadOnly && activeSession.completed_at
                  ? format(new Date(activeSession.completed_at), 'dd.MM.yy HH:mm', { locale: getDateLocale() })
                  : format(new Date(activeSession.created_at), 'dd.MM.yy HH:mm', { locale: getDateLocale() })}
              </p>
            </div>
          </div>

          {/* Progress Stats - Mobile */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{sessionStats.progressPercent}%</div>
              <div className="text-xs text-muted-foreground">{t('inventory.progress', 'Fortschritt')}</div>
            </div>
            <div className="text-center border-x">
              <div className="text-lg font-bold">{sessionStats.capturedArticles}/{sessionStats.totalArticles}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.captured')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">€{sessionStats.totalValue.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.value')}</div>
            </div>
          </div>

          <div className={`grid gap-2 ${isReadOnly ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <Button variant="outline" size="sm" onClick={handleExportPdf} className="h-10">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-10">
              <FileSpreadsheet className="w-4 h-4" />
            </Button>
            {!isReadOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={!hasChanges || isSaving}
                  className="h-10"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={onComplete} className="h-10">
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{activeSession.name}</CardTitle>
                  <Badge variant={isReadOnly ? 'default' : 'secondary'}>
                    {isReadOnly ? t('inventory.completed') : t('inventory.inProgress')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isReadOnly && activeSession.completed_at
                    ? t('inventory.completedOn', 'Abgeschlossen am') + ' ' + format(new Date(activeSession.completed_at), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })
                    : t('inventory.startedOn', 'Gestartet am') + ' ' + format(new Date(activeSession.created_at), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              {!isReadOnly && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save')}
                  </Button>
                  <Button size="sm" onClick={onComplete}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('inventory.completeSession')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Stats - Desktop */}
          <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{sessionStats.progressPercent}%</div>
              <div className="text-xs text-muted-foreground">{t('inventory.progress', 'Fortschritt')}</div>
            </div>
            <div className="text-center border-l">
              <div className="text-2xl font-bold">{sessionStats.capturedArticles}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.captured')}</div>
            </div>
            <div className="text-center border-l">
              <div className="text-2xl font-bold">{sessionStats.totalArticles}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.total')}</div>
            </div>
            <div className="text-center border-l">
              <div className="text-2xl font-bold text-green-600">€{sessionStats.totalValue.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.value')}</div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
