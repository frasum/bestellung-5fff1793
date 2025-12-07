import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrders, useUpdateOrderStatus, useDeleteTestOrders, Order } from '@/hooks/useOrders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { Loader2, Package, CheckCircle2, Clock, Truck, XCircle, Eye, Search, X, ChevronDown, Trash2, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OrderEmailViewDialog } from '@/components/orders/OrderEmailViewDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type DateFilter = 'all' | 'today' | 'week' | 'month' | '3months';

const localeMap = { de, en: enUS, fr };

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-blue-500/20 text-blue-500',
  processing: 'bg-purple-500/20 text-purple-500',
  shipped: 'bg-cyan-500/20 text-cyan-500',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

const statusIcons: Record<Order['status'], typeof Clock> = {
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeLocation } = useLocationContext();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: orders, isLoading } = useOrders(activeLocation?.id);
  const updateStatus = useUpdateOrderStatus();
  const deleteTestOrders = useDeleteTestOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const locale = localeMap[i18n.language as keyof typeof localeMap] || de;

  // Fetch organization info for test mode
  const { data: orgData } = useQuery({
    queryKey: ['organization-test-mode', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name, test_mode_enabled, test_email)')
        .eq('id', user?.id)
        .maybeSingle();
      return {
        name: data?.organizations?.name || 'Restaurant',
        testModeEnabled: data?.organizations?.test_mode_enabled || false,
        testEmail: data?.organizations?.test_email || '',
      };
    },
    enabled: !!user?.id,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Count test orders
  const testOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(order => order.is_test_order).length;
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter((order) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.suppliers?.name?.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case 'today':
            matchesDate = isAfter(orderDate, startOfDay(now)) && isBefore(orderDate, endOfDay(now));
            break;
          case 'week':
            matchesDate = isAfter(orderDate, subDays(now, 7));
            break;
          case 'month':
            matchesDate = isAfter(orderDate, subMonths(now, 1));
            break;
          case '3months':
            matchesDate = isAfter(orderDate, subMonths(now, 3));
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Group orders by supplier and sort by date within each group
  const groupedOrders = useMemo(() => {
    if (!filteredOrders.length) return new Map<string, Order[]>();
    
    const grouped = filteredOrders.reduce((acc, order) => {
      const supplierName = order.suppliers?.name || 'Unbekannt';
      if (!acc.has(supplierName)) {
        acc.set(supplierName, []);
      }
      acc.get(supplierName)!.push(order);
      return acc;
    }, new Map<string, Order[]>());
    
    // Sort orders within each group by date (newest first)
    grouped.forEach((supplierOrders) => {
      supplierOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    
    // Sort suppliers alphabetically
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredOrders]);

  // Track which supplier groups are open (default: all closed)
  const [openSuppliers, setOpenSuppliers] = useState<Set<string>>(new Set());
  // Track which individual orders are open (default: all closed)
  const [openOrders, setOpenOrders] = useState<Set<string>>(new Set());

  const toggleSupplier = (supplierName: string) => {
    const newOpen = new Set(openSuppliers);
    if (newOpen.has(supplierName)) {
      newOpen.delete(supplierName);
    } else {
      newOpen.add(supplierName);
    }
    setOpenSuppliers(newOpen);
  };

  const toggleOrder = (orderId: string) => {
    const newOpen = new Set(openOrders);
    if (newOpen.has(orderId)) {
      newOpen.delete(orderId);
    } else {
      newOpen.add(orderId);
    }
    setOpenOrders(newOpen);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleViewEmail = (order: Order) => {
    setSelectedOrder(order);
    setEmailDialogOpen(true);
  };

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
            <h1 className="text-3xl font-bold text-foreground">{t('orders.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('orders.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/articles')}>
            <Package className="w-4 h-4 mr-2" />
            {t('orders.newOrder')}
          </Button>
        </div>

        {/* Test Mode Banner */}
        {orgData?.testModeEnabled && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">{t('orders.testMode.banner')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('orders.testMode.bannerDescription', { email: orgData.testEmail })}
                  </p>
                </div>
              </div>
              {testOrdersCount > 0 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('orders.testMode.deleteAll')} ({testOrdersCount})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('orders.testMode.deleteConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('orders.testMode.deleteConfirmDescription', { count: testOrdersCount })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTestOrders.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteTestOrders.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('orders.testMode.noTestOrders')}
                </span>
              )}
            </div>
          </div>
        )}
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('orders.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Order['status'] | 'all')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('orders.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
              <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
              <SelectItem value="confirmed">{t('orders.status.confirmed')}</SelectItem>
              <SelectItem value="processing">{t('orders.status.processing')}</SelectItem>
              <SelectItem value="shipped">{t('orders.status.shipped')}</SelectItem>
              <SelectItem value="delivered">{t('orders.status.delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('orders.filterByDate')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('orders.allDates')}</SelectItem>
              <SelectItem value="today">{t('orders.today')}</SelectItem>
              <SelectItem value="week">{t('orders.lastWeek')}</SelectItem>
              <SelectItem value="month">{t('orders.lastMonth')}</SelectItem>
              <SelectItem value="3months">{t('orders.last3Months')}</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('orders.noOrders')}</h2>
            <p className="text-muted-foreground mb-6">{t('orders.noOrdersDescription')}</p>
            <Button onClick={() => navigate('/articles')}>{t('orders.browseArticles')}</Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('orders.noResults')}</h2>
            <p className="text-muted-foreground mb-6">{t('orders.noResultsDescription')}</p>
            <Button variant="outline" onClick={clearFilters}>{t('orders.clearFilters')}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(groupedOrders.entries()).map(([supplierName, supplierOrders]) => {
              const isOpen = openSuppliers.has(supplierName);
              const totalAmount = supplierOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
              
              return (
                <Collapsible
                  key={supplierName}
                  open={isOpen}
                  onOpenChange={() => toggleSupplier(supplierName)}
                >
                  {/* Supplier Header */}
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <ChevronDown className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform duration-200",
                          isOpen && "rotate-180"
                        )} />
                        <span className="font-semibold text-foreground">{supplierName}</span>
                        <Badge variant="secondary">{supplierOrders.length} {t('orders.ordersCount')}</Badge>
                      </div>
                      <span className="font-bold text-foreground">€{totalAmount.toFixed(2)}</span>
                    </div>
                  </CollapsibleTrigger>
                  
                  {/* Orders for this Supplier */}
                  <CollapsibleContent>
                    <div className="space-y-2 pl-4 mt-2">
                      {supplierOrders.map((order) => {
                        const StatusIcon = statusIcons[order.status];
                        const isOrderOpen = openOrders.has(order.id);
                        
                        return (
                          <Collapsible
                            key={order.id}
                            open={isOrderOpen}
                            onOpenChange={() => toggleOrder(order.id)}
                          >
                            {/* Compact Order Header */}
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <ChevronDown className={cn(
                                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                    isOrderOpen && "rotate-180"
                                  )} />
                                  <StatusIcon className="w-4 h-4 text-primary" />
                                  <span className="font-medium text-foreground">{order.order_number}</span>
                                  {order.is_test_order && (
                                    <Badge className="bg-warning/20 text-warning text-xs">
                                      <FlaskConical className="w-3 h-3 mr-1" />
                                      {t('orders.testMode.badge')}
                                    </Badge>
                                  )}
                                  <Badge className={cn(statusColors[order.status], "text-xs")}>
                                    {t(`orders.status.${order.status}`)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground hidden sm:inline">
                                    {order.order_items?.length || 0} {t('orders.items')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground hidden sm:inline">
                                    {format(new Date(order.created_at), 'EEEE d. MMM yyyy', { locale })}
                                  </span>
                                  <span className="font-bold text-foreground">€{Number(order.total_amount).toFixed(2)}</span>
                                </div>
                              </div>
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
                                        {item.quantity} {item.unit} • €{Number(item.total_price).toFixed(2)}
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
                                
                                {/* Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <div className="flex items-center gap-2">
                                    {order.email_sent && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewEmail(order);
                                        }}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        {t('orders.viewEmail')}
                                      </Button>
                                    )}
                                  </div>
                                  <Select
                                    value={order.status}
                                    onValueChange={(value) => updateStatus.mutate({ orderId: order.id, status: value as Order['status'] })}
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
                          </Collapsible>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <OrderEmailViewDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        order={selectedOrder}
        restaurantName={orgData?.name || 'Restaurant'}
      />
    </DashboardLayout>
  );
};

export default Orders;
