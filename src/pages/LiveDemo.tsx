import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, RotateCcw, ShoppingCart, Truck, Volume2, VolumeX, ArrowLeft, AlertTriangle, ClipboardList } from 'lucide-react';
import { LiveDemoRestaurantPanel } from '@/components/demo/LiveDemoRestaurantPanel';
import { LiveDemoSupplierPanel } from '@/components/demo/LiveDemoSupplierPanel';
import { LiveDemoEasyOrderPanel } from '@/components/demo/LiveDemoEasyOrderPanel';
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
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('is_test_order', true);
      
      if (error) throw error;
      
      toast.success('Demo-Bestellungen zurückgesetzt');
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
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 border-b border-green-500/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/presentation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-300">
            Live-Demo – Echte Daten
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={isResetting}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Demo zurücksetzen
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 3-Panel Split Screen */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Restaurant Panel */}
        <ResizablePanel defaultSize={33} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">Restaurant / Besteller</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <LiveDemoRestaurantPanel soundEnabled={soundEnabled} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* EasyOrder Panel */}
        <ResizablePanel defaultSize={34} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
              <ClipboardList className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-700 dark:text-orange-300 text-sm">EasyOrder / Mitarbeiter</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <LiveDemoEasyOrderPanel soundEnabled={soundEnabled} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Supplier Panel */}
        <ResizablePanel defaultSize={33} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-b border-green-500/20">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300 text-sm">Lieferanten-Portal</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <LiveDemoSupplierPanel soundEnabled={soundEnabled} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
