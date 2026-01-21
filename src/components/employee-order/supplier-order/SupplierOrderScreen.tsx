import { Loader2 } from 'lucide-react';
import { SupplierOrderScreenProps, Supplier, Article } from './types';
import { useSupplierOrderState } from './useSupplierOrderState';
import { OrderHeader } from './OrderHeader';
import { ArticlesList } from './ArticlesList';
import { MobileCartButton } from './MobileCartButton';

export function SupplierOrderScreen({
  session,
  selectedLocation,
  cart,
  onAddToCart,
  onUpdateCartItem,
  onBack,
  onOrderSubmitted,
  onLogout,
}: SupplierOrderScreenProps) {
  const state = useSupplierOrderState(session, selectedLocation, cart, onOrderSubmitted);

  const handleAddArticle = (article: Article) => {
    const supplier = state.suppliers.find((s: Supplier) => s.id === article.supplier_id);
    onAddToCart({
      articleId: article.id,
      articleName: article.name,
      quantity: 1,
      unit: article.unit,
      orderUnit: article.order_unit_name,
      supplierId: article.supplier_id,
      supplierName: supplier?.name || '',
      price: article.price,
    });
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OrderHeader
        session={session}
        selectedLocation={selectedLocation}
        cart={cart}
        cartBySupplier={state.cartBySupplier}
        cartItemCount={state.cartItemCount}
        deliveryDate={state.deliveryDate}
        setDeliveryDate={state.setDeliveryDate}
        timeWindow={state.timeWindow}
        setTimeWindow={state.setTimeWindow}
        calendarOpen={state.calendarOpen}
        setCalendarOpen={state.setCalendarOpen}
        isSubmitting={state.isSubmitting}
        showOrderHistory={state.showOrderHistory}
        setShowOrderHistory={state.setShowOrderHistory}
        employeeOrders={state.employeeOrders}
        isLoadingOrders={state.isLoadingOrders}
        expandedOrders={state.expandedOrders}
        onUpdateCartItem={onUpdateCartItem}
        onSubmitOrder={state.handleSubmitOrder}
        loadEmployeeOrders={state.loadEmployeeOrders}
        toggleOrderExpanded={state.toggleOrderExpanded}
        onBack={onBack}
        onLogout={onLogout}
      />

      <ArticlesList
        suppliers={state.suppliers}
        articles={state.articles}
        articlesBySupplier={state.articlesBySupplier}
        selectedSupplier={state.selectedSupplier}
        setSelectedSupplier={state.setSelectedSupplier}
        searchQuery={state.searchQuery}
        setSearchQuery={state.setSearchQuery}
        getCartQuantity={state.getCartQuantity}
        onAddArticle={handleAddArticle}
        onUpdateCartItem={onUpdateCartItem}
      />

      <MobileCartButton
        cart={cart}
        cartBySupplier={state.cartBySupplier}
        cartItemCount={state.cartItemCount}
        deliveryDate={state.deliveryDate}
        setDeliveryDate={state.setDeliveryDate}
        timeWindow={state.timeWindow}
        setTimeWindow={state.setTimeWindow}
        mobileCalendarOpen={state.mobileCalendarOpen}
        setMobileCalendarOpen={state.setMobileCalendarOpen}
        isSubmitting={state.isSubmitting}
        onUpdateCartItem={onUpdateCartItem}
        onSubmitOrder={state.handleSubmitOrder}
      />
    </div>
  );
}
