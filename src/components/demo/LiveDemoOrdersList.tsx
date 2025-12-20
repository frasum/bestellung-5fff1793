import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Package, ChevronDown, Clock, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface OrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  notes: string | null;
  supplier: { name: string } | null;
  employee: { name: string } | null;
  order_items: OrderItem[];
}

export function LiveDemoOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          total_amount,
          status,
          notes,
          suppliers:supplier_id (name),
          employees:employee_id (name),
          order_items (
            id,
            article_name,
            quantity,
            unit,
            unit_price,
            total_price
          )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('is_test_order', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedOrders = (data || []).map((o: any) => ({
        ...o,
        supplier: o.suppliers,
        employee: o.employees,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Realtime updates for new orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Bestätigt</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm font-medium">Keine Bestellungen</p>
        <p className="text-xs mt-1">Noch keine Bestellungen gesendet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100%-2rem)]">
      <div className="p-1 space-y-1">
        {orders.map(order => {
          const isExpanded = expandedOrders.has(order.id);
          const itemCount = order.order_items?.length || 0;
          
          // Extract orderer from notes if employee is null
          let ordererName = order.employee?.name;
          if (!ordererName && order.notes) {
            const match = order.notes.match(/EasyOrder: ([^(]+)/);
            if (match) {
              ordererName = match[1].trim();
            }
          }

          return (
            <Collapsible 
              key={order.id} 
              open={isExpanded} 
              onOpenChange={() => toggleExpanded(order.id)}
            >
              <div className="rounded-md border bg-card overflow-hidden">
                {/* Compact one-liner header */}
                <CollapsibleTrigger className="w-full text-left px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {order.order_number}
                      </span>
                      <span className="text-xs font-medium truncate">
                        {order.supplier?.name || 'Unbekannt'}
                      </span>
                      {ordererName && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline truncate">
                          ({ordererName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(order.status)}
                      <span className="text-xs font-semibold">€{order.total_amount.toFixed(2)}</span>
                      <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Details Dropdown */}
                <CollapsibleContent>
                  <div className="px-2 pb-2 pt-1 border-t bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                      <span>{itemCount} Artikel</span>
                    </div>
                    <div className="space-y-0.5">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate mr-2">
                            {item.quantity}x {item.article_name}
                          </span>
                          <span className="shrink-0">€{item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </ScrollArea>
  );
}
