import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FileText,
  PackageSearch,
  Sparkles,
  User,
} from 'lucide-react';
import B2BArticlesTab from '@/components/b2b/B2BArticlesTab';
import B2BCustomersTab from '@/components/b2b/B2BCustomersTab';
import B2BOrdersTab from '@/components/b2b/B2BOrdersTab';
import B2BOffersTab from '@/components/b2b/B2BOffersTab';
import B2BSettingsTab from '@/components/b2b/B2BSettingsTab';
import B2BPurchaseTab from '@/components/b2b/B2BPurchaseTab';
import B2BUpgradePricingDialog from '@/components/b2b-customer/B2BUpgradePricingDialog';

interface B2BAccount {
  id: string;
  company_name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  welcome_message: string | null;
  subscription_tier: string | null;
  is_active: boolean | null;
  linked_supplier_id: string | null;
  upgraded_organization_id: string | null;
}

interface B2BSupplier {
  id: string;
  name: string;
  logo_url: string | null;
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
  const location = useLocation();
  const { user } = useAuth();
  const [account, setAccount] = useState<B2BAccount | null>(null);
  const [supplier, setSupplier] = useState<B2BSupplier | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  
  // Supplier User Mode (e.g., Luigi with own login)
  const [isSupplierUser, setIsSupplierUser] = useState(false);
  const [supplierUserRole, setSupplierUserRole] = useState<string>('manager');
  const [supplierUserName, setSupplierUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/b2b/login');
      return;
    }
    
    // Check if navigated as supplier user from login
    const state = location.state as { 
      supplierId?: string; 
      accountId?: string; 
      isSupplierUser?: boolean;
      supplierUserRole?: string;
    } | null;
    
