import { SimpleOrderHeader } from '../SimpleOrderHeader';
import { SupplierSelection } from '../SupplierSelection';
import { EmployeeInfoSection } from '../EmployeeInfoSection';
import { DeliveryInfoBar } from '../DeliveryInfoBar';
import { ArticleList } from '../ArticleList';
import { SubmitBar } from '../SubmitBar';
import { PWAInstallPrompt } from '../PWAInstallPrompt';
import { Article, Location, Supplier, TokenData, OrderStatus } from '../types';
import { FreeItem } from '../FreeItemDialog';

interface MainViewProps {
  tokenData: TokenData | null;
  token: string | undefined;
  
  // Supplier state
  suppliers: Supplier[];
  selectedSupplierId: string | null;
  articles: Article[];
  allArticles: Article[];
  
  // Employee & location
  employeeName: string;
  setEmployeeName: (name: string) => void;
  isEmployeeNameLocked: boolean;
  locations: Location[];
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  isLocationLocked: boolean;
  validationErrors: { name?: boolean; location?: boolean; deliveryDate?: boolean };
  setValidationErrors: React.Dispatch<React.SetStateAction<{ name?: boolean; location?: boolean; deliveryDate?: boolean }>>;
  
  // Delivery
  deliveryDate: Date | undefined;
  timeWindow: string;
  
  // Cart
  quantities: Record<string, number>;
  search: string;
  setSearch: (search: string) => void;
  favoriteIds: Set<string>;
  freeItems: FreeItem[];
  
  // Photo capture
  articlesWithoutPhotos: Article[];
  
  // Computed
  getTotalItems: () => number;
  getSupplierArticleCount: (supplierId: string) => number;
  getSupplierCartCount: (supplierId: string) => number;
  getCurrentSupplierName: () => string;
  
  // Handlers
  handleSupplierSelect: (supplierId: string) => void;
  handleQuantityChange: (articleId: string, delta: number) => void;
  toggleFavorite: (articleId: string) => void;
  handleAddFreeItem: (item: Omit<FreeItem, 'id'>) => void;
  handleUpdateFreeItem: (item: FreeItem) => void;
  handleDeleteFreeItem: (itemId: string) => void;
  handleFreeItemQuantityChange: (itemId: string, delta: number) => void;
  handleSubmitClick: () => void;
  handleViewCartFromSupplierSelection: () => void;
  fetchDrafts: () => void;
  setStatus: React.Dispatch<React.SetStateAction<OrderStatus>>;
}

export const SimpleOrderMainView = (props: MainViewProps) => {
  const {
    tokenData,
    token,
    suppliers,
    selectedSupplierId,
    articles,
    allArticles,
    employeeName,
    setEmployeeName,
    isEmployeeNameLocked,
    locations,
    selectedLocationId,
    setSelectedLocationId,
    isLocationLocked,
    validationErrors,
    setValidationErrors,
    deliveryDate,
    timeWindow,
    quantities,
    search,
    setSearch,
    favoriteIds,
    freeItems,
    articlesWithoutPhotos,
    getTotalItems,
    getSupplierArticleCount,
    getSupplierCartCount,
    getCurrentSupplierName,
    handleSupplierSelect,
    handleQuantityChange,
    toggleFavorite,
    handleAddFreeItem,
    handleUpdateFreeItem,
    handleDeleteFreeItem,
    handleFreeItemQuantityChange,
    handleSubmitClick,
    handleViewCartFromSupplierSelection,
    fetchDrafts,
    setStatus,
  } = props;

  const showSupplierSelection = tokenData?.is_multi_supplier && !selectedSupplierId;

  return (
    <div className="min-h-screen bg-background pb-32">
      <SimpleOrderHeader
        supplierName={getCurrentSupplierName()}
        isMultiSupplier={tokenData?.is_multi_supplier || false}
        selectedSupplierId={selectedSupplierId}
        suppliers={suppliers}
        onSupplierChange={handleSupplierSelect}
        getArticleCount={getSupplierArticleCount}
        hasEmployee={!!tokenData?.has_employee}
        onViewOrders={() => {
          fetchDrafts();
          setStatus('viewing-history');
        }}
        voiceInputEnabled={tokenData?.voice_input_enabled || false}
        onVoiceMode={() => setStatus('voice-mode')}
        canCapturePhotos={tokenData?.can_capture_photos || false}
        onPhotoCapture={() => setStatus('photo-capture')}
        photoCaptureCount={articlesWithoutPhotos.length}
        wineCatalogAccess={tokenData?.wine_catalog_access || 'none'}
        onWineCatalog={() => setStatus('wine-catalog')}
      />

      {showSupplierSelection && (
        <SupplierSelection
          suppliers={suppliers}
          onSelect={handleSupplierSelect}
          getArticleCount={getSupplierArticleCount}
          getCartCount={getSupplierCartCount}
          onViewCart={getTotalItems() > 0 ? handleViewCartFromSupplierSelection : undefined}
          totalCartItems={getTotalItems()}
        />
      )}

      {!showSupplierSelection && (
        <>
          <EmployeeInfoSection
            employeeName={employeeName}
            setEmployeeName={setEmployeeName}
            isEmployeeNameLocked={isEmployeeNameLocked}
            selectedLocationId={selectedLocationId}
            setSelectedLocationId={setSelectedLocationId}
            isLocationLocked={isLocationLocked}
            locations={locations}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            variant="default"
          />
          <DeliveryInfoBar
            deliveryDate={deliveryDate}
            timeWindow={timeWindow}
            hasError={validationErrors.deliveryDate}
          />
          <ArticleList
            articles={articles}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
            search={search}
            onSearchChange={setSearch}
            allArticles={allArticles}
            suppliers={suppliers}
            selectedSupplierId={selectedSupplierId}
            onSupplierChange={handleSupplierSelect}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            canAddFreeItems={tokenData?.can_add_free_items || false}
            freeItems={freeItems.filter(item => item.supplier_id === selectedSupplierId)}
            onAddFreeItem={handleAddFreeItem}
            onUpdateFreeItem={handleUpdateFreeItem}
            onDeleteFreeItem={handleDeleteFreeItem}
            onFreeItemQuantityChange={handleFreeItemQuantityChange}
            token={token}
            organizationId={tokenData?.organization_id}
            canCapturePhotos={tokenData?.can_capture_photos || false}
          />
          <SubmitBar
            totalItems={getTotalItems()}
            isSubmitting={false}
            onSubmit={handleSubmitClick}
            isAutoApproveEmployee={tokenData?.auto_approve_orders || false}
          />
        </>
      )}
      
      <PWAInstallPrompt />
    </div>
  );
};
