import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Minus, Send, ClipboardList, Zap, ShoppingCart, Package, Check, Clock, Trash2 } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface LiveDemoEasyOrderPanelProps {
  soundEnabled?: boolean;
  onDirectOrderChange?: (isDirectOrder: boolean) => void;
  onOrderCreated?: (from: string, to: string) => void;
}

export function LiveDemoEasyOrderPanel({ soundEnabled, onDirectOrderChange, onOrderCreated }: LiveDemoEasyOrderPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: articles = [] } = useArticles();
  const { data: suppliers = [] } = useSuppliers();
  
  const [employeeName, setEmployeeName] = useState('Demo Mitarbeiter');
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isDirectOrder, setIsDirectOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'cart' | 'orders'>('articles');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch my orders (EasyOrder demo orders)
  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, created_at, notes,
          suppliers(name),
          order_items(article_name, quantity, unit, total_price)
        `)
        .eq('organization_id', profile.organization_id)
        .eq('is_test_order', true)
        .order('created_at', { ascending: false })
        .limit(20);

      setMyOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Notify parent about direct order changes
  useEffect(() => {
    onDirectOrderChange?.(isDirectOrder);
  }, [isDirectOrder, onDirectOrderChange]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchMyOrders();

    const channel = supabase
      .channel('demo-easyorder-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // Always refetch to keep list updated
          fetchMyOrders();

          // Special handling for confirmation
          if (payload.eventType === 'UPDATE') {
            const oldOrder = payload.old as any;
            const newOrder = payload.new as any;
            
            if (newOrder.is_test_order && newOrder.status === 'confirmed' && oldOrder.status === 'pending') {
              if (soundEnabled) {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.6;
                audio.play().catch(() => {});
              }
              
              toast.success('Bestellung bestätigt! ✓', {
                description: `${newOrder.order_number} wurde vom Lieferanten angenommen`,
                icon: '📦',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Create draft for admin approval instead of direct order
  const createDemoDraft = useMutation({
    mutationFn: async (draftData: { supplierId: string; items: { articleId: string; quantity: number }[]; employeeName: string; supplierName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Create cart draft
      const { data: draft, error: draftError } = await supabase
        .from('cart_drafts')
        .insert({
          name: `EasyOrder: ${draftData.employeeName} (${draftData.supplierName})`,
          organization_id: profile.organization_id,
          user_id: user.id,
          notes: `EasyOrder Demo - Mitarbeiter: ${draftData.employeeName}`,
        })
        .select()
        .single();

      if (draftError) throw draftError;

      // Create draft items
      const draftItems = draftData.items.map(item => ({
        draft_id: draft.id,
        article_id: item.articleId,
        quantity: item.quantity,
        supplier_id: draftData.supplierId,
      }));

      const { error: itemsError } = await supabase.from('cart_draft_items').insert(draftItems);
      if (itemsError) throw itemsError;

      return draft;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
    },
  });

  // Create direct order (skipping admin approval)
  const createDirectOrder = useMutation({
    mutationFn: async (orderData: { supplierId: string; items: { articleId: string; quantity: number }[]; employeeName: string; supplierName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Get article details for the order
      const articleIds = orderData.items.map(i => i.articleId);
      const { data: articleDetails } = await supabase
        .from('articles')
        .select('id, name, price, unit')
        .in('id', articleIds);

      const articleMap = new Map(articleDetails?.map(a => [a.id, a]) || []);
      
      // Calculate total
      const orderItems = orderData.items.map(item => {
        const article = articleMap.get(item.articleId);
        return {
          article_id: item.articleId,
          article_name: article?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: article?.price || 0,
          unit: article?.unit || 'Stück',
          total_price: (article?.price || 0) * item.quantity,
        };
      });

      const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);

      // Create order directly
      const orderNumber = `EO-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          organization_id: profile.organization_id,
          user_id: user.id,
          supplier_id: orderData.supplierId,
          status: 'pending',
          total_amount: totalAmount,
          delivery_address: 'Demo Adresse',
          notes: `Direktbestellung von ${orderData.employeeName}`,
          is_test_order: true,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        ...item,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      // Create communication log entry
      await supabase.from('communication_logs').insert({
        organization_id: profile.organization_id,
        order_id: order.id,
        supplier_id: orderData.supplierId,
        email_type: 'order',
        recipient_email: `${orderData.supplierName.toLowerCase().replace(/\s+/g, '')}@demo.local`,
        recipient_name: orderData.supplierName,
        subject: `Direktbestellung ${orderNumber}`,
        status: 'sent',
        direction: 'outgoing',
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
    },
  });

  // Get selected supplier (null = all suppliers)
  const activeSupplier = useMemo(() => {
    if (selectedSupplierId) {
      return suppliers.find(s => s.id === selectedSupplierId);
    }
    return null; // null = alle Lieferanten anzeigen
  }, [suppliers, selectedSupplierId]);

  // Filter articles by supplier and search
  const filteredArticles = useMemo(() => {
    return articles
      .filter(a => a.is_active && (!activeSupplier || a.supplier_id === activeSupplier.id))
      .filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  }, [articles, activeSupplier, search]);

  const updateQuantity = (articleId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[articleId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [articleId]: newQty };
    });
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const totalAmount = useMemo(() => {
    return Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .reduce((sum, [articleId, qty]) => {
        const article = articles.find(a => a.id === articleId);
        return sum + (article?.price || 0) * qty;
      }, 0);
  }, [quantities, articles]);

  const handleSubmitOrder = async () => {
    if (totalItems === 0) return;
    
    // Group selected articles by supplier
    const itemsBySupplier = new Map<string, { supplier: typeof suppliers[0]; items: { articleId: string; quantity: number }[] }>();
    
    Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .forEach(([articleId, quantity]) => {
        const article = articles.find(a => a.id === articleId);
        if (!article) return;
        
        const supplier = suppliers.find(s => s.id === article.supplier_id);
        if (!supplier) return;
        
        if (!itemsBySupplier.has(supplier.id)) {
          itemsBySupplier.set(supplier.id, { supplier, items: [] });
        }
        itemsBySupplier.get(supplier.id)!.items.push({ articleId, quantity });
      });

    if (itemsBySupplier.size === 0) return;

    try {
      const supplierCount = itemsBySupplier.size;
      
      // Create separate order for EACH supplier
      for (const [_, { supplier, items }] of itemsBySupplier) {
        if (isDirectOrder) {
          // Direct order - skip admin approval
          await createDirectOrder.mutateAsync({
            supplierId: supplier.id,
            items,
            employeeName,
            supplierName: supplier.name
          });
        } else {
          // Normal flow - create draft for admin approval
          await createDemoDraft.mutateAsync({
            supplierId: supplier.id,
            items,
            employeeName,
            supplierName: supplier.name
          });
        }
      }

      if (soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      }

      // Trigger connection highlights
      if (isDirectOrder) {
        onOrderCreated?.('easyorder', 'supplier');
        onOrderCreated?.('easyorder', 'email');
        
        toast.success(
          supplierCount > 1 
            ? `${supplierCount} Direktbestellungen gesendet!` 
            : 'Direktbestellung gesendet!',
          {
            description: supplierCount > 1 
              ? `An ${supplierCount} verschiedene Lieferanten übermittelt` 
              : 'Bestellung direkt an Lieferant übermittelt'
          }
        );
      } else {
        onOrderCreated?.('easyorder', 'gastro');
        
        toast.success(
          supplierCount > 1 
            ? `${supplierCount} Vorbestellungen gesendet!` 
            : 'Vorbestellung gesendet!',
          {
            description: supplierCount > 1 
              ? `${supplierCount} Bestellungen warten auf Freigabe` 
              : 'Warte auf Freigabe durch Admin'
          }
        );
      }
      
      setQuantities({});
    } catch (error) {
      console.error('Order error:', error);
      toast.error(isDirectOrder ? 'Fehler beim Senden der Direktbestellung' : 'Fehler beim Senden der Vorbestellung');
    }
  };

  const isPending = isDirectOrder ? createDirectOrder.isPending : createDemoDraft.isPending;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="default" className="bg-green-600 text-white text-[10px] gap-1">
            <Check className="h-3 w-3" />
            Bestätigt
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Clock className="h-3 w-3" />
            Warten
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Direct Order Toggle */}
      <div className="px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <Label htmlFor="direct-order" className="text-xs flex items-center gap-1.5 cursor-pointer">
            <Zap className={cn("h-3 w-3", isDirectOrder ? "text-green-600" : "text-muted-foreground")} />
            Direktbestellung
          </Label>
          <Switch
            id="direct-order"
            checked={isDirectOrder}
            onCheckedChange={setIsDirectOrder}
            className="scale-75"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isDirectOrder ? 'Bestellung geht direkt an Lieferant' : 'Bestellung benötigt Admin-Freigabe'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'articles' | 'cart' | 'orders')} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3 h-9 rounded-none border-b bg-muted/30">
          <TabsTrigger value="articles" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <ClipboardList className="h-3.5 w-3.5" />
            Artikel
          </TabsTrigger>
          <TabsTrigger value="cart" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <ShoppingCart className="h-3.5 w-3.5" />
            Warenkorb
            {totalItems > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                {totalItems}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs gap-1.5 data-[state=active]:bg-background">
            <Package className="h-3.5 w-3.5" />
            Bestellungen
            {myOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {myOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          {/* Supplier Selection */}
          <div className="p-3 border-b">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <Badge
                variant={selectedSupplierId === null ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedSupplierId(null)}
              >
                Alle
              </Badge>
              {suppliers.filter(s => s.is_active).slice(0, 4).map(supplier => (
                <Badge
                  key={supplier.id}
                  variant={selectedSupplierId === supplier.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap text-xs"
                  onClick={() => setSelectedSupplierId(supplier.id)}
                >
                  {supplier.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Article List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{activeSupplier ? 'Keine Artikel gefunden' : 'Bitte Lieferant wählen'}</p>
                </div>
              ) : (
                filteredArticles.map(article => {
                  const qty = quantities[article.id] || 0;
                  return (
                    <div 
                      key={article.id} 
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border transition-all",
                        qty > 0 ? "bg-orange-500/5 border-orange-500/30" : "bg-background border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{article.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.unit} • €{article.price.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {qty > 0 && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(article.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {qty > 0 && (
                          <span className="w-5 text-center font-medium text-sm">{qty}</span>
                        )}
                        
                        <Button
                          variant={qty > 0 ? "default" : "ghost"}
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(article.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Submit Bar */}
          {totalItems > 0 && (
            <div className="p-3 border-t bg-muted/30">
              <Button 
                className={cn(
                  "w-full h-8 text-sm gap-2",
                  isDirectOrder && "bg-green-600 hover:bg-green-700"
                )}
                onClick={handleSubmitOrder}
                disabled={isPending}
              >
                {isDirectOrder ? <Zap className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {isDirectOrder ? `Direkt bestellen (${totalItems})` : `Vorbestellung senden (${totalItems})`}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Cart Tab */}
        <TabsContent value="cart" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {totalItems === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Warenkorb ist leer</p>
                  <p className="text-xs mt-1">Artikel im Tab "Artikel" hinzufügen</p>
                </div>
              ) : (
                Object.entries(quantities)
                  .filter(([_, qty]) => qty > 0)
                  .map(([articleId, qty]) => {
                    const article = articles.find(a => a.id === articleId);
                    if (!article) return null;
                    const supplier = suppliers.find(s => s.id === article.supplier_id);
                    return (
                      <div key={articleId} className="flex items-center gap-2 p-2 rounded-md border bg-orange-500/5 border-orange-500/30">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{article.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {supplier?.name} • €{(article.price * qty).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(articleId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center font-medium text-sm">{qty}</span>
                          <Button 
                            variant="default" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(articleId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => setQuantities(prev => {
                              const { [articleId]: _, ...rest } = prev;
                              return rest;
                            })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </ScrollArea>
          
          {/* Total + Submit Button */}
          {totalItems > 0 && (
            <div className="p-3 border-t bg-muted/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gesamt ({totalItems} Artikel):</span>
                <span className="font-bold">€{totalAmount.toFixed(2)}</span>
              </div>
              <Button 
                className={cn(
                  "w-full h-8 text-sm gap-2",
                  isDirectOrder && "bg-green-600 hover:bg-green-700"
                )}
                onClick={handleSubmitOrder}
                disabled={isPending}
              >
                {isDirectOrder ? <Zap className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                {isDirectOrder ? 'Direkt bestellen' : 'Vorbestellung senden'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* My Orders Tab */}
        <TabsContent value="orders" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {ordersLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm">Laden...</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Noch keine Bestellungen</p>
                  <p className="text-xs mt-1">Bestellen Sie im "Artikel" Tab</p>
                </div>
              ) : (
                myOrders.map(order => (
                  <div 
                    key={order.id} 
                    className={cn(
                      "p-3 rounded-md border transition-all",
                      order.status === 'confirmed' 
                        ? "bg-green-500/5 border-green-500/30" 
                        : "bg-background border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.suppliers?.name || 'Lieferant'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'dd.MM. HH:mm', { locale: de })}
                      </span>
                      <span className="text-sm font-medium">
                        €{order.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-1">Artikel:</p>
                        {order.order_items.slice(0, 3).map((item: any, idx: number) => (
                          <p key={idx} className="text-xs truncate">
                            {item.quantity}x {item.article_name}
                          </p>
                        ))}
                        {order.order_items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{order.order_items.length - 3} weitere
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className={cn(
        "p-2 border-t text-center transition-colors",
        isDirectOrder ? "bg-green-500/5" : ""
      )}>
        <p className={cn(
          "text-xs",
          isDirectOrder ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"
        )}>
          {isDirectOrder ? '⚡ Mitarbeiter → Lieferant (direkt)' : 'Mitarbeiter → Admin Freigabe'}
        </p>
      </div>
    </div>
  );
}
