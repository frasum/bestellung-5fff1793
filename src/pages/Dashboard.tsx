import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingCart, Users, BarChart3, Package, Loader2, ChevronRight, Box } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useArticles } from '@/hooks/useArticles';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || ordersLoading || suppliersLoading || articlesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Calculate real stats from database
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalSuppliers = suppliers.length;
  const totalArticles = articles.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Calculate monthly spending (last 6 months)
  const now = new Date();
  const monthlySpending = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthName = date.toLocaleDateString('de-DE', { month: 'short' });
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === date.getMonth() && 
             orderDate.getFullYear() === date.getFullYear();
    });
    const amount = monthOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    return { month: monthName, amount };
  });

  // Calculate top suppliers by spending
  const supplierSpending = orders.reduce((acc, order) => {
    const supplierId = order.supplier_id;
    const supplierName = order.suppliers?.name || 'Unknown';
    if (!acc[supplierId]) {
      acc[supplierId] = { name: supplierName, amount: 0 };
    }
    acc[supplierId].amount += Number(order.total_amount);
    return acc;
  }, {} as Record<string, { name: string; amount: number }>);

  const topSuppliers = Object.values(supplierSpending)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const maxSupplierAmount = Math.max(...topSuppliers.map(s => s.amount), 1);
  const maxMonthlyAmount = Math.max(...monthlySpending.map(m => m.amount), 1);

  // Get recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    confirmed: 'bg-success/10 text-success border-success/20',
    processing: 'bg-primary/10 text-primary border-primary/20',
    shipped: 'bg-accent/10 text-accent border-accent/20',
    delivered: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    draft: 'bg-muted text-muted-foreground border-muted',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    processing: 'In Bearbeitung',
    shipped: 'Versendet',
    delivered: 'Geliefert',
    cancelled: 'Storniert',
    draft: 'Entwurf',
  };

  const stats = [
    { label: 'Bestellungen', value: totalOrders, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Gesamtausgaben', value: `€${totalSpent.toLocaleString('de-DE')}`, icon: BarChart3, color: 'text-success' },
    { label: 'Lieferanten', value: totalSuppliers, icon: Users, color: 'text-accent' },
    { label: 'Artikel', value: totalArticles, icon: Box, color: 'text-blue-500' },
    { label: 'Ausstehend', value: pendingOrders, icon: Package, color: 'text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Willkommen zurück! Hier ist Ihre Beschaffungsübersicht.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 lg:mb-4">
                <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
              </div>
              <div className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs lg:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Monatliche Ausgaben</h2>
            <div className="h-36 lg:h-48 flex items-end justify-between gap-1.5 lg:gap-2">
              {monthlySpending.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1.5 lg:gap-2">
                  <div 
                    className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${(item.amount / maxMonthlyAmount) * 100}%`, minHeight: item.amount > 0 ? '4px' : '0' }}
                  />
                  <span className="text-[10px] lg:text-xs text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Top Lieferanten</h2>
            {topSuppliers.length === 0 ? (
              <p className="text-muted-foreground text-sm">Noch keine Bestellungen</p>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm lg:text-base text-foreground truncate mr-2">{supplier.name}</span>
                      <span className="font-medium text-sm lg:text-base text-foreground whitespace-nowrap">€{supplier.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 lg:h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(supplier.amount / maxSupplierAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-base lg:text-lg font-semibold text-foreground">Letzte Bestellungen</h2>
            <Link 
              to="/orders" 
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Alle anzeigen
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Bestellungen</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders?orderId=${order.id}`}
                  className="flex items-center justify-between p-2.5 lg:p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {order.suppliers?.name || 'Unbekannt'}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] lg:text-xs px-1.5 py-0 ${statusColors[order.status] || ''}`}
                        >
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('de-DE', { 
                          day: '2-digit', 
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap ml-2">
                    €{Number(order.total_amount).toLocaleString('de-DE')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
