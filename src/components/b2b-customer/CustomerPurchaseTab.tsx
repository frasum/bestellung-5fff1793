import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Package, ShoppingCart, ClipboardList } from 'lucide-react';
import CustomerVendorsTab from './CustomerVendorsTab';
import CustomerVendorArticlesTab from './CustomerVendorArticlesTab';
import CustomerPurchaseCartTab from './CustomerPurchaseCartTab';
import CustomerPurchaseOrdersTab from './CustomerPurchaseOrdersTab';

interface CustomerPurchaseTabProps {
  customerId: string;
}

const CustomerPurchaseTab = ({ customerId }: CustomerPurchaseTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState('vendors');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
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
          <CustomerVendorsTab 
            customerId={customerId} 
            onVendorChange={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <CustomerVendorArticlesTab 
            key={refreshKey}
            customerId={customerId}
          />
        </TabsContent>

        <TabsContent value="cart" className="mt-4">
          <CustomerPurchaseCartTab 
            key={refreshKey}
            customerId={customerId}
            onOrderPlaced={() => {
              handleRefresh();
              setActiveSubTab('orders');
            }}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <CustomerPurchaseOrdersTab 
            key={refreshKey}
            customerId={customerId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerPurchaseTab;
