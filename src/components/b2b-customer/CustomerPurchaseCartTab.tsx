import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, Plus, Minus, Trash2, Package } from 'lucide-react';

interface CartItem {
  articleId: string;
  vendorId: string;
  vendorName: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface CustomerPurchaseCartTabProps {
  customerId: string;
  onOrderPlaced?: () => void;
}

interface VendorArticle {
  id: string;
  name: string;
  price: number;
  unit: string;
  vendor_id: string;
}

const CART_STORAGE_KEY = 'b2b_customer_purchase_cart';

const CustomerPurchaseCartTab = ({ customerId, onOrderPlaced }: CustomerPurchaseCartTabProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [articles, setArticles] = useState<VendorArticle[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
    // Load cart from localStorage
    const savedCart = localStorage.getItem(`${CART_STORAGE_KEY}_${customerId}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [customerId]);

  useEffect(() => {
    // Save cart to localStorage
    localStorage.setItem(`${CART_STORAGE_KEY}_${customerId}`, JSON.stringify(cart));
  }, [cart, customerId]);

  const loadData = async () => {
    try {
      const [vendorsRes, articlesRes] = await Promise.all([
        supabase
          .from('b2b_customer_vendors')
          .select('id, name, email')
          .eq('customer_id', customerId)
          .eq('is_active', true),
        supabase
          .from('b2b_customer_vendor_articles')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (articlesRes.error) throw articlesRes.error;

      setVendors(vendorsRes.data || []);
      setArticles(articlesRes.data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error loading data:', message);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (article: VendorArticle) => {
    const vendor = vendors.find(v => v.id === article.vendor_id);
    if (!vendor) return;

    setCart(prev => {
      const existing = prev.find(item => item.articleId === article.id);
      if (existing) {
        return prev.map(item =>
          item.articleId === article.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          articleId: article.id,
          vendorId: article.vendor_id,
          vendorName: vendor.name,
          name: article.name,
          price: article.price,
          unit: article.unit,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (articleId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.articleId !== articleId) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (articleId: string) => {
    setCart(prev => prev.filter(item => item.articleId !== articleId));
  };

  const cartByVendor = useMemo(() => {
    return cart.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          vendorName: item.vendorName,
          items: [],
          total: 0,
        };
      }
      acc[item.vendorId].items.push(item);
      acc[item.vendorId].total += item.price * item.quantity;
      return acc;
    }, {} as Record<string, { vendorName: string; items: CartItem[]; total: number }>);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Object.values(cartByVendor).reduce((sum, v) => sum + v.total, 0);
  }, [cartByVendor]);

  const handleSubmitOrders = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);

    try {
      // Create one order per vendor
      for (const [vendorId, vendorCart] of Object.entries(cartByVendor)) {
        const vendor = vendors.find(v => v.id === vendorId);
        
        // Create order
        const { data: order, error: orderError } = await supabase
          .from('b2b_customer_purchase_orders')
          .insert({
            customer_id: customerId,
            vendor_id: vendorId,
            total_amount: vendorCart.total,
            delivery_date: deliveryDate || null,
            notes: notes || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = vendorCart.items.map(item => ({
          order_id: order.id,
          article_id: item.articleId,
          article_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('b2b_customer_purchase_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Send email if vendor has email
        if (vendor?.email) {
          await supabase.functions.invoke('send-b2b-customer-purchase-order', {
            body: {
              orderId: order.id,
              vendorEmail: vendor.email,
              vendorName: vendor.name,
            },
          });
        }
      }

      toast.success('Bestellungen erfolgreich aufgegeben!');
      setCart([]);
      setDeliveryDate('');
      setNotes('');
      onOrderPlaced?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error submitting orders:', message);
      toast.error('Fehler beim Absenden: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artikel hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Keine Artikel vorhanden. Fügen Sie zuerst Lieferanten und Artikel hinzu.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map(article => {
                const inCart = cart.find(item => item.articleId === article.id);
                return (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{article.name}</p>
                      <p className="text-sm text-muted-foreground">
                        €{article.price.toFixed(2)} / {article.unit}
                      </p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(article.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{inCart.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(article.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2"
                        onClick={() => addToCart(article)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart Summary */}
      {cart.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Warenkorb
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(cartByVendor).map(([vendorId, vendorCart]) => (
                <div key={vendorId} className="space-y-3">
                  <h4 className="font-semibold text-primary">{vendorCart.vendorName}</h4>
                  <div className="space-y-2">
                    {vendorCart.items.map(item => (
                      <div key={item.articleId} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × €{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            €{(item.quantity * item.price).toFixed(2)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.articleId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end text-sm">
                    <span className="text-muted-foreground">Zwischensumme:</span>
                    <span className="font-semibold ml-2">€{vendorCart.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold text-lg">Gesamtsumme</span>
                <span className="font-bold text-lg">€{grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lieferdetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Gewünschtes Lieferdatum</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionale Anmerkungen zur Bestellung..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitOrders}
            disabled={submitting}
            className="w-full h-14 text-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Package className="h-5 w-5 mr-2" />
                {Object.keys(cartByVendor).length} Bestellung{Object.keys(cartByVendor).length > 1 ? 'en' : ''} absenden
              </>
            )}
          </Button>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Warenkorb ist leer</h3>
            <p className="text-muted-foreground">
              Fügen Sie Artikel aus der Liste oben hinzu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerPurchaseCartTab;
