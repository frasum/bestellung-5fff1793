import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { useArticles, useBulkUpdateArticles } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCategories } from '@/hooks/useCategories';
import { useOrderUnits } from '@/hooks/useOrderUnits';
import { TOP_CATEGORIES } from '@/components/suppliers/constants';
import { toast } from 'sonner';

type TopCategory = typeof TOP_CATEGORIES[number];

interface ArticleWithTopCategory {
  id: string;
  name: string;
  category: string | null;
  top_category: string | null;
  order_unit_id: string | null;
  supplier_id: string;
  suppliers?: { id: string; name: string } | null;
}

export const ArticleOrganizationTab = () => {
  const { t } = useTranslation();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useCategories();
  const { data: orderUnits = [] } = useOrderUnits();
  const bulkUpdate = useBulkUpdateArticles();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopCategory, setFilterTopCategory] = useState<string>('all');
  const [filterMainCategory, setFilterMainCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterOrderUnit, setFilterOrderUnit] = useState<string>('all');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [filterNoOrderUnit, setFilterNoOrderUnit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  

  // Cast articles to include top_category and order_unit_id
  const articlesWithTopCategory = articles as unknown as ArticleWithTopCategory[];

  // Statistics
  const stats = useMemo(() => {
    const total = articlesWithTopCategory.length;
    const withTopCategory = articlesWithTopCategory.filter(a => a.top_category).length;
    const withMainCategory = articlesWithTopCategory.filter(a => a.category).length;
    const withOrderUnit = articlesWithTopCategory.filter(a => a.order_unit_id).length;
    return {
      total,
      withTopCategory,
      withMainCategory,
      withOrderUnit,
      missingTopCategory: total - withTopCategory,
      missingMainCategory: total - withMainCategory,
      missingOrderUnit: total - withOrderUnit,
      progressTop: total > 0 ? (withTopCategory / total) * 100 : 0,
      progressMain: total > 0 ? (withMainCategory / total) * 100 : 0,
      progressOrderUnit: total > 0 ? (withOrderUnit / total) * 100 : 0,
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
        return true;
      })
      .sort((a, b) => {
        // Unvollständige Artikel zuerst (mindestens eine Kategorie fehlt)
        const aIncomplete = !a.top_category || !a.category;
        const bIncomplete = !b.top_category || !b.category;
        
        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;
        
        // Dann nach Lieferant und Name sortieren
        const supplierCompare = (a.suppliers?.name || '').localeCompare(b.suppliers?.name || '', 'de');
        if (supplierCompare !== 0) return supplierCompare;
        return a.name.localeCompare(b.name, 'de');
      });
  }, [articlesWithTopCategory, searchQuery, filterTopCategory, filterMainCategory, filterSupplier, filterOrderUnit, filterUnassigned, filterNoOrderUnit]);

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

  // Inline update handler
  const handleInlineUpdate = (id: string, field: 'top_category' | 'category' | 'order_unit_id', value: string | null) => {
    bulkUpdate.mutate({
      ids: [id],
      updates: { [field]: value } as any,
    });
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
    return unit ? `${unit.quantity}× ${unit.name}` : null;
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
      {/* Statistics Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('settings.articleOrganization.statistics')}</CardTitle>
          <CardDescription>{t('settings.articleOrganization.statisticsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('settings.articleOrganization.topCategoryProgress')}</span>
                <span className="text-muted-foreground">
                  {stats.withTopCategory}/{stats.total}
                </span>
              </div>
              <Progress value={stats.progressTop} className="h-2" />
              {stats.missingTopCategory > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('settings.articleOrganization.missingTopCategory', { count: stats.missingTopCategory })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('settings.articleOrganization.mainCategoryProgress')}</span>
                <span className="text-muted-foreground">
                  {stats.withMainCategory}/{stats.total}
                </span>
              </div>
              <Progress value={stats.progressMain} className="h-2" />
              {stats.missingMainCategory > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('settings.articleOrganization.missingMainCategory', { count: stats.missingMainCategory })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('settings.articleOrganization.orderUnitProgress')}</span>
                <span className="text-muted-foreground">
                  {stats.withOrderUnit}/{stats.total}
                </span>
              </div>
              <Progress value={stats.progressOrderUnit} className="h-2" />
              {stats.missingOrderUnit > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('settings.articleOrganization.missingOrderUnit', { count: stats.missingOrderUnit })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('settings.articleOrganization.title')}</CardTitle>
          <CardDescription>{t('settings.articleOrganization.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Select value={filterOrderUnit} onValueChange={setFilterOrderUnit}>
              <SelectTrigger className="w-[140px]">
                <span className="truncate">
                  {filterOrderUnit === 'all' 
                    ? t('settings.orderUnitsShort')
                    : formatOrderUnit(filterOrderUnit) || filterOrderUnit
                  }
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {orderUnits.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.quantity}× {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
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
                      {unit.quantity}× {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                {t('common.cancel')}
              </Button>
            </div>
          )}

          {/* Articles Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableHead>{t('articles.articleName')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('articles.supplier')}</TableHead>
                  <TableHead>{t('settings.articleOrganization.topCategory')}</TableHead>
                  <TableHead>{t('settings.articleOrganization.mainCategory')}</TableHead>
                  <TableHead>{t('settings.orderUnitsShort')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('settings.articleOrganization.noArticles')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticles.map((article) => (
                    <TableRow key={article.id} className={getRowHighlightClass(article)}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(article.id)}
                          onCheckedChange={() => toggleSelect(article.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{article.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {article.suppliers?.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {article.suppliers?.name}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={article.top_category || 'none'}
                          onValueChange={(v) => handleInlineUpdate(article.id, 'top_category', v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">—</span>
                            </SelectItem>
                            {TOP_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={article.category || 'none'}
                          onValueChange={(v) => handleInlineUpdate(article.id, 'category', v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">—</span>
                            </SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={article.order_unit_id || 'none'}
                          onValueChange={(v) => handleInlineUpdate(article.id, 'order_unit_id', v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="h-8 w-[180px]">
                            <SelectValue>
                              {article.order_unit_id ? formatOrderUnit(article.order_unit_id) : <span className="text-muted-foreground">—</span>}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">—</span>
                            </SelectItem>
                            {orderUnits.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.quantity}× {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('settings.articleOrganization.showingCount', { count: filteredArticles.length, total: stats.total })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
