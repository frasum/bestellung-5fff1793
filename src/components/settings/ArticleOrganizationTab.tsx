import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupplierOrderUnitSelect } from '@/components/suppliers/SupplierOrderUnitSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, CheckSquare, Square, Loader2, BarChart3, ChevronUp, ChevronDown, Eye, Trash2 } from 'lucide-react';
import { ArticlePreviewPanel } from './ArticlePreviewPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useArticles, useBulkUpdateArticles, useUpdateArticle, useDeleteArticle } from '@/hooks/useArticles';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUnits } from '@/hooks/useUnits';
import { useSuppliers, useUpdateSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useCategories } from '@/hooks/useCategories';
import { useOrderUnits } from '@/hooks/useOrderUnits';
import { TOP_CATEGORIES } from '@/components/suppliers/constants';
import { toast } from 'sonner';
import { ArticleFormDialog } from '@/components/suppliers/ArticleFormDialog';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';

type TopCategory = typeof TOP_CATEGORIES[number];

interface ArticleWithTopCategory {
  id: string;
  name: string;
  category: string | null;
  top_category: string | null;
  order_unit_id: string | null;
  supplier_id: string;
  suppliers?: { id: string; name: string } | null;
  unit: string;
  price: number;
  packaging_unit: number | null;
}

export const ArticleOrganizationTab = () => {
  const { t } = useTranslation();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useCategories();
  const { data: orderUnits = [] } = useOrderUnits();
  const { data: units = [] } = useUnits();
  const bulkUpdate = useBulkUpdateArticles();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopCategory, setFilterTopCategory] = useState<string>('all');
  const [filterMainCategory, setFilterMainCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterOrderUnit, setFilterOrderUnit] = useState<string>('all');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [filterNoOrderUnit, setFilterNoOrderUnit] = useState(false);
  const [filterNoPackaging, setFilterNoPackaging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPackagingValue, setBulkPackagingValue] = useState<string>('');
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleWithTopCategory | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleWithTopCategory | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'supplier' | 'unit' | 'price' | 'bePrice'>('supplier');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Advanced settings state (from localStorage)
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  
  const updateSupplier = useUpdateSupplier();

  // Listen for advanced settings changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Reset selection when bulk assign mode is disabled
  useEffect(() => {
    if (!bulkAssignMode) {
      setSelectedIds(new Set());
    }
  }, [bulkAssignMode]);

  // Cast articles to include top_category and order_unit_id
  const articlesWithTopCategory = articles as unknown as ArticleWithTopCategory[];

  // Statistics
  const stats = useMemo(() => {
    const total = articlesWithTopCategory.length;
    const withTopCategory = articlesWithTopCategory.filter(a => a.top_category).length;
    const withMainCategory = articlesWithTopCategory.filter(a => a.category).length;
    const withOrderUnit = articlesWithTopCategory.filter(a => a.order_unit_id).length;
    const withPackaging = articlesWithTopCategory.filter(a => a.packaging_unit && a.packaging_unit > 1).length;
    return {
      total,
      withTopCategory,
      withMainCategory,
      withOrderUnit,
      withPackaging,
      missingTopCategory: total - withTopCategory,
      missingMainCategory: total - withMainCategory,
      missingOrderUnit: total - withOrderUnit,
      missingPackaging: total - withPackaging,
      progressTop: total > 0 ? (withTopCategory / total) * 100 : 0,
      progressMain: total > 0 ? (withMainCategory / total) * 100 : 0,
      progressOrderUnit: total > 0 ? (withOrderUnit / total) * 100 : 0,
      progressPackaging: total > 0 ? (withPackaging / total) * 100 : 0,
    };
  }, [articlesWithTopCategory]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articlesWithTopCategory
      .filter(article => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!article.name.toLowerCase().includes(query) &&
              !article.suppliers?.name?.toLowerCase().includes(query)) {
            return false;
          }
        }
        if (filterTopCategory !== 'all' && article.top_category !== filterTopCategory) {
          return false;
        }
        if (filterMainCategory !== 'all' && article.category !== filterMainCategory) {
          return false;
        }
        if (filterSupplier !== 'all' && article.supplier_id !== filterSupplier) {
          return false;
        }
        if (filterOrderUnit !== 'all' && article.order_unit_id !== filterOrderUnit) {
          return false;
        }
        if (filterUnassigned && article.top_category) {
          return false;
        }
        if (filterNoOrderUnit && article.order_unit_id) {
          return false;
        }
        if (filterNoPackaging && article.packaging_unit && article.packaging_unit > 1) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Unvollständige Artikel zuerst (mindestens eine Kategorie fehlt)
        const aIncomplete = !a.top_category || !a.category;
        const bIncomplete = !b.top_category || !b.category;
        
        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;
        
        // Dann nach gewähltem Feld sortieren
        const direction = sortDirection === 'asc' ? 1 : -1;
        
        switch (sortField) {
          case 'name':
            return direction * a.name.localeCompare(b.name, 'de');
          case 'supplier':
            return direction * (a.suppliers?.name || '').localeCompare(b.suppliers?.name || '', 'de');
          case 'unit':
            return direction * (a.unit || '').localeCompare(b.unit || '', 'de');
          case 'price':
            return direction * ((a.price || 0) - (b.price || 0));
          case 'bePrice':
            const aBe = a.price * (a.packaging_unit && a.packaging_unit > 1 ? a.packaging_unit : 1);
            const bBe = b.price * (b.packaging_unit && b.packaging_unit > 1 ? b.packaging_unit : 1);
            return direction * (aBe - bBe);
          default:
            return 0;
        }
      });
  }, [articlesWithTopCategory, searchQuery, filterTopCategory, filterMainCategory, filterSupplier, filterOrderUnit, filterUnassigned, filterNoOrderUnit, filterNoPackaging, sortField, sortDirection]);

  // Sort handler
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredArticles.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Bulk assign handlers
  const handleBulkAssignTopCategory = (topCategory: TopCategory) => {
    if (selectedIds.size === 0) return;
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), updates: { top_category: topCategory } as any },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          toast.success(t('settings.articleOrganization.bulkAssignSuccess', { count: selectedIds.size }));
        },
      }
    );
  };

  const handleBulkAssignMainCategory = (category: string) => {
    if (selectedIds.size === 0) return;
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), updates: { category } },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          toast.success(t('settings.articleOrganization.bulkAssignSuccess', { count: selectedIds.size }));
        },
      }
    );
  };

  const handleBulkAssignOrderUnit = (orderUnitId: string) => {
    if (selectedIds.size === 0) return;
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), updates: { order_unit_id: orderUnitId } as any },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          toast.success(t('settings.articleOrganization.bulkAssignSuccess', { count: selectedIds.size }));
        },
      }
    );
  };

  const handleBulkAssignPackaging = () => {
    if (selectedIds.size === 0 || !bulkPackagingValue) return;
    const value = Number(bulkPackagingValue);
    if (isNaN(value) || value < 1) return;
    
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), updates: { packaging_unit: value } as any },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkPackagingValue('');
          toast.success(t('settings.articleOrganization.bulkAssignSuccess', { count: selectedIds.size }));
        },
      }
    );
  };

  // Inline update handler
  const handleInlineUpdate = (id: string, field: 'top_category' | 'category' | 'order_unit_id' | 'packaging_unit' | 'unit' | 'price', value: string | number | null) => {
    bulkUpdate.mutate({
      ids: [id],
      updates: { [field]: value } as any,
    });
  };

  // Calculate BE price
  const calculateBePrice = (article: ArticleWithTopCategory) => {
    const multiplier = article.packaging_unit && article.packaging_unit > 1 ? article.packaging_unit : 1;
    return article.price * multiplier;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Row highlight for incomplete articles
  const getRowHighlightClass = (article: ArticleWithTopCategory) => {
    if (!article.top_category || !article.category || !article.order_unit_id) {
      return 'bg-red-50 dark:bg-red-950/30';
    }
    return '';
  };

  // Format order unit display
  const formatOrderUnit = (unitId: string | null) => {
    if (!unitId) return null;
    const unit = orderUnits.find(u => u.id === unitId);
    return unit ? unit.name : null;
  };

  // Handle article edit submission
  const handleArticleSubmit = async (data: any, capturedImage?: string, imageCleared?: boolean) => {
    if (editingArticle) {
      await updateArticle.mutateAsync({
        id: editingArticle.id,
        supplier_id: data.supplier_id || editingArticle.supplier_id,
        name: data.name,
        price: parseFloat(data.price) || 0,
        unit: data.unit || 'Stk',
        sku: data.sku || undefined,
        category: data.category || undefined,
        description: data.description || undefined,
        packaging_unit: data.packaging_unit ? parseInt(data.packaging_unit) : undefined,
        order_unit_id: data.order_unit_id || undefined,
        selling_price: data.selling_price ? parseFloat(data.selling_price) : undefined,
        grape_variety: data.grape_variety || undefined,
        flavor_profile: data.flavor_profile || undefined,
        food_pairings: data.food_pairings || undefined,
        origin_country: data.origin_country || undefined,
      });
    }
    setIsArticleDialogOpen(false);
    setEditingArticle(null);
  };

  // Delete article handler
  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;
    await deleteArticle.mutateAsync(deletingArticle.id);
    setDeletingArticle(null);
  };

  if (articlesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card - Accordion Design */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={[]} className="w-full">
            <AccordionItem value="statistics" className="border-b-0">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">
                    {t('settings.articleOrganization.statistics')}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.articleOrganization.statisticsDesc')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('settings.articleOrganization.topCategoryProgress')}</span>
                      <span className="text-muted-foreground">
                        {stats.withTopCategory}/{stats.total}
                      </span>
                    </div>
                    <Progress value={stats.progressTop} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('settings.articleOrganization.mainCategoryProgress')}</span>
                      <span className="text-muted-foreground">
                        {stats.withMainCategory}/{stats.total}
                      </span>
                    </div>
                    <Progress value={stats.progressMain} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('settings.orderUnitsShort')}</span>
                      <span className="text-muted-foreground">
                        {stats.withOrderUnit}/{stats.total}
                      </span>
                    </div>
                    <Progress value={stats.progressOrderUnit} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Stk/BE</span>
                      <span className="text-muted-foreground">
                        {stats.withPackaging}/{stats.total}
                      </span>
                    </div>
                    <Progress value={stats.progressPackaging} className="h-2" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* BE Preview Accordion */}
            <AccordionItem value="preview" className="border-b-0">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">
                    BE-Vorschau
                  </span>
                  {stats.missingOrderUnit > 0 && (
                    <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400">
                      {stats.missingOrderUnit} ohne BE
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">
                  Prüfen Sie wie Bestelleinheiten in EasyOrder und E-Mails angezeigt werden
                </p>
                <ArticlePreviewPanel 
                  articles={articlesWithTopCategory}
                  onArticleUpdate={() => {}}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Sticky Filters and Bulk Actions - Outside Card for proper sticky behavior */}
      <div className="sticky top-14 xl:top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-4 pt-2 space-y-4 -mx-4 px-4 md:-mx-6 md:px-6">
        <div>
          <h3 className="text-lg font-semibold">{t('settings.articleOrganization.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('settings.articleOrganization.description')}</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterTopCategory} onValueChange={setFilterTopCategory}>
            <SelectTrigger className="w-[140px]">
              <span className="truncate">
                {filterTopCategory === 'all' 
                  ? t('settings.articleOrganization.topCategory')
                  : filterTopCategory
                }
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {TOP_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMainCategory} onValueChange={setFilterMainCategory}>
            <SelectTrigger className="w-[140px]">
              <span className="truncate">
                {filterMainCategory === 'all' 
                  ? t('settings.articleOrganization.mainCategory')
                  : filterMainCategory
                }
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SupplierOrderUnitSelect
            value={filterOrderUnit === 'all' ? null : filterOrderUnit}
            onChange={(v) => setFilterOrderUnit(v || 'all')}
            isFilter={true}
            filterLabel={t('settings.orderUnitsShort')}
            className="w-[160px]"
          />
          <Select value={filterSupplier} onValueChange={setFilterSupplier}>
            <SelectTrigger className="w-[140px]">
              <span className="truncate">
                {filterSupplier === 'all' 
                  ? t('articles.supplier')
                  : suppliers.find(s => s.id === filterSupplier)?.name || filterSupplier
                }
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={filterUnassigned ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterUnassigned(!filterUnassigned)}
          >
            {t('settings.articleOrganization.onlyUnassigned')}
          </Button>
          <Button
            variant={filterNoOrderUnit ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterNoOrderUnit(!filterNoOrderUnit)}
          >
            {t('settings.articleOrganization.onlyNoOrderUnit')}
          </Button>
          <Button
            variant={filterNoPackaging ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterNoPackaging(!filterNoPackaging)}
          >
            Nur ohne Stk/BE
          </Button>
          
          {/* Sammelzuweisung Switch - only visible when advanced settings enabled */}
          {advancedSettingsEnabled && (
            <div className="flex items-center gap-2 ml-auto pl-4 border-l">
              <Switch
                id="bulk-assign-mode"
                checked={bulkAssignMode}
                onCheckedChange={setBulkAssignMode}
              />
              <Label htmlFor="bulk-assign-mode" className="text-sm font-medium cursor-pointer">
                Sammelzuweisung
              </Label>
            </div>
          )}
        </div>

        {/* Bulk Actions Toolbar - only when bulk assign mode active and items selected */}
        {bulkAssignMode && selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            <Badge variant="secondary" className="font-normal">
              {t('settings.articleOrganization.selectedCount', { count: selectedIds.size })}
            </Badge>
            <Select onValueChange={(v) => handleBulkAssignTopCategory(v as TopCategory)}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder={t('settings.articleOrganization.assignTopCategory')} />
              </SelectTrigger>
              <SelectContent>
                {TOP_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleBulkAssignMainCategory}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder={t('settings.articleOrganization.assignMainCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleBulkAssignOrderUnit}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder={t('settings.articleOrganization.assignOrderUnit')} />
              </SelectTrigger>
              <SelectContent>
                {orderUnits.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="1"
                placeholder="Stk/BE"
                className="h-8 w-20"
                value={bulkPackagingValue}
                onChange={(e) => setBulkPackagingValue(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkAssignPackaging}
                disabled={!bulkPackagingValue || Number(bulkPackagingValue) < 1}
              >
                Zuweisen
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              {t('common.cancel')}
            </Button>
          </div>
        )}
      </div>

      {/* Articles Table - Now in separate Card */}
      <Card>
        <CardContent className="pt-4">

          {/* Articles Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {bulkAssignMode && (
                    <TableHead className="w-[50px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={selectedIds.size === filteredArticles.length ? deselectAll : selectAll}
                      >
                        {selectedIds.size === filteredArticles.length && filteredArticles.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      {t('articles.articleName')}
                      <SortIndicator field="name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="hidden sm:table-cell cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('supplier')}
                  >
                    <div className="flex items-center gap-1">
                      {t('articles.supplier')}
                      <SortIndicator field="supplier" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="hidden md:table-cell cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('unit')}
                  >
                    <div className="flex items-center gap-1">
                      Einheit
                      <SortIndicator field="unit" />
                    </div>
                  </TableHead>
                  <TableHead>{t('settings.orderUnitsShort')}</TableHead>
                  <TableHead className="w-[80px]">Stk/BE</TableHead>
                  <TableHead 
                    className="hidden lg:table-cell text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Preis
                      <SortIndicator field="price" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('bePrice')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      BE-Preis
                      <SortIndicator field="bePrice" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={bulkAssignMode ? 9 : 8} className="text-center py-8 text-muted-foreground">
                      {t('settings.articleOrganization.noArticles')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticles.map((article) => {
                    const bePrice = calculateBePrice(article);
                    const hasMultiplier = article.packaging_unit && article.packaging_unit > 1;
                    
                    return (
                      <TableRow key={article.id} className={getRowHighlightClass(article)}>
                        {bulkAssignMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(article.id)}
                              onCheckedChange={() => toggleSelect(article.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div>
                            <button
                              onClick={() => {
                                setEditingArticle(article);
                                setIsArticleDialogOpen(true);
                              }}
                              className="font-medium text-left hover:text-primary hover:underline transition-colors"
                            >
                              {article.name}
                            </button>
                            <button
                              onClick={() => {
                                const supplier = suppliers.find(s => s.id === article.supplier_id);
                                if (supplier) {
                                  setEditingSupplier(supplier);
                                  setIsSupplierDialogOpen(true);
                                }
                              }}
                              className="text-xs text-muted-foreground sm:hidden hover:text-primary hover:underline transition-colors"
                            >
                              {article.suppliers?.name}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <button
                            onClick={() => {
                              const supplier = suppliers.find(s => s.id === article.supplier_id);
                              if (supplier) {
                                setEditingSupplier(supplier);
                                setIsSupplierDialogOpen(true);
                              }
                            }}
                            className="text-muted-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {article.suppliers?.name}
                          </button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Select
                            value={article.unit || ''}
                            onValueChange={(v) => handleInlineUpdate(article.id, 'unit', v)}
                          >
                            <SelectTrigger className="h-8 w-[100px]">
                              <SelectValue placeholder="Einheit" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.name}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <SupplierOrderUnitSelect
                            value={article.order_unit_id}
                            onChange={(v) => handleInlineUpdate(article.id, 'order_unit_id', v)}
                            className="h-8 w-[140px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            className="h-8 w-16 text-center"
                            value={article.packaging_unit || ''}
                            placeholder="1"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              handleInlineUpdate(article.id, 'packaging_unit', val);
                            }}
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 w-20 text-right"
                            value={article.price || ''}
                            placeholder="0.00"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : 0;
                              handleInlineUpdate(article.id, 'price', val);
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`cursor-help ${hasMultiplier ? "font-medium text-primary" : "text-primary"}`}>
                                  {formatCurrency(bePrice)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {formatCurrency(article.price)} × {article.packaging_unit || 1} Stk/BE
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingArticle(article)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('settings.articleOrganization.showingCount', { count: filteredArticles.length, total: stats.total })}
          </p>
        </CardContent>
      </Card>

      {/* Article Edit Dialog */}
      <ArticleFormDialog
        open={isArticleDialogOpen}
        onOpenChange={(open) => {
          setIsArticleDialogOpen(open);
          if (!open) setEditingArticle(null);
        }}
        onSubmit={handleArticleSubmit}
        suppliers={suppliers}
        categories={categories.map(c => c.name)}
        units={units.map(u => u.name)}
        editingArticle={editingArticle as any}
        isPending={updateArticle.isPending}
      />

      {/* Supplier Edit Dialog */}
      <SupplierFormDialog
        open={isSupplierDialogOpen}
        onOpenChange={(open) => {
          setIsSupplierDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        editingSupplier={editingSupplier}
        onSubmit={async (data: SupplierInput) => {
          if (editingSupplier) {
            await updateSupplier.mutateAsync({ id: editingSupplier.id, ...data });
          }
          setIsSupplierDialogOpen(false);
          setEditingSupplier(null);
        }}
        isPending={updateSupplier.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingArticle} onOpenChange={() => setDeletingArticle(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie "{deletingArticle?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteArticle} 
              className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteArticle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
