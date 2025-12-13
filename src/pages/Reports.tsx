import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrders } from '@/hooks/useOrders';
import { useSupplierAnnualRevenue } from '@/hooks/useSupplierAnnualRevenue';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useArticles } from '@/hooks/useArticles';
import { useInventorySessions, useInventoryItems } from '@/hooks/useInventory';
import { useLocations } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Download, TrendingUp, TrendingDown, Euro, ShoppingCart, Users, Loader2, Package, BarChart3, ClipboardList, ChevronRight, MapPin, Smartphone, User } from 'lucide-react';
import { InventoryTab } from '@/components/reports/InventoryTab';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(262, 83%, 58%)'];

// Recent Orders Card Component
const RecentOrdersCard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();
  const { data: locations } = useLocations();
  const [openOrders, setOpenOrders] = useState<Set<string>>(new Set());
  
  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return orders.slice(0, 5);
  }, [orders]);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    confirmed: 'bg-success/20 text-success',
    processing: 'bg-purple-500/20 text-purple-500',
    shipped: 'bg-cyan-500/20 text-cyan-500',
    delivered: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{t('dashboard.recentOrders')}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="text-xs">
            {t('common.viewAll', 'Alle anzeigen')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((order) => {
              const isExpanded = openOrders.has(order.id);
              return (
                <Collapsible
                  key={order.id}
                  open={isExpanded}
                  onOpenChange={() => {
                    setOpenOrders(prev => {
                      const next = new Set(prev);
                      if (next.has(order.id)) {
                        next.delete(order.id);
                      } else {
                        next.add(order.id);
                      }
                      return next;
                    });
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-2.5 bg-muted/30 hover:bg-muted/50 rounded-md transition-colors text-left">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ChevronRight className={cn("w-4 h-4 shrink-0 transition-transform text-muted-foreground", isExpanded && "rotate-90")} />
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
                            {order.employees?.name ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700">
                                <Smartphone className="w-3 h-3 mr-0.5" />
                                {order.employees.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                                <User className="w-3 h-3 mr-0.5" />
                                Admin
                              </Badge>
                            )}
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
                            {format(new Date(order.created_at), 'dd.MM.yy, HH:mm')}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-foreground whitespace-nowrap ml-2">
                        €{Number(order.total_amount).toLocaleString(i18n.language)}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-1 ml-6 p-3 bg-muted/20 rounded-md space-y-1.5">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm gap-2">
                            <span className="text-foreground truncate">{item.article_name}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {item.quantity} {item.unit} • €{Number(item.total_price).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">{t('orders.noItems', 'Keine Artikel')}</span>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t('orders.noOrders', 'Noch keine Bestellungen vorhanden')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Overview KPIs Component
const QuickOverviewKPIs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: sessions, isLoading: sessionsLoading } = useInventorySessions();
  
  // Find last completed inventory session
  const lastCompletedSession = useMemo(() => {
    if (!sessions) return null;
    return sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0];
  }, [sessions]);
  
  const { data: inventoryItems } = useInventoryItems(lastCompletedSession?.id || '');
  
  // Calculate KPIs
  const kpis = useMemo(() => {
    const activeSuppliers = suppliers?.filter(s => s.is_active).length || 0;
    const activeArticles = articles?.filter(a => a.is_active).length || 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
    
    // Calculate inventory value
    let inventoryValue = 0;
    if (inventoryItems) {
      inventoryValue = inventoryItems.reduce((sum, item) => {
        const total = (item.storage_1 || 0) + (item.storage_2 || 0);
        return sum + (total * (item.unit_price || 0));
      }, 0);
    }
    
    return { activeSuppliers, activeArticles, pendingOrders, inventoryValue };
  }, [suppliers, articles, orders, inventoryItems]);
  
  const isLoading = suppliersLoading || articlesLoading || ordersLoading || sessionsLoading;
  
  const kpiCards = [
    { 
      label: t('reports.totalSuppliers', 'Lieferanten'), 
      value: kpis.activeSuppliers, 
      icon: Users,
      format: 'number',
      href: '/suppliers'
    },
    { 
      label: t('reports.totalArticles', 'Artikel'), 
      value: kpis.activeArticles, 
      icon: Package,
      format: 'number',
      href: '/suppliers?tab=articles'
    },
    { 
      label: t('reports.pendingOrders', 'Offene Bestellungen'), 
      value: kpis.pendingOrders, 
      icon: ShoppingCart,
      format: 'number',
      href: '/orders'
    },
    { 
      label: t('reports.inventoryValue', 'Inventurwert'), 
      value: kpis.inventoryValue, 
      icon: ClipboardList,
      format: 'currency',
      href: '/reports?tab=inventory'
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{t('reports.quickOverview', 'Schnellübersicht')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <Card 
            key={kpi.label} 
            className="relative overflow-hidden cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(kpi.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-xl font-semibold">
                      {kpi.format === 'currency' 
                        ? `€${kpi.value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        : kpi.value.toLocaleString('de-DE')
                      }
                    </p>
                  )}
                </div>
                <kpi.icon className="h-8 w-8 text-muted-foreground/20" />
              </div>
              {kpi.label === t('reports.inventoryValue', 'Inventurwert') && lastCompletedSession && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('reports.lastInventory', 'Letzte Inventur')}: {format(new Date(lastCompletedSession.completed_at || lastCompletedSession.created_at), 'dd.MM.yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Reports = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: orders, isLoading } = useOrders();
  const { data: annualRevenue, isLoading: revenueLoading } = useSupplierAnnualRevenue();
  const [timeRange, setTimeRange] = useState('6');

  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    if (value === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!orders) return null;

    const monthsAgo = parseInt(timeRange);
    const startDate = startOfMonth(subMonths(new Date(), monthsAgo - 1));
    const endDate = endOfMonth(new Date());

    const filteredOrders = orders.filter((order) =>
      isWithinInterval(new Date(order.created_at), { start: startDate, end: endDate })
    );

    // Monthly spending
    const monthlyData: Record<string, number> = {};
    for (let i = monthsAgo - 1; i >= 0; i--) {
      const month = format(subMonths(new Date(), i), 'MMM yyyy');
      monthlyData[month] = 0;
    }

    filteredOrders.forEach((order) => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      if (monthlyData[month] !== undefined) {
        monthlyData[month] += Number(order.total_amount);
      }
    });

    const monthlySpending = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100,
    }));

    // Supplier breakdown
    const supplierTotals: Record<string, { name: string; amount: number; orders: number }> = {};
    filteredOrders.forEach((order) => {
      const supplierId = order.supplier_id;
      const supplierName = order.suppliers?.name || 'Unknown';
      if (!supplierTotals[supplierId]) {
        supplierTotals[supplierId] = { name: supplierName, amount: 0, orders: 0 };
      }
      supplierTotals[supplierId].amount += Number(order.total_amount);
      supplierTotals[supplierId].orders += 1;
    });

    const supplierBreakdown = Object.values(supplierTotals)
      .sort((a, b) => b.amount - a.amount)
      .map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] }));

    // Order status breakdown
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const statusBreakdown = Object.entries(statusCounts).map(([status, count], i) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: COLORS[i % COLORS.length],
    }));

    // Calculate totals and trends
    const totalSpent = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Previous period comparison
    const prevStartDate = startOfMonth(subMonths(startDate, monthsAgo));
    const prevEndDate = endOfMonth(subMonths(endDate, monthsAgo));
    const prevOrders = orders.filter((order) =>
      isWithinInterval(new Date(order.created_at), { start: prevStartDate, end: prevEndDate })
    );
    const prevTotalSpent = prevOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const spendingChange = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100 : 0;

    // Top articles
    const articleCounts: Record<string, { name: string; quantity: number; spent: number }> = {};
    filteredOrders.forEach((order) => {
      order.order_items?.forEach((item) => {
        if (!articleCounts[item.article_id]) {
          articleCounts[item.article_id] = { name: item.article_name, quantity: 0, spent: 0 };
        }
        articleCounts[item.article_id].quantity += item.quantity;
        articleCounts[item.article_id].spent += Number(item.total_price);
      });
    });

    const topArticles = Object.values(articleCounts)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);

    return {
      monthlySpending,
      supplierBreakdown,
      statusBreakdown,
      totalSpent,
      totalOrders,
      avgOrderValue,
      spendingChange,
      topArticles,
      filteredOrders,
    };
  }, [orders, timeRange]);

  const exportToCSV = () => {
    if (!stats?.filteredOrders) return;

    const headers = [t('orders.orderDetails'), t('common.date'), t('articles.supplier'), t('orders.items'), t('common.total'), t('common.status')];
    const rows = stats.filteredOrders.map((order) => [
      order.order_number,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
      order.suppliers?.name || t('common.noData'),
      order.order_items?.length || 0,
      `€${Number(order.total_amount).toFixed(2)}`,
      order.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bestellung-bericht-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('reports.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('reports.description')}</p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full h-10 sm:h-9 sm:w-auto p-1 bg-muted/50 border border-border rounded-md">
            <TabsTrigger 
              value="overview" 
              className="flex-1 sm:flex-initial h-8 gap-2 px-4 text-sm font-medium data-[state=active]:bg-background"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('reports.overview')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="inventur" 
              className="flex-1 sm:flex-initial h-8 gap-2 px-4 text-sm font-medium data-[state=active]:bg-background"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t('reports.inventoryTab')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Quick Overview KPIs */}
            <QuickOverviewKPIs />

            {/* Recent Orders */}
            <RecentOrdersCard />
            
            {/* Time Range & Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-40 h-9 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="3">{t('reports.months', { count: 3 })}</SelectItem>
                  <SelectItem value="6">{t('reports.months', { count: 6 })}</SelectItem>
                  <SelectItem value="12">{t('reports.months', { count: 12 })}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={exportToCSV} disabled={!stats?.filteredOrders?.length} className="h-9 w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                {t('export.csv')}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !stats || stats.totalOrders === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-md">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">{t('common.noData')}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('orders.noOrdersDescription')}
                </p>
                <Button onClick={() => navigate('/articles')}>{t('orders.browseArticles')}</Button>
              </div>
            ) : (
              <>
                {/* KPI Cards - 2x2 on mobile, 4 cols on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Euro className="w-5 h-5 text-muted-foreground/50" />
                        {stats.spendingChange !== 0 && (
                          <div className={`flex items-center gap-0.5 text-xs ${stats.spendingChange > 0 ? 'text-destructive' : 'text-success'}`}>
                            {stats.spendingChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{Math.abs(stats.spendingChange).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xl font-semibold text-foreground mt-2">
                        €{stats.totalSpent.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('reports.totalSpent')}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <ShoppingCart className="w-5 h-5 text-muted-foreground/50" />
                      <p className="text-xl font-semibold text-foreground mt-2">{stats.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">{t('reports.orderCount')}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <Euro className="w-5 h-5 text-muted-foreground/50" />
                      <p className="text-xl font-semibold text-foreground mt-2">€{stats.avgOrderValue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{t('reports.avgOrderValue')}</p>
                    </CardContent>
                  </Card>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <Users className="w-5 h-5 text-muted-foreground/50" />
                      <p className="text-xl font-semibold text-foreground mt-2">{stats.supplierBreakdown.length}</p>
                      <p className="text-xs text-muted-foreground">{t('reports.activeSuppliers')}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Monthly Spending Chart */}
                  <Card>
                    <CardHeader className="pb-2 border-b border-border">
                      <CardTitle className="text-sm font-semibold">{t('reports.monthlySpending')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.monthlySpending} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                              tickFormatter={(value) => value.slice(0, 3)}
                              interval={0}
                            />
                            <YAxis 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `€${v}`}
                              width={45}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ausgaben']}
                            />
                            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supplier Breakdown */}
                  <Card>
                    <CardHeader className="pb-2 border-b border-border">
                      <CardTitle className="text-sm font-semibold">{t('reports.supplierSpending')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Mobile: Stacked layout, Desktop: Side by side */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="h-48 w-full sm:w-1/2">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.supplierBreakdown}
                                dataKey="amount"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                              >
                                {stats.supplierBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                }}
                                formatter={(value: number) => `€${value.toFixed(2)}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full sm:flex-1 grid grid-cols-2 sm:grid-cols-1 gap-2">
                          {stats.supplierBreakdown.slice(0, 6).map((supplier, i) => (
                            <div key={i} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" style={{ backgroundColor: supplier.color }} />
                                <span className="text-foreground truncate">{supplier.name}</span>
                              </div>
                              <span className="text-muted-foreground shrink-0">€{supplier.amount.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Row */}
                <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Spending Trend */}
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg">{t('reports.spendingTrend')}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6 pb-4">
                      <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={stats.monthlySpending} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                              tickFormatter={(value) => value.slice(0, 3)}
                              interval={0}
                            />
                            <YAxis 
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `€${v}`}
                              width={45}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ausgaben']}
                            />
                            <Line
                              type="monotone"
                              dataKey="amount"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Articles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('reports.topArticles')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.topArticles.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>
                        ) : (
                          stats.topArticles.map((article, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{article.name}</p>
                                  <p className="text-xs text-muted-foreground">{article.quantity} Einheiten bestellt</p>
                                </div>
                              </div>
                              <span className="font-semibold text-foreground">€{article.spent.toFixed(2)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Supplier Annual Revenue Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Lieferanten-Jahresumsätze</h2>
                      <p className="text-sm text-muted-foreground">Basierend auf Lieferanten-Angaben im Portal (365 Tage)</p>
                    </div>
                    {annualRevenue && annualRevenue.suppliers.length > 0 && (
                      <Button
                        variant="outline"
                        className="h-10 sm:h-9"
                        onClick={() => {
                          const headers = ['Lieferant', 'Artikel gesamt', 'Mit Wert', 'Jahresumsatz', 'Vollständigkeit'];
                          const rows = annualRevenue.suppliers.map((s) => [
                            s.name,
                            s.articleCount,
                            s.articlesWithValue,
                            `€${s.totalRevenue.toFixed(2)}`,
                            `${s.articleCount > 0 ? ((s.articlesWithValue / s.articleCount) * 100).toFixed(0) : 0}%`,
                          ]);
                          const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `lieferanten-jahresumsaetze-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                          link.click();
                        }}
                      >
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">CSV</span>
                      </Button>
                    )}
                  </div>

                  {revenueLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : !annualRevenue || annualRevenue.suppliers.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Noch keine Jahresumsätze erfasst</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* KPI Cards */}
                      <Card>
                        <CardContent className="p-6">
                          <Euro className="w-8 h-8 text-primary" />
                          <p className="text-2xl font-bold text-foreground mt-4">
                            €{annualRevenue.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-muted-foreground">Gesamt Jahresumsatz</p>
                          <div className="mt-3 flex items-center gap-2">
                            <Progress value={annualRevenue.completeness} className="flex-1" />
                            <span className="text-xs text-muted-foreground">{annualRevenue.completeness.toFixed(0)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {annualRevenue.totalWithValue} von {annualRevenue.totalArticles} Artikeln erfasst
                          </p>
                        </CardContent>
                      </Card>

                      {/* Top Suppliers Chart */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg">Top 10 Lieferanten nach Jahresumsatz</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={annualRevenue.suppliers.slice(0, 10)}
                                layout="vertical"
                                margin={{ left: 60, right: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                  type="number"
                                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                  fontSize={12}
                                  tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                  fontSize={11}
                                  width={55}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                  }}
                                  formatter={(value: number) => [`€${value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 'Jahresumsatz']}
                                />
                                <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Supplier Table/Cards */}
                  {annualRevenue && annualRevenue.suppliers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Übersicht aller Lieferanten</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-3">
                          {annualRevenue.suppliers.map((supplier) => {
                            const completeness = supplier.articleCount > 0
                              ? (supplier.articlesWithValue / supplier.articleCount) * 100
                              : 0;
                            return (
                              <div key={supplier.id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex justify-between items-start">
                                  <p className="font-medium">{supplier.name}</p>
                                  <span className="font-semibold text-primary">
                                    €{supplier.totalRevenue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>{supplier.articlesWithValue}/{supplier.articleCount} Artikel</span>
                                  <div className="flex items-center gap-2">
                                    <Progress value={completeness} className="w-12" />
                                    <span className={completeness === 100 ? 'text-green-600' : ''}>{completeness.toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden sm:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Lieferant</TableHead>
                                <TableHead className="text-right">Artikel</TableHead>
                                <TableHead className="text-right">Erfasst</TableHead>
                                <TableHead className="text-right">Jahresumsatz</TableHead>
                                <TableHead className="text-right">Vollständigkeit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {annualRevenue.suppliers.map((supplier) => {
                                const completeness = supplier.articleCount > 0
                                  ? (supplier.articlesWithValue / supplier.articleCount) * 100
                                  : 0;
                                return (
                                  <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell className="text-right">{supplier.articleCount}</TableCell>
                                    <TableCell className="text-right">
                                      {supplier.articlesWithValue}/{supplier.articleCount}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                      €{supplier.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Progress value={completeness} className="w-16" />
                                        <span className={`text-sm ${completeness === 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                          {completeness.toFixed(0)}%
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventur" className="mt-4">
            <InventoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
