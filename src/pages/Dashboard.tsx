import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChefHat, LogOut, ShoppingCart, Users, BarChart3, Package } from 'lucide-react';
import { dashboardStats } from '@/data/mockData';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">ProcureResto</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your procurement overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Charts placeholder */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Spending</h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {dashboardStats.monthlySpending.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-primary/60 rounded-t"
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
                <div key={index} className="flex items-center justify-between">
                  <span className="text-foreground">{supplier.name}</span>
                  <span className="font-medium text-foreground">€{supplier.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
