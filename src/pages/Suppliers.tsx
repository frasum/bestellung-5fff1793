import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle, useBulkUpdateArticles, Article, ArticleInput } from '@/hooks/useArticles';
import { Plus, Loader2, Upload, Package } from 'lucide-react';
import { useSendSupplierInvitation } from '@/hooks/useSupplierPortal';
import { generateOrderListPdf, generateCombinedOrderListPdf } from '@/lib/orderListPdf';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { useImportSuppliers, useImportArticles } from '@/hooks/useImport';
import { supabase } from '@/integrations/supabase/client';
import { ExportMenu } from '@/components/ExportMenu';
import { useSupplierPendingChanges, useCombinedPendingBySupplier, usePendingArticleIds, useRecentlyActiveSuppliers } from '@/hooks/useSupplierChanges';
import { useLastOrderByArticle } from '@/hooks/useLastOrderByArticle';
import { SupplierChangesDialog } from '@/components/suppliers/SupplierChangesDialog';
import { SupplierLocationsDialog } from '@/components/suppliers/SupplierLocationsDialog';
import { useCategories } from '@/hooks/useCategories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// Refactored components
import { SUPPLIER_IMPORT_FIELDS, ARTICLE_IMPORT_FIELDS, DEFAULT_UNITS } from '@/components/suppliers/constants';
import { ArticleFormData } from '@/components/suppliers/schemas';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { ArticleFormDialog } from '@/components/suppliers/ArticleFormDialog';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { ArticleFilters } from '@/components/suppliers/ArticleFilters';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { ArticleTable } from '@/components/suppliers/ArticleTable';
import { BulkCategoryToolbar } from '@/components/suppliers/BulkCategoryToolbar';
import { DeleteConfirmationDialogs } from '@/components/suppliers/DeleteConfirmationDialogs';

