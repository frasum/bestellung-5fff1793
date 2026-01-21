import { Loader2 } from 'lucide-react';
import { DashboardLayout, useSidebarContext } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgDebugBar } from '@/components/debug/OrgDebugBar';
import { WinesTab } from '@/components/suppliers/WinesTab';
import { SuggestionsTab } from '@/components/suppliers/SuggestionsTab';
import { useSuggestedArticlesCount } from '@/hooks/useSuggestedArticles';
import { useSupplierPendingChanges, useCombinedPendingBySupplier, usePendingArticleIds, useRecentlyActiveSuppliers } from '@/hooks/useSupplierChanges';
import { useSuppliersRealtime } from '@/hooks/useSuppliersRealtime';
import { useArticlesRealtime } from '@/hooks/useArticlesRealtime';
import { useLastOrderByArticle } from '@/hooks/useLastOrderByArticle';

import { useSuppliersPageState, useSuppliersPageActions, SuppliersTabContent, SuppliersDialogs } from './suppliers';

const Suppliers = () => {
  const state = useSuppliersPageState();
  
  // Realtime subscriptions
  useSuppliersRealtime();
  useArticlesRealtime();
  
  // Additional data hooks
  const { data: pendingChangesBySupplier } = useCombinedPendingBySupplier();
  const { data: pendingArticleIds } = usePendingArticleIds();
  const { data: recentlyActiveSuppliers } = useRecentlyActiveSuppliers();
  const { data: lastOrderMap } = useLastOrderByArticle();
  const { data: suggestionsCount } = useSuggestedArticlesCount();
  
  const actions = useSuppliersPageActions({
    organizationName: state.organizationName,
    setInvitingSupplierId: state.setInvitingSupplierId,
    setShowSupplierUpgradeDialog: state.setShowSupplierUpgradeDialog,
    setSupplierDialog: state.setSupplierDialog,
    setArticleDialog: state.setArticleDialog,
    setDeleteState: state.setDeleteState,
    selectedSuppliers: state.selectedSuppliers,
    setSelectedSuppliers: state.setSelectedSuppliers,
    selectedArticles: state.selectedArticles,
    setSelectedArticles: state.setSelectedArticles,
    suppliers: state.suppliers,
    articlesBySupplier: state.articlesBySupplier,
    filteredSuppliers: state.filteredSuppliers,
    lastOrderMap,
  });

  if (state.authLoading || !state.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        <OrgDebugBar />
        <PageHeader activeTab={state.activeTab} />

        <Tabs value={state.activeTab} onValueChange={state.setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="suppliers">Lieferanten</TabsTrigger>
            <TabsTrigger value="wines" className="gap-1">
              <span className="hidden sm:inline">🍷</span> Weine
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="relative">
              Vorschläge
              {(suggestionsCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {suggestionsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            <SuppliersTabContent
              searchQuery={state.searchQuery}
              onSearchChange={state.setSearchQuery}
              topCategoryFilter={state.topCategoryFilter}
              onTopCategoryChange={state.setTopCategoryFilter}
              categoryFilter={state.categoryFilter}
              onCategoryChange={state.setCategoryFilter}
              articleCategories={state.articleCategoriesForSupplierFilter}
              multiSelectEnabled={state.supplierMultiSelectEnabled}
              onMultiSelectChange={state.setSupplierMultiSelectEnabled}
              selectedCount={state.selectedSuppliers.size}
              onPrintCombined={actions.handlePrintCombined}
              showMultiSelectToggle={state.advancedSettingsEnabled}
              suppliers={state.suppliers || []}
              filteredSuppliers={state.filteredSuppliers || []}
              articlesBySupplier={state.articlesBySupplier}
              suppliersLoading={state.suppliersLoading}
              allArticles={state.allArticles}
              expandedSuppliers={state.expandedSuppliers}
              selectedSuppliers={state.selectedSuppliers}
              pendingChangesBySupplier={pendingChangesBySupplier || {}}
              pendingArticleIds={pendingArticleIds || new Set()}
              recentlyActiveSuppliers={recentlyActiveSuppliers || new Map()}
              advancedSettingsEnabled={state.advancedSettingsEnabled}
              cartItemCountsBySupplier={state.cartItemCountsBySupplier}
              cartItemsByArticle={state.cartItemsByArticle}
              highlightSearch={state.debouncedSearchQuery}
              lastOrderByArticle={lastOrderMap}
              onToggleExpand={state.toggleSupplierExpanded}
              onToggleSelect={state.toggleSupplierSelected}
              onSelectAll={actions.selectAllSuppliers}
              onEditSupplier={(supplier) => state.setSupplierDialog({ isOpen: true, editingSupplier: supplier })}
              onDeleteSupplier={(supplier) => state.setDeleteState({ deletingSupplier: supplier, deletingArticle: null })}
              onSendInvitation={actions.handleSendInvitation}
              onShowQRCode={state.setQrCodeSupplier}
              onShowTokens={state.setTokensDialogSupplier}
              onOpenPortal={actions.handleOpenPortal}
              onShowChanges={(supplier) => state.setChangesDialog({ supplier, article: null })}
              onEditArticle={(article) => state.setArticleDialog({ isOpen: true, editingArticle: article, preselectedSupplierId: null })}
              onDeleteArticle={(article) => state.setDeleteState({ deletingSupplier: null, deletingArticle: article })}
              onAddArticle={(supplier) => state.setArticleDialog({ isOpen: true, editingArticle: null, preselectedSupplierId: supplier.id })}
              onAddToCart={state.handleAddToCart}
              onRemoveFromCart={state.handleRemoveFromCart}
              onArticleChangeClick={(article, supplier) => state.setChangesDialog({ supplier, article: { id: article.id, name: article.name } })}
              onOpenSupplierDialog={actions.handleOpenSupplierDialog}
              onOpenMergeDialog={() => state.setIsMergeSuppliersOpen(true)}
              onOpenQuickCapture={() => state.setIsQuickCaptureOpen(true)}
              invitingSupplierId={state.invitingSupplierId}
              sendingInvitation={actions.sendingInvitation}
            />
          </TabsContent>

          <TabsContent value="wines" className="space-y-4">
            <WinesTab
              articles={state.allArticles || []}
              suppliers={state.suppliers || []}
              onEditArticle={(article) => state.setArticleDialog({ isOpen: true, editingArticle: article, preselectedSupplierId: null })}
            />
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <SuggestionsTab suppliers={state.suppliers || []} />
          </TabsContent>
        </Tabs>
      </div>

      <SuppliersDialogs
        isSupplierDialogOpen={state.supplierDialog.isOpen}
        editingSupplier={state.supplierDialog.editingSupplier}
        onSupplierDialogChange={(open) => state.setSupplierDialog({ isOpen: open, editingSupplier: open ? state.supplierDialog.editingSupplier : null })}
        onSupplierSubmit={(input) => actions.handleSupplierSubmit(input, state.supplierDialog.editingSupplier)}
        onImportArticles={(supplierId) => { state.setArticleImportSupplierId(supplierId); state.setSupplierDialog({ isOpen: false, editingSupplier: null }); }}
        isSupplierPending={actions.createSupplier.isPending || actions.updateSupplier.isPending}
        isArticleDialogOpen={state.articleDialog.isOpen}
        editingArticle={state.articleDialog.editingArticle}
        preselectedSupplierId={state.articleDialog.preselectedSupplierId}
        onArticleDialogChange={(open) => state.setArticleDialog({ isOpen: open, editingArticle: open ? state.articleDialog.editingArticle : null, preselectedSupplierId: open ? state.articleDialog.preselectedSupplierId : null })}
        onArticleSubmit={(data, capturedImage, imageCleared, locationIds) => actions.handleArticleSubmit(data, state.articleDialog.editingArticle, capturedImage, imageCleared, locationIds)}
        onArticleDeleteFromForm={(article) => { state.setDeleteState({ deletingSupplier: null, deletingArticle: article }); state.setArticleDialog({ isOpen: false, editingArticle: null, preselectedSupplierId: null }); }}
        isArticlePending={actions.createArticle.isPending || actions.updateArticle.isPending}
        suppliers={state.suppliers || []}
        categories={state.allArticleCategories}
        units={state.existingUnits}
        deletingSupplier={state.deleteState.deletingSupplier}
        deletingArticle={state.deleteState.deletingArticle}
        onSupplierDeleteClose={() => state.setDeleteState({ ...state.deleteState, deletingSupplier: null })}
        onSupplierDelete={() => actions.handleSupplierDelete(state.deleteState.deletingSupplier)}
        isSupplierDeleting={actions.deleteSupplier.isPending}
        onArticleDeleteClose={() => state.setDeleteState({ ...state.deleteState, deletingArticle: null })}
        onArticleDeleteConfirm={() => actions.handleArticleDelete(state.deleteState.deletingArticle)}
        isArticleDeleting={actions.deleteArticle.isPending}
        changesDialogSupplier={state.changesDialog.supplier}
        changesDialogArticle={state.changesDialog.article}
        onChangesDialogClose={() => state.setChangesDialog({ supplier: null, article: null })}
        locationsDialogSupplier={state.locationsDialogSupplier}
        onLocationsDialogClose={() => state.setLocationsDialogSupplier(null)}
        qrCodeSupplier={state.qrCodeSupplier}
        onQRCodeDialogClose={() => state.setQrCodeSupplier(null)}
        tokensDialogSupplier={state.tokensDialogSupplier}
        onTokensDialogClose={() => state.setTokensDialogSupplier(null)}
        showUpgradeDialog={state.showSupplierUpgradeDialog}
        onUpgradeDialogChange={state.setShowSupplierUpgradeDialog}
        subscriptionTier={actions.subscriptionLimits.tier}
        suppliersCount={actions.subscriptionLimits.usage.suppliersCount}
        suppliersLimit={actions.subscriptionLimits.limits.suppliers}
        isQuickCaptureOpen={state.isQuickCaptureOpen}
        onQuickCaptureChange={state.setIsQuickCaptureOpen}
        onCreateSupplier={async (input) => actions.createSupplier.mutateAsync(input)}
        onCreateArticle={async (input) => actions.createArticle.mutateAsync(input)}
        onUploadImage={async (base64, orgId, articleId) => {
          const imageUrl = await actions.uploadImage(base64, orgId, articleId);
          if (imageUrl) await actions.updateArticle.mutateAsync({ id: articleId, image_url: imageUrl });
          return imageUrl;
        }}
        organizationId={state.organizationId}
        isMergeOpen={state.isMergeSuppliersOpen}
        onMergeChange={state.setIsMergeSuppliersOpen}
        allArticles={state.allArticles || []}
        isSupplierImportOpen={state.isSupplierImportOpen}
        onSupplierImportChange={state.setIsSupplierImportOpen}
        onImportSuppliers={async (data) => actions.importSuppliers.mutateAsync(data)}
        articleImportSupplierId={state.articleImportSupplierId}
        onArticleImportClose={() => state.setArticleImportSupplierId(null)}
        onImportArticlesData={async (data) => actions.importArticles.mutateAsync(data)}
        addArticleSheet={state.addArticleSheet}
        onAddArticleSheetChange={(open) => state.setAddArticleSheet(prev => ({ ...prev, open }))}
      />
    </DashboardLayout>
  );
};

export default Suppliers;
