import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
import { useOrders } from '@/hooks/useOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';

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
  
  // Local update order mutation
  const updateOrder = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(null);

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const newCount = filteredOrders.filter(o => o.status === 'pending').length;
  const inProgressCount = filteredOrders.filter(o => ['confirmed', 'processing'].includes(o.status || '')).length;
  const completedCount = filteredOrders.filter(o => ['shipped', 'delivered'].includes(o.status || '')).length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-green-500/5 border-b">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-green-600" />
          <div>
            <span className="font-semibold text-sm text-green-700 dark:text-green-300">Lieferant</span>
            <p className="text-xs text-muted-foreground">Bestellungs-Verwaltung</p>
          </div>
        </div>
        {newCount > 0 && (
          <Badge variant="destructive" className="animate-pulse">{newCount} neu</Badge>
        )}
      </div>

      {/* Supplier Filter */}
      <div className="p-3 border-b">
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="h-8 text-sm">
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
        <div className="p-2 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Keine Demo-Bestellungen</p>
              <p className="text-xs mt-1">Bestellungen erscheinen sobald sie eingehen</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const status = order.status || 'pending';
              const config = statusConfig[status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrders.has(order.id);
              const nextStatus = getNextStatus(status);
              const supplier = suppliers.find(s => s.id === order.supplier_id);
              
              return (
                <div 
                  key={order.id} 
                  className={cn(
                    "rounded-lg border transition-all duration-500",
                    highlightedOrder === order.id && "ring-2 ring-green-500 animate-pulse",
                    status === 'pending' && "border-orange-500/50"
                  )}
                >
                  <div 
                    className="p-2.5 cursor-pointer"
                    onClick={() => toggleExpanded(order.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">{order.order_number}</span>
                        {status === 'pending' && (
                          <Badge variant="destructive" className="text-xs h-5 animate-pulse">NEU</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge className={cn("text-xs gap-1 h-5", config.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{supplier?.name}</span>
                      <span>{format(new Date(order.created_at), 'HH:mm', { locale: de })}</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-2.5 pb-2.5 pt-0">
                      <div className="border-t pt-2 space-y-1">
                        {order.order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="truncate">{item.article_name}</span>
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-1.5 flex justify-between text-sm font-medium">
                          <span>Gesamt:</span>
                          <span>€{order.total_amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        
                        {nextStatus && (
                          <Button
                            className="w-full mt-1.5 h-7 text-xs"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(order.id, nextStatus);
                            }}
                            disabled={updateOrder.isPending}
                          >
                            {updateOrder.isPending && (
                              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            )}
                            {statusConfig[nextStatus].label} setzen
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Summary Footer */}
      <div className="border-t p-2 grid grid-cols-3 gap-1.5 text-center">
        <div className="p-1.5 rounded bg-orange-500/10">
          <p className="text-orange-600 font-bold text-sm">{newCount}</p>
          <p className="text-xs text-muted-foreground">Neu</p>
        </div>
        <div className="p-1.5 rounded bg-blue-500/10">
          <p className="text-blue-600 font-bold text-sm">{inProgressCount}</p>
          <p className="text-xs text-muted-foreground">In Arbeit</p>
        </div>
        <div className="p-1.5 rounded bg-green-500/10">
          <p className="text-green-600 font-bold text-sm">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Fertig</p>
        </div>
      </div>
    </div>
  );
}
