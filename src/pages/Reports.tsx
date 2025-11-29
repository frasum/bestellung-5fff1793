import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Download, TrendingUp, TrendingDown, Euro, ShoppingCart, Users, Loader2 } from 'lucide-react';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();
  const [timeRange, setTimeRange] = useState('6');

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

    const headers = ['Order Number', 'Date', 'Supplier', 'Items', 'Total', 'Status'];
    const rows = stats.filteredOrders.map((order) => [
      order.order_number,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
      order.suppliers?.name || 'Unknown',
      order.order_items?.length || 0,
      `€${Number(order.total_amount).toFixed(2)}`,
      order.status,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `procureresto-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">Analyze your procurement spending and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} disabled={!stats?.filteredOrders?.length}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !stats || stats.totalOrders === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No data yet</h2>
            <p className="text-muted-foreground mb-6">
              Start placing orders to see your spending analytics
            </p>
            <Button onClick={() => navigate('/articles')}>Browse Articles</Button>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Euro className="w-8 h-8 text-primary" />
                    {stats.spendingChange !== 0 && (
                      <div className={`flex items-center gap-1 text-sm ${stats.spendingChange > 0 ? 'text-destructive' : 'text-success'}`}>
                        {stats.spendingChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(stats.spendingChange).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-4">€{stats.totalSpent.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <ShoppingCart className="w-8 h-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground mt-4">{stats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Euro className="w-8 h-8 text-success" />
                  <p className="text-2xl font-bold text-foreground mt-4">€{stats.avgOrderValue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Average Order</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Users className="w-8 h-8 text-warning" />
                  <p className="text-2xl font-bold text-foreground mt-4">{stats.supplierBreakdown.length}</p>
                  <p className="text-sm text-muted-foreground">Active Suppliers</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Spending Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlySpending}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} tickFormatter={(v) => `€${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spent']}
                        />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spending by Supplier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 flex items-center">
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.supplierBreakdown}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                        >
                          {stats.supplierBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => `€${value.toFixed(2)}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {stats.supplierBreakdown.map((supplier, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: supplier.color }} />
                            <span className="text-foreground truncate max-w-[120px]">{supplier.name}</span>
                          </div>
                          <span className="text-muted-foreground">€{supplier.amount.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Spending Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spending Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.monthlySpending}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} tickFormatter={(v) => `€${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`€${value.toFixed(2)}`, 'Spent']}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Articles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Articles by Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topArticles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No article data available</p>
                    ) : (
                      stats.topArticles.map((article, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{article.name}</p>
                              <p className="text-xs text-muted-foreground">{article.quantity} units ordered</p>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
