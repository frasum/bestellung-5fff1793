import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useOrders, useUpdateOrder } from '@/hooks/useOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Neu', icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10' },
  confirmed: { label: 'Bestätigt', icon: CheckCircle2, color: 'text-blue-500 bg-blue-500/10' },
  processing: { label: 'In Bearbeitung', icon: Package, color: 'text-purple-500 bg-purple-500/10' },
  shipped: { label: 'Versendet', icon: Truck, color: 'text-green-500 bg-green-500/10' },
  delivered: { label: 'Geliefert', icon: CheckCircle2, color: 'text-green-600 bg-green-600/10' },
  cancelled: { label: 'Storniert', icon: AlertCircle, color: 'text-red-500 bg-red-500/10' },
};

interface LiveDemoSupplierPanelProps {
  soundEnabled: boolean;
}

export function LiveDemoSupplierPanel({ soundEnabled }: LiveDemoSupplierPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: suppliers = [] } = useSuppliers();
  const updateOrder = useUpdateOrder();
  
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(null);
  const prevOrderCountRef = useRef(orders.length);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('live-demo-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // Invalidate orders query to refetch
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            setHighlightedOrder(newOrder.id);
            setExpandedOrders(prev => new Set([...prev, newOrder.id]));
            
            if (soundEnabled) {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            }
            
            toast.success('Neue Bestellung eingegangen!', {
              description: `Bestellung ${newOrder.order_number}`,
            });
            
            setTimeout(() => setHighlightedOrder(null), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, soundEnabled]);

  // Track new orders for sound
  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      // New order detected via query update
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length]);

  const filteredOrders = orders.filter(order => 
    (selectedSupplier === 'all' || order.supplier_id === selectedSupplier) &&
    order.is_test_order === true
  );

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

  const getNextStatus = (currentStatus: string): OrderStatus | null => {
    const flow: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = flow.indexOf(currentStatus as OrderStatus);
    return currentIndex >= 0 && currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, status: newStatus });
      toast.success(`Status auf "${statusConfig[newStatus].label}" geändert`);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  if (ordersLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Supplier Filter */}
      <div className="mb-4">
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger>
            <SelectValue placeholder="Lieferant auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Lieferanten</SelectItem>
            {suppliers.map(supplier => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Demo-Bestellungen</p>
              <p className="text-sm">Bestellungen erscheinen hier sobald sie eingehen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const status = order.status || 'pending';
              const config = statusConfig[status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrders.has(order.id);
              const nextStatus = getNextStatus(status);
              const supplier = suppliers.find(s => s.id === order.supplier_id);
              
              return (
                <Card 
                  key={order.id} 
                  className={cn(
                    "transition-all duration-500",
                    highlightedOrder === order.id && "ring-2 ring-green-500 animate-pulse",
                    status === 'pending' && "border-orange-500/50"
                  )}
                >
                  <CardHeader 
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleExpanded(order.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-mono">{order.order_number}</CardTitle>
                        {status === 'pending' && (
                          <Badge variant="destructive" className="animate-pulse">NEU</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("gap-1", config.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{supplier?.name}</span>
                      <span>{format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="border-t pt-3 space-y-2">
                        {order.order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.article_name}</span>
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit} × €{item.unit_price?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Gesamt:</span>
                          <span>€{order.total_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        
                        {nextStatus && (
                          <Button
                            className="w-full mt-2"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(order.id, nextStatus);
                            }}
                            disabled={updateOrder.isPending}
                          >
                            {updateOrder.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {statusConfig[nextStatus].label} setzen
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Summary */}
      <div className="border-t pt-3 mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 rounded bg-orange-500/10">
          <p className="text-orange-600 font-bold">{filteredOrders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">Neu</p>
        </div>
        <div className="p-2 rounded bg-blue-500/10">
          <p className="text-blue-600 font-bold">
            {filteredOrders.filter(o => ['confirmed', 'processing'].includes(o.status || '')).length}
          </p>
          <p className="text-xs text-muted-foreground">In Arbeit</p>
        </div>
        <div className="p-2 rounded bg-green-500/10">
          <p className="text-green-600 font-bold">
            {filteredOrders.filter(o => ['shipped', 'delivered'].includes(o.status || '')).length}
          </p>
          <p className="text-xs text-muted-foreground">Abgeschlossen</p>
        </div>
      </div>
    </div>
  );
}
