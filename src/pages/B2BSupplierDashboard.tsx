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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Truck,
  PackageSearch,
} from 'lucide-react';
import B2BArticlesTab from '@/components/b2b/B2BArticlesTab';
import B2BCustomersTab from '@/components/b2b/B2BCustomersTab';
import B2BOrdersTab from '@/components/b2b/B2BOrdersTab';
import B2BOffersTab from '@/components/b2b/B2BOffersTab';
import B2BSettingsTab from '@/components/b2b/B2BSettingsTab';
import B2BPurchaseTab from '@/components/b2b/B2BPurchaseTab';
import B2BSupplierFormDialog from '@/components/b2b/B2BSupplierFormDialog';
import B2BUpgradePricingDialog from '@/components/b2b-customer/B2BUpgradePricingDialog';

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
  totalSuppliers: number;
  pendingOrders: number;
  totalOrders: number;
}

const B2BSupplierDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [account, setAccount] = useState<B2BAccount | null>(null);
  const [suppliers, setSuppliers] = useState<B2BSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newSupplierDialogOpen, setNewSupplierDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

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
      await loadSuppliers(accountData.id);
    } catch (error: any) {
      console.error('Error loading account:', error);
      toast.error('Fehler beim Laden des Kontos');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async (accountId: string) => {
    const { data, error } = await supabase
      .from('b2b_suppliers')
      .select('id, name, logo_url')
      .eq('account_id', accountId)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setSuppliers(data);
      // Auto-select first supplier (Hybrid Model)
      if (data.length > 0 && !selectedSupplierId) {
        const firstSupplierId = data[0].id;
        setSelectedSupplierId(firstSupplierId);
        await loadStats(accountId, firstSupplierId);
      } else if (data.length === 0) {
        // No suppliers yet - load stats without supplier filter
        await loadStats(accountId);
      }
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

      // Filter ALL queries by supplier_id (Hybrid Model)
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
        totalSuppliers: suppliers.length,
        pendingOrders,
        totalOrders: ordersRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId === '__new__') {
      setNewSupplierDialogOpen(true);
      return;
    }
    setSelectedSupplierId(supplierId);
    if (account) {
      loadStats(account.id, supplierId);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/b2b/login');
  };

  const openCustomerPortal = () => {
    if (account) {
      let url = `/b2b/portal/${account.subdomain}`;
      if (selectedSupplierId) {
        url += `?preview_supplier=${selectedSupplierId}`;
      }
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

  const selectedSupplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Dev Mode Badge */}
            <Badge variant="outline" className="text-orange-600 bg-orange-100 border-0 hidden sm:flex">
              🟠 B2B Supplier
            </Badge>
            {(() => {
              const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
              const logoUrl = selectedSupplier?.logo_url || account.logo_url;
              const displayName = selectedSupplier?.name || account.company_name;
              
              return (
                <>
                  {logoUrl ? (
                    <img src={logoUrl} alt={displayName} className="h-10 w-10 object-contain" />
                  ) : (
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: account.primary_color + '20' }}
                    >
                      <Building2 className="h-5 w-5" style={{ color: account.primary_color }} />
                    </div>
                  )}
                  <div>
                    <h1 className="font-semibold text-lg">{displayName}</h1>
                    <p className="text-sm text-muted-foreground">
                      {account.subdomain}.bestellung.pro
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
          
          {/* Supplier Selector in Header (Hybrid Model) */}
          <div className="flex items-center gap-4">
            {suppliers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Lieferant:</span>
                <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
                  <SelectTrigger className="w-[180px]">
                    <Truck className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Lieferant wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                    <SelectItem value="__new__" className="text-primary font-medium">
                      <Plus className="h-4 w-4 mr-2 inline" />
                      Neuen Lieferanten anlegen
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Badge variant="outline" className="capitalize hidden sm:flex">
              {account.subscription_tier}
            </Badge>
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
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
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
              <TabsTrigger value="purchase" className="gap-2">
                <PackageSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Mein Einkauf</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Einstellungen</span>
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* No supplier selected - prompt to create or select */}
            {suppliers.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Willkommen bei Ihrem B2B-Portal!</CardTitle>
                  <CardDescription>
                    Erstellen Sie zunächst einen Lieferanten, um loszulegen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab('settings')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Lieferanten anlegen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Upgrade Banner - show if not yet upgraded */}
                {!account.upgraded_organization_id && (
                  <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Upgraden Sie zu Bestellung.pro</p>
                          <p className="text-sm text-muted-foreground">
                            Nutzen Sie alle Funktionen für Ihren eigenen Einkauf - mit Sonderkonditionen für B2B-Lieferanten
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => setUpgradeDialogOpen(true)}>
                        Jetzt upgraden
                      </Button>
                    </CardContent>
                  </Card>
                )}

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
                    <CardTitle>Schnellaktionen für {selectedSupplierName}</CardTitle>
                    <CardDescription>
                      Verwalten Sie Ihren Lieferanten
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
              selectedSupplierId={selectedSupplierId}
              suppliers={suppliers}
              onStatsChange={() => loadStats(account.id, selectedSupplierId)} 
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <B2BCustomersTab 
              accountId={account.id} 
              supplierName={account.company_name} 
              onStatsChange={() => loadStats(account.id, selectedSupplierId)}
              selectedSupplierId={selectedSupplierId}
              suppliers={suppliers}
            />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <B2BOffersTab 
              accountId={account.id} 
              selectedSupplierId={selectedSupplierId}
              suppliers={suppliers}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <B2BOrdersTab 
              accountId={account.id} 
              selectedSupplierId={selectedSupplierId}
              suppliers={suppliers}
            />
          </TabsContent>

          {/* Purchase Tab (Mein Einkauf) */}
          <TabsContent value="purchase">
            <B2BPurchaseTab accountId={account.id} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <B2BSettingsTab 
              account={account} 
              onUpdate={loadAccount}
              selectedSupplierId={selectedSupplierId}
              suppliers={suppliers}
              onSuppliersChange={() => loadSuppliers(account.id)}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* New Supplier Dialog */}
      <B2BSupplierFormDialog
        open={newSupplierDialogOpen}
        onOpenChange={setNewSupplierDialogOpen}
        supplier={null}
        accountId={account.id}
        onSuccess={async () => {
          await loadSuppliers(account.id);
        }}
      />

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
