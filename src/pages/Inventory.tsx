import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useArticles, useUpdateArticle } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  useInventorySessions,
  useInventorySession,
  useInventoryItems,
  useCreateInventorySession,
  useUpdateInventorySession,
  useBulkUpsertInventoryItems,
  useDeleteInventorySession,
  InventoryItem,
} from '@/hooks/useInventory';
import { useUnits } from '@/hooks/useUnits';
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
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { generateInventoryListPdf, exportInventoryToExcel } from '@/lib/inventoryListPdf';
import { toast } from 'sonner';

interface LocalInventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
}

// Default units if no custom units exist
const DEFAULT_UNITS = ['kg', 'g', 'Stück', 'Stk', 'Liter', 'l', '0,75l', '1,0l', 'ml', 'Pg.', 'Ka.', 'Kt.', 'Fl.', 'Dose', 'Bund', 'Beutel', 'Pack'];

const Inventory = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState<Map<string, LocalInventoryItem>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  
  // Price editing state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  
  // Unit editing state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitValue, setEditingUnitValue] = useState<string>('');

  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: suppliers } = useSuppliers();
  const { data: sessions, isLoading: sessionsLoading } = useInventorySessions();
  const { data: activeSession } = useInventorySession(activeSessionId);
  const { data: inventoryItems } = useInventoryItems(activeSessionId);
  const { data: units } = useUnits();
  const { data: dbCategories } = useCategories();

  const createSession = useCreateInventorySession();
  const updateSession = useUpdateInventorySession();
  const bulkUpsertItems = useBulkUpsertInventoryItems();
  const deleteSession = useDeleteInventorySession();
  const updateArticle = useUpdateArticle();

  // Compute available units - use from DB or defaults
  const commonUnits = useMemo(() => {
    if (units && units.length > 0) {
      return units.map(u => u.name);
    }
    return DEFAULT_UNITS;
  }, [units]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load inventory items into local state
  useEffect(() => {
    if (inventoryItems) {
      const itemsMap = new Map<string, LocalInventoryItem>();
      inventoryItems.forEach((item) => {
        itemsMap.set(item.article_id, {
          article_id: item.article_id,
          storage_1: Number(item.storage_1),
          storage_2: Number(item.storage_2),
        });
      });
      setLocalItems(itemsMap);
      setHasChanges(false);
    }
  }, [inventoryItems]);

  // Check for active in-progress session
  useEffect(() => {
    if (sessions && !activeSessionId) {
      const inProgressSession = sessions.find((s) => s.status === 'in_progress');
      if (inProgressSession) {
        setActiveSessionId(inProgressSession.id);
      }
    }
  }, [sessions, activeSessionId]);

  // Combine database categories with article categories for filter dropdown
  const categories = useMemo(() => {
    const allCats = new Set<string>();
    // Add categories from database
    if (dbCategories) {
      dbCategories.forEach(c => allCats.add(c.name));
    }
    // Add categories from articles (for backwards compatibility)
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
    const items = Array.from(localItems.values()).filter(
      (item) => item.storage_1 > 0 || item.storage_2 > 0
    );
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
      toast.error('Ungültiger Preis');
      return;
    }
    try {
      await updateArticle.mutateAsync({ id: articleId, price: newPrice });
      toast.success('Preis aktualisiert');
      setEditingPriceId(null);
      setEditingPriceValue('');
    } catch {
      toast.error('Fehler beim Speichern');
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
      toast.error('Einheit darf nicht leer sein');
      return;
    }
    try {
      await updateArticle.mutateAsync({ id: articleId, unit: unitValue.trim() });
      toast.success('Einheit aktualisiert');
      setEditingUnitId(null);
      setEditingUnitValue('');
    } catch {
      toast.error('Fehler beim Speichern');
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventur</h1>
            <p className="text-muted-foreground">Bestandsaufnahme & Artikelpreise</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'inventory' && (
              <>
                <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
                  <History className="w-4 h-4 mr-2" />
                  Historie
                </Button>
                {!activeSession && (
                  <Button onClick={() => setShowNewSessionDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Inventur
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inventory" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Inventur
            </TabsTrigger>
            <TabsTrigger value="prices" className="gap-2">
              <Euro className="w-4 h-4" />
              Artikelpreise
            </TabsTrigger>
          </TabsList>

          {/* Filters - shared between tabs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Lieferant filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Lieferanten</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Kategorie filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="space-y-4 mt-4">
            {/* Active Session Info */}
            {activeSession && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{activeSession.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Gestartet am{' '}
                          {format(new Date(activeSession.created_at), 'dd.MM.yyyy HH:mm', {
                            locale: de,
                          })}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || bulkUpsertItems.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Speichern
                      </Button>
                      <Button size="sm" onClick={handleComplete}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Abschließen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Inventory Table */}
            {!activeSession ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine aktive Inventur</h3>
                  <p className="text-muted-foreground mb-4">
                    Starten Sie eine neue Inventur oder laden Sie eine aus der Historie.
                  </p>
                  <Button onClick={() => setShowNewSessionDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Inventur starten
                  </Button>
                </CardContent>
              </Card>
            ) : articlesLoading ? (
              <Card>
                <CardContent className="py-8">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Nr.</TableHead>
                          <TableHead>Artikel</TableHead>
                          <TableHead>Lieferant</TableHead>
                          <TableHead className="w-24">Einheit</TableHead>
                          <TableHead className="w-28 text-right">Lager 1</TableHead>
                          <TableHead className="w-28 text-right">Lager 2</TableHead>
                          <TableHead className="w-28 text-right">Gesamt</TableHead>
                          <TableHead className="w-32 text-right">Gesamtwert</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArticles.map((article, index) => {
                          const values = getItemValues(article.id);
                          return (
                            <TableRow key={article.id}>
                              <TableCell className="text-muted-foreground">
                                {index + 1}
                              </TableCell>
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
                                {article.suppliers?.name}
                              </TableCell>
                              <TableCell>
                                {editingUnitId === article.id ? (
                                  <div className="flex items-center gap-1">
                                    <Select
                                      value={editingUnitValue}
                                      onValueChange={(value) => {
                                        setEditingUnitValue(value);
                                        handleSaveUnitEdit(article.id, value);
                                      }}
                                      open={true}
                                      onOpenChange={(open) => {
                                        if (!open) handleCancelUnitEdit();
                                      }}
                                    >
                                      <SelectTrigger className="w-24 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background z-50">
                                        {commonUnits.map((unit) => (
                                          <SelectItem key={unit} value={unit}>
                                            {unit}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <span
                                    className="cursor-pointer hover:text-primary hover:underline"
                                    onClick={() => handleStartUnitEdit(article.id, article.unit)}
                                  >
                                    {article.unit}
                                  </span>
                                )}
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
                                  className="w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  className="w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {values.total > 0 ? values.total.toFixed(2) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {values.total > 0 ? `€${(values.total * article.price).toFixed(2)}` : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredArticles.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      Keine Artikel gefunden
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Prices Tab Content */}
          <TabsContent value="prices" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {articlesLoading ? (
                  <div className="py-8">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Nr.</TableHead>
                          <TableHead>Artikel</TableHead>
                          <TableHead>Kategorie</TableHead>
                          <TableHead>Lieferant</TableHead>
                          <TableHead className="w-24">Einheit</TableHead>
                          <TableHead className="w-36 text-right">Preis (€)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredArticles.map((article, index) => (
                          <TableRow key={article.id}>
                            <TableCell className="text-muted-foreground">
                              {index + 1}
                            </TableCell>
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
                            <TableCell className="text-muted-foreground">
                              {article.suppliers?.name}
                            </TableCell>
                            <TableCell>
                              {editingUnitId === article.id ? (
                                <div className="flex items-center gap-1">
                                  <Select
                                    value={editingUnitValue}
                                    onValueChange={(value) => {
                                      setEditingUnitValue(value);
                                      handleSaveUnitEdit(article.id, value);
                                    }}
                                    open={true}
                                    onOpenChange={(open) => {
                                      if (!open) handleCancelUnitEdit();
                                    }}
                                  >
                                    <SelectTrigger className="w-24 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background z-50">
                                      {commonUnits.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                          {unit}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-primary hover:underline"
                                  onClick={() => handleStartUnitEdit(article.id, article.unit)}
                                >
                                  {article.unit}
                                </span>
                              )}
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
                )}
                {filteredArticles.length === 0 && !articlesLoading && (
                  <div className="py-12 text-center text-muted-foreground">
                    Keine Artikel gefunden
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Inventur starten</DialogTitle>
            <DialogDescription>
              Geben Sie einen Namen für die Inventursitzung ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Name</Label>
              <Input
                id="session-name"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`Inventur ${format(new Date(), 'dd.MM.yyyy')}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={createSession.isPending}
            >
              Starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventur-Historie</DialogTitle>
            <DialogDescription>
              Vergangene Inventuren anzeigen und laden.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {sessionsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.created_at), 'dd.MM.yyyy HH:mm', {
                            locale: de,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          session.status === 'completed' ? 'default' : 'secondary'
                        }
                      >
                        {session.status === 'completed'
                          ? 'Abgeschlossen'
                          : 'In Bearbeitung'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadSession(session.id)}
                      >
                        Laden
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSessionId(session.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Inventuren durchgeführt.
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inventur löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle erfassten Daten
              dieser Inventur werden gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
};

export default Inventory;
