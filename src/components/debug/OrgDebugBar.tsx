import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useLocationContext } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export function OrgDebugBar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: organizationId, isLoading: orgLoading } = useOrganization();
  const { activeLocation, locations } = useLocationContext();

  // Fetch organization name
  const { data: orgData } = useQuery({
    queryKey: ['organization-details', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const isAdvancedEnabled = localStorage.getItem('advanced-settings-enabled') === 'true';
  if (!isAdvancedEnabled) return null;

  const isMismatch = organizationId && activeLocation && activeLocation.organization_id !== organizationId;

  const handleClearAllCache = () => {
    // Invalidate all organization-bound queries
    queryClient.invalidateQueries({ queryKey: ['locations'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['articles'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-sessions-with-stats'] });
    queryClient.invalidateQueries({ queryKey: ['suggested-articles'] });
    queryClient.invalidateQueries({ queryKey: ['suggested-articles-count'] });
    queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
    queryClient.invalidateQueries({ queryKey: ['price-history'] });
    queryClient.invalidateQueries({ queryKey: ['organization'] });
    
    // Clear localStorage location to force fresh selection
    localStorage.removeItem('activeLocationId');
    
    toast.success('Cache geleert - Seite wird neu geladen...');
    
    // Force reload after short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4 text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isMismatch ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="font-semibold text-foreground">Org/Location Debug</span>
          {isMismatch && (
            <Badge variant="destructive" className="text-[10px]">MISMATCH!</Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearAllCache}
          className="h-6 text-[10px] px-2"
        >
          <RefreshCcw className="h-3 w-3 mr-1" />
          Clear Cache
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-muted-foreground">
        <div>
          <span className="text-foreground/60">User:</span>{' '}
          <span className="text-foreground">{user?.email?.split('@')[0] || '–'}</span>
        </div>
        
        <div>
          <span className="text-foreground/60">Org:</span>{' '}
          <span className="text-foreground">
            {orgLoading ? '...' : orgData?.name || 'Unknown'}
          </span>
        </div>
        
        <div>
          <span className="text-foreground/60">OrgID:</span>{' '}
          <span className="text-foreground text-[10px]">
            {organizationId?.slice(0, 8) || '–'}...
          </span>
        </div>
        
        <div>
          <span className="text-foreground/60">Locations:</span>{' '}
          <span className="text-foreground">{locations.length}</span>
        </div>
        
        <div className="col-span-2">
          <span className="text-foreground/60">Active Location:</span>{' '}
          <span className="text-foreground">
            {activeLocation?.name || '–'}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="text-foreground/60">Location OrgID:</span>{' '}
          <span className={isMismatch ? 'text-destructive font-bold' : 'text-foreground'}>
            {activeLocation?.organization_id?.slice(0, 8) || '–'}...
          </span>
        </div>
      </div>
    </div>
  );
}
