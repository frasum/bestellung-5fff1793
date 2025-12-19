import { useState, useEffect } from 'react';
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
  ChevronUp
} from 'lucide-react';
import { useDemo, DemoOrder } from '@/contexts/DemoContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusConfig: Record<DemoOrder['status'], { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Neu', icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10' },
  confirmed: { label: 'Bestätigt', icon: CheckCircle2, color: 'text-blue-500 bg-blue-500/10' },
  processing: { label: 'In Bearbeitung', icon: Package, color: 'text-purple-500 bg-purple-500/10' },
  shipped: { label: 'Versendet', icon: Truck, color: 'text-green-500 bg-green-500/10' },
  delivered: { label: 'Geliefert', icon: CheckCircle2, color: 'text-green-600 bg-green-600/10' },
};

export function MockSupplierPanel() {
  const { t } = useTranslation();
  const { orders, updateOrderStatus, getSuppliers } = useDemo();
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(null);

  const suppliers = getSuppliers();

  const filteredOrders = orders.filter(order => 
    selectedSupplier === 'all' || order.supplierId === selectedSupplier
  );

  // Highlight new orders
  useEffect(() => {
    if (orders.length > 0) {
      const newestOrder = orders[0];
      if (newestOrder.status === 'pending') {
        setHighlightedOrder(newestOrder.id);
        setExpandedOrders(prev => new Set([...prev, newestOrder.id]));
        
        setTimeout(() => {
          setHighlightedOrder(null);
        }, 3000);
      }
    }
  }, [orders.length]);

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

  const getNextStatus = (currentStatus: DemoOrder['status']): DemoOrder['status'] | null => {
    const flow: DemoOrder['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = flow.indexOf(currentStatus);
    return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
  };

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
              <p>Keine Bestellungen</p>
              <p className="text-sm">Bestellungen erscheinen hier sobald sie eingehen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const StatusIcon = statusConfig[order.status].icon;
              const isExpanded = expandedOrders.has(order.id);
              const nextStatus = getNextStatus(order.status);
              
              return (
                <Card 
                  key={order.id} 
                  className={cn(
                    "transition-all duration-500",
                    highlightedOrder === order.id && "ring-2 ring-green-500 animate-pulse",
                    order.status === 'pending' && "border-orange-500/50"
                  )}
                >
                  <CardHeader 
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => toggleExpanded(order.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-mono">{order.orderNumber}</CardTitle>
                        {order.status === 'pending' && (
                          <Badge variant="destructive" className="animate-pulse">NEU</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("gap-1", statusConfig[order.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status].label}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{order.supplierName}</span>
                      <span>{format(order.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="border-t pt-3 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.articleName}</span>
                            <span className="text-muted-foreground">
                              {item.quantity} {item.unit} × €{item.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Gesamt:</span>
                          <span>€{order.totalAmount.toFixed(2)}</span>
                        </div>
                        
                        {nextStatus && (
                          <Button
                            className="w-full mt-2"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, nextStatus);
                            }}
                          >
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
          <p className="text-orange-600 font-bold">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">Neu</p>
        </div>
        <div className="p-2 rounded bg-blue-500/10">
          <p className="text-blue-600 font-bold">
            {orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length}
          </p>
          <p className="text-xs text-muted-foreground">In Arbeit</p>
        </div>
        <div className="p-2 rounded bg-green-500/10">
          <p className="text-green-600 font-bold">
            {orders.filter(o => ['shipped', 'delivered'].includes(o.status)).length}
          </p>
          <p className="text-xs text-muted-foreground">Abgeschlossen</p>
        </div>
      </div>
    </div>
  );
}
