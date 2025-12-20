import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs defaultValue="articles" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 h-8">
          <TabsTrigger value="articles" className="flex-1 text-xs h-7">
            <Package className="h-3 w-3 mr-1.5" />
            Artikel
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex-1 text-xs h-7 relative">
            <ShoppingCart className="h-3 w-3 mr-1.5" />
            Warenkorb
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="flex-1 flex flex-col m-0 p-3 pt-2">

          {/* Supplier Filter */}
          <div className="flex gap-1.5 mb-2 flex-wrap">
            <Badge
              variant={selectedSupplier === null ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedSupplier(null)}
            >
              Alle
            </Badge>
            {suppliers.slice(0, 4).map(supplier => (
              <Badge
                key={supplier.id}
                variant={selectedSupplier === supplier.id ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedSupplier(supplier.id)}
              >
                {supplier.name}
              </Badge>
            ))}
          </div>

          {/* Articles List */}
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {filteredArticles.slice(0, 50).map(article => {
                const quantity = getCartQuantity(article.id);
                const supplier = suppliers.find(s => s.id === article.supplier_id);
                return (
                  <div 
                    key={article.id} 
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border transition-all",
                      quantity > 0 ? "bg-blue-500/5 border-blue-500/30" : "bg-background border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{article.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.unit} • €{article.price.toFixed(2)}
                        {supplier && <span className="ml-1">• {supplier.name}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {quantity > 0 ? (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(article.id, quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-sm font-medium">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(article.id, quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleAddToCart(article)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="cart" className="flex-1 flex flex-col m-0 p-3 pt-2">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Warenkorb ist leer</p>
                <p className="text-xs mt-1">Artikel im Tab "Artikel" hinzufügen</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {Object.entries(cartBySupplierId).map(([supplierId, items]) => {
                    const supplier = suppliers.find(s => s.id === supplierId);
                    const supplierTotal = items.reduce((sum, item) => sum + item.article.price * item.quantity, 0);
                    
                    return (
                      <div key={supplierId} className="rounded-lg border p-2.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{supplier?.name}</span>
                          <span className="text-sm font-semibold">€{supplierTotal.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1">
                          {items.map(item => (
                            <div key={item.article.id} className="flex items-center gap-2 text-sm">
                              <div className="flex-1 min-w-0">
                                <span className="truncate">{item.article.name}</span>
                                <span className="text-muted-foreground ml-1.5 text-xs">
                                  {item.quantity} × €{item.article.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => updateQuantity(item.article.id, item.quantity - 1)}
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </Button>
                                <span className="w-4 text-center text-xs">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => updateQuantity(item.article.id, item.quantity + 1)}
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full h-7 text-xs"
                          size="sm"
                          onClick={() => handleSendOrder(supplierId)}
                          disabled={isOrdering}
                        >
                          {isOrdering ? (
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3 mr-1.5" />
                          )}
                          Bestellung senden
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Gesamt:</span>
                  <span className="font-bold">€{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
