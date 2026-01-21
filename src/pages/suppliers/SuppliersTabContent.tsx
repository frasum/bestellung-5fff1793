import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Package, Merge } from 'lucide-react';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';
import { SupplierActivityInfo } from '@/hooks/useSupplierChanges';
import { LastOrderInfo } from '@/hooks/useLastOrderByArticle';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { generateOrderListPdf } from '@/lib/orderListPdf';

interface SuppliersTabContentProps {
  // Filters
  searchQuery: string;
  onSearchChange: (query: string) => void;
  topCategoryFilter: string;
  onTopCategoryChange: (filter: string) => void;
  categoryFilter: string;
  onCategoryChange: (filter: string) => void;
  articleCategories: string[];
  
  // Multi-select
  multiSelectEnabled: boolean;
  onMultiSelectChange: (enabled: boolean) => void;
  selectedCount: number;
  onPrintCombined: () => void;
  showMultiSelectToggle: boolean;
  
  // Data
  suppliers: Supplier[];
  filteredSuppliers: Supplier[];
  articlesBySupplier: Record<string, Article[]>;
  suppliersLoading: boolean;
  allArticles: Article[] | undefined;
  
  // States
  expandedSuppliers: Set<string>;
  selectedSuppliers: Set<string>;
  pendingChangesBySupplier: Record<string, number>;
  pendingArticleIds: Set<string>;
  recentlyActiveSuppliers: Map<string, SupplierActivityInfo>;
  advancedSettingsEnabled: boolean;
  cartItemCountsBySupplier: Record<string, number>;
  cartItemsByArticle: Map<string, number>;
  highlightSearch: string;
  lastOrderByArticle: Record<string, LastOrderInfo> | undefined;
  
  // Handlers
  onToggleExpand: (supplierId: string) => void;
  onToggleSelect: (supplierId: string) => void;
  onSelectAll: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  onSendInvitation: (supplier: Supplier) => void;
  onShowQRCode: (supplier: Supplier) => void;
  onShowTokens: (supplier: Supplier) => void;
  onOpenPortal: (supplier: Supplier) => void;
  onShowChanges: (supplier: Supplier) => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (article: Article) => void;
  onAddArticle: (supplier: Supplier) => void;
  onAddToCart: (article: Article) => void;
  onRemoveFromCart: (article: Article) => void;
  onArticleChangeClick: (article: Article, supplier: Supplier) => void;
  onOpenSupplierDialog: () => void;
  onOpenMergeDialog: () => void;
  onOpenQuickCapture: () => void;
  
  // Status
  invitingSupplierId: string | null;
  sendingInvitation: boolean;
}

