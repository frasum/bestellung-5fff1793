import { Package, ChevronDown, ChevronUp, ClipboardList, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { EmployeeOrder, OrderItem } from './types';

interface OrderHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: EmployeeOrder[];
  isLoading: boolean;
  expandedOrders: Set<string>;
  onLoad: () => void;
  onToggleExpanded: (orderId: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'sent':
      return <Badge variant="default">Gesendet</Badge>;
    case 'confirmed':
      return <Badge className="bg-green-500">Bestätigt</Badge>;
    case 'draft':
      return <Badge variant="secondary">Entwurf</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Storniert</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const OrderHistorySheet = ({
  open,
  onOpenChange,
  orders,
  isLoading,
  expandedOrders,
  onLoad,
  onToggleExpanded,
}: OrderHistorySheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => {
            if (!open) onLoad();
          }}
        >
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Meine Bestellungen</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Meine Bestellungen
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Bestellungen</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <Collapsible 
                    open={expandedOrders.has(order.id)}
                    onOpenChange={() => onToggleExpanded(order.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">#{order.order_number}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.supplier?.name} • {order.location?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.created_at), "dd.MM.yyyy 'um' HH:mm", { locale: de })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {expandedOrders.has(order.id) ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="py-3 px-4 border-t bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Artikel:</p>
                        <div className="space-y-1">
                          {order.items?.map((item: OrderItem) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.article_name}</span>
                              <span className="text-muted-foreground">{item.unit}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
