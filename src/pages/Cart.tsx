import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCart, FreeCartItem } from '@/contexts/CartContext';
import { useCreateCartDraft } from '@/hooks/useCartDrafts';
import { useSupplierLocations } from '@/hooks/useSupplierLocations';
import { useOrderUnits } from '@/hooks/useOrderUnits';
import { DashboardLayout, useSidebarContext } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Loader2, AlertTriangle, Save, Camera, PlusCircle, CalendarIcon, Clock, DatabaseZap } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScanOrderListDialog } from '@/components/cart/ScanOrderListDialog';
import { AddArticleSheet } from '@/components/cart/AddArticleSheet';
import { ConvertToCatalogDialog } from '@/components/simple-order/ConvertToCatalogDialog';
import { Article } from '@/hooks/useArticles';

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeLocation } = useLocationContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, freeItems, removeItem, updateQuantity, removeFreeItem, updateFreeItemQuantity, addItem, getTotal, clearCart, draftDeliveryDate, draftTimeWindow } = useCart();
  const createDraft = useCreateCartDraft();
  const { data: supplierLocations } = useSupplierLocations();
  const { data: orderUnits } = useOrderUnits();
  
  // Helper to format order unit with fallback to base unit
  const formatOrderUnit = (orderUnitId: string | null | undefined, fallbackUnit: string) => {
    if (!orderUnitId || !orderUnits) return fallbackUnit;
    const unit = orderUnits.find(u => u.id === orderUnitId);
    return unit?.name || fallbackUnit;
  };
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [addArticleSheet, setAddArticleSheet] = useState<{ open: boolean; supplierId: string; supplierName: string }>({
    open: false,
    supplierId: '',
    supplierName: '',
  });
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingFreeItem, setConvertingFreeItem] = useState<{ item: FreeCartItem; supplierName: string } | null>(null);

  const handleConvertToCatalog = (freeItem: FreeCartItem, supplierName: string) => {
    setConvertingFreeItem({ item: freeItem, supplierName });
    setConvertDialogOpen(true);
  };

  const handleConvertSuccess = (article: Article) => {
    if (convertingFreeItem) {
      // Remove the free item and add the new article to the cart with same quantity
      const quantity = convertingFreeItem.item.quantity;
      removeFreeItem(convertingFreeItem.item.id);
      addItem(article, quantity);
      setConvertingFreeItem(null);
    }
  };

  // Helper to get locale for date formatting
  const getDateLocale = () => {
    const lang = localStorage.getItem('i18nextLng') || 'de';
    switch (lang) {
      case 'en': return enUS;
      case 'fr': return fr;
      case 'it': return it;
      case 'th': return th;
      case 'vi': return vi;
      default: return de;
    }
  };

  // Helper to format time window
  const formatTimeWindow = (value: string) => {
    switch (value) {
      case 'morning': return '10:00 - 12:00';
      case 'afternoon': return '12:00 - 15:00';
      case 'flexible': return t('checkout.flexible');
      default: return value;
    }
  };

  // Helper to get location-specific minimum order value with fallback to supplier default
  const getMinimumOrderValue = useCallback((supplierId: string, supplierDefault: number | null): number => {
    if (activeLocation && supplierLocations) {
      const locationSpecific = supplierLocations.find(
        sl => sl.supplier_id === supplierId && sl.location_id === activeLocation.id
      );
      if (locationSpecific?.minimum_order_value !== null && locationSpecific?.minimum_order_value !== undefined) {
        return Number(locationSpecific.minimum_order_value);
      }
    }
    // Fallback to supplier default
    return supplierDefault ? Number(supplierDefault) : 0;
  }, [activeLocation, supplierLocations]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group items by supplier
  const itemsBySupplier = items.reduce((acc, item) => {
    const supplierName = item.article.suppliers?.name || 'Unbekannter Lieferant';
    const supplierId = item.article.supplier_id;
    if (!acc[supplierId]) {
      acc[supplierId] = { name: supplierName, items: [] };
    }
    acc[supplierId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: typeof items }>);

  // Group free items by supplier
  const freeItemsBySupplier = freeItems.reduce((acc, item) => {
    if (!acc[item.supplier_id]) {
      acc[item.supplier_id] = [];
    }
    acc[item.supplier_id].push(item);
    return acc;
  }, {} as Record<string, typeof freeItems>);

  // Combine supplier IDs from both regular and free items
  const allSupplierIds = [...new Set([...Object.keys(itemsBySupplier), ...Object.keys(freeItemsBySupplier)])];

  const supplierTotals = allSupplierIds.map((supplierId) => {
    const regularData = itemsBySupplier[supplierId];
    const freeItemsForSupplier = freeItemsBySupplier[supplierId] || [];
    const supplierItems = regularData?.items || [];
    const supplier = supplierItems[0]?.article.suppliers;
    const name = regularData?.name || 'Unbekannter Lieferant';
    return {
      supplierId,
      name,
      total: supplierItems.reduce((sum, item) => sum + Number(item.article.price) * item.quantity, 0),
      items: supplierItems,
      freeItems: freeItemsForSupplier,
      minimumOrderValue: getMinimumOrderValue(supplierId, supplier?.minimum_order_value || null),
    };
  });

  const hasMinimumOrderWarning = supplierTotals.some(
    ({ total, minimumOrderValue }) => minimumOrderValue > 0 && total < minimumOrderValue
  );

  const handleSaveDraft = () => {
    if (!draftName.trim()) return;
    
    createDraft.mutate({
      name: draftName.trim(),
      items: items.map(item => ({
        articleId: item.article.id,
        quantity: item.quantity,
      })),
      locationId: activeLocation?.id,
    }, {
      onSuccess: () => {
        setSaveDialogOpen(false);
        setDraftName('');
        clearCart();
        navigate('/orders?tab=drafts');
      },
    });
  };

  const { sidebarCollapsed, toggleSidebar } = useSidebarContext();
  
  return (
    <DashboardLayout>
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        {/* Header with Breadcrumb */}
        <PageHeader 
          title={t('cart.title')}
          description={(items.length + freeItems.length) === 0 
            ? t('cart.empty')
            : t('cart.itemCount', { count: items.length + freeItems.length })}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        >
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setScanDialogOpen(true)} className="h-9">
              <Camera className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('scan.title')}</span>
            </Button>
            {items.length > 0 && (
              <Button variant="ghost" onClick={clearCart} className="h-9">
                <span className="hidden sm:inline">{t('common.delete')}</span>
                <Trash2 className="w-4 h-4 sm:hidden" />
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Draft delivery info from EasyOrder */}
        {(draftDeliveryDate || draftTimeWindow) && (
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex flex-wrap gap-x-4 gap-y-1 text-blue-700 dark:text-blue-300">
              {draftDeliveryDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {format(draftDeliveryDate, 'EEEE, dd. MMMM yyyy', { locale: getDateLocale() })}
                </span>
              )}
              {draftTimeWindow && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeWindow(draftTimeWindow)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {(items.length + freeItems.length) === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-card border border-border rounded-md">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t('cart.empty')}</h2>
            <p className="text-sm text-muted-foreground mb-6 px-4">{t('cart.emptyDescription')}</p>
            <Button onClick={() => navigate('/suppliers?tab=articles')}>
              {t('cart.browseArticles')}
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet: Order Summary Sticky at top */}
            <div className="xl:hidden sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('cart.itemCount', { count: items.length + freeItems.length })}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="md:h-11 md:px-4"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <Save className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">{t('cart.saveAsDraft')}</span>
                  </Button>
                  <Button 
                    size="sm"
                    className="md:h-11 md:px-4"
                    onClick={() => navigate('/checkout')}
                    disabled={hasMinimumOrderWarning}
                  >
                    {t('cart.checkout')}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
              {hasMinimumOrderWarning && (
                <p className="text-xs text-destructive mt-2">
                  {t('cart.minimumOrderWarning')}
                </p>
              )}
            </div>

            <div className="grid xl:grid-cols-3 gap-4 md:gap-5 xl:gap-6">
              {/* Cart Items */}
              <div className="xl:col-span-2 space-y-4 md:space-y-5 xl:space-y-6">
                {supplierTotals.map(({ supplierId, name, items: supplierItems, freeItems: supplierFreeItems, total, minimumOrderValue }) => (
                  <div key={supplierId} className="bg-card border border-border rounded-md overflow-hidden">
                    <div className="bg-muted/30 px-4 md:px-5 xl:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{name}</h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 md:h-8 shrink-0"
                        onClick={() => setAddArticleSheet({
                          open: true,
                          supplierId: supplierId,
                          supplierName: name,
                        })}
                      >
                        <PlusCircle className="w-4 h-4 md:mr-1.5" />
                        <span className="hidden md:inline">{t('cart.addArticle')}</span>
                      </Button>
                    </div>
                    {minimumOrderValue > 0 && total < minimumOrderValue && (
                      <Alert variant="destructive" className="m-3 md:m-4 mb-0">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs md:text-sm">
                          {t('cart.minimumOrderMessage', { supplier: name, amount: `€${minimumOrderValue.toFixed(2)}`, remaining: `€${(minimumOrderValue - total).toFixed(2)}` })}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Free Items Section */}
                    {supplierFreeItems.length > 0 && (
                      <div className="border-b border-dashed border-border">
                        {supplierFreeItems.map((freeItem) => (
                          <div key={freeItem.id} className="p-3 md:p-4 border-b border-border last:border-b-0 bg-amber-50/50 dark:bg-amber-950/20">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground text-sm md:text-base">{freeItem.name}</h4>
                                  <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">Frei</span>
                                </div>
                                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                  {freeItem.unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 md:h-10 md:w-10 text-primary hover:text-primary hover:bg-primary/10"
                                      onClick={() => handleConvertToCatalog(freeItem, name)}
                                    >
                                      <DatabaseZap className="w-4 h-4 md:w-5 md:h-5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>In Katalog übernehmen</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:text-destructive shrink-0"
                                  onClick={() => removeFreeItem(freeItem.id)}
                                >
                                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 md:h-11 md:w-11"
                                  onClick={() => updateFreeItemQuantity(freeItem.id, freeItem.quantity - 1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={freeItem.quantity}
                                  onChange={(e) => updateFreeItemQuantity(freeItem.id, parseInt(e.target.value) || 1)}
                                  onFocus={(e) => e.target.select()}
                                  className="w-14 md:w-16 text-center h-9 md:h-11"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 md:h-11 md:w-11"
                                  onClick={() => updateFreeItemQuantity(freeItem.id, freeItem.quantity + 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground italic">kein Preis</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Mobile/Tablet Card Layout */}
                    <div className="xl:hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:p-4">
                        {supplierItems.map((item) => (
                          <div key={item.article.id} className="p-3 md:p-4 md:border md:border-border md:rounded-lg border-b border-border last:border-b-0 md:last:border-b md:border-b">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground text-sm md:text-base">{item.article.name}</h4>
                                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                  {formatOrderUnit(item.article.order_unit_id, item.article.unit)}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:text-destructive shrink-0"
                                onClick={() => removeItem(item.article.id)}
                              >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 md:h-11 md:w-11"
                                  onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.article.id, parseInt(e.target.value) || 1)}
                                  onFocus={(e) => e.target.select()}
                                  className="w-14 md:w-16 text-center h-9 md:h-11"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 md:h-11 md:w-11"
                                  onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Desktop: Horizontal layout */}
                    <div className="hidden xl:block divide-y divide-border">
                      {supplierItems.map((item) => (
                        <div key={item.article.id} className="p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{item.article.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatOrderUnit(item.article.order_unit_id, item.article.unit)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.article.id, parseInt(e.target.value) || 1)}
                              onFocus={(e) => e.target.select()}
                              className="w-16 text-center h-8"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.article.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary - Desktop only */}
              <div className="hidden xl:block xl:col-span-1">
                <div className="bg-card border border-border rounded-md p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('checkout.orderSummary')}</h3>
                  <div className="space-y-3 mb-6">
                    {supplierTotals.map(({ supplierId, name }) => (
                      <div key={supplierId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{name}</span>
                      </div>
                    ))}
                  </div>
                  {hasMinimumOrderWarning && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {t('cart.cannotCheckout')}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={() => navigate('/checkout')}
                      disabled={hasMinimumOrderWarning}
                    >
                      {t('cart.checkout')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={() => setSaveDialogOpen(true)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t('cart.saveAsDraft')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save as Draft Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('cart.saveAsDraft')}</DialogTitle>
              <DialogDescription>
                {t('drafts.emptyDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 sm:py-4">
              <Input
                placeholder={t('cart.draftName')}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveDraft()}
                className="h-11 sm:h-9"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="w-full sm:w-auto h-10 sm:h-9">
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSaveDraft}
                className="w-full sm:w-auto h-10 sm:h-9"
                disabled={!draftName.trim() || createDraft.isPending}
              >
                {createDraft.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scan Order List Dialog */}
        <ScanOrderListDialog 
          open={scanDialogOpen} 
          onOpenChange={setScanDialogOpen} 
        />

        {/* Add Article Sheet */}
        <AddArticleSheet
          open={addArticleSheet.open}
          onOpenChange={(open) => setAddArticleSheet(prev => ({ ...prev, open }))}
          supplierId={addArticleSheet.supplierId}
          supplierName={addArticleSheet.supplierName}
        />

        {/* Convert to Catalog Dialog */}
        <ConvertToCatalogDialog
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          freeItem={convertingFreeItem?.item || null}
          supplierName={convertingFreeItem?.supplierName || ''}
          onSuccess={handleConvertSuccess}
        />
      </div>
    </DashboardLayout>
  );
};

export default Cart;