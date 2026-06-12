import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ClipboardList, Package, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  vendor_id: string;
  vendor_name?: string;
  status: string;
  total_amount: number;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface CustomerPurchaseOrdersTabProps {
  customerId: string;
}

const CustomerPurchaseOrdersTab = ({ customerId }: CustomerPurchaseOrdersTabProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, [customerId]);

  const loadOrders = async () => {
    try {
      // Load orders with vendor info
      const { data: ordersData, error: ordersError } = await supabase
        .from('b2b_customer_purchase_orders')
        .select(`
          *,
          b2b_customer_vendors(name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Load items for each order
      const ordersWithItems: Order[] = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('b2b_customer_purchase_order_items')
            .select('*')
            .eq('order_id', order.id)
            .order('article_name');

          const vendorRel = order.b2b_customer_vendors as { name?: string } | null;
          return {
            id: order.id,
            order_number: order.order_number,
            vendor_id: order.vendor_id,
            vendor_name: vendorRel?.name,
            status: order.status ?? 'pending',
            total_amount: order.total_amount ?? 0,
            delivery_date: order.delivery_date,
            notes: order.notes,
            created_at: order.created_at ?? '',
            items: (items || []).map(it => ({
              id: it.id,
              article_name: it.article_name,
              quantity: it.quantity,
              unit: it.unit ?? '',
              unit_price: it.unit_price ?? 0,
              total_price: it.total_price ?? 0,
            })),
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error: unknown) {
      console.error('Error loading orders:', error instanceof Error ? error.message : error);
      toast.error('Fehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (orderId: string) => {
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
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Ausstehend</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Bestätigt</Badge>;
      case 'delivered':
        return <Badge variant="secondary">Geliefert</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Storniert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Keine Bestellungen</h3>
          <p className="text-muted-foreground">
            Ihre Bestellungen werden hier angezeigt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const isExpanded = expandedOrders.has(order.id);
        return (
          <Card key={order.id}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleOrder(order.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span>{order.order_number}</span>
                          {getStatusBadge(order.status)}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {order.vendor_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{order.total_amount.toFixed(2)}</p>
                      {order.delivery_date && (
                        <p className="text-sm text-muted-foreground">
                          Lieferung: {format(new Date(order.delivery_date), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="border-t pt-4 space-y-3">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">{item.article_name}</span>
                          <span className="text-muted-foreground ml-2">
                            {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-medium">€{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notizen:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

export default CustomerPurchaseOrdersTab;
