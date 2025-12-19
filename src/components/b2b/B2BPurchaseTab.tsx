import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Factory, Package, ShoppingCart, ClipboardList, Sparkles, CheckCircle, Clipboard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import B2BVendorsTab from './B2BVendorsTab';
import B2BVendorArticlesTab from './B2BVendorArticlesTab';
import B2BPurchaseCartTab from './B2BPurchaseCartTab';
import B2BPurchaseOrdersTab from './B2BPurchaseOrdersTab';
import B2BInventoryTab from './B2BInventoryTab';
import B2BUpgradePricingDialog from '@/components/b2b-customer/B2BUpgradePricingDialog';

interface B2BPurchaseTabProps {
  accountId: string;
  supplierId: string;
}

interface AccountInfo {
  email: string;
  companyName: string;
  upgradedOrganizationId: string | null;
  vendorCount: number;
  articleCount: number;
}

const B2BPurchaseTab = ({ accountId, supplierId }: B2BPurchaseTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState('vendors');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  useEffect(() => {
    loadAccountInfo();
  }, [accountId, supplierId]);

  const loadAccountInfo = async () => {
    // Get account info
    const { data: account } = await supabase
      .from('supplier_b2b_accounts')
      .select('email, company_name, upgraded_organization_id')
      .eq('id', accountId)
      .single();

    // Get vendor count (filtered by supplier)
    let vendorQuery = supabase
      .from('b2b_supplier_vendors')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_account_id', accountId);
    
    if (supplierId) {
      vendorQuery = vendorQuery.eq('supplier_id', supplierId);
    }
    const { count: vendorCount } = await vendorQuery;

    // Get article count (filtered by supplier through vendors)
    const { count: articleCount } = await supabase
      .from('b2b_supplier_vendor_articles')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_account_id', accountId);

    if (account) {
      setAccountInfo({
        email: account.email,
        companyName: account.company_name,
        upgradedOrganizationId: account.upgraded_organization_id,
        vendorCount: vendorCount || 0,
        articleCount: articleCount || 0,
      });
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleUpgradeSuccess = () => {
    loadAccountInfo();
  };

  return (
    <div className="space-y-4">
      {/* Upgrade Banner */}
      {accountInfo && !accountInfo.upgradedOrganizationId && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Bestellung.pro für Ihren Einkauf nutzen</h3>
              <p className="text-sm text-muted-foreground">
                Upgraden Sie zu einem vollwertigen Bestellung.pro Account und nutzen Sie alle Features für Ihr Einkaufsmanagement.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowUpgradeDialog(true)} className="shrink-0">
            <Sparkles className="h-4 w-4 mr-2" />
            Zu Bestellung.pro upgraden
          </Button>
        </div>
      )}

      {/* Upgraded Badge */}
      {accountInfo?.upgradedOrganizationId && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Bestellung.pro Account verknüpft
          </span>
          <Badge variant="outline" className="ml-auto text-green-600 border-green-600">
            Upgraded
          </Badge>
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="vendors" className="gap-2">
            <Factory className="h-4 w-4" />
            <span className="hidden sm:inline">Meine Lieferanten</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Katalog</span>
          </TabsTrigger>
          <TabsTrigger value="cart" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Warenkorb</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Bestellungen</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Clipboard className="h-4 w-4" />
            <span className="hidden sm:inline">Inventur</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="mt-4">
          <B2BVendorsTab 
            accountId={accountId}
            supplierId={supplierId}
            onVendorChange={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <B2BVendorArticlesTab 
            key={refreshKey}
            accountId={accountId}
            supplierId={supplierId}
          />
        </TabsContent>

        <TabsContent value="cart" className="mt-4">
          <B2BPurchaseCartTab 
            key={refreshKey}
            accountId={accountId}
            supplierId={supplierId}
            onOrderPlaced={() => {
              handleRefresh();
              setActiveSubTab('orders');
            }}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <B2BPurchaseOrdersTab 
            key={refreshKey}
            accountId={accountId}
            supplierId={supplierId}
          />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <B2BInventoryTab 
            key={refreshKey}
            accountId={accountId}
            supplierId={supplierId}
          />
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      {accountInfo && (
        <B2BUpgradePricingDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          type="supplier"
          entityId={accountId}
          email={accountInfo.email}
          companyName={accountInfo.companyName}
          vendorCount={accountInfo.vendorCount}
          articleCount={accountInfo.articleCount}
          onUpgradeSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
};

export default B2BPurchaseTab;