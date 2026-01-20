import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ClipboardList, ChevronDown, ChevronRight, Mail, MailX, Calendar, MapPin } from 'lucide-react';

interface OrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  vendor_id: string;
  vendor_name?: string;
  status: string;
  delivery_date: string | null;
  delivery_address: string | null;
  notes: string | null;
  total_amount: number;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface B2BPurchaseOrdersTabProps {
  accountId: string;
  supplierId?: string;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  pending: { label: 'Offen', variant: 'secondary' },
  confirmed: { label: 'Bestätigt', variant: 'default' },
  delivered: { label: 'Geliefert', variant: 'outline' },
  cancelled: { label: 'Storniert', variant: 'destructive' },
};

const B2BPurchaseOrdersTab = ({ accountId, supplierId }: B2BPurchaseOrdersTabProps) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, [accountId, supplierId]);

  const loadOrders = async () => {
    try {
      // Load vendors (filtered by supplier_id)
      let vendorsQuery = supabase
        .from('b2b_supplier_vendors')
        .select('id, name')
        .eq('supplier_account_id', accountId);

      if (supplierId) {
        vendorsQuery = vendorsQuery.eq('supplier_id', supplierId);
      }

      const { data: vendorsData } = await vendorsQuery;

      const vendorMap = new Map(vendorsData?.map(v => [v.id, v.name]) || []);
      const vendorIds = vendorsData?.map(v => v.id) || [];

      if (vendorIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Load orders (only for the filtered vendors)
      const { data: ordersData, error: ordersError } = await supabase
        .from('b2b_supplier_purchase_orders')
        .select('*')
        .eq('supplier_account_id', accountId)
        .in('vendor_id', vendorIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithVendor = (ordersData || []).map(order => ({
        ...order,
        vendor_name: vendorMap.get(order.vendor_id) || 'Unbekannt',
      }));

      setOrders(ordersWithVendor);
    } catch (error: unknown) {
      console.error('Error loading orders:', error);
      toast.error('Fehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from('b2b_supplier_purchase_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading order items:', error);
      return;
    }

    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, items: data } : order
    ));
  };

  const toggleOrder = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      // Load items if not loaded yet
      const order = orders.find(o => o.id === orderId);
      if (order && !order.items) {
        loadOrderItems(orderId);
      }
    }
    setExpandedOrders(newExpanded);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('b2b_supplier_purchase_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status aktualisiert');
      loadOrders();
    } catch (error: unknown) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-4">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
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
            Sie haben noch keine Bestellungen aufgegeben.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const isExpanded = expandedOrders.has(order.id);
        const statusInfo = statusLabels[order.status] || { label: order.status, variant: 'secondary' as const };

        return (
          <Collapsible key={order.id} open={isExpanded} onOpenChange={() => toggleOrder(order.id)}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <CardTitle className="text-base">{order.order_number}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      {order.email_sent ? (
                        <Mail className="h-4 w-4 text-green-600" />
                      ) : (
                        <MailX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-semibold">€{order.total_amount.toFixed(2)}</span>
                  </div>
                  <CardDescription className="text-left ml-6">
                    {order.vendor_name} • {format(new Date(order.created_at), 'PPp', { locale: de })}
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Delivery Info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {order.delivery_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Lieferung: {format(new Date(order.delivery_date), 'PP', { locale: de })}
                      </div>
                    )}
                    {order.delivery_address && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {order.delivery_address}
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {order.notes}
                    </p>
                  )}

                  {/* Order Items */}
                  {order.items ? (
                    <div className="rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2">Artikel</th>
                            <th className="text-right p-2">Menge</th>
                            <th className="text-right p-2">Preis</th>
                            <th className="text-right p-2">Gesamt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map(item => (
                            <tr key={item.id} className="border-t">
                              <td className="p-2">{item.article_name}</td>
                              <td className="text-right p-2">{item.quantity} {item.unit}</td>
                              <td className="text-right p-2">€{item.unit_price.toFixed(2)}</td>
                              <td className="text-right p-2 font-medium">€{item.total_price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="animate-pulse h-20 bg-muted rounded" />
                  )}

                  {/* Status Actions */}
                  <div className="flex gap-2 pt-2">
                    {order.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'confirmed')}>
                          Als bestätigt markieren
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'cancelled')}>
                          Stornieren
                        </Button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'delivered')}>
                        Als geliefert markieren
                      </Button>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default B2BPurchaseOrdersTab;