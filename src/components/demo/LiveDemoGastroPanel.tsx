import { useState, useEffect } from 'react';
import { Store, LayoutDashboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LiveDemoRestaurantPanel } from './LiveDemoRestaurantPanel';
import { LiveDemoAdminPanel } from './LiveDemoAdminPanel';
import { supabase } from '@/integrations/supabase/client';

interface LiveDemoGastroPanelProps {
  soundEnabled: boolean;
  onOrderCreated?: (from: string, to: string) => void;
}

export function LiveDemoGastroPanel({ soundEnabled, onOrderCreated }: LiveDemoGastroPanelProps) {
  const [activeTab, setActiveTab] = useState('restaurant');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { count } = await supabase
        .from('cart_drafts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .ilike('name', 'EasyOrder:%');

      setPendingCount(count || 0);
    };

    fetchPendingCount();

    const channel = supabase
      .channel('gastro-panel-pending-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_drafts'
      }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]">
              {pendingCount}
            </Badge>
          )}
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
