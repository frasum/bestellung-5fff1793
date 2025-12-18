import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Loader2, Package, ChevronDown, ChevronRight, MapPin, Calendar, CheckCircle, Eye, Clock } from 'lucide-react';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
}

interface OrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  order_unit?: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  delivery_address: string;
  notes: string | null;
  status: string;
  total_amount: number;
  location_name?: string;
  restaurant_name: string;
  items: OrderItem[];
  seen_at?: string | null;
  confirmed_at?: string | null;
}

interface SupplierPortalOrdersTabProps {
  session: SupplierSession;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Neu', color: 'bg-blue-500' },
  confirmed: { label: 'Bestätigt', color: 'bg-green-500' },
  delivered: { label: 'Geliefert', color: 'bg-gray-500' },
  cancelled: { label: 'Storniert', color: 'bg-red-500' },
};

export const SupplierPortalOrdersTab = ({ session }: SupplierPortalOrdersTabProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'get-orders',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
        },
      });

      if (error) throw error;
      setOrders(data?.orders || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Fehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [session]);

  const toggleExpanded = async (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      // Mark as seen when expanded
      const order = orders.find(o => o.id === orderId);
      if (order && !order.seen_at) {
        await markAsSeen(orderId);
      }
    }
    setExpandedOrders(newExpanded);
  };

  const markAsSeen = async (orderId: string) => {
    try {
      await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'mark-order-seen',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          orderId,
        },
      });
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, seen_at: new Date().toISOString() } : o
      ));
    } catch (error) {
      console.error('Error marking order as seen:', error);
    }
  };

  const confirmOrder = async (orderId: string) => {
    setConfirmingOrder(orderId);
    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'confirm-order',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          orderId,
        },
      });

      if (error) throw error;
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'confirmed', confirmed_at: new Date().toISOString() } : o
      ));
      
      toast.success('Bestellung bestätigt');
    } catch (error: any) {
      console.error('Error confirming order:', error);
      toast.error('Fehler beim Bestätigen der Bestellung');
    } finally {
      setConfirmingOrder(null);
    }
  };

  const newOrdersCount = orders.filter(o => !o.seen_at && o.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bestellungen
              {newOrdersCount > 0 && (
                <Badge variant="destructive">{newOrdersCount} neu</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Eingehende Bestellungen von {session.supplierName}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Noch keine Bestellungen vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isNew = !order.seen_at && order.status === 'pending';
              const isExpanded = expandedOrders.has(order.id);
              
              return (
                <Collapsible key={order.id} open={isExpanded} onOpenChange={() => toggleExpanded(order.id)}>
                  <Card className={isNew ? 'border-blue-500 border-2' : ''}>
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{order.order_number}</span>
                                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                                {isNew && (
                                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Neu
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {order.restaurant_name} • {order.items.length} Artikel
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t pt-4 space-y-4">
                        {/* Delivery Address */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Lieferadresse</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{order.delivery_address}</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Hinweise:</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-line">{order.notes}</p>
                          </div>
                        )}

                        {/* Order Items Table */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Artikel</TableHead>
                              <TableHead className="text-center">Menge</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.article_name}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">
                                    {item.quantity} {item.order_unit || item.unit}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Confirm Button */}
                        {order.status === 'pending' && (
                          <div className="flex justify-end pt-2">
                            <Button 
                              onClick={() => confirmOrder(order.id)}
                              disabled={confirmingOrder === order.id}
                              className="gap-2"
                            >
                              {confirmingOrder === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Bestellung bestätigen
                            </Button>
                          </div>
                        )}

                        {/* Confirmed info */}
                        {order.confirmed_at && (
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            Bestätigt am {format(new Date(order.confirmed_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
