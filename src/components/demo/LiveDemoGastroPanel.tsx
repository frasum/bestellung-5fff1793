import { useState } from 'react';
import { Store, LayoutDashboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LiveDemoRestaurantPanel } from './LiveDemoRestaurantPanel';
import { LiveDemoAdminPanel } from './LiveDemoAdminPanel';

interface LiveDemoGastroPanelProps {
  soundEnabled: boolean;
  onOrderCreated?: (from: string, to: string) => void;
}

export function LiveDemoGastroPanel({ soundEnabled, onOrderCreated }: LiveDemoGastroPanelProps) {
  const [activeTab, setActiveTab] = useState('restaurant');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="restaurant" className="flex items-center gap-1.5 text-xs">
            <Store className="h-3.5 w-3.5" />
            Restaurant
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-1.5 text-xs">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Admin
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="restaurant" className="flex-1 mt-2 overflow-hidden">
          <LiveDemoRestaurantPanel soundEnabled={soundEnabled} />
        </TabsContent>
        
        <TabsContent value="admin" className="flex-1 mt-2 overflow-hidden">
          <LiveDemoAdminPanel soundEnabled={soundEnabled} onOrderCreated={onOrderCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