    if (state?.isSupplierUser && state?.accountId) {
      setIsSupplierUser(true);
      setSupplierUserRole(state.supplierUserRole || 'manager');
      loadAccountAsSupplierUser(state.accountId, state.supplierId!);
    } else {
      loadAccount();
    }
  }, [user, navigate, location.state]);

  const loadAccountAsSupplierUser = async (accountId: string, supplierId: string) => {
    try {
      // Load account data
      const { data: accountData, error } = await supabase
        .from('supplier_b2b_accounts')
        .select('*')
        .eq('id', accountId)
        .maybeSingle();

      if (error) throw error;

      if (!accountData) {
        toast.error('Kein B2B-Konto gefunden');
        navigate('/b2b/login');
        return;
      }

      setAccount(accountData);
      
      // Load supplier user name
      const { data: supplierUserData } = await supabase
        .from('b2b_supplier_users')
        .select('name')
        .eq('user_id', user?.id ?? '')
        .maybeSingle();
      
      if (supplierUserData?.name) {
        setSupplierUserName(supplierUserData.name);
      }
      
      // Load this supplier
      const { data: supplierData } = await supabase
        .from('b2b_suppliers')
        .select('id, name, logo_url')
        .eq('id', supplierId)
        .single();

      if (supplierData) {
        setSupplier(supplierData);
        await loadStats(accountId, supplierId);
      }
    } catch (error: unknown) {
      console.error('Error loading account:', error);
      toast.error('Fehler beim Laden des Kontos');
    } finally {
      setLoading(false);
    }
  };

  const loadAccount = async () => {
    try {
      // First check if user is an account owner
      const { data: accountData, error } = await supabase
        .from('supplier_b2b_accounts')
        .select('*')
        .eq('email', user?.email ?? '')
        .maybeSingle();

      if (error) throw error;

      if (accountData) {
        // Account owner
        setAccount(accountData);
        await loadSupplier(accountData.id);
        return;
      }

      // Check if user is a supplier user
      const { data: supplierUser } = await supabase
        .from('b2b_supplier_users')
        .select('supplier_id, account_id, role, name')
        .eq('user_id', user?.id ?? '')
        .maybeSingle();

      if (supplierUser) {
        setIsSupplierUser(true);
        setSupplierUserRole(supplierUser.role);
        if (supplierUser.name) {
          setSupplierUserName(supplierUser.name);
        }
        await loadAccountAsSupplierUser(supplierUser.account_id, supplierUser.supplier_id);
        return;
      }

      toast.error('Kein B2B-Konto gefunden');
      navigate('/b2b/login');
    } catch (error: unknown) {
      console.error('Error loading account:', error);
      toast.error('Fehler beim Laden des Kontos');
    } finally {
      setLoading(false);
    }
  };

  // Load the single supplier for this account (1 Account = 1 Supplier)
  const loadSupplier = async (accountId: string) => {
    const { data, error } = await supabase
      .from('b2b_suppliers')
      .select('id, name, logo_url')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSupplier(data);
      await loadStats(accountId, data.id);
    } else {
      // No supplier yet - still load stats without supplier filter
      await loadStats(accountId);
    }
  };

  const loadStats = async (accountId: string, supplierId?: string) => {
    try {
      let articlesQuery = supabase
        .from('supplier_b2b_articles')
        .select('id', { count: 'exact', head: true })
        .eq('supplier_account_id', accountId);

      let customersQuery = supabase
        .from('supplier_b2b_customers')
        .select('id', { count: 'exact', head: true })
        .eq('supplier_account_id', accountId);

      let ordersQuery = supabase
        .from('supplier_b2b_orders')
        .select('id, status', { count: 'exact' })
        .eq('supplier_account_id', accountId);

      if (supplierId) {
        articlesQuery = articlesQuery.eq('supplier_id', supplierId);
        customersQuery = customersQuery.eq('supplier_id', supplierId);
        ordersQuery = ordersQuery.eq('supplier_id', supplierId);
      }

      const [articlesRes, customersRes, ordersRes] = await Promise.all([
        articlesQuery,
        customersQuery,
        ordersQuery,
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
      const url = `/b2b/portal/${account.subdomain}`;
      window.open(url, '_blank');
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

  // Use supplier name if available, otherwise company name
  const displayName = supplier?.name || account.company_name;
  const logoUrl = supplier?.logo_url || account.logo_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Dev Mode Badge */}
            <Badge variant="outline" className="text-orange-600 bg-orange-100 border-0 hidden sm:flex">
              {isSupplierUser ? '🟡 Lieferanten-Benutzer' : '🟠 B2B Supplier'}
            </Badge>
            {logoUrl ? (
              <img src={logoUrl} alt={displayName} className="h-10 w-10 object-contain" />
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: account.primary_color + '20' }}
              >
                <Building2 className="h-5 w-5" style={{ color: account.primary_color ?? undefined }} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">{displayName}</h1>
                {/* Upgrade Badge */}
                {!account.upgraded_organization_id ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 gap-1.5 bg-gradient-to-r from-primary/10 to-amber-500/10 border-primary/30 hover:border-primary hover:bg-gradient-to-r hover:from-primary/20 hover:to-amber-500/20"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="capitalize text-xs font-medium">
                      {account.subscription_tier}
                    </span>
                    <Badge variant="secondary" className="h-4 text-[10px] px-1.5 bg-primary/20 text-primary hover:bg-primary/30">
                      Upgrade
                    </Badge>
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-green-600 bg-green-100 border-green-300">
                    ✓ Bestellung.pro
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {account.subdomain}.bestellung.pro
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Show current user info for supplier users */}
            {isSupplierUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{supplierUserName || user?.email}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={openCustomerPortal}>
              <ExternalLink className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Kundenportal</span>
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
          <TabsList className={`grid w-full lg:w-auto lg:inline-grid ${isSupplierUser ? 'grid-cols-5' : 'grid-cols-7'}`}>
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
            <TabsTrigger value="offers" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Angebote</span>
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
            {/* Hide "Mein Einkauf" for supplier users or when no supplier */}
            {!isSupplierUser && supplier && (
              <TabsTrigger value="purchase" className="gap-2">
                <PackageSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Mein Einkauf</span>
              </TabsTrigger>
            )}
            {/* Hide "Einstellungen" for supplier users with viewer role */}
            {(!isSupplierUser || supplierUserRole !== 'viewer') && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Einstellungen</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* No supplier yet - should not happen after registration fix */}
            {!supplier ? (
              <Card>
                <CardHeader>
                  <CardTitle>Willkommen bei Ihrem B2B-Portal!</CardTitle>
                  <CardDescription>
                    Es ist ein Fehler aufgetreten. Bitte kontaktieren Sie den Support.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
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
                    <CardTitle>Schnellaktionen</CardTitle>
                    <CardDescription>
                      Verwalten Sie Ihr B2B-Portal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab('articles')}
                    >
                      <Package className="h-6 w-6" />
                      <span>Artikel verwalten</span>
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
                      <span>Einstellungen</span>
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <B2BArticlesTab 
              accountId={account.id} 
              linkedSupplierId={account.linked_supplier_id} 
              selectedSupplierId={supplier?.id || ''}
              suppliers={supplier ? [supplier] : []}
              onStatsChange={() => loadStats(account.id, supplier?.id)} 
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <B2BCustomersTab 
              accountId={account.id} 
              supplierName={account.company_name} 
              onStatsChange={() => loadStats(account.id, supplier?.id)}
              selectedSupplierId={supplier?.id || ''}
              suppliers={supplier ? [supplier] : []}
            />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <B2BOffersTab 
              accountId={account.id} 
              selectedSupplierId={supplier?.id || ''}
              suppliers={supplier ? [supplier] : []}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <B2BOrdersTab 
              accountId={account.id} 
              selectedSupplierId={supplier?.id || ''}
              suppliers={supplier ? [supplier] : []}
            />
          </TabsContent>

          {/* Purchase Tab (Mein Einkauf) */}
          <TabsContent value="purchase">
            {supplier && <B2BPurchaseTab accountId={account.id} supplierId={supplier.id} />}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <B2BSettingsTab 
              account={account} 
              onUpdate={loadAccount}
              selectedSupplierId={supplier?.id || ''}
              suppliers={supplier ? [supplier] : []}
              onSuppliersChange={() => loadSupplier(account.id)}
              isSupplierUser={isSupplierUser}
              supplierUserRole={supplierUserRole}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Upgrade Dialog */}
      <B2BUpgradePricingDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        type="supplier"
        entityId={account.id}
        email={account.email}
        companyName={account.company_name}
        vendorCount={0}
        articleCount={0}
        onUpgradeSuccess={() => {
          loadAccount();
        }}
      />
    </div>
  );
};

export default B2BSupplierDashboard;
