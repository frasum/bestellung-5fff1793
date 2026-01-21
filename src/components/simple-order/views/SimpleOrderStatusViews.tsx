import { useTranslation } from 'react-i18next';
import { LoadingScreen, ErrorScreen, SuccessScreen } from '../StatusScreens';
import { PinEntryScreen } from '../PinEntryScreen';
import { LocationDateStep } from '../LocationDateStep';
import { EmployeeOrderHistory } from '../EmployeeOrderHistory';
import { EmployeeOrderEdit } from '../EmployeeOrderEdit';
import { PhotoCaptureTab } from '../PhotoCaptureTab';
import { VoiceOrderMode } from '../VoiceOrderMode';
import { WineCatalogView } from '../WineCatalogView';
import { MultiSupplierCartOverview } from '../MultiSupplierCartOverview';
import { OrderConfirmationScreen } from '../OrderConfirmationScreen';
import { Article, Location, Supplier, TokenData, Draft, CompletedOrder, Category, OrderStatus } from '../types';
import { FreeItem } from '../FreeItemDialog';

interface StatusViewProps {
  status: OrderStatus;
  error: string | null;
  token: string | undefined;
  tokenData: TokenData | null;
  
  // Employee & location state
  employeeName: string;
  isEmployeeNameLocked: boolean;
  locations: Location[];
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  isLocationLocked: boolean;
  deliveryDate: Date | undefined;
  setDeliveryDate: (date: Date | undefined) => void;
  timeWindow: string;
  setTimeWindow: (window: string) => void;
  
  // Auto-approve
  isAutoApproved: boolean;
  orderNumber: string | null;
  hasEmployee: boolean;
  
  // Draft handling
  drafts: Draft[];
  completedOrders: CompletedOrder[];
  isLoadingDrafts: boolean;
  isDeletingDraft: string | null;
  editingDraft: Draft | null;
  isSavingDraft: boolean;
  articles: Article[];
  favoriteIds: Set<string>;
  
  // Photo capture
  articlesWithoutPhotos: Article[];
  suppliers: Supplier[];
  categories: Category[];
  
  // Multi-supplier cart
  allArticles: Article[];
  quantities: Record<string, number>;
  freeItems: FreeItem[];
  
  // Handlers
  handlePinVerify: (pin: string) => Promise<boolean>;
  handlePinSuccess: () => void;
  handleLocationDateContinue: () => void;
  handleNewOrder: () => void;
  handleViewOrders: () => void;
  handleEditDraft: (draftId: string) => void;
  handleDeleteDraft: (draftId: string) => void;
  handleSaveDraft: (items: { article_id: string; quantity: number }[], newDeliveryDate: Date | undefined, newTimeWindow: string) => void;
  toggleFavorite: (articleId: string) => void;
  setArticlesWithoutPhotos: React.Dispatch<React.SetStateAction<Article[]>>;
  setStatus: React.Dispatch<React.SetStateAction<OrderStatus>>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleConfirmationQuantityChange: (articleId: string, delta: number) => void;
  handleRemoveItem: (articleId: string) => void;
  handleSubmit: () => void;
  handleAddFreeItem: (item: Omit<FreeItem, 'id'>) => void;
  handleUpdateFreeItem: (item: FreeItem) => void;
  handleDeleteFreeItem: (itemId: string) => void;
  handleFreeItemQuantityChange: (itemId: string, delta: number) => void;
  getCurrentSupplierName: () => string;
  getSelectedLocationName: () => string;
  selectedSupplierId: string | null;
}

