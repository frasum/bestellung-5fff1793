import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, ShoppingCart, Plus, Minus, Trash2, CalendarIcon, Send, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface B2BMobilePurchaseTabProps {
  accountId: string;
  supplierId: string | null;
}

interface Vendor {
  id: string;
  name: string;
  email: string | null;
}

interface Article {
  id: string;
  name: string;
  price: number | null;
  unit: string | null;
  category: string | null;
  vendor_id: string;
}

interface CartItem {
  article: Article;
  quantity: number;
}

const B2BMobilePurchaseTab = ({ accountId, supplierId }: B2BMobilePurchaseTabProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [accountId, supplierId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load vendors
      let vendorQuery = supabase
        .from('b2b_supplier_vendors')
        .select('id, name, email')
        .eq('supplier_account_id', accountId)
        .eq('is_active', true)
        .order('name');

      if (supplierId) {
        vendorQuery = vendorQuery.eq('supplier_id', supplierId);
      }

      const { data: vendorData, error: vendorError } = await vendorQuery;
      if (vendorError) throw vendorError;
      setVendors(vendorData || []);

      // Load articles
      const { data: articleData, error: articleError } = await supabase
        .from('b2b_supplier_vendor_articles')
        .select('id, name, price, unit, category, vendor_id')
        .eq('supplier_account_id', accountId)
        .eq('is_active', true)
        .order('name');

      if (articleError) throw articleError;
      setArticles(articleData || []);

      // Select first vendor if available
      if (vendorData && vendorData.length > 0 && !selectedVendor) {
        setSelectedVendor(vendorData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesVendor = !selectedVendor || article.vendor_id === selectedVendor;
      const matchesSearch = !searchTerm || 
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.category && article.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesVendor && matchesSearch;
    });
  }, [articles, selectedVendor, searchTerm]);

  const addToCart = (article: Article) => {
    setCart(prev => {
      const existing = prev.find(item => item.article.id === article.id);
      if (existing) {
        return prev.map(item =>
          item.article.id === article.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { article, quantity: 1 }];
    });
    toast({
      title: 'Hinzugefügt',
      description: `${article.name} wurde zum Warenkorb hinzugefügt`,
    });
  };

  const updateQuantity = (articleId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.article.id === articleId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (articleId: string) => {
    setCart(prev => prev.filter(item => item.article.id !== articleId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.article.price || 0) * item.quantity, 0);
  }, [cart]);
  // Note: B2B vendor articles don't have packaging_unit field

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || 'Unbekannt';
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Warenkorb leer',
        description: 'Bitte fügen Sie Artikel zum Warenkorb hinzu',
        variant: 'destructive',
      });
      return;
    }

    // Group cart items by vendor
    const itemsByVendor = cart.reduce((acc, item) => {
      const vendorId = item.article.vendor_id;
      if (!acc[vendorId]) {
        acc[vendorId] = [];
      }
      acc[vendorId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    setSubmitting(true);
    try {
      // Create orders for each vendor
      for (const [vendorId, items] of Object.entries(itemsByVendor)) {
        const totalAmount = items.reduce(
          (sum, item) => sum + (item.article.price || 0) * item.quantity,
          0
        );

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('b2b_supplier_purchase_orders')
          .insert({
            supplier_account_id: accountId,
            vendor_id: vendorId,
            total_amount: totalAmount,
            delivery_date: deliveryDate ? format(deliveryDate, 'yyyy-MM-dd') : null,
            notes: notes || null,
            status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          article_id: item.article.id,
          article_name: item.article.name,
          quantity: item.quantity,
          unit: item.article.unit || 'Stk',
          unit_price: item.article.price || 0,
          total_price: (item.article.price || 0) * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('b2b_supplier_purchase_order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: 'Bestellung gesendet',
        description: `${Object.keys(itemsByVendor).length} Bestellung(en) erfolgreich erstellt`,
      });

      // Reset cart
      setCart([]);
      setNotes('');
      setDeliveryDate(undefined);
      setCartOpen(false);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Fehler',
        description: 'Bestellung konnte nicht gesendet werden',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium">Keine Lieferanten</h3>
        <p className="text-sm text-muted-foreground">
          Erstellen Sie zuerst Lieferanten im Dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Filter Header */}
      <div className="p-4 space-y-3 bg-card border-b sticky top-0 z-10">
        <Select value={selectedVendor || ''} onValueChange={setSelectedVendor}>
          <SelectTrigger>
            <SelectValue placeholder="Lieferant wählen" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map(vendor => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Article List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Artikel gefunden
            </div>
          ) : (
            filteredArticles.map(article => {
              const inCart = cart.find(item => item.article.id === article.id);
              return (
                <Card key={article.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{article.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {article.price !== null && (
                          <span>€{article.price.toFixed(2)}</span>
                        )}
                        {article.unit && (
                          <span>/ {article.unit}</span>
                        )}
                        {article.category && (
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(article.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {inCart.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(article.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addToCart(article)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Cart Button */}
      <div className="p-4 border-t bg-card">
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button className="w-full" size="lg">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Warenkorb ({cartItemCount})
              {cartTotal > 0 && (
                <span className="ml-auto">€{cartTotal.toFixed(2)}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Warenkorb</SheetTitle>
            </SheetHeader>
            
            <div className="flex flex-col h-full mt-4">
              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground">Warenkorb ist leer</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-3">
                      {cart.map(item => (
                        <Card key={item.article.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{item.article.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {getVendorName(item.article.vendor_id)}
                              </p>
                              <p className="text-sm">
                                {item.article.price !== null && (
                                  <>€{item.article.price.toFixed(2)} × {item.quantity} = €{((item.article.price || 0) * item.quantity).toFixed(2)}</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.article.id, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.article.id, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeFromCart(item.article.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="space-y-4 pt-4 border-t mt-4">
                    {/* Delivery Date */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Lieferdatum
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {deliveryDate
                              ? format(deliveryDate, 'PPP', { locale: de })
                              : 'Datum wählen'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={deliveryDate}
                            onSelect={setDeliveryDate}
                            locale={de}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Bemerkungen
                      </label>
                      <Textarea
                        placeholder="Optionale Bemerkungen..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Total & Submit */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Gesamt</p>
                        <p className="text-xl font-bold">€{cartTotal.toFixed(2)}</p>
                      </div>
                      <Button
                        size="lg"
                        onClick={submitOrder}
                        disabled={submitting || cart.length === 0}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Bestellen
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default B2BMobilePurchaseTab;