const Suppliers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem, updateQuantity, items: cartItems, getItemsBySupplier } = useCart();

  // Tab state from URL
  const activeTab = searchParams.get('tab') || 'suppliers';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Supplier tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [topCategoryFilter, setTopCategoryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSupplierImportOpen, setIsSupplierImportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [articleImportSupplierId, setArticleImportSupplierId] = useState<string | null>(null);

  // Article tab state
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [selectedArticleSuppliers, setSelectedArticleSuppliers] = useState<string[]>([]);
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isArticleImportOpen, setIsArticleImportOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [openArticleSuppliers, setOpenArticleSuppliers] = useState<Set<string>>(new Set());

  // Shared data
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: allArticles, isLoading: articlesLoading } = useArticles();
  const { data: dbCategories } = useCategories();

  // Supplier mutations
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const importSuppliers = useImportSuppliers();

  // Article mutations
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const bulkUpdateArticles = useBulkUpdateArticles();
  const importArticles = useImportArticles();

  const { sendInvitation, loading: sendingInvitation } = useSendSupplierInvitation();
  const [invitingSupplierId, setInvitingSupplierId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [changesDialogSupplier, setChangesDialogSupplier] = useState<Supplier | null>(null);
  const [changesDialogArticle, setChangesDialogArticle] = useState<{ id: string; name: string } | null>(null);
  const [locationsDialogSupplier, setLocationsDialogSupplier] = useState<Supplier | null>(null);
  const { data: pendingChanges } = useSupplierPendingChanges();
  const { data: pendingChangesBySupplier } = useCombinedPendingBySupplier();
  const { data: pendingArticleIds } = usePendingArticleIds();
  const { data: recentlyActiveSuppliers } = useRecentlyActiveSuppliers();
  const { data: lastOrderMap } = useLastOrderByArticle();

  // Local state for multi-select toggles
  const [supplierMultiSelectEnabled, setSupplierMultiSelectEnabled] = useState(() => {
    const saved = localStorage.getItem('suppliers-multi-select');
    return saved === 'true';
  });

  const [articleAdvancedViewEnabled, setArticleAdvancedViewEnabled] = useState(() => {
    const saved = localStorage.getItem('articles-advanced-view');
    return saved === 'true';
  });

  // Advanced settings mode for export/import visibility
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(() => {
    return localStorage.getItem('advanced-settings-enabled') === 'true';
  });

  // Listen for changes to advanced settings from Settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('suppliers-multi-select', String(supplierMultiSelectEnabled));
  }, [supplierMultiSelectEnabled]);

  useEffect(() => {
    localStorage.setItem('articles-advanced-view', String(articleAdvancedViewEnabled));
  }, [articleAdvancedViewEnabled]);

  useEffect(() => {
    if (!supplierMultiSelectEnabled) {
      setSelectedSuppliers(new Set());
    }
  }, [supplierMultiSelectEnabled]);

  useEffect(() => {
    if (!articleAdvancedViewEnabled) {
      setSelectedArticles(new Set());
    }
  }, [articleAdvancedViewEnabled]);

  // pendingChangesBySupplier now comes from useCombinedPendingBySupplier hook

  // Fetch organization name for invitation emails
  useEffect(() => {
    const fetchOrgName = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();
        if (org) setOrganizationName(org.name);
      }
    };
    fetchOrgName();
  }, [user]);

  const handleSendInvitation = async (supplier: Supplier) => {
    setInvitingSupplierId(supplier.id);
    await sendInvitation(supplier.id, supplier.email, supplier.name, organizationName);
    setInvitingSupplierId(null);
  };

  // Extract article categories for supplier filter
  const articleCategoriesForSupplierFilter = [...new Set(allArticles?.map(a => a.category).filter(Boolean) as string[])].sort();

  // Group articles by supplier
  const articlesBySupplier = allArticles?.reduce((acc, article) => {
    if (!acc[article.supplier_id]) {
      acc[article.supplier_id] = [];
    }
    acc[article.supplier_id].push(article);
    return acc;
  }, {} as Record<string, Article[]>) || {};

  // Extract categories from articles
  const articleDerivedCategories = allArticles?.map(a => a.category).filter(Boolean) as string[] || [];
  const dbCategoryNames = dbCategories?.map(c => c.name) || [];
  const allArticleCategories = [...new Set([...articleDerivedCategories, ...dbCategoryNames])].sort();

  // Extract unique units from articles + defaults
  const existingUnits = [...new Set([
    ...DEFAULT_UNITS,
    ...(allArticles?.map(a => a.unit).filter(Boolean) as string[] || [])
  ])].sort();

  // Supplier functions
  const toggleSupplierExpanded = (supplierId: string) => {
    setExpandedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const toggleSupplierSelected = (supplierId: string) => {
    setSelectedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const selectAllSuppliers = () => {
    const suppliersWithArticles = filteredSuppliers?.filter(s => (articlesBySupplier[s.id]?.length || 0) > 0) || [];
    if (selectedSuppliers.size === suppliersWithArticles.length) {
      setSelectedSuppliers(new Set());
    } else {
      setSelectedSuppliers(new Set(suppliersWithArticles.map(s => s.id)));
    }
  };

  const handlePrintCombined = async () => {
    const selectedSuppliersData = suppliers?.filter(s => selectedSuppliers.has(s.id)) || [];
    // Enrich articles with last order quantities
    const enrichedArticlesBySupplier = Object.fromEntries(
      Object.entries(articlesBySupplier).map(([supplierId, articles]) => [
        supplierId,
        articles.map(a => ({
          name: a.name,
          unit: a.unit,
          sku: a.sku,
          description: a.description,
          lastOrderQuantity: lastOrderMap?.[a.id]?.quantity,
          lastOrderDate: lastOrderMap?.[a.id]?.date
        }))
      ])
    );
    await generateCombinedOrderListPdf(selectedSuppliersData, enrichedArticlesBySupplier);
    setSelectedSuppliers(new Set());
  };

  // Article functions
  const toggleArticleSupplier = (supplierId: string) => {
    setOpenArticleSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const toggleArticleSelected = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const handleBulkCategoryAssign = async (category: string | null) => {
    if (selectedArticles.size === 0) return;
    await bulkUpdateArticles.mutateAsync({
      ids: Array.from(selectedArticles),
      updates: { category: category || undefined }
    });
    setSelectedArticles(new Set());
  };

  const getCartQuantity = (articleId: string) => {
    const item = cartItems.find(i => i.article.id === articleId);
    return item?.quantity || 0;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);


  // Supplier submit handler
  const handleSupplierSubmit = async (input: SupplierInput) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...input });
    } else {
      await createSupplier.mutateAsync(input);
    }
    setIsSupplierDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleSupplierDelete = async () => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      setDeletingSupplier(null);
    }
  };

  // Article submit handler
  const handleArticleSubmit = async (data: ArticleFormData) => {
    const input: ArticleInput = {
      supplier_id: data.supplier_id,
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      unit: data.unit,
      price: Number(data.price),
      category: data.category || undefined,
      packaging_unit: data.packaging_unit ? Number(data.packaging_unit) : undefined,
    };
    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, ...input });
    } else {
      await createArticle.mutateAsync(input);
    }
    setIsArticleDialogOpen(false);
    setEditingArticle(null);
  };

  const handleArticleDelete = async () => {
    if (deletingArticle) {
      await deleteArticle.mutateAsync(deletingArticle.id);
      setDeletingArticle(null);
    }
  };

  // Debounced search values for performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const debouncedArticleSearchQuery = useDebouncedValue(articleSearchQuery, 300);

  // Filtered suppliers - now filter by article categories
  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || supplier.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    // Filter by article categories instead of supplier categories
    const supplierArticles = articlesBySupplier[supplier.id] || [];
    const matchesTopCategory = topCategoryFilter === 'all' || supplierArticles.some(a => a.top_category === topCategoryFilter);
    const matchesCategory = categoryFilter === 'all' || supplierArticles.some(a => a.category === categoryFilter);
    
    return matchesSearch && matchesTopCategory && matchesCategory;
  });

  // Filtered articles
  const filteredArticles = allArticles?.filter((article) => {
    const matchesSearch = article.name.toLowerCase().includes(debouncedArticleSearchQuery.toLowerCase()) ||
      article.description?.toLowerCase().includes(debouncedArticleSearchQuery.toLowerCase());
    const matchesSupplier = selectedArticleSuppliers.length === 0 || selectedArticleSuppliers.includes(article.supplier_id);
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesSupplier && matchesCategory;
  });

  // Sorted articles
  const sortedArticles = filteredArticles?.slice().sort((a, b) => {
    const supplierA = suppliers?.find(s => s.id === a.supplier_id)?.name || '';
    const supplierB = suppliers?.find(s => s.id === b.supplier_id)?.name || '';
    const supplierCompare = supplierA.localeCompare(supplierB, 'de');
    if (supplierCompare !== 0) return supplierCompare;
    return a.name.localeCompare(b.name, 'de');
  });

  // Group articles by supplier
  const groupedBySupplier = useMemo(() => {
    const groups: { supplier: { id: string; name: string }; articles: typeof sortedArticles }[] = [];
    const groupMap = new Map<string, typeof sortedArticles>();
    
    sortedArticles?.forEach(article => {
      const supplierId = article.supplier_id;
      if (!groupMap.has(supplierId)) {
        groupMap.set(supplierId, []);
      }
      groupMap.get(supplierId)!.push(article);
    });
    
    groupMap.forEach((articles, supplierId) => {
      const supplierName = articles[0]?.suppliers?.name || 'Unbekannt';
      groups.push({ supplier: { id: supplierId, name: supplierName }, articles });
    });
    
    return groups.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, 'de'));
  }, [sortedArticles]);

  // Track previous search query to detect when search is cleared
  const prevArticleSearchRef = useRef(debouncedArticleSearchQuery);

  // Auto-expand suppliers when article search query is active
  useEffect(() => {
    const prevSearch = prevArticleSearchRef.current;
    prevArticleSearchRef.current = debouncedArticleSearchQuery;
    
    if (debouncedArticleSearchQuery.trim() !== '') {
      // Search active: open all filtered suppliers
      const supplierIds = groupedBySupplier.map(group => group.supplier.id);
      setOpenArticleSuppliers(new Set(supplierIds));
    } else if (prevSearch.trim() !== '') {
      // Search was just cleared: close all
      setOpenArticleSuppliers(new Set());
    }
    // If search was already empty: do nothing (allow manual toggle)
  }, [debouncedArticleSearchQuery, groupedBySupplier]);

  const articleCategoriesForFilter = (allArticles?.map((a) => a.category).filter(Boolean) || []) as string[];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Katalog</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">Verwalten Sie Ihre Lieferanten und Artikel</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm md:max-w-md">
            <TabsTrigger value="suppliers">Lieferanten</TabsTrigger>
            <TabsTrigger value="articles">Alle Artikel</TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            {/* Combined Filter + Actions Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <SupplierFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                topCategoryFilter={topCategoryFilter}
                onTopCategoryChange={setTopCategoryFilter}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                articleCategories={articleCategoriesForSupplierFilter}
                multiSelectEnabled={supplierMultiSelectEnabled}
                onMultiSelectChange={setSupplierMultiSelectEnabled}
                selectedCount={selectedSuppliers.size}
                onPrintCombined={handlePrintCombined}
                showMultiSelectToggle={advancedSettingsEnabled}
              />
              <div className="flex flex-wrap gap-2 shrink-0">
                {advancedSettingsEnabled && (
                  <ExportMenu 
                    filename="suppliers" 
                    title="Lieferanten" 
                    headers={['Name', 'Email', 'Telefon', 'Adresse', 'Ansprechpartner', 'Kundennummer', 'Status']} 
                    getData={() => suppliers?.map(s => [s.name, s.email, s.phone || '', s.address || '', s.contact_person || '', s.customer_number || '', s.is_active ? 'Aktiv' : 'Inaktiv']) || []} 
                    disabled={!suppliers?.length} 
                  />
                )}
                {advancedSettingsEnabled && (
                  <Button variant="outline" onClick={() => setIsSupplierImportOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren
                  </Button>
                )}
                <Button onClick={() => { setEditingSupplier(null); setIsSupplierDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Lieferant hinzufügen
                </Button>
              </div>
            </div>

            {/* Supplier Form Dialog */}
            <SupplierFormDialog
              open={isSupplierDialogOpen}
              onOpenChange={(open) => {
                setIsSupplierDialogOpen(open);
                if (!open) setEditingSupplier(null);
              }}
              editingSupplier={editingSupplier}
              onSubmit={handleSupplierSubmit}
              onImportArticles={(supplierId) => {
                setArticleImportSupplierId(supplierId);
                setIsSupplierDialogOpen(false);
              }}
              isPending={createSupplier.isPending || updateSupplier.isPending}
            />

            {/* Supplier Import */}
            <CsvImportDialog 
              open={isSupplierImportOpen} 
              onOpenChange={setIsSupplierImportOpen} 
              title="Lieferanten importieren" 
              fields={SUPPLIER_IMPORT_FIELDS} 
              onImport={async data => { await importSuppliers.mutateAsync(data); }} 
              templateFileName="suppliers_template.csv" 
            />

            {/* Article Import Dialog for specific supplier */}
            <CsvImportDialog 
              open={!!articleImportSupplierId} 
              onOpenChange={open => !open && setArticleImportSupplierId(null)} 
              title={`Artikel importieren für ${suppliers?.find(s => s.id === articleImportSupplierId)?.name || 'Lieferant'}`} 
              fields={ARTICLE_IMPORT_FIELDS} 
              onImport={async data => {
                if (articleImportSupplierId) {
                  await importArticles.mutateAsync({ articles: data, defaultSupplierId: articleImportSupplierId });
                }
              }} 
              templateFileName="articles_template.csv" 
            />

            {/* Suppliers Table */}
            {suppliersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSuppliers?.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">
                  {searchQuery || topCategoryFilter !== 'all' || categoryFilter !== 'all' ? 'Keine Lieferanten gefunden' : 'Noch keine Lieferanten. Fügen Sie Ihren ersten Lieferanten hinzu.'}
                </p>
              </div>
            ) : (
              <SupplierTable
                suppliers={filteredSuppliers || []}
                articlesBySupplier={articlesBySupplier}
                expandedSuppliers={expandedSuppliers}
                selectedSuppliers={selectedSuppliers}
                multiSelectEnabled={supplierMultiSelectEnabled}
                pendingChangesBySupplier={pendingChangesBySupplier || {}}
                pendingArticleIds={pendingArticleIds || new Set()}
                recentlyActiveSuppliers={recentlyActiveSuppliers || new Map()}
                onToggleExpand={toggleSupplierExpanded}
                onToggleSelect={toggleSupplierSelected}
                onSelectAll={selectAllSuppliers}
                onEdit={(supplier) => { setEditingSupplier(supplier); setIsSupplierDialogOpen(true); }}
                onDelete={setDeletingSupplier}
                onSendInvitation={handleSendInvitation}
                onShowChanges={setChangesDialogSupplier}
                onShowLocations={setLocationsDialogSupplier}
                onPrintOrderList={async (supplier, articles) => await generateOrderListPdf(supplier, articles.map(a => ({
                  name: a.name,
                  unit: a.unit,
                  sku: a.sku,
                  description: a.description,
                  lastOrderQuantity: lastOrderMap?.[a.id]?.quantity,
                  lastOrderDate: lastOrderMap?.[a.id]?.date
                })))}
                onArticleChangeClick={(article, supplier) => {
                  setChangesDialogSupplier(supplier);
                  setChangesDialogArticle({ id: article.id, name: article.name });
                }}
                invitingSupplierId={invitingSupplierId}
                sendingInvitation={sendingInvitation}
                getCartQuantity={getCartQuantity}
                onAddToCart={addItem}
                onUpdateQuantity={updateQuantity}
              />
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            {/* Combined Filter + Actions Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <ArticleFilters
                searchQuery={articleSearchQuery}
                onSearchChange={setArticleSearchQuery}
                selectedSuppliers={selectedArticleSuppliers}
                onSupplierChange={setSelectedArticleSuppliers}
                suppliers={suppliers || []}
                supplierPopoverOpen={supplierPopoverOpen}
                onSupplierPopoverChange={setSupplierPopoverOpen}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                articleCategories={articleCategoriesForFilter}
                advancedViewEnabled={articleAdvancedViewEnabled}
                onAdvancedViewChange={setArticleAdvancedViewEnabled}
                hasFilters={articleSearchQuery !== '' || selectedArticleSuppliers.length > 0 || selectedCategory !== 'all'}
                showAdvancedToggle={advancedSettingsEnabled}
                recentlyActiveSuppliers={recentlyActiveSuppliers || new Map()}
                onClearFilters={() => {
                  setArticleSearchQuery('');
                  setSelectedArticleSuppliers([]);
                  setSelectedCategory('all');
                }}
              />
              <div className="flex flex-wrap gap-2 shrink-0">
                {advancedSettingsEnabled && (
                  <ExportMenu
                    filename="articles"
                    title="Artikel"
                    headers={['Name', 'Lieferant', 'Preis', 'Einheit', 'SKU', 'Kategorie', 'Status']}
                    getData={() => allArticles?.map(a => [
                      a.name,
                      a.suppliers?.name || '',
                      `€${Number(a.price).toFixed(2)}`,
                      a.unit,
                      a.sku || '',
                      a.category || '',
                      a.is_active ? 'Aktiv' : 'Inaktiv'
                    ]) || []}
                    disabled={!allArticles?.length}
                  />
                )}
                {advancedSettingsEnabled && (
                  <Button variant="outline" onClick={() => setIsArticleImportOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren
                  </Button>
                )}
                <Button onClick={() => { setEditingArticle(null); setIsArticleDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Artikel hinzufügen
                </Button>
              </div>
            </div>

            {/* Article Form Dialog */}
            <ArticleFormDialog
              open={isArticleDialogOpen}
              onOpenChange={(open) => {
                setIsArticleDialogOpen(open);
                if (!open) setEditingArticle(null);
              }}
              editingArticle={editingArticle}
              suppliers={suppliers || []}
              categories={allArticleCategories}
              units={existingUnits}
              onSubmit={handleArticleSubmit}
              isPending={createArticle.isPending || updateArticle.isPending}
            />

            <CsvImportDialog
              open={isArticleImportOpen}
              onOpenChange={setIsArticleImportOpen}
              title="Artikel importieren"
              fields={ARTICLE_IMPORT_FIELDS}
              onImport={async (data, defaultSupplierId) => {
                await importArticles.mutateAsync({ articles: data, defaultSupplierId });
              }}
              templateFileName="articles_template.csv"
              suppliers={suppliers?.map(s => ({ id: s.id, name: s.name }))}
              showSupplierSelect={true}
            />

            {/* Selection Toolbar */}
            {articleAdvancedViewEnabled && selectedArticles.size > 0 && (
              <BulkCategoryToolbar
                selectedCount={selectedArticles.size}
                categories={allArticleCategories}
                onAssignCategory={handleBulkCategoryAssign}
                onClearSelection={() => setSelectedArticles(new Set())}
              />
            )}

            {/* Articles List */}
            {articlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedArticles?.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {articleSearchQuery || selectedArticleSuppliers.length > 0 || selectedCategory !== 'all'
                    ? 'Keine Artikel gefunden'
                    : 'Noch keine Artikel. Fügen Sie Ihren ersten Artikel hinzu.'}
                </p>
              </div>
            ) : (
              <ArticleTable
                groupedBySupplier={groupedBySupplier}
                openSuppliers={openArticleSuppliers}
                selectedArticles={selectedArticles}
                advancedViewEnabled={articleAdvancedViewEnabled}
                getCartQuantity={getCartQuantity}
                getItemsBySupplier={getItemsBySupplier}
                pendingChangesBySupplier={pendingChangesBySupplier || {}}
                pendingArticleIds={pendingArticleIds || new Set()}
                recentlyActiveSuppliers={recentlyActiveSuppliers || new Map()}
                lastOrderMap={lastOrderMap || {}}
                onToggleSupplier={toggleArticleSupplier}
                onToggleArticle={toggleArticleSelected}
                onAddToCart={addItem}
                onUpdateQuantity={updateQuantity}
                onEdit={(article) => { setEditingArticle(article); setIsArticleDialogOpen(true); }}
                onDelete={setDeletingArticle}
                onShowChanges={(supplierId) => {
                  const supplier = suppliers?.find(s => s.id === supplierId);
                  if (supplier) setChangesDialogSupplier(supplier);
                }}
                onArticleChangeClick={(article, supplierId, supplierName) => {
                  const supplier = suppliers?.find(s => s.id === supplierId);
                  if (supplier) {
                    setChangesDialogSupplier(supplier);
                    setChangesDialogArticle({ id: article.id, name: article.name });
                  }
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialogs
        deletingSupplier={deletingSupplier}
        onSupplierClose={() => setDeletingSupplier(null)}
        onSupplierDelete={handleSupplierDelete}
        isSupplierDeleting={deleteSupplier.isPending}
        deletingArticle={deletingArticle}
        onArticleClose={() => setDeletingArticle(null)}
        onArticleDelete={handleArticleDelete}
        isArticleDeleting={deleteArticle.isPending}
      />

      {/* Supplier Changes Dialog */}
      <SupplierChangesDialog
        open={!!changesDialogSupplier}
        onOpenChange={(open) => {
          if (!open) {
            setChangesDialogSupplier(null);
            setChangesDialogArticle(null);
          }
        }}
        supplierId={changesDialogSupplier?.id || null}
        supplierName={changesDialogSupplier?.name || ''}
        articleId={changesDialogArticle?.id}
        articleName={changesDialogArticle?.name}
      />

      {/* Supplier Locations Dialog */}
      {locationsDialogSupplier && (
        <SupplierLocationsDialog
          open={!!locationsDialogSupplier}
          onOpenChange={(open) => !open && setLocationsDialogSupplier(null)}
          supplier={locationsDialogSupplier}
        />
      )}
    </DashboardLayout>
  );
};

export default Suppliers;
