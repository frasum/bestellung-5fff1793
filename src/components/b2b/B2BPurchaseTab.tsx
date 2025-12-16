import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Package, ShoppingCart, ClipboardList } from 'lucide-react';
import B2BVendorsTab from './B2BVendorsTab';
import B2BVendorArticlesTab from './B2BVendorArticlesTab';
import B2BPurchaseCartTab from './B2BPurchaseCartTab';
import B2BPurchaseOrdersTab from './B2BPurchaseOrdersTab';

interface B2BPurchaseTabProps {
  accountId: string;
}

const B2BPurchaseTab = ({ accountId }: B2BPurchaseTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState('vendors');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
        </TabsList>

        <TabsContent value="vendors" className="mt-4">
          <B2BVendorsTab 
            accountId={accountId} 
            onVendorChange={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <B2BVendorArticlesTab 
            key={refreshKey}
            accountId={accountId}
          />
        </TabsContent>

        <TabsContent value="cart" className="mt-4">
          <B2BPurchaseCartTab 
            key={refreshKey}
            accountId={accountId}
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default B2BPurchaseTab;
