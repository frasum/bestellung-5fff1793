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
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CartItem as OrderCartItem } from '@/contexts/CartContext';

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
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const createOrder = useCreateOrder();
  
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

  const handleSendOrder = async (supplierId: string) => {
    if (!user) return;
    
    const supplierItems = cart.filter(item => item.article.supplier_id === supplierId);
    if (supplierItems.length === 0) return;
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    setIsOrdering(true);
    
    try {
      // Convert to the format expected by useCreateOrder
      const orderItems: OrderCartItem[] = supplierItems.map(item => ({
        article: item.article,
        quantity: item.quantity,
      }));

      await createOrder.mutateAsync({
        supplierId,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        items: orderItems,
        deliveryAddress: 'Live-Demo Adresse',
        restaurantName: 'Live-Demo Restaurant',
        isTestOrder: true,
        notes: 'Live-Demo Bestellung',
      });

      // Remove ordered items from cart
      setCart(prev => prev.filter(item => item.article.supplier_id !== supplierId));
      
      if (soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
      
      toast.success('Bestellung gesendet!', {
        description: `${supplierItems.length} Artikel bestellt`,
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
