import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrders, useUpdateOrderStatus, useDeleteTestOrders, useUpdateOrderLocation, Order } from '@/hooks/useOrders';
import { useCartDrafts, useDeleteCartDraft, CartDraft } from '@/hooks/useCartDrafts';
import { useLocations } from '@/hooks/useLocations';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths, Locale } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { Loader2, Package, CheckCircle2, Clock, Truck, XCircle, Eye, Search, X, ChevronDown, Trash2, FlaskConical, Filter, FileText, ShoppingCart, Calendar, Smartphone, MapPin, Bell, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimpleOrderTab } from '@/components/settings/SimpleOrderTab';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { OrderEmailViewDialog } from '@/components/orders/OrderEmailViewDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type DateFilter = 'all' | 'today' | 'week' | 'month' | '3months';

const localeMap: Record<string, Locale> = { de, en: enUS, fr };

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-success/20 text-success',
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
  const { data: locations } = useLocations();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  
  // Location filter state: 'all' = all locations (default), 'active' = current location, or specific location id
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  // Compute locationId for query based on filter
  const queryLocationId = useMemo(() => {
    if (locationFilter === 'all') return null;
    if (locationFilter === 'active') return activeLocation?.id;
    return locationFilter;
  }, [locationFilter, activeLocation?.id]);
  
  // Orders state
  const { data: orders, isLoading } = useOrders(queryLocationId);
  const updateStatus = useUpdateOrderStatus();
  const updateLocation = useUpdateOrderLocation();
  const deleteTestOrders = useDeleteTestOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const locale = localeMap[i18n.language] || de;
  const highlightedOrderRef = useRef<HTMLDivElement>(null);
  
  // Drafts state
  const [draftsLocationFilter, setDraftsLocationFilter] = useState<string>('all'); // 'all' or specific location id
  const showAllDraftLocations = draftsLocationFilter === 'all';
  const draftsQueryLocationId = draftsLocationFilter === 'all' ? undefined : draftsLocationFilter;
  const { data: drafts, isLoading: draftsLoading } = useCartDrafts(draftsQueryLocationId, showAllDraftLocations);
  const deleteDraft = useDeleteCartDraft();
  const { loadFromDraft, items: cartItems } = useCart();
  const [draftsSearchQuery, setDraftsSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<CartDraft | null>(null);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  
  // Tab state from URL
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'drafts' ? 'drafts' : tabParam === 'simple-order' ? 'simple-order' : 'orders';

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

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || locationFilter !== 'active';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setLocationFilter('active');
  };

  // Count test orders
  const testOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(order => order.is_test_order).length;
  }, [orders]);

  // Count orders without location
  const ordersWithoutLocation = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => !order.location_id);
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
      const supplierName = order.suppliers?.name || t('common.unknown');
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
  // Track highlighted order from URL
  const highlightedOrderId = searchParams.get('orderId');

  // Auto-expand supplier and order when navigating from dashboard
  useEffect(() => {
    if (highlightedOrderId && orders && groupedOrders.size > 0) {
      // Find the order and its supplier
      const targetOrder = orders.find(o => o.id === highlightedOrderId);
      if (targetOrder) {
        const supplierName = targetOrder.suppliers?.name || t('common.unknown');
        
        // Open the supplier group and the specific order
        setOpenSuppliers(prev => new Set([...prev, supplierName]));
        setOpenOrders(prev => new Set([...prev, highlightedOrderId]));
        
        // Scroll to the order after a short delay
        setTimeout(() => {
          highlightedOrderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Clear the URL parameter after scrolling
        setTimeout(() => {
          setSearchParams({}, { replace: true });
        }, 2000);
      }
    }
  }, [highlightedOrderId, orders, groupedOrders]);

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

  // Get location display name helper
  const getLocationDisplayName = (loc: { name: string; short_code: string | null }) => {
    return loc.short_code || loc.name;
  };

  // Drafts functions
  const filteredDrafts = drafts?.filter(draft => 
    draft.name.toLowerCase().includes(draftsSearchQuery.toLowerCase())
  ) || [];

  const handleDeleteDraft = (draft: CartDraft) => {
    setSelectedDraft(draft);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDraft = () => {
    if (selectedDraft) {
      deleteDraft.mutate(selectedDraft.id);
    }
    setDeleteDialogOpen(false);
    setSelectedDraft(null);
  };

  const handleLoadDraft = (draft: CartDraft) => {
    if (cartItems.length > 0) {
      setSelectedDraft(draft);
      setLoadDialogOpen(true);
    } else {
      loadDraftToCart(draft);
    }
  };

  const loadDraftToCart = (draft: CartDraft) => {
    if (draft.items && loadFromDraft) {
      loadFromDraft(
        draft.items.filter(item => item.article).map(item => ({
          article: item.article!,
          quantity: item.quantity,
        })),
        draft.desired_delivery_date,
        draft.desired_time_window,
        draft.location_id
      );
      
      // Vorbestellung nach dem Laden löschen
      deleteDraft.mutate(draft.id);
      
      navigate('/cart');
    }
    setLoadDialogOpen(false);
    setSelectedDraft(null);
  };

  const getDraftTotal = (draft: CartDraft) => {
    return draft.items?.reduce((sum, item) => {
      if (item.article) {
        return sum + Number(item.article.price) * item.quantity;
      }
      return sum;
    }, 0) || 0;
  };

  const getDraftItemCount = (draft: CartDraft) => {
    return draft.items?.length || 0;
  };

  const handleTabChange = (value: string) => {
    if (value === 'drafts') {
      setSearchParams({ tab: 'drafts' }, { replace: true });
    } else if (value === 'simple-order') {
      setSearchParams({ tab: 'simple-order' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
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
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('orders.title')}</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5 md:mt-1">{t('orders.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/suppliers?tab=articles')} className="h-10 sm:h-9">
            <Package className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('orders.newOrder')}</span>
          </Button>
        </div>

        {/* Warning for orders without location */}
        {ordersWithoutLocation.length > 0 && locations && locations.length > 1 && (
          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-warning">
                {ordersWithoutLocation.length} {ordersWithoutLocation.length === 1 ? 'Bestellung' : 'Bestellungen'} ohne Standort-Zuordnung
              </span>
              <span className="text-xs text-muted-foreground">
                (Filter auf "Alle Standorte" setzen um diese zu sehen)
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Orders Card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground mb-3">{t('dashboard.recentOrders')}</h2>
          {orders && orders.length > 0 ? (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    const supplierName = order.suppliers?.name || t('common.unknown');
                    setOpenSuppliers(prev => new Set([...prev, supplierName]));
                    setOpenOrders(prev => new Set([...prev, order.id]));
                    setTimeout(() => {
                      document.getElementById(`order-${order.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {order.suppliers?.name || t('common.unknown')}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 ${statusColors[order.status] || ''}`}
                        >
                          {t(`orders.status.${order.status}`)}
                        </Badge>
                        {order.location_id && locations && (() => {
                          const loc = locations.find(l => l.id === order.location_id);
                          return loc ? (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              <MapPin className="w-3 h-3 mr-0.5" />
                              {loc.short_code || loc.name}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'dd.MM.yy', { locale })}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap ml-2">
                    €{Number(order.total_amount).toLocaleString(i18n.language)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('orders.noOrders', 'Noch keine Bestellungen vorhanden')}
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t('orders.title')}</span>
              {orders && orders.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{orders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.drafts')}</span>
              {drafts && drafts.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  {drafts.some(d => d.name.startsWith('EasyOrder:')) && (
                    <Bell className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  )}
                  <Badge variant="secondary" className="text-xs">{drafts.length}</Badge>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="simple-order" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">EasyOrder</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab Content */}
          <TabsContent value="orders" className="space-y-6 mt-6">

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
                  <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('orders.testMode.deleteConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('orders.testMode.deleteConfirmDescription', { count: testOrdersCount })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTestOrders.mutate()}
                        className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        {/* Mobile Filters */}
        <div className="flex gap-2 sm:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('orders.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative">
                <Filter className="w-4 h-4" />
                {(statusFilter !== 'all' || dateFilter !== 'all' || locationFilter !== 'active') && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-card border border-border" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('orders.filterByStatus')}</label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Order['status'] | 'all')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('orders.filterByDate')}</label>
                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('orders.allDates')}</SelectItem>
                      <SelectItem value="today">{t('orders.today')}</SelectItem>
                      <SelectItem value="week">{t('orders.lastWeek')}</SelectItem>
                      <SelectItem value="month">{t('orders.lastMonth')}</SelectItem>
                      <SelectItem value="3months">{t('orders.last3Months')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {locations && locations.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('orders.filterByLocation')}</label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          {activeLocation ? getLocationDisplayName(activeLocation) : t('orders.currentLocation')}
                        </SelectItem>
                        <SelectItem value="all">{t('orders.allLocations')}</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {getLocationDisplayName(loc)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    {t('orders.clearFilters')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Desktop Filters */}
        <div className="hidden sm:flex gap-3">
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
            <SelectTrigger className="w-40 h-10">
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
            <SelectTrigger className="w-40 h-10">
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
          {locations && locations.length > 1 && (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40 h-10">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {locationFilter === 'active' 
                      ? (activeLocation ? getLocationDisplayName(activeLocation) : t('orders.currentLocation'))
                      : locationFilter === 'all'
                        ? t('orders.allLocations')
                        : getLocationDisplayName(locations.find(l => l.id === locationFilter) || { name: '', short_code: null })
                    }
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {activeLocation ? getLocationDisplayName(activeLocation) : t('orders.currentLocation')} ({t('orders.currentLocation')})
                </SelectItem>
                <SelectItem value="all">{t('orders.allLocations')}</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {getLocationDisplayName(loc)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors min-h-[56px]">
                      <div className="flex items-center gap-3">
                        <ChevronDown className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0",
                          isOpen && "rotate-180"
                        )} />
                        <span className="font-semibold text-foreground text-left">{supplierName}</span>
                        <Badge variant="secondary" className="shrink-0">{supplierOrders.length}</Badge>
                      </div>
                      <span className="font-bold text-foreground pl-8 sm:pl-0 text-left sm:text-right mt-1 sm:mt-0">€{totalAmount.toFixed(2)}</span>
                    </div>
                  </CollapsibleTrigger>
                  
                  {/* Orders for this Supplier */}
                  <CollapsibleContent>
                    <div className="space-y-2 pl-4 mt-2">
                      {supplierOrders.map((order) => {
                        const StatusIcon = statusIcons[order.status];
                        const isOrderOpen = openOrders.has(order.id);
                        const isHighlighted = order.id === highlightedOrderId;
                        
                        return (
                          <Collapsible
                            key={order.id}
                            open={isOrderOpen}
                            onOpenChange={() => toggleOrder(order.id)}
                          >
                            <div ref={isHighlighted ? highlightedOrderRef : undefined}>
                            {/* Mobile Order Header */}
                            <CollapsibleTrigger className="w-full sm:hidden">
                              <div className="flex flex-col gap-2 p-3 bg-card border border-border rounded-lg min-h-[64px]">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ChevronDown className={cn(
                                      "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
                                      isOrderOpen && "rotate-180"
                                    )} />
                                    <StatusIcon className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-medium text-foreground text-sm truncate max-w-[140px]">{order.order_number}</span>
                                  </div>
                                  <Badge className={cn(statusColors[order.status], "text-xs shrink-0")}>
                                    {t(`orders.status.${order.status}`)}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between pl-6 text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>
                                      {format(new Date(order.created_at), 'd. MMM', { locale })}
                                    </span>
                                    {order.is_test_order && (
                                      <span className="text-warning">
                                        <FlaskConical className="w-3 h-3 inline" />
                                      </span>
                                    )}
                                    {order.location_id && locations && (() => {
                                      const loc = locations.find(l => l.id === order.location_id);
                                      return loc ? (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          {loc.short_code || loc.name}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                  <span className="font-bold text-foreground">€{Number(order.total_amount).toFixed(2)}</span>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            {/* Desktop Order Header */}
                            <CollapsibleTrigger className="w-full hidden sm:block">
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
                                  <span className="text-xs text-muted-foreground">
                                    {order.order_items?.length || 0} {t('orders.items')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(order.created_at), 'EEEE d. MMM yyyy', { locale })}
                                  </span>
                                  {order.location_id && locations && (() => {
                                    const loc = locations.find(l => l.id === order.location_id);
                                    return loc ? (
                                      <Badge variant="outline" className="text-xs">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {loc.short_code || loc.name}
                                      </Badge>
                                    ) : null;
                                  })()}
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
                                        onValueChange={(value) => {
                                          updateLocation.mutate({ 
                                            orderId: order.id, 
                                            locationId: value === 'none' ? null : value 
                                          });
                                        }}
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
                                    <Button
                                      variant="outline"
                                      className="w-full h-11 justify-start"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewEmail(order);
                                      }}
                                    >
                                      <Eye className="w-5 h-5 mr-2" />
                                      {t('orders.viewEmail')}
                                    </Button>
                                  )}
                                  <div className="grid grid-cols-3 gap-2">
                                    <Button
                                      variant={order.status === 'confirmed' ? 'default' : 'outline'}
                                      size="sm"
                                      className="h-11 flex-col gap-0.5 px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus.mutate({ orderId: order.id, status: 'confirmed' });
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
                                        updateStatus.mutate({ orderId: order.id, status: 'delivered' });
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
                                        updateStatus.mutate({ orderId: order.id, status: 'cancelled' });
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
                            </div>
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
          </TabsContent>

          {/* Drafts Tab Content */}
          <TabsContent value="drafts" className="space-y-6 mt-6">
            {/* Search and Location Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('drafts.searchPlaceholder')}
                  value={draftsSearchQuery}
                  onChange={(e) => setDraftsSearchQuery(e.target.value)}
                  className="pl-9 h-11 sm:h-10"
                />
              </div>
              {locations && locations.length > 1 && (
                <Select value={draftsLocationFilter} onValueChange={setDraftsLocationFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-11 sm:h-10">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('orders.allLocations', 'Alle Standorte')}</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.short_code || loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Loading State */}
            {draftsLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty State */}
            {!draftsLoading && filteredDrafts.length === 0 && (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {draftsSearchQuery ? t('drafts.noResults') : t('drafts.empty')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {draftsSearchQuery ? t('drafts.noResultsDescription') : t('drafts.emptyDescription')}
                </p>
                {!draftsSearchQuery && (
                  <Button onClick={() => navigate('/suppliers?tab=articles')}>
                    {t('drafts.browseArticles')}
                  </Button>
                )}
              </div>
            )}

            {/* Drafts List */}
            {!draftsLoading && filteredDrafts.length > 0 && (
              <div className="grid gap-3 sm:gap-4">
                {filteredDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Draft Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {draft.name.startsWith('EasyOrder:') ? (
                            <div className="flex items-center gap-1.5">
                              <Smartphone className="w-5 h-5 text-primary" />
                              <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                            </div>
                          ) : (
                            <FileText className="w-5 h-5 text-primary" />
                          )}
                          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                            {draft.name}
                          </h3>
                          {/* Location Badge */}
                          {(draft as { location?: { id: string; name: string; short_code: string | null } }).location && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              <MapPin className="w-3 h-3 mr-1" />
                              {(draft as { location?: { id: string; name: string; short_code: string | null } }).location!.short_code || (draft as { location?: { id: string; name: string; short_code: string | null } }).location!.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {getDraftItemCount(draft)} {t('drafts.items')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {format(new Date(draft.updated_at), 'dd.MM.yy', { locale })}
                          </span>
                          {draft.desired_delivery_date && (
                            <span className="flex items-center gap-1 text-primary">
                              📅 {format(new Date(draft.desired_delivery_date), 'dd.MM.', { locale })}
                              {draft.desired_time_window && (
                                <span className="ml-1">
                                  🕐 {draft.desired_time_window === 'flexible' ? t('checkout.flexible') : draft.desired_time_window}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {draft.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {draft.notes}
                          </p>
                        )}
                      </div>

                      {/* Price & Actions Row */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                        <div>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">
                            €{getDraftTotal(draft).toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('drafts.total')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 sm:h-9"
                            onClick={() => handleLoadDraft(draft)}
                          >
                            <ShoppingCart className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t('drafts.loadToCart')}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDraft(draft)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    {draft.items && draft.items.length > 0 && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {draft.items.slice(0, 4).map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs sm:text-sm"
                            >
                              {item.quantity}x {item.article?.name || 'Unknown'}
                            </span>
                          ))}
                          {draft.items.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs sm:text-sm text-muted-foreground">
                              +{draft.items.length - 4} {t('drafts.more')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Simple Order Tab Content */}
          <TabsContent value="simple-order" className="mt-6">
            <SimpleOrderTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Draft Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drafts.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('drafts.deleteDescription', { name: selectedDraft?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDraft}
              className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load Draft Confirmation Dialog */}
      <AlertDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drafts.loadTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('drafts.loadDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDraft && loadDraftToCart(selectedDraft)}
              className="w-full sm:w-auto h-10 sm:h-9"
            >
              {t('drafts.replaceCart')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
