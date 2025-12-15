import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Building2,
  Package,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  TrendingUp,
} from 'lucide-react';
import B2BArticlesTab from '@/components/b2b/B2BArticlesTab';
import B2BCustomersTab from '@/components/b2b/B2BCustomersTab';
import B2BOrdersTab from '@/components/b2b/B2BOrdersTab';
import B2BSettingsTab from '@/components/b2b/B2BSettingsTab';

interface B2BAccount {
  id: string;
  company_name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  subscription_tier: string;
  is_active: boolean;
  linked_supplier_id: string | null;
}

interface DashboardStats {
  totalArticles: number;
  totalCustomers: number;
  pendingOrders: number;
  totalOrders: number;
}

const B2BSupplierDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [account, setAccount] = useState<B2BAccount | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      navigate('/b2b/login');
      return;
    }
    loadAccount();
  }, [user, navigate]);

  const loadAccount = async () => {
    try {
      // Get account by email
      const { data: accountData, error } = await supabase
        .from('supplier_b2b_accounts')
        .select('*')
        .eq('email', user?.email)
        .maybeSingle();

      if (error) throw error;

      if (!accountData) {
        toast.error('Kein B2B-Konto gefunden');
        navigate('/b2b/login');
        return;
      }

      setAccount(accountData);
      await loadStats(accountData.id);
    } catch (error: any) {
      console.error('Error loading account:', error);
      toast.error('Fehler beim Laden des Kontos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (accountId: string) => {
    try {
      const [articlesRes, customersRes, ordersRes] = await Promise.all([
        supabase
          .from('supplier_b2b_articles')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_account_id', accountId),
        supabase
          .from('supplier_b2b_customers')
          .select('id', { count: 'exact', head: true })
          .eq('supplier_account_id', accountId),
        supabase
          .from('supplier_b2b_orders')
          .select('id, status', { count: 'exact' })
          .eq('supplier_account_id', accountId),
      ]);

      const pendingOrders = ordersRes.data?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalArticles: articlesRes.count || 0,
        totalCustomers: customersRes.count || 0,
        pendingOrders,
        totalOrders: ordersRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/b2b/login');
  };

  const openCustomerPortal = () => {
    if (account) {
      // In production, this would be the subdomain URL
      window.open(`/b2b/portal/${account.subdomain}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {account.logo_url ? (
              <img src={account.logo_url} alt={account.company_name} className="h-10 w-10 object-contain" />
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: account.primary_color + '20' }}
              >
                <Building2 className="h-5 w-5" style={{ color: account.primary_color }} />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-lg">{account.company_name}</h1>
              <p className="text-sm text-muted-foreground">
                {account.subdomain}.bestellung.pro
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {account.subscription_tier}
            </Badge>
            <Button variant="outline" size="sm" onClick={openCustomerPortal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Kundenportal öffnen
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Artikel</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Kunden</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Bestellungen</span>
              {stats?.pendingOrders ? (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.pendingOrders}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Einstellungen</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('articles')}>
                <CardHeader className="pb-2">
                  <CardDescription>Artikel</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalArticles || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto">
                    <Plus className="h-4 w-4 mr-1" />
                    Artikel hinzufügen
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('customers')}>
                <CardHeader className="pb-2">
                  <CardDescription>Kunden</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalCustomers || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto">
                    <Plus className="h-4 w-4 mr-1" />
                    Kunden einladen
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('orders')}>
                <CardHeader className="pb-2">
                  <CardDescription>Offene Bestellungen</CardDescription>
                  <CardTitle className="text-3xl text-orange-500">{stats?.pendingOrders || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {stats?.totalOrders || 0} Bestellungen gesamt
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Portal-Status</CardDescription>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {account.is_active ? 'Aktiv' : 'Inaktiv'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto" onClick={openCustomerPortal}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Portal ansehen
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Erste Schritte</CardTitle>
                <CardDescription>
                  Richten Sie Ihr B2B-Portal ein
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('articles')}
                >
                  <Package className="h-6 w-6" />
                  <span>Artikel anlegen</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('customers')}
                >
                  <Users className="h-6 w-6" />
                  <span>Kunden einladen</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-6 w-6" />
                  <span>Branding anpassen</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <B2BArticlesTab accountId={account.id} linkedSupplierId={account.linked_supplier_id} onStatsChange={() => loadStats(account.id)} />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <B2BCustomersTab accountId={account.id} supplierName={account.company_name} onStatsChange={() => loadStats(account.id)} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <B2BOrdersTab accountId={account.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <B2BSettingsTab account={account} onUpdate={loadAccount} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default B2BSupplierDashboard;
