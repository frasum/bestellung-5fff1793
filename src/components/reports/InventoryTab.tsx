import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Article, useUpdateArticle, useCreateArticle, useDeleteArticle, ArticleInput } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ClipboardList, Euro, History, GitCompareArrows } from 'lucide-react';
import { format, Locale } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { InventoryComparisonDialog } from './InventoryComparisonDialog';
import { MergeArticlesDialog } from '@/components/suppliers/MergeArticlesDialog';
import { ArticleFormDialog } from '@/components/suppliers/ArticleFormDialog';
import { ArticleFormData } from '@/components/suppliers/schemas';
import {
  useInventoryState,
  InventoryHistoryDialog,
  NewSessionDialog,
  DeleteSessionDialog,
  DeleteArticleDialog,
  InventoryFilters,
  SupplierInventoryCard,
  PricesTabContent,
  InventoryTabContent,
} from './inventory';

export const InventoryTab = () => {
  const { t, i18n } = useTranslation();

  const getDateLocale = (): Locale => {
    const locales: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };
    return locales[i18n.language] || de;
  };

  // Use the consolidated inventory state hook
  const {
    articles,
    suppliers,
    sessions,
    activeSession,
    units,
    categories,
    commonUnits,
    filteredArticles,
    groupedArticlesBySupplier,
    groupedInventoryArticles,
    sessionStats,
    localItems,
    articlesLoading,
    sessionsLoading,
    activeSessionId,
    setActiveSessionId,
    supplierFilter,
    setSupplierFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    hasChanges,
    savingArticleIds,
    savedArticleIds,
    createSession,
    updateSession,
    bulkUpsertItems,
    deleteSession,
    handleItemChange,
    handleSave,
    handleComplete,
    getItemValues,
  } = useInventoryState();

  // Local UI state
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [showMergeArticlesDialog, setShowMergeArticlesDialog] = useState(false);
  const [mergeArticlesSupplierId, setMergeArticlesSupplierId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  
  const [openPriceSuppliers, setOpenPriceSuppliers] = useState<Set<string>>(new Set());
  const [openInventorySuppliers, setOpenInventorySuppliers] = useState<Set<string>>(new Set());
  
  // Article CRUD state
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);

  const updateArticle = useUpdateArticle();
  const createArticle = useCreateArticle();
  const deleteArticle = useDeleteArticle();

  // Expand suppliers when searching
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

  const handleOpenMergeArticles = (supplierId: string) => {
    setMergeArticlesSupplierId(supplierId);
    setShowMergeArticlesDialog(true);
  };

  const handleOpenNewArticle = (supplierId: string) => {
    setEditingArticle(null);
    setPreselectedSupplierId(supplierId);
    setShowArticleDialog(true);
  };

  const handleOpenEditArticle = (article: Article) => {
    setEditingArticle(article);
    setPreselectedSupplierId(null);
    setShowArticleDialog(true);
  };

  const handleSaveArticle = async (
    data: ArticleFormData,
    capturedImage?: string,
    imageCleared?: boolean,
    locationIds?: string[]
  ) => {
    const articleData: ArticleInput = {
      supplier_id: preselectedSupplierId || data.supplier_id,
      name: data.name || '',
      description: data.description,
      sku: data.sku,
      unit: data.unit || 'Stk',
      price: parseFloat(data.price) || 0,
      category: data.category,
      origin_country: data.origin_country,
      packaging_unit: data.packaging_unit ? parseInt(data.packaging_unit) : undefined,
      order_unit_id: data.order_unit_id || null,
      reference_price: data.reference_price ? parseFloat(data.reference_price.replace(',', '.')) : undefined,
      reference_unit: data.reference_unit,
      selling_price: data.selling_price ? parseFloat(data.selling_price) : undefined,
      grape_variety: data.grape_variety,
      flavor_profile: data.flavor_profile,
      food_pairings: data.food_pairings,
    };

    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, ...articleData });
    } else {
      await createArticle.mutateAsync(articleData);
    }
    setShowArticleDialog(false);
    setEditingArticle(null);
    setPreselectedSupplierId(null);
  };

  const handleConfirmDeleteArticle = async () => {
    if (!deleteArticleId) return;
    await deleteArticle.mutateAsync(deleteArticleId);
    setDeleteArticleId(null);
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
          <Button variant="accent" size="sm" onClick={() => setShowNewSessionDialog(true)} className="h-9">
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

        {/* Filters */}
        <InventoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          supplierFilter={supplierFilter}
          onSupplierFilterChange={setSupplierFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          suppliers={suppliers || []}
          categories={categories}
        />

        {/* Inventory Tab Content */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <InventoryTabContent
            activeSession={activeSession}
            groupedInventoryArticles={groupedInventoryArticles}
            sessionStats={sessionStats}
            openInventorySuppliers={openInventorySuppliers}
            toggleInventorySupplier={toggleInventorySupplier}
            getItemValues={getItemValues}
            onItemChange={handleItemChange}
            savingArticleIds={savingArticleIds}
            savedArticleIds={savedArticleIds}
            hasChanges={hasChanges}
            isSaving={bulkUpsertItems.isPending}
            onSave={handleSave}
            onComplete={handleComplete}
            onAddArticle={handleOpenNewArticle}
            onEditArticle={handleOpenEditArticle}
            onDeleteArticle={setDeleteArticleId}
            onMergeArticles={handleOpenMergeArticles}
            filteredArticles={filteredArticles}
            localItems={localItems}
            supplierFilter={supplierFilter}
            suppliers={suppliers}
            articlesLoading={articlesLoading}
          />
          
          {activeSession && groupedInventoryArticles.map((group) => (
            <SupplierInventoryCard
              key={group.supplier.id}
              group={group}
              isOpen={openInventorySuppliers.has(group.supplier.id)}
              onToggle={() => toggleInventorySupplier(group.supplier.id)}
              getItemValues={getItemValues}
              onItemChange={handleItemChange}
              savingArticleIds={savingArticleIds}
              savedArticleIds={savedArticleIds}
              onAddArticle={handleOpenNewArticle}
              onEditArticle={handleOpenEditArticle}
              onDeleteArticle={setDeleteArticleId}
              onMergeArticles={handleOpenMergeArticles}
              isReadOnly={activeSession.status === 'completed'}
            />
          ))}
        </TabsContent>

        {/* Prices Tab Content */}
        <TabsContent value="prices" className="space-y-4 mt-4">
          <PricesTabContent
            groupedArticlesBySupplier={groupedArticlesBySupplier}
            articlesLoading={articlesLoading}
            openPriceSuppliers={openPriceSuppliers}
            togglePriceSupplier={togglePriceSupplier}
            commonUnits={commonUnits}
            units={units}
            onAddArticle={handleOpenNewArticle}
            onMergeArticles={handleOpenMergeArticles}
            onEditArticle={handleOpenEditArticle}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewSessionDialog
        open={showNewSessionDialog}
        onOpenChange={setShowNewSessionDialog}
        sessionName={newSessionName}
        onSessionNameChange={setNewSessionName}
        onCreateSession={handleCreateSession}
        isCreating={createSession.isPending}
      />

      <InventoryHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        sessions={sessions || []}
        onLoadSession={handleLoadSession}
        onDeleteSession={setDeleteSessionId}
      />

      <DeleteSessionDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
        onConfirm={handleDeleteSession}
      />

      <InventoryComparisonDialog
        open={showComparisonDialog}
        onOpenChange={setShowComparisonDialog}
        sessions={sessions || []}
        currentSessionId={activeSessionId}
      />

      <MergeArticlesDialog
        open={showMergeArticlesDialog}
        onOpenChange={(open) => {
          setShowMergeArticlesDialog(open);
          if (!open) setMergeArticlesSupplierId(null);
        }}
        suppliers={suppliers || []}
        articles={articles?.map(a => ({
          id: a.id,
          name: a.name,
          sku: a.sku,
          unit: a.unit,
          price: a.price,
          supplier_id: a.supplier_id,
        })) || []}
        preselectedSupplierId={mergeArticlesSupplierId}
      />

      <ArticleFormDialog
        open={showArticleDialog}
        onOpenChange={setShowArticleDialog}
        editingArticle={editingArticle}
        preselectedSupplierId={preselectedSupplierId}
        suppliers={suppliers || []}
        categories={categories}
        units={commonUnits}
        onSubmit={handleSaveArticle}
        isPending={createArticle.isPending || updateArticle.isPending}
        onDelete={(article) => setDeleteArticleId(article.id)}
      />

      <DeleteArticleDialog
        open={!!deleteArticleId}
        onOpenChange={(open) => !open && setDeleteArticleId(null)}
        onConfirm={handleConfirmDeleteArticle}
      />
    </div>
  );
};

export default InventoryTab;
