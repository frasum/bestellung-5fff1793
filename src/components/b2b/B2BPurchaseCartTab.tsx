import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, Plus, Minus, Send } from 'lucide-react';
import { getPurchaseCart, setPurchaseCart, B2BVendorArticle } from './B2BVendorArticlesTab';
import B2BPurchaseCheckoutDialog from './B2BPurchaseCheckoutDialog';
import type { B2BVendor } from './B2BVendorsTab';

interface CartItem extends B2BVendorArticle {
  quantity: number;
}

interface B2BPurchaseCartTabProps {
  accountId: string;
  onOrderPlaced: () => void;
}

const B2BPurchaseCartTab = ({ accountId, onOrderPlaced }: B2BPurchaseCartTabProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [vendors, setVendors] = useState<B2BVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutVendorId, setCheckoutVendorId] = useState<string | null>(null);

  useEffect(() => {
    loadCartData();
    
    const handleCartUpdate = () => loadCartData();
    window.addEventListener('b2b-cart-update', handleCartUpdate);
    return () => window.removeEventListener('b2b-cart-update', handleCartUpdate);
  }, [accountId]);

  const loadCartData = async () => {
    const cart = getPurchaseCart();
    const articleIds = Object.keys(cart);
    
    if (articleIds.length === 0) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      // Load vendors
      const { data: vendorsData } = await supabase
        .from('b2b_supplier_vendors')
        .select('*')
        .eq('supplier_account_id', accountId);
      
      setVendors(vendorsData || []);

      // Load articles
      const { data: articlesData, error } = await supabase
        .from('b2b_supplier_vendor_articles')
        .select('*')
        .in('id', articleIds);

      if (error) throw error;

      const vendorMap = new Map(vendorsData?.map(v => [v.id, v.name]) || []);
      const items: CartItem[] = (articlesData || []).map(article => ({
        ...article,
        vendor_name: vendorMap.get(article.vendor_id) || 'Unbekannt',
        quantity: cart[article.id] || 1,
      }));

      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Fehler beim Laden des Warenkorbs');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (articleId: string, delta: number) => {
    const cart = getPurchaseCart();
    const newQuantity = (cart[articleId] || 1) + delta;
    
    if (newQuantity <= 0) {
      delete cart[articleId];
    } else {
      cart[articleId] = newQuantity;
    }
    
    setPurchaseCart(cart);
    loadCartData();
  };

  const removeItem = (articleId: string) => {
    const cart = getPurchaseCart();
    delete cart[articleId];
    setPurchaseCart(cart);
    loadCartData();
  };

  const clearCart = () => {
    setPurchaseCart({});
    loadCartData();
  };

  // Group items by vendor
  const itemsByVendor = cartItems.reduce((acc, item) => {
    if (!acc[item.vendor_id]) {
      acc[item.vendor_id] = {
        vendor: vendors.find(v => v.id === item.vendor_id),
        items: [],
        total: 0,
      };
    }
    acc[item.vendor_id].items.push(item);
    acc[item.vendor_id].total += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { vendor: B2BVendor | undefined; items: CartItem[]; total: number }>);

  const grandTotal = Object.values(itemsByVendor).reduce((sum, group) => sum + group.total, 0);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Warenkorb ist leer</h3>
          <p className="text-muted-foreground">
            Fügen Sie Artikel aus dem Katalog hinzu
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Warenkorb ({cartItems.length} Artikel)
        </h3>
        <Button variant="outline" size="sm" onClick={clearCart}>
          <Trash2 className="h-4 w-4 mr-2" />
          Leeren
        </Button>
      </div>

      {Object.entries(itemsByVendor).map(([vendorId, group]) => (
        <Card key={vendorId}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">{group.vendor?.name || 'Unbekannter Lieferant'}</CardTitle>
                <CardDescription>{group.items.length} Artikel</CardDescription>
              </div>
              <Button onClick={() => setCheckoutVendorId(vendorId)}>
                <Send className="h-4 w-4 mr-2" />
                Bestellen
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    €{item.price.toFixed(2)} / {item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 0;
                        const cart = getPurchaseCart();
                        if (newQty <= 0) {
                          delete cart[item.id];
                        } else {
                          cart[item.id] = newQty;
                        }
                        setPurchaseCart(cart);
                        loadCartData();
                      }}
                      className="w-16 text-center h-8"
                      min={1}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="w-20 text-right font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-semibold">
              <span>Zwischensumme</span>
              <span>€{group.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Gesamtsumme</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      {checkoutVendorId && (
        <B2BPurchaseCheckoutDialog
          open={!!checkoutVendorId}
          onOpenChange={(open) => !open && setCheckoutVendorId(null)}
          accountId={accountId}
          vendorId={checkoutVendorId}
          vendor={vendors.find(v => v.id === checkoutVendorId)}
          items={itemsByVendor[checkoutVendorId]?.items || []}
          total={itemsByVendor[checkoutVendorId]?.total || 0}
          onSuccess={() => {
            // Remove ordered items from cart
            const cart = getPurchaseCart();
            itemsByVendor[checkoutVendorId]?.items.forEach(item => {
              delete cart[item.id];
            });
            setPurchaseCart(cart);
            setCheckoutVendorId(null);
            onOrderPlaced();
          }}
        />
      )}
    </div>
  );
};

export default B2BPurchaseCartTab;