export const SimpleOrderStatusViews = (props: StatusViewProps) => {
  const { i18n } = useTranslation();
  const { status, error, token, tokenData } = props;

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'pin-entry') {
    return (
      <PinEntryScreen
        employeeName={props.employeeName}
        onVerify={props.handlePinVerify}
        onSuccess={props.handlePinSuccess}
      />
    );
  }

  if (status === 'error') {
    return <ErrorScreen error={error} />;
  }

  if (status === 'location-date') {
    return (
      <LocationDateStep
        locations={props.locations}
        selectedLocationId={props.selectedLocationId}
        onLocationSelect={props.setSelectedLocationId}
        isLocationLocked={props.isLocationLocked}
        deliveryDate={props.deliveryDate}
        onDeliveryDateChange={props.setDeliveryDate}
        timeWindow={props.timeWindow}
        onTimeWindowChange={props.setTimeWindow}
        onContinue={props.handleLocationDateContinue}
        employeeName={props.isEmployeeNameLocked ? props.employeeName : undefined}
        wineCatalogAccess={tokenData?.wine_catalog_access || 'none'}
        onWineCatalog={() => props.setStatus('wine-catalog')}
      />
    );
  }

  if (status === 'success') {
    return (
      <SuccessScreen 
        onNewOrder={props.handleNewOrder}
        onViewOrders={props.hasEmployee ? props.handleViewOrders : undefined}
        hasEmployee={props.hasEmployee}
        isAutoApproved={props.isAutoApproved}
        orderNumber={props.orderNumber}
      />
    );
  }

  if (status === 'viewing-history') {
    return (
      <EmployeeOrderHistory
        drafts={props.drafts}
        orders={props.completedOrders}
        isLoading={props.isLoadingDrafts}
        employeeName={props.employeeName}
        onEdit={props.handleEditDraft}
        onDelete={props.handleDeleteDraft}
        onBack={() => props.setStatus('ready')}
        isDeleting={props.isDeletingDraft}
      />
    );
  }

  if (status === 'editing' && props.editingDraft) {
    return (
      <EmployeeOrderEdit
        draft={props.editingDraft}
        articles={props.articles}
        favoriteIds={props.favoriteIds}
        onToggleFavorite={props.toggleFavorite}
        onSave={props.handleSaveDraft}
        onCancel={() => {
          props.setStatus('viewing-history');
        }}
        onDelete={() => props.handleDeleteDraft(props.editingDraft!.id)}
        isSaving={props.isSavingDraft}
        isDeleting={props.isDeletingDraft === props.editingDraft.id}
      />
    );
  }

  if (status === 'photo-capture') {
    return (
      <PhotoCaptureTab
        articlesWithoutPhotos={props.articlesWithoutPhotos}
        suppliers={props.suppliers}
        categories={props.categories}
        organizationId={tokenData?.organization_id || ''}
        token={token || ''}
        onPhotoAssigned={(articleId) => {
          props.setArticlesWithoutPhotos(prev => prev.filter(a => a.id !== articleId));
        }}
        onBack={() => props.setStatus('ready')}
      />
    );
  }

  if (status === 'voice-mode') {
    const currentArticles = props.selectedSupplierId 
      ? props.allArticles.filter(a => a.supplier_id === props.selectedSupplierId)
      : props.allArticles;
    
    return (
      <VoiceOrderMode
        articles={currentArticles.map(a => ({
          id: a.id,
          name: a.name,
          unit: a.unit,
          order_unit_name: a.order_unit?.name,
        }))}
        language={tokenData?.language || i18n.language}
        token={token || ''}
        onBack={() => props.setStatus('ready')}
        onAddToCart={(items) => {
          items.forEach(({ articleId, quantity }) => {
            props.setQuantities(prev => ({
              ...prev,
              [articleId]: (prev[articleId] || 0) + quantity,
            }));
          });
        }}
      />
    );
  }

  if (status === 'wine-catalog' && tokenData && token) {
    return (
      <WineCatalogView
        organizationId={tokenData.organization_id}
        permission={tokenData.wine_catalog_access === 'edit' ? 'edit' : 'view'}
        onBack={() => props.setStatus('ready')}
        token={token}
        employeeId={tokenData.employee_id || undefined}
        employeeName={tokenData.employee_name || undefined}
      />
    );
  }

  if (status === 'confirming' || status === 'submitting') {
    if (tokenData?.is_multi_supplier) {
      return (
        <MultiSupplierCartOverview
          articles={props.allArticles}
          quantities={props.quantities}
          suppliers={props.suppliers}
          deliveryDate={props.deliveryDate}
          timeWindow={props.timeWindow}
          locationName={props.getSelectedLocationName()}
          onQuantityChange={props.handleConfirmationQuantityChange}
          onRemoveItem={props.handleRemoveItem}
          onBack={() => {
            props.setStatus('ready');
          }}
          onConfirm={props.handleSubmit}
          isSubmitting={status === 'submitting'}
          allArticles={props.allArticles}
          freeItems={props.freeItems}
          onAddFreeItem={props.handleAddFreeItem}
          onUpdateFreeItem={props.handleUpdateFreeItem}
          onDeleteFreeItem={props.handleDeleteFreeItem}
          onFreeItemQuantityChange={props.handleFreeItemQuantityChange}
          canAddFreeItems={tokenData?.can_add_free_items || false}
        />
      );
    }
    
    const orderedArticles = props.allArticles.filter(a => props.quantities[a.id] > 0);
    return (
      <OrderConfirmationScreen
        articles={orderedArticles}
        quantities={props.quantities}
        supplierName={props.getCurrentSupplierName()}
        deliveryDate={props.deliveryDate}
        timeWindow={props.timeWindow}
        onQuantityChange={props.handleConfirmationQuantityChange}
        onRemoveItem={props.handleRemoveItem}
        onBack={() => props.setStatus('ready')}
        onConfirm={props.handleSubmit}
        isSubmitting={status === 'submitting'}
      />
    );
  }

  return null;
};
