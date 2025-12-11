import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCreateOrder } from '@/hooks/useOrders';
import { useDeliveryAddresses } from '@/hooks/useSettings';
import { useUserDeliveryPreference } from '@/hooks/useUserDeliveryPreference';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, CalendarIcon, CheckCircle2, Clock, Eye, Loader2, Mail, MapPin, Minus, Plus, Send, Settings, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EmailPreviewDialog, EmailPreviewData } from '@/components/checkout/EmailPreviewDialog';

const Checkout = () => {
  const { t } = useTranslation();

  const TIME_WINDOWS = [
    { value: 'morning', label: '10:00 - 12:00' },
    { value: 'afternoon', label: '12:00 - 15:00' },
    { value: 'flexible', label: t('checkout.flexible') },
  ];

  const checkoutSchema = z.object({
    deliveryAddressId: z.string().min(1, t('validation.required')),
    deliveryDate: z.date({ required_error: t('validation.required') }),
    deliveryTimeWindow: z.string({ required_error: t('validation.required') }),
    notes: z.string().optional(),
  });

  type CheckoutFormData = z.infer<typeof checkoutSchema>;

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, getTotal, clearCart, updateQuantity, removeItem, draftDeliveryDate, draftTimeWindow } = useCart();
  const { activeLocation } = useLocationContext();
  const createOrder = useCreateOrder();
  const { data: deliveryAddresses, isLoading: addressesLoading } = useDeliveryAddresses(activeLocation?.id);
  const { data: userDeliveryPreference } = useUserDeliveryPreference();
  const isMobileDevice = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<{orderNumber: string; supplierName: string}[]>([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviews, setEmailPreviews] = useState<EmailPreviewData[]>([]);
  const [pendingOrderData, setPendingOrderData] = useState<CheckoutFormData | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);

  const defaultAddress = deliveryAddresses?.find(a => a.is_default);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryAddressId: '', notes: '', deliveryTimeWindow: '' },
  });

  // Set address priority: 1. User preference, 2. Location default, 3. First available
  useEffect(() => {
    if (deliveryAddresses && deliveryAddresses.length > 0) {
      const currentValue = form.getValues('deliveryAddressId');
      if (!currentValue || currentValue === '') {
        // Priority 1: User preference for this location
        if (userDeliveryPreference?.delivery_address_id) {
          const preferredAddr = deliveryAddresses.find(a => a.id === userDeliveryPreference.delivery_address_id);
          if (preferredAddr) {
            form.setValue('deliveryAddressId', preferredAddr.id);
            return;
          }
        }
        // Priority 2: Location default
        const defaultAddr = deliveryAddresses.find(a => a.is_default);
        if (defaultAddr) {
          form.setValue('deliveryAddressId', defaultAddr.id);
        } else if (deliveryAddresses[0]) {
          // Priority 3: First available
          form.setValue('deliveryAddressId', deliveryAddresses[0].id);
        }
      }
    }
  }, [deliveryAddresses, userDeliveryPreference, form]);

  // Pre-fill delivery date and time window from draft
  useEffect(() => {
    if (draftDeliveryDate) {
      form.setValue('deliveryDate', draftDeliveryDate);
    }
    if (draftTimeWindow) {
      form.setValue('deliveryTimeWindow', draftTimeWindow);
    }
  }, [draftDeliveryDate, draftTimeWindow, form]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (items.length === 0 && completedOrders.length === 0) {
      navigate('/cart');
    }
  }, [items, completedOrders, navigate]);

  // Group items by supplier
  const itemsBySupplier = items.reduce((acc, item) => {
    const supplierId = item.article.supplier_id;
    const supplierName = item.article.suppliers?.name || 'Unknown';
    if (!acc[supplierId]) {
      acc[supplierId] = {
        supplierId,
        supplierName,
        supplierEmail: '', // Will be fetched
        items: [],
        total: 0,
      };
    }
    acc[supplierId].items.push(item);
    acc[supplierId].total += Number(item.article.price) * item.quantity;
    return acc;
  }, {} as Record<string, { supplierId: string; supplierName: string; supplierEmail: string; items: typeof items; total: number }>);

  const formatAddress = (address: typeof deliveryAddresses[0]) => {
    const parts = [address.address_line1];
    if (address.address_line2) parts.push(address.address_line2);
    parts.push(`${address.postal_code} ${address.city}`);
    parts.push(address.country);
    return parts.join('\n');
  };

  const handlePreviewEmails = async (data: CheckoutFormData) => {
    const supplierOrders = Object.values(itemsBySupplier);

    // Get selected address
    const selectedAddress = deliveryAddresses?.find(a => a.id === data.deliveryAddressId);
    if (!selectedAddress) {
      toast.error(t('checkout.selectAddressError'));
      return;
    }

    const formattedAddress = `${selectedAddress.label}\n${formatAddress(selectedAddress)}`;

    try {
      // Fetch supplier emails and customer numbers (location-specific)
      const { supabase } = await import('@/integrations/supabase/client');
      const supplierIds = supplierOrders.map(s => s.supplierId);
      
      // First get suppliers
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, email, customer_number')
        .in('id', supplierIds);

      // Then get location-specific customer numbers if we have an active location
      let supplierLocationsMap = new Map<string, { customerNumber: string | null }>();
      if (activeLocation) {
        const { data: supplierLocations } = await supabase
          .from('supplier_locations')
          .select('supplier_id, customer_number')
          .eq('location_id', activeLocation.id)
          .in('supplier_id', supplierIds);
        
        supplierLocations?.forEach(sl => {
          supplierLocationsMap.set(sl.supplier_id, { customerNumber: sl.customer_number });
        });
      }

      // Build supplier data map - prefer location-specific customer number
      const supplierData = new Map(suppliers?.map(s => {
        const locationData = supplierLocationsMap.get(s.id);
        return [s.id, { 
          email: s.email, 
          customerNumber: locationData?.customerNumber || s.customer_number 
        }];
      }) || []);

      // Fetch organization info (name and test mode)
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name, test_mode_enabled)')
        .eq('id', user!.id)
        .single();

      const restaurantName = (profile?.organizations as any)?.name || 'Restaurant';
      const isTestMode = (profile?.organizations as any)?.test_mode_enabled || false;

      // Format delivery info for notes
      const deliveryDateStr = format(data.deliveryDate, 'dd.MM.yyyy', { locale: de });
      const timeWindowLabel = TIME_WINDOWS.find(t => t.value === data.deliveryTimeWindow)?.label || data.deliveryTimeWindow;
      const deliveryInfo = `Gewünschtes Lieferdatum: ${deliveryDateStr}\nZeitfenster: ${timeWindowLabel}`;
      const fullNotes = data.notes ? `${deliveryInfo}\n\n${data.notes}` : deliveryInfo;

      // Build email previews
      const previews: EmailPreviewData[] = supplierOrders.map(supplier => {
        const data = supplierData.get(supplier.supplierId);
        return {
          supplierName: supplier.supplierName,
          supplierEmail: data?.email || '',
          restaurantName,
          deliveryAddress: formattedAddress,
          items: supplier.items.map(item => ({
            article_name: item.article.name,
            quantity: item.quantity,
            unit: item.article.unit,
            unit_price: Number(item.article.price),
            total_price: Number(item.article.price) * item.quantity,
            sku: item.article.sku || undefined,
            packaging_unit: item.article.packaging_unit || undefined,
          })),
          totalAmount: supplier.total,
          notes: fullNotes,
          customerNumber: data?.customerNumber || undefined,
          isTestMode,
        };
      });

      setEmailPreviews(previews);
      setPendingOrderData(data);
      setShowEmailPreview(true);
    } catch (error: any) {
      toast.error(error.message || t('checkout.loadPreviewError'));
    }
  };

  const handleConfirmOrders = async () => {
    if (!pendingOrderData) return;
    
    setIsSubmitting(true);
    const supplierOrders = Object.values(itemsBySupplier);
    const orderNumbers: {orderNumber: string; supplierName: string}[] = [];

    try {
      for (const preview of emailPreviews) {
        const supplier = supplierOrders.find(s => s.supplierName === preview.supplierName);
        if (!supplier) continue;

        // Use edited data from preview
        const result = await createOrder.mutateAsync({
          supplierId: supplier.supplierId,
          supplierName: preview.supplierName,
          supplierEmail: preview.supplierEmail,
          items: supplier.items,
          deliveryAddress: preview.deliveryAddress,
          notes: preview.notes,
          restaurantName: preview.restaurantName,
          isTestOrder: preview.isTestMode || false,
          locationId: activeLocation?.id,
        });
        orderNumbers.push({ orderNumber: result.orderNumber, supplierName: preview.supplierName });
      }

      setCompletedOrders(orderNumbers);
      clearCart();
      setShowEmailPreview(false);
      toast.success(t('checkout.ordersSuccessful', { count: orderNumbers.length }));
    } catch (error: any) {
      toast.error(error.message || t('checkout.createOrderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success state
  if (completedOrders.length > 0) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">{t('checkout.confirmSend')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('orders.emailSent')}
          </p>
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-foreground mb-4">{t('orders.orderDetails')}</h2>
            <div className="space-y-2">
              {completedOrders.map((order) => {
                const displayNumber = order.orderNumber.replace(/^ORD/, order.supplierName);
                return (
                  <div key={order.orderNumber} className="flex items-center justify-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="font-mono text-foreground">{displayNumber}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/orders')} className="h-11 sm:h-10 w-full sm:w-auto">
              {t('nav.orders')}
            </Button>
            <Button onClick={() => navigate('/articles')} className="h-11 sm:h-10 w-full sm:w-auto">
              {t('orders.browseArticles')}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Reusable form content for both desktop and mobile
  const renderFormContent = (isMobile: boolean = false) => (
    <form onSubmit={form.handleSubmit(handlePreviewEmails)} className="space-y-4">
      <div className="space-y-2">
        <Label>
          <MapPin className="w-4 h-4 inline mr-1" />
          {t('checkout.selectAddress')} *
        </Label>
        {addressesLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : deliveryAddresses && deliveryAddresses.length > 0 ? (
          <Controller
            control={form.control}
            name="deliveryAddressId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={isMobile ? "h-11" : "h-10"}>
                  <SelectValue placeholder={t('checkout.selectAddress')} />
                </SelectTrigger>
                <SelectContent>
                  {deliveryAddresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      <span className="flex items-center gap-2">
                        {address.label}
                        {address.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {t('checkout.defaultBadge')}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        ) : (
          <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-4 text-center">
            <p className="mb-2">{t('settings.noAddresses')}</p>
            <Button variant="outline" onClick={() => navigate('/settings')} className="h-10 sm:h-9">
              <Settings className="w-4 h-4 mr-2" />
              {t('settings.addAddress')}
            </Button>
          </div>
        )}
        {form.formState.errors.deliveryAddressId && (
          <p className="text-sm text-destructive">
            {form.formState.errors.deliveryAddressId.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          {t('checkout.deliveryDate')} *
        </Label>
        <Controller
          control={form.control}
          name="deliveryDate"
          render={({ field }) => (
            <>
              {/* Mobile: Button only - Sheet rendered outside Drawer to avoid touch conflicts */}
              {isMobile && isMobileDevice ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !field.value && "text-muted-foreground"
                  )}
                  onClick={() => setShowMobileCalendar(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP", { locale: de }) : t('checkout.selectDate')}
                </Button>
              ) : (
                /* Desktop: Use Popover */
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP", { locale: de }) : t('checkout.selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
        />
        {form.formState.errors.deliveryDate && (
          <p className="text-sm text-destructive">
            {form.formState.errors.deliveryDate.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          <Clock className="w-4 h-4 inline mr-1" />
          {t('checkout.timeWindow')} *
        </Label>
        <Controller
          control={form.control}
          name="deliveryTimeWindow"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className={isMobile ? "h-11" : "h-10"}>
                <SelectValue placeholder={t('checkout.selectTimeWindow')} />
              </SelectTrigger>
              <SelectContent>
                {TIME_WINDOWS.map((tw) => (
                  <SelectItem key={tw.value} value={tw.value}>
                    {tw.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.deliveryTimeWindow && (
          <p className="text-sm text-destructive">
            {form.formState.errors.deliveryTimeWindow.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={isMobile ? "notes-mobile" : "notes"}>{t('checkout.addNotes')}</Label>
        <Textarea
          id={isMobile ? "notes-mobile" : "notes"}
          {...form.register('notes')}
          placeholder={t('checkout.addNotes')}
          rows={3}
          className="min-h-[100px] md:min-h-[120px] text-base"
        />
      </div>

      {!isMobile && (
        <>
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('checkout.orderSummary')}</span>
              <span className="text-foreground">{Object.keys(itemsBySupplier).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">{t('common.total')}</span>
              <span className="font-bold text-xl text-foreground">€{getTotal().toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full h-10" size="lg">
            <Eye className="w-4 h-4 mr-2" />
            {t('checkout.emailPreview')}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t('checkout.ordersEmailed')}
          </p>
        </>
      )}

      {isMobile && (
        <Button type="submit" className="w-full h-11" size="lg">
          <Eye className="w-5 h-5 mr-2" />
          {t('checkout.emailPreview')}
        </Button>
      )}
    </form>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-48 xl:pb-0">
        <Button variant="ghost" onClick={() => navigate('/cart')} className="mb-4 xl:mb-6 h-10 sm:h-9">
          <ArrowLeft className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('common.back')}</span>
        </Button>

        <h1 className="text-2xl xl:text-3xl font-bold text-foreground mb-1 xl:mb-2">{t('checkout.title')}</h1>
        <p className="text-sm xl:text-base text-muted-foreground mb-4 xl:mb-8">
          {t('checkout.reviewOrders')}
        </p>

        <div className="grid xl:grid-cols-3 gap-4 md:gap-5 xl:gap-6">
          {/* Order Summary */}
          <div className="xl:col-span-2 space-y-4 md:space-y-5 xl:space-y-6">
            {Object.values(itemsBySupplier).map(({ supplierId, supplierName, items: supplierItems, total }) => (
              <div key={supplierId} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-muted/50 px-4 md:px-5 xl:px-6 py-3 xl:py-4 border-b border-border flex items-center justify-between min-h-[52px]">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-semibold text-foreground text-sm xl:text-base truncate">{supplierName}</h3>
                  </div>
                  <div className="flex items-center gap-2 xl:gap-3 flex-shrink-0">
                    <span className="text-xs xl:text-sm text-muted-foreground">
                      {t('cart.itemCount', { count: supplierItems.length })}
                    </span>
                    <span className="font-bold text-foreground text-sm xl:text-base xl:hidden">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Mobile/Tablet Card Layout */}
                <div className="xl:hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:p-4">
                    {supplierItems.map((item) => (
                      <div key={item.article.id} className="p-4 md:p-4 md:border md:border-border md:rounded-lg border-b border-border last:border-b-0 md:last:border-b md:border-b">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-foreground text-sm md:text-base flex-1 pr-2">{item.article.name}</p>
                          <p className="font-semibold text-foreground text-sm md:text-base flex-shrink-0">
                            €{(Number(item.article.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3">
                          {item.article.sku && <span>SKU: {item.article.sku} • </span>}
                          {item.article.unit}
                          {item.article.packaging_unit && item.article.packaging_unit > 1 && (
                            <span className="text-primary font-medium"> ({item.article.packaging_unit}er)</span>
                          )}
                          {' '}× €{Number(item.article.price).toFixed(2)}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 md:h-12 md:w-12"
                              onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.article.id, parseInt(e.target.value) || 1)}
                              className="w-14 md:w-16 h-10 md:h-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 md:h-12 md:w-12"
                              onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-11 md:w-11 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.article.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Desktop: Original inline layout */}
                <div className="hidden xl:block divide-y divide-border">
                  {supplierItems.map((item) => (
                    <div key={item.article.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.article.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.article.sku && <span className="mr-2">SKU: {item.article.sku}</span>}
                          {item.article.unit}
                          {item.article.packaging_unit && item.article.packaging_unit > 1 && (
                            <span className="text-primary font-medium"> ({item.article.packaging_unit}er)</span>
                          )}
                          {' '}× €{Number(item.article.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.article.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.article.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <p className="font-semibold text-foreground w-20 text-right">
                          €{(Number(item.article.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted/30 px-4 xl:px-6 py-3 hidden xl:flex justify-between">
                  <span className="font-medium text-foreground">{t('cart.subtotal')}</span>
                  <span className="font-bold text-foreground">€{total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form - Desktop only */}
          <div className="hidden xl:block xl:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('checkout.selectAddress')}</h2>
              {renderFormContent(false)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Sticky Footer */}
      <div className="fixed bottom-16 md:bottom-20 left-0 right-0 bg-card border-t border-border p-4 xl:hidden z-40 safe-area-bottom shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {t('checkout.orderSummary')}
            </p>
            <p className="text-xl font-bold text-foreground">€{getTotal().toFixed(2)}</p>
          </div>
          <Button onClick={() => setShowMobileForm(true)} className="h-11 px-6 touch-manipulation">
            {t('checkout.selectAddress')}
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </div>

      {/* Mobile Form Drawer */}
      <Drawer open={showMobileForm} onOpenChange={setShowMobileForm}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('checkout.selectAddress')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {renderFormContent(true)}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Calendar Sheet - rendered at root level to avoid Drawer touch conflicts on iOS */}
      {isMobileDevice && (
        <Sheet open={showMobileCalendar} onOpenChange={setShowMobileCalendar}>
          <SheetContent side="bottom" className="h-auto max-h-[85vh] z-[100]">
            <SheetHeader className="pb-4">
              <SheetTitle>{t('checkout.deliveryDate')}</SheetTitle>
            </SheetHeader>
            <div className="flex justify-center pb-6">
              <Calendar
                mode="single"
                selected={form.watch('deliveryDate')}
                onSelect={(date) => {
                  form.setValue('deliveryDate', date);
                  setShowMobileCalendar(false);
                }}
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <EmailPreviewDialog
        open={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        emailPreviews={emailPreviews}
        onEmailPreviewsChange={setEmailPreviews}
        onConfirm={handleConfirmOrders}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
};

export default Checkout;