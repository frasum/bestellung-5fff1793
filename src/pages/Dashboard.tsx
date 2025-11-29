import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingCart, Users, BarChart3, Package, Loader2 } from 'lucide-react';
import { dashboardStats } from '@/data/mockData';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: 'Total Orders', value: dashboardStats.totalOrders, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Total Spent', value: `€${dashboardStats.totalSpent.toLocaleString()}`, icon: BarChart3, color: 'text-success' },
    { label: 'Active Suppliers', value: dashboardStats.activeSuppliers, icon: Users, color: 'text-accent' },
    { label: 'Pending Orders', value: dashboardStats.pendingOrders, icon: Package, color: 'text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your procurement overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Spending</h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {dashboardStats.monthlySpending.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${(item.amount / 2500) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Top Suppliers</h2>
            <div className="space-y-4">
              {dashboardStats.topSuppliers.map((supplier, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground">{supplier.name}</span>
                    <span className="font-medium text-foreground">€{supplier.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(supplier.amount / 5000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