export const SuppliersTabContent = memo(function SuppliersTabContent({
  searchQuery,
  onSearchChange,
  topCategoryFilter,
  onTopCategoryChange,
  categoryFilter,
  onCategoryChange,
  articleCategories,
  multiSelectEnabled,
  onMultiSelectChange,
  selectedCount,
  onPrintCombined,
  showMultiSelectToggle,
  suppliers,
  filteredSuppliers,
  articlesBySupplier,
  suppliersLoading,
  allArticles,
  expandedSuppliers,
  selectedSuppliers,
  pendingChangesBySupplier,
  pendingArticleIds,
  recentlyActiveSuppliers,
  advancedSettingsEnabled,
  cartItemCountsBySupplier,
  cartItemsByArticle,
  highlightSearch,
  lastOrderByArticle,
  onToggleExpand,
  onToggleSelect,
  onSelectAll,
  onEditSupplier,
  onDeleteSupplier,
  onSendInvitation,
  onShowQRCode,
  onShowTokens,
  onOpenPortal,
  onShowChanges,
  onEditArticle,
  onDeleteArticle,
  onAddArticle,
  onAddToCart,
  onRemoveFromCart,
  onArticleChangeClick,
  onOpenSupplierDialog,
  onOpenMergeDialog,
  onOpenQuickCapture,
  invitingSupplierId,
  sendingInvitation,
}: SuppliersTabContentProps) {
  const { t } = useTranslation();

  const handlePrintOrderList = async (supplier: Supplier, articles: Article[]) => {
    await generateOrderListPdf(supplier, articles.map(a => ({
      name: a.name,
      unit: a.unit,
      sku: a.sku,
      description: a.description,
      lastOrderQuantity: lastOrderByArticle?.[a.id]?.quantity,
      lastOrderDate: lastOrderByArticle?.[a.id]?.date
    })));
  };

  const handleOrderClick = (supplier: Supplier) => {
    onToggleExpand(supplier.id);
  };

  // Empty state with onboarding CTA
  if (!suppliersLoading && filteredSuppliers.length === 0 && !searchQuery && topCategoryFilter === 'all' && categoryFilter === 'all' && (!allArticles || allArticles.length === 0)) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <SupplierFilters
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            topCategoryFilter={topCategoryFilter}
            onTopCategoryChange={onTopCategoryChange}
            categoryFilter={categoryFilter}
            onCategoryChange={onCategoryChange}
            articleCategories={articleCategories}
            multiSelectEnabled={multiSelectEnabled}
            onMultiSelectChange={onMultiSelectChange}
            selectedCount={selectedCount}
            onPrintCombined={onPrintCombined}
            showMultiSelectToggle={showMultiSelectToggle}
          />
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button 
              variant="accent" 
              size="icon" 
              className="h-11 w-11 rounded-full" 
              onClick={onOpenSupplierDialog}
              title="Lieferant hinzufügen"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        <div className="text-center py-16 bg-gradient-to-b from-primary/5 to-background border border-primary/20 rounded-xl">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto px-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Starte mit einem Foto!</h3>
              <p className="text-muted-foreground">
                Fotografiere ein Produkt und die KI erkennt automatisch Name, Kategorie und Einheit. So baust du deinen Katalog in Sekunden auf.
              </p>
            </div>
            <Button size="lg" className="h-14 px-8 text-base" onClick={onOpenQuickCapture}>
              <Package className="w-5 h-5 mr-2" />
              Schnell-Erfassung starten
            </Button>
            <p className="text-xs text-muted-foreground">
              Oder <button className="underline hover:text-foreground" onClick={onOpenSupplierDialog}>füge manuell einen Lieferanten hinzu</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter + Actions Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SupplierFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          topCategoryFilter={topCategoryFilter}
          onTopCategoryChange={onTopCategoryChange}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          articleCategories={articleCategories}
          multiSelectEnabled={multiSelectEnabled}
          onMultiSelectChange={onMultiSelectChange}
          selectedCount={selectedCount}
          onPrintCombined={onPrintCombined}
          showMultiSelectToggle={showMultiSelectToggle}
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          {suppliers.length >= 2 && (
            <Button 
              variant="outline" 
              onClick={onOpenMergeDialog}
              className="gap-2"
            >
              <Merge className="w-4 h-4" />
              <span className="hidden sm:inline">Zusammenführen</span>
            </Button>
          )}
          <Button 
            variant="accent" 
            size="icon" 
            className="h-11 w-11 rounded-full" 
            onClick={onOpenSupplierDialog}
            title="Lieferant hinzufügen"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {suppliersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">
            {searchQuery || topCategoryFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Keine Lieferanten gefunden' 
              : 'Noch keine Lieferanten. Fügen Sie Ihren ersten Lieferanten hinzu.'}
          </p>
        </div>
      ) : (
        <SupplierTable
          suppliers={filteredSuppliers}
          articlesBySupplier={articlesBySupplier}
          expandedSuppliers={expandedSuppliers}
          selectedSuppliers={selectedSuppliers}
          multiSelectEnabled={multiSelectEnabled}
          pendingChangesBySupplier={pendingChangesBySupplier}
          pendingArticleIds={pendingArticleIds}
          recentlyActiveSuppliers={recentlyActiveSuppliers}
          advancedSettingsEnabled={advancedSettingsEnabled}
          cartItemCountsBySupplier={cartItemCountsBySupplier}
          cartItemsByArticle={cartItemsByArticle}
          highlightSearch={highlightSearch}
          lastOrderByArticle={lastOrderByArticle}
          onToggleExpand={onToggleExpand}
          onToggleSelect={onToggleSelect}
          onSelectAll={onSelectAll}
          onEdit={onEditSupplier}
          onDelete={onDeleteSupplier}
          onSendInvitation={onSendInvitation}
          onShowQRCode={onShowQRCode}
          onShowTokens={onShowTokens}
          onOpenPortal={onOpenPortal}
          onShowChanges={onShowChanges}
          onOrderClick={handleOrderClick}
          onPrintOrderList={handlePrintOrderList}
          onArticleChangeClick={onArticleChangeClick}
          onEditArticle={onEditArticle}
          onDeleteArticle={onDeleteArticle}
          onAddArticle={onAddArticle}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          invitingSupplierId={invitingSupplierId}
          sendingInvitation={sendingInvitation}
        />
      )}
    </div>
  );
});
