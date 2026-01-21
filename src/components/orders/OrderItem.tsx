import { memo, forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { format, Locale } from 'date-fns';
import { 
  Loader2, Package, CheckCircle2, Clock, Truck, XCircle, 
  Eye, ChevronRight, FlaskConical, MapPin, Send, User 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';
import { statusColors, LocationOption, getLocationDisplayName } from './types';


const statusIconMap = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

interface OrderItemProps {
  order: Order;
  isOpen: boolean;
  onToggle: () => void;
  onUpdateStatus: (status: Order['status']) => void;
  onUpdateLocation: (locationId: string | null) => void;
  onViewEmail: () => void;
  onResendEmail: () => void;
  isResending: boolean;
  locations: LocationOption[] | undefined;
  locale: Locale;
  isHighlighted?: boolean;
}

export const OrderItem = memo(forwardRef<HTMLDivElement, OrderItemProps>(({
  order,
  isOpen,
  onToggle,
  onUpdateStatus,
  onUpdateLocation,
  onViewEmail,
  onResendEmail,
  isResending,
  locations,
  locale,
  isHighlighted,
}, ref) => {
  const { t } = useTranslation();
  const StatusIcon = statusIconMap[order.status];

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div
        ref={ref}
        className={cn(
          "transition-all duration-500",
          isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
        )}
      >
        <CollapsibleTrigger className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors flex flex-wrap items-center gap-2">
          <ChevronRight className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-90"
          )} />
          <span className="font-medium text-foreground">{order.order_number}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale })}
          </span>
          <Badge className={cn('text-xs', statusColors[order.status])}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {t(`orders.status.${order.status}`)}
          </Badge>
          {order.is_test_order && (
            <Badge variant="outline" className="text-xs border-warning text-warning">
              <FlaskConical className="w-3 h-3 mr-1" />
              Test
            </Badge>
          )}
          {order.locations && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {getLocationDisplayName(order.locations)}
            </Badge>
          )}
          {order.employees && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
              <User className="w-3 h-3 mr-1" />
              {order.employees.name}
            </Badge>
          )}
          {!order.employees && !order.employee_id && (
            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
              Admin
            </Badge>
          )}
          <span className="font-bold text-foreground ml-auto">€{Number(order.total_amount).toFixed(2)}</span>
        </CollapsibleTrigger>
        
        {/* Order Details */}
        <CollapsibleContent>
          <div className="mt-1 p-4 bg-muted/30 border border-border rounded-lg space-y-4">
            {/* Order Items */}
            <div className="space-y-2">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.article_name}</span>
                  <span className="text-muted-foreground">
                    {item.quantity} {item.order_unit || item.unit} • €{Number(item.total_price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Delivery Address */}
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {order.delivery_address.split('\n').join(' • ')}
              </p>
            </div>
            
            {/* Location Assignment */}
            {locations && locations.length > 1 && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Standort:
                  </span>
                  <Select
                    value={order.location_id || 'none'}
                    onValueChange={(value) => onUpdateLocation(value === 'none' ? null : value)}
                  >
                    <SelectTrigger 
                      className={cn(
                        "w-40 h-9 bg-card",
                        !order.location_id && "border-warning text-warning"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="Standort wählen" />
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-card border border-border z-50"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <SelectItem value="none" className="text-muted-foreground">
                        Kein Standort
                      </SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.short_code || loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Mobile Actions - Touch-friendly */}
            <div className="flex flex-col gap-3 pt-3 border-t border-border sm:hidden">
              {order.email_sent && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewEmail();
                    }}
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    {t('orders.viewEmail')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResendEmail();
                    }}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Erneut senden
                      </>
                    )}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={order.status === 'confirmed' ? 'default' : 'outline'}
                  size="sm"
                  className="h-11 flex-col gap-0.5 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus('confirmed');
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px]">{t('orders.status.confirmed')}</span>
                </Button>
                <Button
                  variant={order.status === 'delivered' ? 'default' : 'outline'}
                  size="sm"
                  className="h-11 flex-col gap-0.5 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus('delivered');
                  }}
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-[10px]">{t('orders.status.delivered')}</span>
                </Button>
                <Button
                  variant={order.status === 'cancelled' ? 'destructive' : 'outline'}
                  size="sm"
                  className="h-11 flex-col gap-0.5 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus('cancelled');
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-[10px]">{t('orders.status.cancelled')}</span>
                </Button>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {order.email_sent && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEmail();
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('orders.viewEmail')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResendEmail();
                      }}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Erneut senden
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              <Select
                value={order.status}
                onValueChange={(value) => onUpdateStatus(value as Order['status'])}
              >
                <SelectTrigger className="w-36 bg-card" onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
                  <SelectItem value="confirmed">{t('orders.status.confirmed')}</SelectItem>
                  <SelectItem value="processing">{t('orders.status.processing')}</SelectItem>
                  <SelectItem value="shipped">{t('orders.status.shipped')}</SelectItem>
                  <SelectItem value="delivered">{t('orders.status.delivered')}</SelectItem>
                  <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}));

OrderItem.displayName = 'OrderItem';
