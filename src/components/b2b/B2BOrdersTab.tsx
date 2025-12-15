import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Search,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Truck,
  Clock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface B2BOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  notes: string | null;
  delivery_date: string | null;
  delivery_address: string | null;
  created_at: string;
  customer: {
    id: string;
    company_name: string;
    email: string;
    customer_number: string | null;
  };
  items: {
    id: string;
    article_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }[];
}

interface B2BOrdersTabProps {
  accountId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Offen', color: 'bg-orange-500', icon: Clock },
  confirmed: { label: 'Bestätigt', color: 'bg-blue-500', icon: Check },
  processing: { label: 'In Bearbeitung', color: 'bg-purple-500', icon: Clock },
  shipped: { label: 'Versendet', color: 'bg-cyan-500', icon: Truck },
  delivered: { label: 'Geliefert', color: 'bg-green-500', icon: Check },
  cancelled: { label: 'Storniert', color: 'bg-red-500', icon: X },
};

const B2BOrdersTab = ({ accountId }: B2BOrdersTabProps) => {
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, [accountId]);

  const loadOrders = async () => {
    try {
      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('supplier_b2b_orders')
        .select(`
          *,
          customer:supplier_b2b_customers(id, company_name, email, customer_number)
        `)
        .eq('supplier_account_id', accountId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Load items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('supplier_b2b_order_items')
            .select('*')
            .eq('order_id', order.id);
          
          return {
            ...order,
            items: items || [],
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('Fehler beim Laden der Bestellungen');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('supplier_b2b_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Status geändert zu "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
      loadOrders();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Ändern des Status');
    }
  };

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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.company_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Bestellungen suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Bestellungen gefunden</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' 
                ? 'Versuchen Sie andere Filteroptionen'
                : 'Hier erscheinen Bestellungen Ihrer Kunden'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrders.has(order.id);
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

            return (
              <Card key={order.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(order.id)}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{order.order_number}</span>
                              <Badge className={`${statusConfig.color} text-white`}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.customer?.company_name}
                              {order.customer?.customer_number && ` (#${order.customer.customer_number})`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{order.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t pt-4 space-y-4">
                      {/* Order Items */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Bestellpositionen</h4>
                        <div className="space-y-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.quantity} × {item.article_name}
                              </span>
                              <span className="text-muted-foreground">
                                €{item.total_price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {order.delivery_date && (
                          <div>
                            <span className="text-muted-foreground">Lieferdatum:</span>{' '}
                            {format(new Date(order.delivery_date), 'dd.MM.yyyy', { locale: de })}
                          </div>
                        )}
                        {order.delivery_address && (
                          <div>
                            <span className="text-muted-foreground">Lieferadresse:</span>{' '}
                            {order.delivery_address}
                          </div>
                        )}
                        {order.notes && (
                          <div className="md:col-span-2">
                            <span className="text-muted-foreground">Notizen:</span>{' '}
                            {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Status Actions */}
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(order.id, 'confirmed')}>
                              <Check className="h-4 w-4 mr-1" />
                              Bestätigen
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, 'cancelled')}>
                              <X className="h-4 w-4 mr-1" />
                              Stornieren
                            </Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <Button size="sm" onClick={() => updateStatus(order.id, 'processing')}>
                            In Bearbeitung
                          </Button>
                        )}
                        {order.status === 'processing' && (
                          <Button size="sm" onClick={() => updateStatus(order.id, 'shipped')}>
                            <Truck className="h-4 w-4 mr-1" />
                            Als versendet markieren
                          </Button>
                        )}
                        {order.status === 'shipped' && (
                          <Button size="sm" onClick={() => updateStatus(order.id, 'delivered')}>
                            <Check className="h-4 w-4 mr-1" />
                            Als geliefert markieren
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default B2BOrdersTab;
