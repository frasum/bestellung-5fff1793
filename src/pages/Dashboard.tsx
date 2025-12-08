import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingCart, Users, BarChart3, Package, Loader2, Box, ClipboardList } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useArticles } from '@/hooks/useArticles';
import { usePendingSubmissionsCount } from '@/hooks/useEmployeeSubmissions';
import { useHasRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi, Locale } from 'date-fns/locale';

const localeMap: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: pendingStaffOrders = 0 } = usePendingSubmissionsCount();
  const { hasRole: canSeeStaffOrders } = useHasRole(['admin', 'manager']);
  
  const locale = localeMap[i18n.language] || de;

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
    const monthName = format(date, 'MMM', { locale });
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
    const supplierName = order.suppliers?.name || t('common.unknown');
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


  const stats = [
    { label: t('dashboard.ordersCount'), value: totalOrders, icon: ShoppingCart, color: 'text-primary' },
    { label: t('dashboard.totalSpent'), value: `€${totalSpent.toLocaleString(i18n.language)}`, icon: BarChart3, color: 'text-success' },
    { label: t('suppliers.title'), value: totalSuppliers, icon: Users, color: 'text-accent' },
    { label: t('articles.title'), value: totalArticles, icon: Box, color: 'text-blue-500' },
    { label: t('dashboard.pending'), value: pendingOrders, icon: Package, color: 'text-warning' },
    ...(canSeeStaffOrders && pendingStaffOrders > 0 ? [{
      label: t('dashboard.pendingStaffOrders'),
      value: pendingStaffOrders,
      icon: ClipboardList,
      color: 'text-orange-500',
      href: '/staff-orders',
      pulse: true,
    }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          {stats.map((stat, index) => {
            const content = (
              <div 
                className={`bg-card border border-border rounded-xl p-4 lg:p-6 ${
                  'href' in stat ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''
                } ${'pulse' in stat && stat.pulse ? 'ring-2 ring-primary/20 animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between mb-2 lg:mb-4">
                  <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                  {'pulse' in stat && stat.pulse && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  )}
                </div>
                <div className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs lg:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
            
            if ('href' in stat && stat.href) {
              return (
                <Link key={index} to={stat.href}>
                  {content}
                </Link>
              );
            }
            
            return <div key={index}>{content}</div>;
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">{t('dashboard.monthlySpending')}</h2>
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
            <h2 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">{t('dashboard.topSuppliers')}</h2>
            {topSuppliers.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('dashboard.noOrders')}</p>
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

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
