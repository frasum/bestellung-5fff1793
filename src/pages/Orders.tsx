import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout, useSidebarContext } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useOrders, useUpdateOrderStatus, useDeleteTestOrders, useUpdateOrderLocation, useResendOrderEmail, Order } from '@/hooks/useOrders';
import { useCartDrafts, useDeleteCartDraft, CartDraft } from '@/hooks/useCartDrafts';
import { useLocations } from '@/hooks/useLocations';
import { useOrganization } from '@/hooks/useOrganization';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths, Locale } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { Loader2, Search, ChevronRight, FileText, ShoppingCart, Smartphone, MapPin, Bell, AlertTriangle, Plus, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SimpleOrderTab } from '@/components/settings/SimpleOrderTab';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Extracted components
import {
  DateFilter,
  EasyOrderGroup,
  OrdersFilters,
  TestModeBanner,
  OrderItem,
  EasyOrderGroupCard,
  DraftCard,
  DeleteDraftDialog,
  DeleteGroupDialog,
  LoadDraftDialog,
  OrderEmailViewDialog,
  getLocationDisplayName,
} from '@/components/orders';

const localeMap: Record<string, Locale> = { de, en: enUS, fr };

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeLocation } = useLocationContext();
  const { data: locations } = useLocations();
  const { data: organizationId } = useOrganization();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  
  // Location filter state
  const [locationFilter, setLocationFilter] = useState<string>('active');
  const queryLocationId = useMemo(() => {
    if (locationFilter === 'all') return null;
    if (locationFilter === 'active') return activeLocation?.id;
    return locationFilter;
  }, [locationFilter, activeLocation?.id]);
  
  // Orders state
  const { data: orders, isLoading } = useOrders(queryLocationId, organizationId);
  const updateStatus = useUpdateOrderStatus();
  const updateLocation = useUpdateOrderLocation();
  const deleteTestOrders = useDeleteTestOrders();
  const resendEmail = useResendOrderEmail();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const locale = localeMap[i18n.language] || de;
  const highlightedOrderRef = useRef<HTMLDivElement>(null);
  
  // Drafts state
  const [draftsLocationFilter, setDraftsLocationFilter] = useState<string>('active');
  const showAllDraftLocations = draftsLocationFilter === 'all';
  const draftsQueryLocationId = useMemo(() => {
    if (draftsLocationFilter === 'all') return undefined;
    if (draftsLocationFilter === 'active') return activeLocation?.id;
    return draftsLocationFilter;
  }, [draftsLocationFilter, activeLocation?.id]);
  const { data: drafts, isLoading: draftsLoading } = useCartDrafts(draftsQueryLocationId, showAllDraftLocations);
  
  useEffect(() => {
    setLocationFilter('active');
    setDraftsLocationFilter('active');
  }, [activeLocation?.id]);
  
  const deleteDraft = useDeleteCartDraft();
  const { loadFromDraft, items: cartItems } = useCart();
  const [draftsSearchQuery, setDraftsSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<CartDraft | null>(null);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  
  // Tab state
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'drafts' ? 'drafts' : tabParam === 'simple-order' ? 'simple-order' : 'orders';

  // Organization test mode
  const { data: orgData } = useQuery({
    queryKey: ['organization-test-mode', user?.id],
    queryFn: async () => {
      if (!user?.id) return { name: 'Restaurant', testModeEnabled: false, testEmail: '' };
      const { data } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name, test_mode_enabled, test_email)')
        .eq('id', user.id)
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
  const hasActiveFilters = !!searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || locationFilter !== 'active';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setLocationFilter('active');
  };

  const testOrdersCount = useMemo(() => orders?.filter(order => order.is_test_order).length || 0, [orders]);
  const ordersWithoutLocation = useMemo(() => orders?.filter(order => !order.location_id) || [], [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        order.order_number.toLowerCase().includes(searchLower) ||
        order.suppliers?.name?.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        switch (dateFilter) {
          case 'today': matchesDate = isAfter(orderDate, startOfDay(now)) && isBefore(orderDate, endOfDay(now)); break;
          case 'week': matchesDate = isAfter(orderDate, subDays(now, 7)); break;
          case 'month': matchesDate = isAfter(orderDate, subMonths(now, 1)); break;
          case '3months': matchesDate = isAfter(orderDate, subMonths(now, 3)); break;
        }
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Group orders by supplier
  const groupedOrders = useMemo(() => {
    if (!filteredOrders.length) return new Map<string, Order[]>();
    const grouped = filteredOrders.reduce((acc, order) => {
      const supplierName = order.suppliers?.name || t('common.unknown');
      if (!acc.has(supplierName)) acc.set(supplierName, []);
      acc.get(supplierName)!.push(order);
      return acc;
    }, new Map<string, Order[]>());
    grouped.forEach((supplierOrders) => {
      supplierOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredOrders, t]);

  // Collapsible states
  const [openSuppliers, setOpenSuppliers] = useState<Set<string>>(new Set());
  const [openOrders, setOpenOrders] = useState<Set<string>>(new Set());
  const highlightedOrderId = searchParams.get('orderId');

  useEffect(() => {
    if (highlightedOrderId && orders && groupedOrders.size > 0) {
      const targetOrder = orders.find(o => o.id === highlightedOrderId);
      if (targetOrder) {
        const supplierName = targetOrder.suppliers?.name || t('common.unknown');
        setOpenSuppliers(prev => new Set([...prev, supplierName]));
        setOpenOrders(prev => new Set([...prev, highlightedOrderId]));
        setTimeout(() => highlightedOrderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        setTimeout(() => setSearchParams({}, { replace: true }), 2000);
      }
    }
  }, [highlightedOrderId, orders, groupedOrders, t, setSearchParams]);

  const toggleSupplier = (name: string) => setOpenSuppliers(prev => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const toggleOrder = (id: string) => setOpenOrders(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Drafts logic
  const getDraftTotal = (draft: CartDraft) => draft.items?.reduce((sum, item) => {
    if (item.article) return sum + Number(item.article.price) * (Number(item.article.packaging_unit) || 1) * item.quantity;
    return sum;
  }, 0) || 0;

  const filteredDrafts = drafts?.filter(draft => draft.name.toLowerCase().includes(draftsSearchQuery.toLowerCase())) || [];

  const { easyOrderGroups, regularDrafts } = useMemo(() => {
    const easyOrderDrafts = filteredDrafts.filter(d => d.name.startsWith('EasyOrder:'));
    const regularDrafts = filteredDrafts.filter(d => !d.name.startsWith('EasyOrder:'));
    const groupsMap = new Map<string, CartDraft[]>();
    easyOrderDrafts.forEach(draft => {
      const timeKey = Math.floor(new Date(draft.created_at).getTime() / 60000);
      const key = `${draft.employee_id || 'unknown'}-${timeKey}`;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(draft);
    });
    const groups: EasyOrderGroup[] = Array.from(groupsMap.entries()).map(([key, drafts]) => {
      const match = drafts[0].name.match(/^EasyOrder:\s*(.+?)(?:\s*\(|$)/);
      const employeeName = match ? match[1].trim() : 'Unbekannt';
      const supplierNames = drafts.map(draft => {
        const supplierMatch = draft.name.match(/\(([^)]+)\)$/);
        if (supplierMatch) return supplierMatch[1];
        const firstItem = draft.items?.find(i => i.article);
        return firstItem?.article?.suppliers?.name || 'Unbekannt';
      });
      return {
        key, employeeName, supplierNames, drafts,
        totalItems: drafts.reduce((sum, d) => sum + (d.items?.length || 0), 0),
        totalPrice: drafts.reduce((sum, d) => sum + getDraftTotal(d), 0),
        desiredDeliveryDate: drafts[0].desired_delivery_date,
        location: (drafts[0] as { location?: { id: string; name: string; short_code: string | null } }).location || null,
        createdAt: drafts[0].created_at,
      };
    });
    groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { easyOrderGroups: groups, regularDrafts };
  }, [filteredDrafts]);

  const [openEasyOrderGroups, setOpenEasyOrderGroups] = useState<Set<string>>(new Set());
  const toggleEasyOrderGroup = (key: string) => setOpenEasyOrderGroups(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  // Draft loading
  const loadGroupToCart = (group: EasyOrderGroup) => {
    if (cartItems.length > 0) {
      setSelectedDraft(group.drafts[0]);
      (window as unknown as { __pendingEasyOrderGroup?: EasyOrderGroup }).__pendingEasyOrderGroup = group;
      setLoadDialogOpen(true);
      return;
    }
    executeGroupLoad(group);
  };

  const executeGroupLoad = (group: EasyOrderGroup) => {
    const allItems = group.drafts.flatMap(d => d.items || []);
    const regularItems = allItems.filter(item => item.article && !item.is_free_text_item);
    const freeTextItems = allItems.filter(item => item.is_free_text_item && item.free_text_name);
    if (regularItems.length === 0 && freeTextItems.length === 0) {
      toast.error('Diese Vorbestellungen enthalten keine Artikel.');
      return;
    }
    const mappedFreeItems = freeTextItems.map(item => ({
      id: item.id, name: item.free_text_name!, unit: item.free_text_unit || 'Stk',
      quantity: item.quantity, supplier_id: item.supplier_id || '',
    }));
    const firstDraft = group.drafts[0];
    if (loadFromDraft) {
      loadFromDraft(
        regularItems.map(item => ({ article: item.article!, quantity: item.quantity })),
        firstDraft.desired_delivery_date, firstDraft.desired_time_window,
        firstDraft.location_id, firstDraft.employee_id, mappedFreeItems
      );
      group.drafts.forEach(draft => deleteDraft.mutate(draft.id));
      navigate('/cart');
    }
    setLoadDialogOpen(false);
    setSelectedDraft(null);
    (window as unknown as { __pendingEasyOrderGroup?: EasyOrderGroup }).__pendingEasyOrderGroup = undefined;
  };

  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<EasyOrderGroup | null>(null);
  const handleDeleteGroup = (group: EasyOrderGroup) => { setSelectedGroup(group); setDeleteGroupDialogOpen(true); };
  const confirmDeleteGroup = () => {
    selectedGroup?.drafts.forEach(draft => deleteDraft.mutate(draft.id));
    setDeleteGroupDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleDeleteDraft = (draft: CartDraft) => { setSelectedDraft(draft); setDeleteDialogOpen(true); };
  const confirmDeleteDraft = () => { selectedDraft && deleteDraft.mutate(selectedDraft.id); setDeleteDialogOpen(false); setSelectedDraft(null); };

  const handleLoadDraft = (draft: CartDraft) => {
    if (cartItems.length > 0) { setSelectedDraft(draft); setLoadDialogOpen(true); }
    else loadDraftToCart(draft);
  };

  const loadDraftToCart = (draft: CartDraft) => {
    const regularItems = draft.items?.filter(item => item.article && !item.is_free_text_item) || [];
    const freeTextItems = draft.items?.filter(item => item.is_free_text_item && item.free_text_name) || [];
    if (regularItems.length === 0 && freeTextItems.length === 0) {
      toast.error('Diese Vorbestellung enthält keine Artikel und kann nicht übernommen werden.');
      setLoadDialogOpen(false); setSelectedDraft(null); return;
    }
    const mappedFreeItems = freeTextItems.map(item => ({
      id: item.id, name: item.free_text_name!, unit: item.free_text_unit || 'Stk',
      quantity: item.quantity, supplier_id: item.supplier_id || '',
    }));
    if (loadFromDraft) {
      loadFromDraft(
        regularItems.map(item => ({ article: item.article!, quantity: item.quantity })),
        draft.desired_delivery_date, draft.desired_time_window,
        draft.location_id, draft.employee_id, mappedFreeItems
      );
      deleteDraft.mutate(draft.id);
      navigate('/cart');
    }
    setLoadDialogOpen(false); setSelectedDraft(null);
  };

  const handleTabChange = (value: string) => {
    if (value === 'drafts') setSearchParams({ tab: 'drafts' }, { replace: true });
    else if (value === 'simple-order') setSearchParams({ tab: 'simple-order' }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);

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
        <PageHeader activeTab={activeTab === 'orders' ? undefined : activeTab} />

        {ordersWithoutLocation.length > 0 && locations && locations.length > 1 && (
          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-warning">
                {ordersWithoutLocation.length} {ordersWithoutLocation.length === 1 ? 'Bestellung' : 'Bestellungen'} ohne Standort-Zuordnung
              </span>
              <span className="text-xs text-muted-foreground">(Filter auf "Alle Standorte" setzen um diese zu sehen)</span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-muted/50 border border-border rounded-md h-9">
            <TabsTrigger value="orders" className="flex items-center gap-2 text-sm h-8">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{t('orders.title')}</span>
              {orders && orders.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{orders.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2 text-sm h-8">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.drafts')}</span>
              {drafts && drafts.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  {drafts.some(d => d.name.startsWith('EasyOrder:')) && <Bell className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                  <Badge variant="secondary" className="text-xs">{drafts.length}</Badge>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="simple-order" className="flex items-center gap-2 text-sm h-8">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">EasyOrder</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            {orgData?.testModeEnabled && (
              <TestModeBanner
                testEmail={orgData.testEmail}
                testOrdersCount={testOrdersCount}
                onDeleteTestOrders={() => deleteTestOrders.mutate()}
                isDeleting={deleteTestOrders.isPending}
              />
            )}

            <OrdersFilters
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              dateFilter={dateFilter} setDateFilter={setDateFilter}
              locationFilter={locationFilter} setLocationFilter={setLocationFilter}
              locations={locations} activeLocation={activeLocation}
              hasActiveFilters={hasActiveFilters} clearFilters={clearFilters}
            />

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">{t('orders.noOrders')}</h2>
                <p className="text-muted-foreground mb-6">{t('orders.noOrdersDescription')}</p>
                <Button onClick={() => navigate('/suppliers')}>{t('orders.startOrder')}</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(groupedOrders.entries()).map(([supplierName, supplierOrders]) => (
                  <Collapsible key={supplierName} open={openSuppliers.has(supplierName)} onOpenChange={() => toggleSupplier(supplierName)}>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", openSuppliers.has(supplierName) && "rotate-90")} />
                          <span className="font-semibold text-foreground">{supplierName}</span>
                          <Badge variant="secondary" className="text-xs">{supplierOrders.length} {t('orders.orders')}</Badge>
                        </div>
                        <span className="font-bold text-foreground">
                          €{supplierOrders.reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2)}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-2">
                          {supplierOrders.map((order) => (
                            <OrderItem
                              key={order.id}
                              ref={order.id === highlightedOrderId ? highlightedOrderRef : undefined}
                              order={order}
                              isOpen={openOrders.has(order.id)}
                              onToggle={() => toggleOrder(order.id)}
                              onUpdateStatus={(status) => updateStatus.mutate({ orderId: order.id, status })}
                              onUpdateLocation={(locId) => updateLocation.mutate({ orderId: order.id, locationId: locId })}
                              onViewEmail={() => { setSelectedOrder(order); setEmailDialogOpen(true); }}
                              onResendEmail={() => resendEmail.mutate(order)}
                              isResending={resendEmail.isPending}
                              locations={locations}
                              locale={locale}
                              isHighlighted={order.id === highlightedOrderId ? true : false}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('drafts.searchPlaceholder')} value={draftsSearchQuery} onChange={(e) => setDraftsSearchQuery(e.target.value)} className="pl-9 h-11 sm:h-10" />
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
                      <SelectItem key={loc.id} value={loc.id}>{loc.short_code || loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {draftsLoading && <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

            {!draftsLoading && filteredDrafts.length === 0 && (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">{draftsSearchQuery ? t('drafts.noResults') : t('drafts.empty')}</h2>
                <p className="text-muted-foreground mb-6">{draftsSearchQuery ? t('drafts.noResultsDescription') : t('drafts.emptyDescription')}</p>
                {!draftsSearchQuery && <Button onClick={() => navigate('/suppliers')}>{t('drafts.browseArticles')}</Button>}
              </div>
            )}

            {!draftsLoading && filteredDrafts.length > 0 && (
              <div className="space-y-4">
                {easyOrderGroups.map((group) => (
                  <EasyOrderGroupCard
                    key={group.key}
                    group={group}
                    isOpen={openEasyOrderGroups.has(group.key)}
                    onToggle={() => toggleEasyOrderGroup(group.key)}
                    onLoadToCart={() => loadGroupToCart(group)}
                    onDelete={() => handleDeleteGroup(group)}
                    onLoadSingleDraft={handleLoadDraft}
                    locale={locale}
                  />
                ))}
                {regularDrafts.map((draft) => (
                  <DraftCard key={draft.id} draft={draft} onLoad={() => handleLoadDraft(draft)} onDelete={() => handleDeleteDraft(draft)} locale={locale} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="simple-order" className="mt-6"><SimpleOrderTab /></TabsContent>
        </Tabs>
      </div>

      <DeleteDraftDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} draft={selectedDraft} onConfirm={confirmDeleteDraft} />
      <LoadDraftDialog open={loadDialogOpen} onOpenChange={(open) => { setLoadDialogOpen(open); if (!open) (window as unknown as { __pendingEasyOrderGroup?: unknown }).__pendingEasyOrderGroup = undefined; }}
        onConfirm={() => {
          const pendingGroup = (window as unknown as { __pendingEasyOrderGroup?: EasyOrderGroup }).__pendingEasyOrderGroup;
          if (pendingGroup) executeGroupLoad(pendingGroup);
          else if (selectedDraft) loadDraftToCart(selectedDraft);
        }}
      />
      <DeleteGroupDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen} group={selectedGroup} onConfirm={confirmDeleteGroup} />
      <OrderEmailViewDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} order={selectedOrder} restaurantName={orgData?.name || 'Restaurant'} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => navigate('/suppliers')} size="lg" className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left"><p>{t('orders.newOrder')}</p></TooltipContent>
      </Tooltip>
    </DashboardLayout>
  );
};

export default Orders;
