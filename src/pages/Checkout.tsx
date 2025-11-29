import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCreateOrder } from '@/hooks/useOrders';
import { useDeliveryAddresses } from '@/hooks/useSettings';
import { ArrowLeft, CalendarIcon, CheckCircle2, Clock, Eye, Loader2, Mail, MapPin, Send, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EmailPreviewDialog, EmailPreviewData } from '@/components/checkout/EmailPreviewDialog';

const TIME_WINDOWS = [
  { value: 'morning', label: '06:00 - 10:00 Uhr' },
  { value: 'late-morning', label: '10:00 - 12:00 Uhr' },
  { value: 'noon', label: '12:00 - 14:00 Uhr' },
  { value: 'afternoon', label: '14:00 - 17:00 Uhr' },
  { value: 'flexible', label: 'Flexibel' },
];

const checkoutSchema = z.object({
  deliveryAddressId: z.string().min(1, 'Bitte wählen Sie eine Lieferadresse'),
  deliveryDate: z.date({ required_error: 'Bitte wählen Sie ein Lieferdatum' }),
  deliveryTimeWindow: z.string({ required_error: 'Bitte wählen Sie ein Zeitfenster' }),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const { data: deliveryAddresses, isLoading: addressesLoading } = useDeliveryAddresses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviews, setEmailPreviews] = useState<EmailPreviewData[]>([]);
  const [pendingOrderData, setPendingOrderData] = useState<CheckoutFormData | null>(null);

  const defaultAddress = deliveryAddresses?.find(a => a.is_default);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryAddressId: '', notes: '', deliveryTimeWindow: '' },
  });

  // Set default address when loaded
  useEffect(() => {
    if (defaultAddress && !form.getValues('deliveryAddressId')) {
      form.setValue('deliveryAddressId', defaultAddress.id);
    }
  }, [defaultAddress, form]);

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
      toast.error('Bitte wählen Sie eine Lieferadresse');
      return;
    }

    const formattedAddress = `${selectedAddress.label}\n${formatAddress(selectedAddress)}`;

    try {
      // Fetch supplier emails
      const { supabase } = await import('@/integrations/supabase/client');
      const supplierIds = supplierOrders.map(s => s.supplierId);
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, email')
        .in('id', supplierIds);

      const supplierEmails = new Map(suppliers?.map(s => [s.id, s.email]) || []);

      // Fetch organization name
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name)')
        .eq('id', user!.id)
        .single();

      const restaurantName = (profile?.organizations as any)?.name || 'Restaurant';

      // Format delivery info for notes
      const deliveryDateStr = format(data.deliveryDate, 'dd.MM.yyyy', { locale: de });
      const timeWindowLabel = TIME_WINDOWS.find(t => t.value === data.deliveryTimeWindow)?.label || data.deliveryTimeWindow;
      const deliveryInfo = `Gewünschtes Lieferdatum: ${deliveryDateStr}\nZeitfenster: ${timeWindowLabel}`;
      const fullNotes = data.notes ? `${deliveryInfo}\n\n${data.notes}` : deliveryInfo;

      // Build email previews
      const previews: EmailPreviewData[] = supplierOrders.map(supplier => ({
        supplierName: supplier.supplierName,
        supplierEmail: supplierEmails.get(supplier.supplierId) || '',
        restaurantName,
        deliveryAddress: formattedAddress,
        items: supplier.items.map(item => ({
          article_name: item.article.name,
          quantity: item.quantity,
          unit: item.article.unit,
          unit_price: Number(item.article.price),
          total_price: Number(item.article.price) * item.quantity,
        })),
        totalAmount: supplier.total,
        notes: fullNotes,
      }));

      setEmailPreviews(previews);
      setPendingOrderData(data);
      setShowEmailPreview(true);
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Laden der Vorschau');
    }
  };

  const handleConfirmOrders = async () => {
    if (!pendingOrderData) return;
    
    setIsSubmitting(true);
    const supplierOrders = Object.values(itemsBySupplier);
    const orderNumbers: string[] = [];

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
        });
        orderNumbers.push(result.orderNumber);
      }

      setCompletedOrders(orderNumbers);
      clearCart();
      setShowEmailPreview(false);
      toast.success(`${orderNumbers.length} Bestellung(en) erfolgreich aufgegeben!`);
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen der Bestellungen');
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
          <h1 className="text-3xl font-bold text-foreground mb-4">Orders Placed Successfully!</h1>
          <p className="text-muted-foreground mb-6">
            Your orders have been sent to the suppliers. You will receive confirmation emails shortly.
          </p>
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-foreground mb-4">Order Numbers</h2>
            <div className="space-y-2">
              {completedOrders.map((orderNumber) => (
                <div key={orderNumber} className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="font-mono text-foreground">{orderNumber}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              View Orders
            </Button>
            <Button onClick={() => navigate('/articles')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/cart')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">
          Review your orders and provide delivery details
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {Object.values(itemsBySupplier).map(({ supplierId, supplierName, items: supplierItems, total }) => (
              <div key={supplierId} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{supplierName}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {supplierItems.length} item{supplierItems.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {supplierItems.map((item) => (
                    <div key={item.article.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.article.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.article.unit} × €{Number(item.article.price).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        €{(Number(item.article.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/30 px-6 py-3 flex justify-between">
                  <span className="font-medium text-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">€{total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Details</h2>
              <form onSubmit={form.handleSubmit(handlePreviewEmails)} className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Lieferadresse *
                  </Label>
                  {addressesLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Lade Adressen...
                    </div>
                  ) : deliveryAddresses && deliveryAddresses.length > 0 ? (
                    <Controller
                      control={form.control}
                      name="deliveryAddressId"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Adresse wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryAddresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                <span className="flex items-center gap-2">
                                  {address.label}
                                  {address.is_default && (
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                      Standard
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
                      <p className="mb-2">Keine Lieferadressen hinterlegt</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        In Einstellungen hinzufügen
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
                    Lieferdatum *
                  </Label>
                  <Controller
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: de }) : "Datum wählen"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
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
                    Zeitfenster *
                  </Label>
                  <Controller
                    control={form.control}
                    name="deliveryTimeWindow"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Zeitfenster wählen" />
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
                  <Label htmlFor="notes">Notizen (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="Besondere Anweisungen, Hinweise zur Lieferung, etc."
                    rows={3}
                  />
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Orders to place</span>
                    <span className="text-foreground">{Object.keys(itemsBySupplier).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-xl text-foreground">€{getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  <Eye className="w-4 h-4 mr-2" />
                  E-Mail Vorschau anzeigen
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Orders will be emailed to each supplier immediately
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

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
