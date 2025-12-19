import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Search, ShoppingCart, Send, Package, Loader2 } from 'lucide-react';
import { useArticles, Article } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

interface LocalCartItem {
  article: Article;
  quantity: number;
}

interface LiveDemoRestaurantPanelProps {
  soundEnabled: boolean;
}

export function LiveDemoRestaurantPanel({ soundEnabled }: LiveDemoRestaurantPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  
  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSupplier = !selectedSupplier || article.supplier_id === selectedSupplier;
      return matchesSearch && matchesSupplier && article.is_active;
    });
  }, [articles, searchTerm, selectedSupplier]);

  const cartBySupplierId = useMemo(() => {
    const grouped: Record<string, LocalCartItem[]> = {};
    cart.forEach(item => {
      if (!grouped[item.article.supplier_id]) {
        grouped[item.article.supplier_id] = [];
      }
      grouped[item.article.supplier_id].push(item);
    });
    return grouped;
  }, [cart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.article.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (article: Article) => {
    setCart(prev => {
      const existing = prev.find(i => i.article.id === article.id);
      if (existing) {
        return prev.map(i => 
          i.article.id === article.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { article, quantity: 1 }];
    });
  };

  const updateQuantity = (articleId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.article.id !== articleId));
    } else {
      setCart(prev => prev.map(i => 
        i.article.id === articleId ? { ...i, quantity } : i
      ));
    }
  };

  const getCartQuantity = (articleId: string) => {
    const item = cart.find(i => i.article.id === articleId);
    return item?.quantity || 0;
  };

  // Generate simulated email HTML for demo
  const generateDemoEmailHtml = (supplier: any, items: LocalCartItem[], orderNumber: string) => {
    const totalAmount = items.reduce((sum, item) => sum + item.article.price * item.quantity, 0);
    const itemRows = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.article.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.article.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.article.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${(item.article.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung ${orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Neue Bestellung</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${orderNumber}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Sehr geehrte Damen und Herren von <strong>${supplier.name}</strong>,</p>
          <p>wir möchten folgende Artikel bestellen:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Artikel</th>
                <th style="padding: 10px; text-align: center;">Menge</th>
                <th style="padding: 10px; text-align: center;">Einheit</th>
                <th style="padding: 10px; text-align: right;">Preis</th>
                <th style="padding: 10px; text-align: right;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background: #f3f4f6;">
                <td colspan="4" style="padding: 10px; text-align: right;">Gesamtsumme:</td>
                <td style="padding: 10px; text-align: right;">€${totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <p><strong>Lieferadresse:</strong><br>Live-Demo Restaurant<br>Live-Demo Adresse</p>
          
          <p style="margin-top: 20px;">Mit freundlichen Grüßen<br>Live-Demo Restaurant</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">Diese E-Mail wurde simuliert für die Live-Demo</p>
          <p style="margin: 5px 0 0 0;">Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendOrder = async (supplierId: string) => {
    if (!user) return;
    
    const supplierItems = cart.filter(item => item.article.supplier_id === supplierId);
    if (supplierItems.length === 0) return;
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    setIsOrdering(true);
    
    try {
      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_order_number');
      
      const totalAmount = supplierItems.reduce((sum, item) => sum + item.article.price * item.quantity, 0);

      // Create order directly in DB (no email function)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          organization_id: profile.organization_id,
          supplier_id: supplierId,
          user_id: user.id,
          total_amount: totalAmount,
          delivery_address: 'Live-Demo Adresse',
          notes: 'Live-Demo Bestellung (simuliert)',
          is_test_order: true,
          email_sent: true, // Mark as sent (simulated)
          email_sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = supplierItems.map(item => ({
        order_id: order.id,
        article_id: item.article.id,
        article_name: item.article.name,
        quantity: item.quantity,
        unit: item.article.unit,
        unit_price: item.article.price,
        total_price: item.article.price * item.quantity,
      }));

      await supabase.from('order_items').insert(orderItems);

      // Create SIMULATED email log (no real email sent)
      const emailHtml = generateDemoEmailHtml(supplier, supplierItems, orderNumber);
      
      await supabase.from('communication_logs').insert({
        organization_id: profile.organization_id,
        order_id: order.id,
        supplier_id: supplierId,
        email_type: 'order_sent',
        direction: 'outgoing',
        recipient_email: supplier.email || 'demo@example.com',
        recipient_name: supplier.name,
        subject: `Bestellung ${orderNumber} - Live-Demo Restaurant`,
        status: 'simulated',
        body_html: emailHtml,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['communication-logs-demo'] });

      // Remove ordered items from cart
      setCart(prev => prev.filter(item => item.article.supplier_id !== supplierId));
      
      if (soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
      
      toast.success('Bestellung gesendet! (Demo)', {
        description: `${supplierItems.length} Artikel - E-Mail simuliert`,
      });
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Fehler beim Senden der Bestellung');
    } finally {
      setIsOrdering(false);
    }
  };

  if (articlesLoading || suppliersLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="articles" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="articles" className="flex-1">
            <Package className="h-4 w-4 mr-2" />
            Artikel
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex-1 relative">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Warenkorb
            {cartItemCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {cartItemCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="flex-1 flex flex-col m-0 p-4 pt-2">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Artikel suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Supplier Filter */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button
              variant={selectedSupplier === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSupplier(null)}
            >
              Alle
            </Button>
            {suppliers.slice(0, 5).map(supplier => (
              <Button
                key={supplier.id}
                variant={selectedSupplier === supplier.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSupplier(supplier.id)}
              >
                {supplier.name}
              </Button>
            ))}
          </div>

          {/* Articles Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredArticles.slice(0, 50).map(article => {
                const quantity = getCartQuantity(article.id);
                const supplier = suppliers.find(s => s.id === article.supplier_id);
                return (
                  <Card key={article.id} className={cn(
                    "transition-all",
                    quantity > 0 && "ring-2 ring-primary"
                  )}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{article.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{supplier?.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {article.category && (
                              <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                            )}
                            <span className="text-sm font-semibold">€{article.price.toFixed(2)}/{article.unit}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {quantity > 0 ? (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(article.id, quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(article.id, quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAddToCart(article)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="cart" className="flex-1 flex flex-col m-0 p-4 pt-2">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Warenkorb ist leer</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {Object.entries(cartBySupplierId).map(([supplierId, items]) => {
                    const supplier = suppliers.find(s => s.id === supplierId);
                    const supplierTotal = items.reduce((sum, item) => sum + item.article.price * item.quantity, 0);
                    
                    return (
                      <Card key={supplierId}>
                        <CardHeader className="py-3 px-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">{supplier?.name}</CardTitle>
                            <span className="font-semibold">€{supplierTotal.toFixed(2)}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3 pt-0 space-y-2">
                          {items.map(item => (
                            <div key={item.article.id} className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <span>{item.article.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  {item.quantity} × €{item.article.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            className="w-full mt-2"
                            size="sm"
                            onClick={() => handleSendOrder(supplierId)}
                            disabled={isOrdering}
                          >
                            {isOrdering ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Bestellung senden
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Gesamt:</span>
                  <span className="text-xl font-bold">€{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
