import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrders, useUpdateOrderStatus, Order } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Loader2, Package, Mail, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';

const statusConfig: Record<Order['status'], { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-warning/20 text-warning', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500/20 text-blue-500', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-purple-500/20 text-purple-500', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-cyan-500/20 text-cyan-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-success/20 text-success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/20 text-destructive', icon: XCircle },
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">View and manage your order history</p>
          </div>
          <Button onClick={() => navigate('/articles')}>
            <Package className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start by browsing articles and placing your first order</p>
            <Button onClick={() => navigate('/articles')}>Browse Articles</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 sm:p-6 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <StatusIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{order.order_number}</h3>
                            <Badge className={statusConfig[order.status].color}>
                              {statusConfig[order.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.suppliers?.name} • {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {order.email_sent && (
                          <div className="flex items-center gap-1 text-sm text-success">
                            <Mail className="w-4 h-4" />
                            <span className="hidden sm:inline">Email sent</span>
                          </div>
                        )}
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateStatus.mutate({ orderId: order.id, status: value as Order['status'] })}
                        >
                          <SelectTrigger className="w-36 bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border border-border z-50">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 sm:p-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {order.order_items?.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                          <span className="text-sm text-foreground truncate">{item.article_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                      {(order.order_items?.length || 0) > 6 && (
                        <div className="flex items-center justify-center bg-muted/30 rounded-lg px-3 py-2">
                          <span className="text-sm text-muted-foreground">
                            +{(order.order_items?.length || 0) - 6} more items
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        {order.order_items?.length} items • {order.delivery_address.split('\n')[0]}
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        €{Number(order.total_amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
