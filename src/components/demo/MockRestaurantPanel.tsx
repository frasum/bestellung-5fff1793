import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Search, ShoppingCart, Send, Check, Package } from 'lucide-react';
import { useDemo, DemoCartItem } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function MockRestaurantPanel() {
  const { t } = useTranslation();
  const { 
    getSuppliers, 
    getArticles, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart,
    cartTotal,
    cartItemCount,
    createOrder
  } = useDemo();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  const suppliers = getSuppliers();
  const articles = getArticles();

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSupplier = !selectedSupplier || article.supplierId === selectedSupplier;
      return matchesSearch && matchesSupplier && article.isActive;
    });
  }, [articles, searchTerm, selectedSupplier]);

  const cartBySupplierId = useMemo(() => {
    const grouped: Record<string, DemoCartItem[]> = {};
    cart.forEach(item => {
      if (!grouped[item.supplierId]) {
        grouped[item.supplierId] = [];
      }
      grouped[item.supplierId].push(item);
    });
    return grouped;
  }, [cart]);

  const handleAddToCart = (article: typeof articles[0]) => {
    addToCart({
      articleId: article.id,
      articleName: article.name,
      unit: article.unit,
      price: article.price,
      supplierId: article.supplierId,
      supplierName: article.supplierName,
    });
  };

  const getCartQuantity = (articleId: string) => {
    const item = cart.find(i => i.articleId === articleId);
    return item?.quantity || 0;
  };

  const handleSendOrder = async (supplierId: string) => {
    setIsOrdering(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const order = createOrder(supplierId);
    if (order) {
      toast.success(`Bestellung ${order.orderNumber} gesendet!`, {
        description: `${order.items.length} Artikel an ${order.supplierName}`,
      });
    }
    
    setIsOrdering(false);
  };

  const handleSendAllOrders = async () => {
    setIsOrdering(true);
    const supplierIds = Object.keys(cartBySupplierId);
    
    for (const supplierId of supplierIds) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const order = createOrder(supplierId);
      if (order) {
        toast.success(`Bestellung ${order.orderNumber} gesendet!`);
      }
    }
    
    setIsOrdering(false);
  };

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
          {/* Search and Filter */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
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
            {suppliers.map(supplier => (
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
              {filteredArticles.map(article => {
                const quantity = getCartQuantity(article.id);
                return (
                  <Card key={article.id} className={cn(
                    "transition-all",
                    quantity > 0 && "ring-2 ring-primary"
                  )}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{article.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{article.supplierName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{article.category}</Badge>
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
                                onClick={() => updateCartQuantity(article.id, quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateCartQuantity(article.id, quantity + 1)}
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
                    const supplierTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    
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
                            <div key={item.articleId} className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <span>{item.articleName}</span>
                                <span className="text-muted-foreground ml-2">
                                  {item.quantity} × €{item.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateCartQuantity(item.articleId, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateCartQuantity(item.articleId, item.quantity + 1)}
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
                            <Send className="h-4 w-4 mr-2" />
                            Bestellung senden
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Gesamt:</span>
                  <span className="text-xl font-bold">€{cartTotal.toFixed(2)}</span>
                </div>
                {Object.keys(cartBySupplierId).length > 1 && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSendAllOrders}
                    disabled={isOrdering}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Alle Bestellungen senden ({Object.keys(cartBySupplierId).length})
                  </Button>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
