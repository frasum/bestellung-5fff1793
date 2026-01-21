import { useParams } from 'react-router-dom';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { useEmployeeOrderNotifications } from '@/hooks/useEmployeeOrderNotifications';
import { 
  useSimpleOrderState, 
  useSimpleOrderHandlers,
  SimpleOrderStatusViews,
  SimpleOrderMainView,
} from '@/components/simple-order';

const SimpleOrder = () => {
  useForceLightTheme();
  const { token } = useParams<{ token: string }>();
  
  // State management
  const state = useSimpleOrderState({ token });
  
  // Handlers
  const handlers = useSimpleOrderHandlers({
    token,
    tokenData: state.tokenData,
    allArticles: state.allArticles,
    quantities: state.quantities,
    setQuantities: state.setQuantities,
    freeItems: state.freeItems,
    setFreeItems: state.setFreeItems,
    employeeName: state.employeeName,
    selectedLocationId: state.selectedLocationId,
    deliveryDate: state.deliveryDate,
    timeWindow: state.timeWindow,
    isEmployeeNameLocked: state.isEmployeeNameLocked,
    setEmployeeName: state.setEmployeeName,
    setValidationErrors: state.setValidationErrors,
    status: state.status,
    setStatus: state.setStatus,
    setError: state.setError,
    setIsAutoApproved: state.setIsAutoApproved,
    setOrderNumber: state.setOrderNumber,
    hasEmployee: state.hasEmployee,
    setArticles: state.setArticles,
    setSelectedSupplierId: state.setSelectedSupplierId,
    setSearch: state.setSearch,
    favoriteIds: state.favoriteIds,
    setFavoriteIds: state.setFavoriteIds,
    drafts: state.drafts,
    setDrafts: state.setDrafts,
    setCompletedOrders: state.setCompletedOrders,
    setIsLoadingDrafts: state.setIsLoadingDrafts,
    setIsDeletingDraft: state.setIsDeletingDraft,
    editingDraft: state.editingDraft,
    setEditingDraft: state.setEditingDraft,
    setIsSavingDraft: state.setIsSavingDraft,
    setPinVerified: state.setPinVerified,
    getTotalItems: state.getTotalItems,
  });

  // Subscribe to order notifications
  useEmployeeOrderNotifications({
    employeeId: state.tokenData?.employee_id || null,
    enabled: !!state.tokenData?.employee_id,
  });

  // Handle status-based views (loading, error, success, etc.)
  const statusView = SimpleOrderStatusViews({
    status: state.status,
    error: state.error,
    token,
    tokenData: state.tokenData,
    employeeName: state.employeeName,
    isEmployeeNameLocked: state.isEmployeeNameLocked,
    locations: state.locations,
    selectedLocationId: state.selectedLocationId,
    setSelectedLocationId: state.setSelectedLocationId,
    isLocationLocked: state.isLocationLocked,
    deliveryDate: state.deliveryDate,
    setDeliveryDate: state.setDeliveryDate,
    timeWindow: state.timeWindow,
    setTimeWindow: state.setTimeWindow,
    isAutoApproved: state.isAutoApproved,
    orderNumber: state.orderNumber,
    hasEmployee: state.hasEmployee,
    drafts: state.drafts,
    completedOrders: state.completedOrders,
    isLoadingDrafts: state.isLoadingDrafts,
    isDeletingDraft: state.isDeletingDraft,
    editingDraft: state.editingDraft,
    isSavingDraft: state.isSavingDraft,
    articles: state.articles,
    favoriteIds: state.favoriteIds,
    articlesWithoutPhotos: state.articlesWithoutPhotos,
    suppliers: state.suppliers,
    categories: state.categories,
    allArticles: state.allArticles,
    quantities: state.quantities,
    freeItems: state.freeItems,
    handlePinVerify: handlers.handlePinVerify,
    handlePinSuccess: handlers.handlePinSuccess,
    handleLocationDateContinue: handlers.handleLocationDateContinue,
    handleNewOrder: handlers.handleNewOrder,
    handleViewOrders: handlers.handleViewOrders,
    handleEditDraft: handlers.handleEditDraft,
    handleDeleteDraft: handlers.handleDeleteDraft,
    handleSaveDraft: handlers.handleSaveDraft,
    toggleFavorite: handlers.toggleFavorite,
    setArticlesWithoutPhotos: state.setArticlesWithoutPhotos,
    setStatus: state.setStatus,
    setQuantities: state.setQuantities,
    handleConfirmationQuantityChange: handlers.handleConfirmationQuantityChange,
    handleRemoveItem: handlers.handleRemoveItem,
    handleSubmit: handlers.handleSubmit,
    handleAddFreeItem: handlers.handleAddFreeItem,
    handleUpdateFreeItem: handlers.handleUpdateFreeItem,
    handleDeleteFreeItem: handlers.handleDeleteFreeItem,
    handleFreeItemQuantityChange: handlers.handleFreeItemQuantityChange,
    getCurrentSupplierName: state.getCurrentSupplierName,
    getSelectedLocationName: state.getSelectedLocationName,
    selectedSupplierId: state.selectedSupplierId,
  });

  // If a status view was returned, render it
  if (statusView) {
    return statusView;
  }

  // Main order view
  return (
    <SimpleOrderMainView
      tokenData={state.tokenData}
      token={token}
      suppliers={state.suppliers}
      selectedSupplierId={state.selectedSupplierId}
      articles={state.articles}
      allArticles={state.allArticles}
      employeeName={state.employeeName}
      setEmployeeName={state.setEmployeeName}
      isEmployeeNameLocked={state.isEmployeeNameLocked}
      locations={state.locations}
      selectedLocationId={state.selectedLocationId}
      setSelectedLocationId={state.setSelectedLocationId}
      isLocationLocked={state.isLocationLocked}
      validationErrors={state.validationErrors}
      setValidationErrors={state.setValidationErrors}
      deliveryDate={state.deliveryDate}
      timeWindow={state.timeWindow}
      quantities={state.quantities}
      search={state.search}
      setSearch={state.setSearch}
      favoriteIds={state.favoriteIds}
      freeItems={state.freeItems}
      articlesWithoutPhotos={state.articlesWithoutPhotos}
      getTotalItems={state.getTotalItems}
      getSupplierArticleCount={state.getSupplierArticleCount}
      getSupplierCartCount={state.getSupplierCartCount}
      getCurrentSupplierName={state.getCurrentSupplierName}
      handleSupplierSelect={handlers.handleSupplierSelect}
      handleQuantityChange={handlers.handleQuantityChange}
      toggleFavorite={handlers.toggleFavorite}
      handleAddFreeItem={handlers.handleAddFreeItem}
      handleUpdateFreeItem={handlers.handleUpdateFreeItem}
      handleDeleteFreeItem={handlers.handleDeleteFreeItem}
      handleFreeItemQuantityChange={handlers.handleFreeItemQuantityChange}
      handleSubmitClick={handlers.handleSubmitClick}
      handleViewCartFromSupplierSelection={handlers.handleViewCartFromSupplierSelection}
      fetchDrafts={handlers.fetchDrafts}
      setStatus={state.setStatus}
    />
  );
};

export default SimpleOrder;
