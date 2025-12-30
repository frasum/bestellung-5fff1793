import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, ShoppingCart, Plus, Minus, Send, CalendarIcon, Package, Trash2, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
}

interface OwnVendor {
  id: string;
  name: string;
  email: string | null;
}

interface OwnArticle {
  id: string;
  vendor_id: string;
  name: string;
  sku: string | null;
  price: number;
  unit: string;
  category: string | null;
}

interface CartItem {
  article: OwnArticle;
  quantity: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  vendor_id: string;
  status: string;
  total_amount: number;
  delivery_date: string | null;
  notes: string | null;
  email_sent: boolean;
  created_at: string;
}

interface Props {
  session: SupplierSession;
}

export const SupplierMobilePurchaseTab = ({ session }: Props) => {
  const [vendors, setVendors] = useState<OwnVendor[]>([]);
  const [articles, setArticles] = useState<OwnArticle[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [notes, setNotes] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const [vendorsRes, articlesRes, ordersRes] = await Promise.all([
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-vendors',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-articles',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-purchase-orders',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (articlesRes.error) throw articlesRes.error;

      setVendors(vendorsRes.data?.vendors || []);
      setArticles(articlesRes.data?.articles || []);
      setOrders(ordersRes.data?.orders || []);

      // Auto-select first vendor if available
      if (vendorsRes.data?.vendors?.length > 0 && !selectedVendor) {
        setSelectedVendor(vendorsRes.data.vendors[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesVendor = a.vendor_id === selectedVendor;
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesVendor && matchesSearch;
    });
  }, [articles, selectedVendor, searchTerm]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.article.price * item.quantity), 0);
  }, [cart]);
  // Note: This component uses OwnArticle type which doesn't have packaging_unit field

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (article: OwnArticle) => {
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
    toast.success(`${article.name} hinzugefügt`);
  };

  const updateQuantity = (articleId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.article.id === articleId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (articleId: string) => {
    setCart(prev => prev.filter(item => item.article.id !== articleId));
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Warenkorb ist leer');
      return;
    }

    const vendor = vendors.find(v => v.id === selectedVendor);
    if (!vendor) {
      toast.error('Kein Händler ausgewählt');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'create-own-purchase-order',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          orderData: {
            vendor_id: selectedVendor,
            delivery_date: deliveryDate?.toISOString().split('T')[0],
            notes: notes || null,
            items: cart.map(item => ({
              article_id: item.article.id,
              article_name: item.article.name,
              quantity: item.quantity,
              unit: item.article.unit,
              unit_price: item.article.price,
              total_price: item.article.price * item.quantity,
            })),
          },
        },
      });

      if (error) throw error;

      toast.success('Bestellung erstellt');
      
      // Reset cart
      setCart([]);
      setDeliveryDate(undefined);
      setNotes('');
      setCartOpen(false);
      
      // Refresh orders
      fetchData();
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast.error('Fehler beim Erstellen der Bestellung');
    } finally {
      setSubmitting(false);
    }
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || 'Unbekannt';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      pending: { label: 'Offen', variant: 'secondary' },
      sent: { label: 'Gesendet', variant: 'default' },
      confirmed: { label: 'Bestätigt', variant: 'outline' },
      delivered: { label: 'Geliefert', variant: 'outline' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Keine Händler vorhanden</h3>
            <p className="text-muted-foreground text-sm">
              Legen Sie zuerst Händler und Artikel im Supplier Portal an.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Vendor Selection & Search */}
      <div className="p-4 space-y-3 border-b bg-muted/20">
        <Select value={selectedVendor} onValueChange={setSelectedVendor}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Händler wählen" />
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Article List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedVendor ? 'Keine Artikel gefunden' : 'Bitte Händler wählen'}
            </div>
          ) : (
            filteredArticles.map(article => {
              const cartItem = cart.find(item => item.article.id === article.id);
              return (
                <Card key={article.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{article.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{article.price.toFixed(2)} €</span>
                          <span>·</span>
                          <span>{article.unit}</span>
                          {article.sku && (
                            <>
                              <span>·</span>
                              <span>{article.sku}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => updateQuantity(article.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => updateQuantity(article.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => addToCart(article)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Bottom Bar */}
      <div className="sticky bottom-0 border-t bg-background p-4 space-y-3">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 h-12"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-5 w-5 mr-2" />
            Bestellungen
          </Button>
          
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="flex-1 h-12 relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Warenkorb
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle>Warenkorb</SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 -mx-6 px-6 my-4" style={{ height: 'calc(85vh - 280px)' }}>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Warenkorb ist leer
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.article.id} className="flex items-center gap-3 py-2 border-b">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.article.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.article.price.toFixed(2)} € × {item.quantity} = {(item.article.price * item.quantity).toFixed(2)} €
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.article.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.article.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(item.article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Order Details */}
              <div className="space-y-3 border-t pt-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, 'PPP', { locale: de }) : 'Lieferdatum wählen'}
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

                <Textarea
                  placeholder="Anmerkungen zur Bestellung..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px]"
                />

                <div className="flex items-center justify-between text-lg font-semibold pt-2">
                  <span>Gesamt:</span>
                  <span>{cartTotal.toFixed(2)} €</span>
                </div>

                <Button
                  className="w-full h-14 text-lg"
                  disabled={cart.length === 0 || submitting}
                  onClick={handleSubmitOrder}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  Bestellung absenden
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Order History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Bestellungen</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6 mt-4" style={{ height: 'calc(80vh - 100px)' }}>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Bestellungen
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {getVendorName(order.vendor_id)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="font-medium mt-1">{order.total_amount.toFixed(2)} €</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};
