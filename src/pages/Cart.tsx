import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';
import { useCreateCartDraft } from '@/hooks/useCartDrafts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Loader2, AlertTriangle, Save, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScanOrderListDialog } from '@/components/cart/ScanOrderListDialog';

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeLocation } = useLocationContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const createDraft = useCreateCartDraft();
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

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
    if (!acc[supplierName]) {
      acc[supplierName] = [];
    }
    acc[supplierName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const supplierTotals = Object.entries(itemsBySupplier).map(([name, supplierItems]) => {
    const supplier = supplierItems[0]?.article.suppliers;
    return {
      name,
      total: supplierItems.reduce((sum, item) => sum + Number(item.article.price) * item.quantity, 0),
      items: supplierItems,
      minimumOrderValue: supplier?.minimum_order_value ? Number(supplier.minimum_order_value) : 0,
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
        navigate('/drafts');
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('cart.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {items.length === 0 
                ? t('cart.empty')
                : t('cart.itemCount', { count: items.length })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScanDialogOpen(true)}>
              <Camera className="w-4 h-4 mr-2" />
              {t('scan.title')}
            </Button>
            {items.length > 0 && (
              <Button variant="outline" onClick={clearCart}>
                {t('common.delete')}
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-card border border-border rounded-xl">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t('cart.empty')}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 px-4">{t('cart.emptyDescription')}</p>
            <Button onClick={() => navigate('/suppliers?tab=articles')}>
              {t('cart.browseArticles')}
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile: Order Summary Sticky at top */}
            <div className="lg:hidden sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('cart.itemCount', { count: items.length })}</p>
                  <p className="text-xl font-bold text-foreground">€{getTotal().toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm"
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

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {supplierTotals.map(({ name, items: supplierItems, total, minimumOrderValue }) => (
                  <div key={name} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">{name}</h3>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                    {minimumOrderValue > 0 && total < minimumOrderValue && (
                      <Alert variant="destructive" className="m-3 sm:m-4 mb-0">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs sm:text-sm">
                          {t('cart.minimumOrderMessage', { supplier: name, amount: `€${minimumOrderValue.toFixed(2)}`, remaining: `€${(minimumOrderValue - total).toFixed(2)}` })}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="divide-y divide-border">
                      {supplierItems.map((item) => (
                        <div key={item.article.id} className="p-3 sm:p-4">
                          {/* Mobile: Stacked layout */}
                          <div className="flex items-start gap-3 sm:hidden">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm">{item.article.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                €{Number(item.article.price).toFixed(2)} / {item.article.unit}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                              onClick={() => removeItem(item.article.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-2 sm:hidden">
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                                onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.article.id, parseInt(e.target.value) || 1)}
                                className="w-14 text-center h-9"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9"
                                onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="font-semibold text-foreground">
                              €{(Number(item.article.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          
                          {/* Desktop: Horizontal layout */}
                          <div className="hidden sm:flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{item.article.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                €{Number(item.article.price).toFixed(2)} / {item.article.unit}
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
                            <div className="text-right min-w-[80px]">
                              <p className="font-semibold text-foreground">
                                €{(Number(item.article.price) * item.quantity).toFixed(2)}
                              </p>
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
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary - Desktop only */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">{t('checkout.orderSummary')}</h3>
                  <div className="space-y-3 mb-6">
                    {supplierTotals.map(({ name, total }) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="text-foreground">€{total.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold text-foreground">{t('common.total')}</span>
                      <span className="font-bold text-xl text-foreground">€{getTotal().toFixed(2)}</span>
                    </div>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('cart.saveAsDraft')}</DialogTitle>
              <DialogDescription>
                {t('drafts.emptyDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder={t('cart.draftName')}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveDraft()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSaveDraft}
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
      </div>
    </DashboardLayout>
  );
};

export default Cart;
