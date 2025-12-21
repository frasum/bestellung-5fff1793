import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  ArrowLeft, 
  LogOut, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package,
  Loader2,
  Send,
  Calendar
} from 'lucide-react';
import type { EmployeeSession, CartItem } from '@/pages/EmployeeOrder';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface SupplierOrderScreenProps {
  session: EmployeeSession;
  selectedLocation: { id: string; name: string };
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onUpdateCartItem: (articleId: string, quantity: number) => void;
  onBack: () => void;
  onOrderSubmitted: () => void;
  onLogout: () => void;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface Article {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: string | null;
  supplier_id: string;
  order_unit_name: string | null;
}

export function SupplierOrderScreen({
  session,
  selectedLocation,
  cart,
  onAddToCart,
  onUpdateCartItem,
  onBack,
  onOrderSubmitted,
  onLogout,
}: SupplierOrderScreenProps) {
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

  // Get supplier IDs assigned to this location for this employee
  const assignedSupplierIds = useMemo(() => {
    return session.locationSuppliers
      .filter(ls => ls.location_id === selectedLocation.id)
      .map(ls => ls.supplier_id);
  }, [session.locationSuppliers, selectedLocation.id]);

  // Load suppliers and articles
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load suppliers
        if (assignedSupplierIds.length > 0) {
          const { data: suppliersData, error: suppliersError } = await supabase
            .from('suppliers')
            .select('id, name, email')
            .in('id', assignedSupplierIds)
            .eq('is_active', true)
            .order('name');

          if (suppliersError) throw suppliersError;
          setSuppliers(suppliersData || []);

          // Load articles for all assigned suppliers
          const { data: articlesData, error: articlesError } = await supabase
            .from('articles')
            .select('id, name, unit, price, category, supplier_id, order_units(name)')
            .in('supplier_id', assignedSupplierIds)
            .eq('is_active', true)
            .order('sort_order')
            .order('name');

          if (articlesError) throw articlesError;
          
          // Map the data to flatten order_unit_name
          const mappedArticles = (articlesData || []).map(article => ({
            id: article.id,
            name: article.name,
            unit: article.unit,
            price: article.price,
            category: article.category,
            supplier_id: article.supplier_id,
            order_unit_name: article.order_units?.name || null,
          }));
          setArticles(mappedArticles);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Fehler',
          description: 'Daten konnten nicht geladen werden',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [assignedSupplierIds, toast]);

  // Filter articles by selected supplier and search
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSupplier = !selectedSupplier || article.supplier_id === selectedSupplier;
      const matchesSearch = !searchQuery || 
        article.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSupplier && matchesSearch;
    });
  }, [articles, selectedSupplier, searchQuery]);

  // Group articles by supplier
  const articlesBySupplier = useMemo(() => {
    const grouped: Record<string, { supplier: Supplier; articles: Article[] }> = {};
    filteredArticles.forEach(article => {
      const supplier = suppliers.find(s => s.id === article.supplier_id);
      if (!supplier) return;
      if (!grouped[supplier.id]) {
        grouped[supplier.id] = { supplier, articles: [] };
      }
      grouped[supplier.id].articles.push(article);
    });
    // Sort by supplier name
    return Object.values(grouped).sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));
  }, [filteredArticles, suppliers]);

  // Cart calculations
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group cart by supplier
  const cartBySupplier = useMemo(() => {
    const grouped: Record<string, CartItem[]> = {};
    cart.forEach(item => {
      if (!grouped[item.supplierId]) {
        grouped[item.supplierId] = [];
      }
      grouped[item.supplierId].push(item);
    });
    return grouped;
  }, [cart]);

  const getCartQuantity = (articleId: string) => {
    return cart.find(item => item.articleId === articleId)?.quantity || 0;
  };

  const handleAddArticle = (article: Article) => {
    const supplier = suppliers.find(s => s.id === article.supplier_id);
    onAddToCart({
      articleId: article.id,
      articleName: article.name,
      quantity: 1,
      unit: article.unit,
      supplierId: article.supplier_id,
      supplierName: supplier?.name || '',
      price: article.price,
    });
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Warenkorb leer',
        description: 'Fügen Sie Artikel hinzu, um zu bestellen',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Group orders by supplier and submit each
      for (const [supplierId, items] of Object.entries(cartBySupplier)) {
        const supplier = suppliers.find(s => s.id === supplierId);
        
        const { error } = await supabase.functions.invoke('submit-simple-order', {
          body: {
            employeeId: session.employee.id,
            locationId: selectedLocation.id,
            supplierId,
            deliveryDate,
            items: items.map(item => ({
              articleId: item.articleId,
              quantity: item.quantity,
            })),
            autoApprove: session.employee.autoApproveOrders,
          },
        });

        if (error) throw error;
      }

      toast({
        title: 'Bestellung erfolgreich',
        description: `${Object.keys(cartBySupplier).length} Bestellung(en) wurden gesendet`,
      });

      onOrderSubmitted();
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Fehler',
        description: 'Bestellung konnte nicht gesendet werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Bestellung für</p>
              <p className="font-semibold">{selectedLocation.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Warenkorb</span>
                  {cartItemCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg flex flex-col">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Warenkorb ({cartItemCount} Artikel)
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Ihr Warenkorb ist leer</p>
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      {Object.entries(cartBySupplier).map(([supplierId, items]) => (
                        <div key={supplierId}>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                            {items[0].supplierName}
                          </h3>
                          <div className="space-y-2">
                            {items.map(item => (
                              <div key={item.articleId} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.articleName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.price.toFixed(2)} € / {item.unit}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onUpdateCartItem(item.articleId, item.quantity - 1)}
                                  >
                                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    className="w-14 h-8 text-center font-semibold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    min={0}
                                    onClick={(e) => e.currentTarget.select()}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      onUpdateCartItem(item.articleId, val);
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => onUpdateCartItem(item.articleId, item.quantity + 1)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {cart.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Lieferdatum
                      </label>
                      <Input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Gesamt:</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg gap-2" 
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Jetzt bestellen
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Supplier Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            <Button
              variant={selectedSupplier === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSupplier(null)}
              className="shrink-0"
            >
              Alle ({articles.length})
            </Button>
            {suppliers.map(supplier => {
              const count = articles.filter(a => a.supplier_id === supplier.id).length;
              return (
                <Button
                  key={supplier.id}
                  variant={selectedSupplier === supplier.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSupplier(supplier.id)}
                  className="shrink-0"
                >
                  {supplier.name} ({count})
                </Button>
              );
            })}
          </div>

          {/* Articles - List View by Supplier */}
          {articlesBySupplier.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Keine Artikel gefunden</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {articlesBySupplier.map(({ supplier, articles: supplierArticles }) => (
                <div key={supplier.id} className="border rounded-lg overflow-hidden bg-card">
                  {/* Supplier Header */}
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <h2 className="text-lg font-semibold">{supplier.name}</h2>
                    <p className="text-sm text-muted-foreground">{supplierArticles.length} Artikel</p>
                  </div>
                  
                  {/* Articles List */}
                  <div className="divide-y">
                    {supplierArticles.map(article => {
                      const cartQty = getCartQuantity(article.id);

                      return (
                        <div key={article.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{article.name}</h3>
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {article.unit}
                              </Badge>
                            </div>
                            {article.order_unit_name && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Bestelleinheit: {article.order_unit_name}
                              </p>
                            )}
                          </div>
                          
                          {cartQty > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => onUpdateCartItem(article.id, cartQty - 1)}
                              >
                                {cartQty === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                              </Button>
                              <Input
                                type="number"
                                value={cartQty}
                                className="w-14 h-9 text-center font-bold text-lg p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={0}
                                onClick={(e) => e.currentTarget.select()}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  onUpdateCartItem(article.id, val);
                                }}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => onUpdateCartItem(article.id, cartQty + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => handleAddArticle(article)} className="gap-2 shrink-0">
                              <Plus className="w-4 h-4" />
                              Hinzufügen
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Cart Button (Mobile) */}
      {cartItemCount > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              className="fixed bottom-6 right-6 h-14 px-6 gap-2 shadow-lg sm:hidden"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount} Artikel • {cartTotal.toFixed(2)} €
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg flex flex-col">
            {/* Same cart content as above - duplicated for mobile trigger */}
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Warenkorb ({cartItemCount} Artikel)
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 py-4">
                {Object.entries(cartBySupplier).map(([supplierId, items]) => (
                  <div key={supplierId}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      {items[0].supplierName}
                    </h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.articleId} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.articleName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toFixed(2)} € / {item.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onUpdateCartItem(item.articleId, item.quantity - 1)}
                            >
                              {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              className="w-14 h-8 text-center font-semibold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              onClick={(e) => e.currentTarget.select()}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                onUpdateCartItem(item.articleId, val);
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onUpdateCartItem(item.articleId, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Lieferdatum
                </label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Gesamt:</span>
                <span>{cartTotal.toFixed(2)} €</span>
              </div>

              <Button 
                className="w-full h-12 text-lg gap-2" 
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Jetzt bestellen
                  </>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
