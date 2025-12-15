import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useArticles, useUpdateArticle } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  useInventorySessionsWithStats,
  useInventorySession,
  useInventoryItems,
  useCreateInventorySession,
  useUpdateInventorySession,
  useBulkUpsertInventoryItems,
  useDeleteInventorySession,
  InventoryItem,
  InventorySessionWithStats,
} from '@/hooks/useInventory';
import { useUnits, useCreateUnit, useDeleteUnit } from '@/hooks/useUnits';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  ClipboardList,
  FileText,
  FileSpreadsheet,
  Search,
  Save,
  CheckCircle,
  History,
  Trash2,
  Euro,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  GitCompareArrows,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, Locale } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { generateInventoryListPdf, exportInventoryToExcel } from '@/lib/inventoryListPdf';
import { toast } from 'sonner';
import { InventoryComparisonDialog } from './InventoryComparisonDialog';

interface LocalInventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
  unit_price?: number;
}

const DEFAULT_UNITS = ['kg', 'g', 'Stück', 'Stk', 'Liter', 'l', '0,75l', '1,0l', 'ml', 'Pg.', 'Ka.', 'Kt.', 'Fl.', 'Dose', 'Bund', 'Beutel', 'Pack'];

export const InventoryTab = () => {
  const { t, i18n } = useTranslation();

  const getDateLocale = () => {
    const locales: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };
    return locales[i18n.language] || de;
  };

  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState<Map<string, LocalInventoryItem>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitValue, setEditingUnitValue] = useState<string>('');
  const [newUnitName, setNewUnitName] = useState('');
  
  const [openPriceSuppliers, setOpenPriceSuppliers] = useState<Set<string>>(new Set());
  const [openInventorySuppliers, setOpenInventorySuppliers] = useState<Set<string>>(new Set());

  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: suppliers } = useSuppliers();
  const { data: sessions, isLoading: sessionsLoading } = useInventorySessionsWithStats();
  const { data: activeSession } = useInventorySession(activeSessionId);
  const { data: inventoryItems } = useInventoryItems(activeSessionId);
  const { data: units } = useUnits();
  const { data: dbCategories } = useCategories();

  const createSession = useCreateInventorySession();
  const updateSession = useUpdateInventorySession();
  const bulkUpsertItems = useBulkUpsertInventoryItems();
  const deleteSession = useDeleteInventorySession();
  const updateArticle = useUpdateArticle();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();

  const commonUnits = useMemo(() => {
    const dbUnits = units?.map(u => u.name) || [];
    const articleUnits = articles?.map(a => a.unit).filter(Boolean) || [];
    const allUnits = [...new Set([...dbUnits, ...articleUnits])];
    return allUnits.length > 0 ? allUnits.sort() : DEFAULT_UNITS;
  }, [units, articles]);

  useEffect(() => {
    if (inventoryItems) {
      const itemsMap = new Map<string, LocalInventoryItem>();
      inventoryItems.forEach((item) => {
        itemsMap.set(item.article_id, {
          article_id: item.article_id,
          storage_1: Number(item.storage_1),
          storage_2: Number(item.storage_2),
          unit_price: item.unit_price != null ? Number(item.unit_price) : undefined,
        });
      });
      setLocalItems(itemsMap);
      setHasChanges(false);
    }
  }, [inventoryItems]);

  useEffect(() => {
    if (sessions && !activeSessionId) {
      const inProgressSession = sessions.find((s) => s.status === 'in_progress');
      if (inProgressSession) {
        setActiveSessionId(inProgressSession.id);
      }
    }
  }, [sessions, activeSessionId]);

  const categories = useMemo(() => {
    const allCats = new Set<string>();
    if (dbCategories) {
      dbCategories.forEach(c => allCats.add(c.name));
    }
    if (articles) {
      articles.filter(a => a.category).forEach(a => allCats.add(a.category!));
    }
    return Array.from(allCats).sort();
  }, [articles, dbCategories]);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    let filtered = articles.filter((a) => a.is_active);

    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter((a) => a.supplier_id === supplierFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.sku?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [articles, supplierFilter, categoryFilter, searchQuery]);

  const groupedArticlesBySupplier = useMemo(() => {
    if (!filteredArticles) return [];
    
    const grouped = new Map<string, { supplier: { id: string; name: string }; articles: typeof filteredArticles }>();
    
    filteredArticles.forEach((article) => {
      if (!article.supplier_id || !article.suppliers) return;
      
      if (!grouped.has(article.supplier_id)) {
        grouped.set(article.supplier_id, {
          supplier: { id: article.supplier_id, name: article.suppliers.name },
          articles: [],
        });
      }
      grouped.get(article.supplier_id)!.articles.push(article);
    });
    
    return Array.from(grouped.values()).sort((a, b) => 
      a.supplier.name.localeCompare(b.supplier.name, 'de')
    );
  }, [filteredArticles]);

  const groupedInventoryArticles = useMemo(() => {
    if (!filteredArticles) return [];
    
    const grouped = new Map<string, { 
      supplier: { id: string; name: string }; 
      articles: typeof filteredArticles;
      capturedCount: number;
      totalValue: number;
    }>();
    
    filteredArticles.forEach((article) => {
      if (!article.supplier_id || !article.suppliers) return;
      
      if (!grouped.has(article.supplier_id)) {
        grouped.set(article.supplier_id, {
          supplier: { id: article.supplier_id, name: article.suppliers.name },
          articles: [],
          capturedCount: 0,
          totalValue: 0,
        });
      }
      const group = grouped.get(article.supplier_id)!;
      group.articles.push(article);
      
      const values = localItems.get(article.id);
      if (values && (values.storage_1 > 0 || values.storage_2 > 0)) {
        group.capturedCount++;
        const price = values.unit_price ?? article.price;
        group.totalValue += (values.storage_1 + values.storage_2) * price;
      }
    });
    
    return Array.from(grouped.values()).sort((a, b) => 
      a.supplier.name.localeCompare(b.supplier.name, 'de')
    );
  }, [filteredArticles, localItems]);

  // Calculate overall progress and total value for active session
  const sessionStats = useMemo(() => {
    let totalArticles = 0;
    let capturedArticles = 0;
    let totalValue = 0;

    groupedInventoryArticles.forEach(group => {
      totalArticles += group.articles.length;
      capturedArticles += group.capturedCount;
      totalValue += group.totalValue;
    });

    const progressPercent = totalArticles > 0 ? Math.round((capturedArticles / totalArticles) * 100) : 0;

    return {
      totalArticles,
      capturedArticles,
      totalValue,
      progressPercent,
    };
  }, [groupedInventoryArticles]);

  useEffect(() => {
    if (searchQuery && groupedArticlesBySupplier.length > 0) {
      setOpenPriceSuppliers(new Set(groupedArticlesBySupplier.map(g => g.supplier.id)));
      setOpenInventorySuppliers(new Set(groupedInventoryArticles.map(g => g.supplier.id)));
    }
  }, [searchQuery, groupedArticlesBySupplier, groupedInventoryArticles]);

  const togglePriceSupplier = (supplierId: string) => {
    setOpenPriceSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const toggleInventorySupplier = (supplierId: string) => {
    setOpenInventorySuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    const result = await createSession.mutateAsync({ name: newSessionName });
    setActiveSessionId(result.id);
    setShowNewSessionDialog(false);
    setNewSessionName('');
  };

  const handleItemChange = (
    articleId: string,
    field: 'storage_1' | 'storage_2',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setLocalItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(articleId) || {
        article_id: articleId,
        storage_1: 0,
        storage_2: 0,
      };
      newMap.set(articleId, { ...existing, [field]: numValue });
      return newMap;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!activeSessionId) return;
    const items = Array.from(localItems.values())
      .filter((item) => item.storage_1 > 0 || item.storage_2 > 0)
      .map((item) => {
        const article = articles?.find((a) => a.id === item.article_id);
        return {
          ...item,
          unit_price: article?.price || 0,
        };
      });
    await bulkUpsertItems.mutateAsync({ session_id: activeSessionId, items });
    setHasChanges(false);
  };

  const handleComplete = async () => {
    if (!activeSessionId) return;
    await handleSave();
    await updateSession.mutateAsync({
      id: activeSessionId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    setActiveSessionId(null);
  };

  const handleLoadSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistoryDialog(false);
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    await deleteSession.mutateAsync(deleteSessionId);
    if (activeSessionId === deleteSessionId) {
      setActiveSessionId(null);
    }
    setDeleteSessionId(null);
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

  const getItemValues = (articleId: string) => {
    const item = localItems.get(articleId);
    return {
      storage_1: item?.storage_1 || 0,
      storage_2: item?.storage_2 || 0,
      total: (item?.storage_1 || 0) + (item?.storage_2 || 0),
    };
  };

  const handleStartPriceEdit = (articleId: string, currentPrice: number) => {
    setEditingPriceId(articleId);
    setEditingPriceValue(currentPrice.toString());
  };

  const handleCancelPriceEdit = () => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  const handleSavePriceEdit = async (articleId: string) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error(t('inventory.invalidPrice'));
      return;
    }
    try {
      await updateArticle.mutateAsync({ id: articleId, price: newPrice });
      toast.success(t('inventory.priceUpdated'));
      setEditingPriceId(null);
      setEditingPriceValue('');
    } catch {
      toast.error(t('inventory.saveError'));
    }
  };

  const handleStartUnitEdit = (articleId: string, currentUnit: string) => {
    setEditingUnitId(articleId);
    setEditingUnitValue(currentUnit);
  };

  const handleCancelUnitEdit = () => {
    setEditingUnitId(null);
    setEditingUnitValue('');
  };

  const handleSaveUnitEdit = async (articleId: string, value?: string) => {
    const unitValue = value ?? editingUnitValue;
    if (!unitValue.trim()) {
      toast.error(t('inventory.unitCannotBeEmpty'));
      return;
    }
    try {
      await updateArticle.mutateAsync({ id: articleId, unit: unitValue.trim() });
      toast.success(t('inventory.unitUpdated'));
      setEditingUnitId(null);
      setEditingUnitValue('');
    } catch {
      toast.error(t('inventory.saveError'));
    }
  };

  const activeFilterCount = (supplierFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Session Dropdown + Actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Select 
            value={activeSessionId || ''} 
            onValueChange={(value) => setActiveSessionId(value || null)}
          >
            <SelectTrigger className="w-full max-w-xs h-9 bg-background border-border">
              <SelectValue placeholder={t('inventory.selectSession', 'Inventur auswählen...')} />
            </SelectTrigger>
            <SelectContent>
              {sessions?.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <div className="flex items-center gap-2">
                      {session.status === 'in_progress' ? (
                        <span className="text-amber-500">⏳</span>
                      ) : (
                        <span className="text-green-500">✓</span>
                      )}
                      <span className="truncate font-medium">{session.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({format(new Date(session.created_at), 'dd.MM.yy', { locale: getDateLocale() })})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">
                      {session.itemCount} {t('inventory.articles')} · {session.status === 'completed' 
                        ? `€${session.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : t('inventory.inProgressLabel', 'In Bearbeitung')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowComparisonDialog(true)} className="h-9">
            <GitCompareArrows className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">{t('inventory.compare', 'Vergleichen')}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistoryDialog(true)} className="h-9">
            <History className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">{t('inventory.history')}</span>
          </Button>
          <Button size="sm" onClick={() => setShowNewSessionDialog(true)} className="h-9">
            <Plus className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">{t('inventory.newSession')}</span>
            <span className="lg:hidden">{t('inventory.new')}</span>
          </Button>
        </div>
      </div>

      {/* Inner Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto bg-muted/50 border border-border rounded-md h-9">
          <TabsTrigger value="inventory" className="gap-2 flex-1 sm:flex-initial h-8 text-sm">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">{t('inventory.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="prices" className="gap-2 flex-1 sm:flex-initial h-8 text-sm">
            <Euro className="w-4 h-4" />
            <span className="hidden sm:inline">{t('inventory.articlePrices')}</span>
            <span className="sm:hidden">{t('inventory.articlePrices')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Filters - Desktop */}
        <div className="hidden sm:flex flex-col sm:flex-row gap-4 mt-4 pb-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('inventory.searchArticles')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background border-border"
            />
          </div>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 bg-background border-border">
              <SelectValue placeholder={t('inventory.filterBySupplier')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventory.allSuppliers')}</SelectItem>
              {suppliers?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 bg-background border-border">
              <SelectValue placeholder={t('inventory.filterByCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category!}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filters - Mobile */}
        <div className="flex sm:hidden gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 relative flex-shrink-0">
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('inventory.supplier')}</Label>
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('inventory.allSuppliers')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('inventory.allSuppliers')}</SelectItem>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('inventory.category')}</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('inventory.allCategories')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category!}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSupplierFilter('all');
                      setCategoryFilter('all');
                    }}
                  >
                    {t('common.resetFilters')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Inventory Tab Content */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          {activeSession && (
            <Card>
              <CardHeader className="pb-3 px-4 lg:px-6">
                {/* Read-only notice for completed sessions */}
                {activeSession.status === 'completed' && (
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
                        <Badge variant={activeSession.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {activeSession.status === 'completed' ? t('inventory.completed') : t('inventory.inProgress')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {activeSession.status === 'completed' && activeSession.completed_at
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

                  <div className={`grid gap-2 ${activeSession.status === 'completed' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                    <Button variant="outline" size="sm" onClick={handleExportPdf} className="h-10">
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-10">
                      <FileSpreadsheet className="w-4 h-4" />
                    </Button>
                    {activeSession.status !== 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSave}
                          disabled={!hasChanges || bulkUpsertItems.isPending}
                          className="h-10"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={handleComplete} className="h-10">
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
                          <Badge variant={activeSession.status === 'completed' ? 'default' : 'secondary'}>
                            {activeSession.status === 'completed' ? t('inventory.completed') : t('inventory.inProgress')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activeSession.status === 'completed' && activeSession.completed_at
                            ? `${t('inventory.completedAt')} ${format(new Date(activeSession.completed_at), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })}`
                            : `${t('inventory.startedAt')} ${format(new Date(activeSession.created_at), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportPdf}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportExcel}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      {activeSession.status !== 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            disabled={!hasChanges || bulkUpsertItems.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {t('common.save')}
                          </Button>
                          <Button size="sm" onClick={handleComplete}>
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
                      <div className="text-sm text-muted-foreground">{t('inventory.progress', 'Fortschritt')}</div>
                    </div>
                    <div className="text-center border-x">
                      <div className="text-2xl font-bold">{sessionStats.capturedArticles}</div>
                      <div className="text-sm text-muted-foreground">{t('inventory.captured')} ({t('inventory.of')} {sessionStats.totalArticles})</div>
                    </div>
                    <div className="text-center border-r">
                      <div className="text-2xl font-bold text-green-600">
                        €{sessionStats.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('inventory.totalValue')}</div>
                    </div>
                    <div className="text-center">
                      <div className="w-full bg-muted rounded-full h-3 mt-1">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${sessionStats.progressPercent}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {sessionStats.capturedArticles} / {sessionStats.totalArticles} {t('inventory.articles')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {!activeSession ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('inventory.noActiveSession')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('inventory.startNewOrLoadHistory')}
                </p>
                <Button onClick={() => setShowNewSessionDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('inventory.startSession')}
                </Button>
              </CardContent>
            </Card>
          ) : articlesLoading ? (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : groupedInventoryArticles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('inventory.noArticles')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {groupedInventoryArticles.map((group) => {
                const isOpen = openInventorySuppliers.has(group.supplier.id);
                return (
                  <Collapsible
                    key={group.supplier.id}
                    open={isOpen}
                    onOpenChange={() => toggleInventorySupplier(group.supplier.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isOpen ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                              <div>
                                <CardTitle className="text-base font-medium">
                                  {group.supplier.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {t('inventory.xOfYCaptured', { captured: group.capturedCount, total: group.articles.length })}
                                  {group.totalValue > 0 && (
                                    <span className="ml-2">• €{group.totalValue.toFixed(2)}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {group.capturedCount > 0 && group.capturedCount === group.articles.length && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('inventory.complete')}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="p-0 pt-0">
                          <div className="divide-y divide-border sm:hidden">
                            {group.articles.map((article) => {
                              const values = getItemValues(article.id);
                              return (
                                <div key={article.id} className="p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-foreground text-sm">{article.name}</p>
                                      {article.sku && (
                                        <p className="text-xs text-muted-foreground">{article.sku}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {article.unit}
                                      </p>
                                    </div>
                                    {values.total > 0 && (
                                      <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-semibold text-sm">{values.total.toFixed(1)}</p>
                                        <p className="text-xs text-muted-foreground">
                                          €{(values.total * article.price).toFixed(2)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">{t('inventory.storage1')}</Label>
                                      <Input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={values.storage_1 || ''}
                                        onChange={(e) =>
                                          handleItemChange(article.id, 'storage_1', e.target.value)
                                        }
                                        onFocus={(e) => e.target.select()}
                                        className="h-11 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground mb-1 block">{t('inventory.storage2')}</Label>
                                      <Input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={values.storage_2 || ''}
                                        onChange={(e) =>
                                          handleItemChange(article.id, 'storage_2', e.target.value)
                                        }
                                        onFocus={(e) => e.target.select()}
                                        className="h-11 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="hidden sm:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('inventory.article')}</TableHead>
                                  <TableHead>{t('inventory.unit')}</TableHead>
                                  <TableHead className="text-right">{t('inventory.price')}</TableHead>
                                  <TableHead className="w-28 text-center">{t('inventory.storage1')}</TableHead>
                                  <TableHead className="w-28 text-center">{t('inventory.storage2')}</TableHead>
                                  <TableHead className="w-20 text-right">{t('inventory.sum')}</TableHead>
                                  <TableHead className="w-24 text-right">{t('inventory.value')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.articles.map((article) => {
                                  const values = getItemValues(article.id);
                                  return (
                                    <TableRow key={article.id}>
                                      <TableCell>
                                        <div>
                                          <span className="font-medium">{article.name}</span>
                                          {article.sku && (
                                            <span className="block text-xs text-muted-foreground">
                                              {article.sku}
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {article.unit}
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground">
                                        €{article.price.toFixed(2)}
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={values.storage_1 || ''}
                                          onChange={(e) =>
                                            handleItemChange(article.id, 'storage_1', e.target.value)
                                          }
                                          onFocus={(e) => e.target.select()}
                                          className="w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          placeholder="0"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={values.storage_2 || ''}
                                          onChange={(e) =>
                                            handleItemChange(article.id, 'storage_2', e.target.value)
                                          }
                                          onFocus={(e) => e.target.select()}
                                          className="w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          placeholder="0"
                                        />
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {values.total > 0 ? values.total.toFixed(1) : '-'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {values.total > 0
                                          ? `€${(values.total * article.price).toFixed(2)}`
                                          : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Prices Tab Content */}
        <TabsContent value="prices" className="space-y-4 mt-4">
          {articlesLoading ? (
            <Card>
              <CardContent className="py-8">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : groupedArticlesBySupplier.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('inventory.noArticles')}
              </CardContent>
            </Card>
          ) : (
            <>
              {groupedArticlesBySupplier.map((group) => {
                const isOpen = openPriceSuppliers.has(group.supplier.id);
                return (
                  <Collapsible
                    key={group.supplier.id}
                    open={isOpen}
                    onOpenChange={() => togglePriceSupplier(group.supplier.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isOpen ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                              <div>
                                <CardTitle className="text-base font-medium">
                                  {group.supplier.name}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {t('inventory.xArticles', { count: group.articles.length })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="p-0 pt-0">
                          <div className="divide-y divide-border sm:hidden">
                            {group.articles.map((article) => (
                              <div key={article.id} className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground text-sm">{article.name}</p>
                                    {article.sku && (
                                      <p className="text-xs text-muted-foreground">{article.sku}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {article.unit}
                                    </p>
                                    {article.category && (
                                      <Badge variant="secondary" className="mt-1 text-xs">
                                        {article.category}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0 ml-3">
                                    {editingPriceId === article.id ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          inputMode="decimal"
                                          min="0"
                                          step="0.01"
                                          value={editingPriceValue}
                                          onChange={(e) => setEditingPriceValue(e.target.value)}
                                          onFocus={(e) => e.target.select()}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSavePriceEdit(article.id);
                                            if (e.key === 'Escape') handleCancelPriceEdit();
                                          }}
                                          className="w-20 h-10 text-right text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          autoFocus
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-10 w-10"
                                          onClick={() => handleSavePriceEdit(article.id)}
                                          disabled={updateArticle.isPending}
                                        >
                                          <Check className="w-5 h-5 text-green-600" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-10 w-10"
                                          onClick={handleCancelPriceEdit}
                                        >
                                          <X className="w-5 h-5 text-destructive" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleStartPriceEdit(article.id, article.price)}
                                        className="font-semibold text-lg hover:text-primary cursor-pointer transition-colors px-3 py-2 rounded-lg hover:bg-muted min-w-[80px] text-right"
                                      >
                                        €{article.price.toFixed(2)}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="hidden sm:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('inventory.article')}</TableHead>
                                  <TableHead>{t('inventory.category')}</TableHead>
                                  <TableHead className="w-24">{t('inventory.unit')}</TableHead>
                                  <TableHead className="w-36 text-right">{t('inventory.price')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.articles.map((article) => (
                                  <TableRow key={article.id}>
                                    <TableCell>
                                      <div>
                                        <span className="font-medium">{article.name}</span>
                                        {article.sku && (
                                          <span className="block text-xs text-muted-foreground">
                                            {article.sku}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {article.category || '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Popover 
                                        open={editingUnitId === article.id}
                                        onOpenChange={(open) => {
                                          if (open) {
                                            handleStartUnitEdit(article.id, article.unit);
                                          } else {
                                            handleCancelUnitEdit();
                                            setNewUnitName('');
                                          }
                                        }}
                                      >
                                        <PopoverTrigger asChild>
                                          <span
                                            className="cursor-pointer hover:text-primary hover:underline"
                                          >
                                            {article.unit}
                                          </span>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56 p-0 bg-background z-50" align="start">
                                          <div className="p-2 border-b">
                                            <div className="flex gap-1">
                                              <Input
                                                placeholder={t('inventory.searchOrAdd')}
                                                value={newUnitName}
                                                onChange={(e) => setNewUnitName(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && newUnitName.trim()) {
                                                    const exactMatch = commonUnits.find(u => u.toLowerCase() === newUnitName.trim().toLowerCase());
                                                    if (exactMatch) {
                                                      handleSaveUnitEdit(article.id, exactMatch);
                                                      setNewUnitName('');
                                                    } else {
                                                      createUnit.mutate(newUnitName.trim(), {
                                                        onSuccess: () => {
                                                          handleSaveUnitEdit(article.id, newUnitName.trim());
                                                          setNewUnitName('');
                                                        }
                                                      });
                                                    }
                                                  }
                                                }}
                                                className="h-8 text-sm"
                                              />
                                              {newUnitName.trim() && !commonUnits.some(u => u.toLowerCase() === newUnitName.trim().toLowerCase()) && (
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-8 w-8 shrink-0"
                                                  disabled={createUnit.isPending}
                                                  onClick={() => {
                                                    createUnit.mutate(newUnitName.trim(), {
                                                      onSuccess: () => {
                                                        handleSaveUnitEdit(article.id, newUnitName.trim());
                                                        setNewUnitName('');
                                                      }
                                                    });
                                                  }}
                                                >
                                                  <Plus className="w-4 h-4" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="max-h-48 overflow-y-auto p-1">
                                            {commonUnits
                                              .filter(unit => !newUnitName.trim() || unit.toLowerCase().includes(newUnitName.toLowerCase()))
                                              .map((unit) => {
                                                const dbUnit = units?.find(u => u.name === unit);
                                                return (
                                                  <div
                                                    key={unit}
                                                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer group"
                                                    onClick={() => {
                                                      handleSaveUnitEdit(article.id, unit);
                                                      setNewUnitName('');
                                                    }}
                                                  >
                                                    <span className={`text-sm ${article.unit === unit ? 'font-medium text-primary' : ''}`}>
                                                      {unit}
                                                    </span>
                                                    {dbUnit && (
                                                      <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          deleteUnit.mutate(dbUnit.id);
                                                        }}
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </Button>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {editingPriceId === article.id ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editingPriceValue}
                                            onChange={(e) => setEditingPriceValue(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSavePriceEdit(article.id);
                                              if (e.key === 'Escape') handleCancelPriceEdit();
                                            }}
                                            className="w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            autoFocus
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleSavePriceEdit(article.id)}
                                            disabled={updateArticle.isPending}
                                          >
                                            <Check className="w-4 h-4 text-green-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={handleCancelPriceEdit}
                                          >
                                            <X className="w-4 h-4 text-destructive" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handleStartPriceEdit(article.id, article.price)}
                                          className="font-medium hover:text-primary cursor-pointer transition-colors px-2 py-1 rounded hover:bg-muted"
                                        >
                                          €{article.price.toFixed(2)}
                                        </button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('inventory.startSession')}</DialogTitle>
            <DialogDescription>
              {t('inventory.enterSessionName')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">{t('common.name')}</Label>
              <Input
                id="session-name"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`${t('inventory.title')} ${format(new Date(), 'dd.MM.yyyy')}`}
                className="h-11 sm:h-9 text-base sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)} className="w-full sm:w-auto h-10 sm:h-9">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={createSession.isPending}
              className="w-full sm:w-auto h-10 sm:h-9"
            >
              {t('inventory.start')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('inventory.historyTitle')}</DialogTitle>
            <DialogDescription>
              {t('inventory.historyDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
            {sessionsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2 pb-2">
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
                        variant={
                          session.status === 'completed' ? 'default' : 'secondary'
                        }
                        className="shrink-0"
                      >
                        {session.status === 'completed'
                          ? t('inventory.completed')
                          : t('inventory.inProgress')}
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={() => handleLoadSession(session.id)}
                        className="h-10 sm:h-8 flex-1 sm:flex-initial"
                      >
                        {t('inventory.load')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSessionId(session.id)}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteSessionId}
        onOpenChange={() => setDeleteSessionId(null)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('inventory.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('inventory.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comparison Dialog */}
      <InventoryComparisonDialog
        open={showComparisonDialog}
        onOpenChange={setShowComparisonDialog}
        sessions={sessions || []}
        currentSessionId={activeSessionId}
      />
    </div>
  );
};

export default InventoryTab;
