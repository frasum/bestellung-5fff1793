import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOrder } from '@/hooks/useOrders';
import { ArrowLeft, CheckCircle2, Loader2, Mail, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(10, 'Please enter a complete delivery address'),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryAddress: '', notes: '' },
  });

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

  const handleSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    const supplierOrders = Object.values(itemsBySupplier);
    const orderNumbers: string[] = [];

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

      // Create orders for each supplier
      for (const supplier of supplierOrders) {
        const result = await createOrder.mutateAsync({
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          supplierEmail: supplierEmails.get(supplier.supplierId) || '',
          items: supplier.items,
          deliveryAddress: data.deliveryAddress,
          notes: data.notes,
          restaurantName,
        });
        orderNumbers.push(result.orderNumber);
      }

      setCompletedOrders(orderNumbers);
      clearCart();
      toast.success(`${orderNumbers.length} order(s) placed successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create orders');
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
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Delivery Address *
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    {...form.register('deliveryAddress')}
                    placeholder="Restaurant Name&#10;Street Address&#10;City, Postal Code"
                    rows={4}
                  />
                  {form.formState.errors.deliveryAddress && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.deliveryAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="Special instructions, delivery time preferences, etc."
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

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing Orders...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Place {Object.keys(itemsBySupplier).length} Order{Object.keys(itemsBySupplier).length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Orders will be emailed to each supplier immediately
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Checkout;
