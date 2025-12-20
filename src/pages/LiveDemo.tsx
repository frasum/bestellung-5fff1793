import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RotateCcw, Volume2, VolumeX, ArrowLeft, AlertTriangle } from 'lucide-react';
import { LiveDemoCanvas } from '@/components/demo/LiveDemoCanvas';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LiveDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    
    setIsResetting(true);
    try {
      // Delete test orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('is_test_order', true);
      
      if (ordersError) throw ordersError;

      // Delete EasyOrder drafts
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', currentUser.id)
          .single();

        if (profile?.organization_id) {
          // Get all EasyOrder drafts
          const { data: drafts } = await supabase
            .from('cart_drafts')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .ilike('name', 'EasyOrder:%');

          if (drafts && drafts.length > 0) {
            const draftIds = drafts.map(d => d.id);
            await supabase.from('cart_draft_items').delete().in('draft_id', draftIds);
            await supabase.from('cart_drafts').delete().in('id', draftIds);
          }

          // Delete communication logs for demo
          const { error: logsError } = await supabase
            .from('communication_logs')
            .delete()
            .eq('organization_id', profile.organization_id);

          if (logsError) {
            console.error('Error deleting communication logs:', logsError);
          }
        }
      }
      
      toast.success('Demo-Daten zurückgesetzt');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Fehler beim Zurücksetzen');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Für die Live-Demo mit echten Daten müssen Sie angemeldet sein.
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/presentation')}>
            Zurück
          </Button>
          <Button onClick={() => navigate('/auth')}>
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Professional Control Bar with Gradient */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-background border-b border-emerald-500/20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/presentation')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          
          <div className="flex items-center gap-2">
            {/* Live Indicator with pulsing dot */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">LIVE-DEMO</span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">Verbunden mit Ihren echten Daten</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={soundEnabled ? 'text-emerald-600' : 'text-muted-foreground'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            disabled={isResetting}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Zurücksetzen</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-muted-foreground hover:text-foreground">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Drag-and-Drop Canvas */}
      <LiveDemoCanvas soundEnabled={soundEnabled} />
    </div>
  );
}
