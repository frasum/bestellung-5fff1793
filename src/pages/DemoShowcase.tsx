import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Maximize2, Minimize2, RotateCcw, ShoppingCart, Truck, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';
import { MockRestaurantPanel } from '@/components/demo/MockRestaurantPanel';
import { MockSupplierPanel } from '@/components/demo/MockSupplierPanel';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function DemoShowcase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearCart, clearOrders, orders } = useDemo();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  // Play sound on new order
  useEffect(() => {
    if (soundEnabled && orders.length > lastOrderCount && lastOrderCount > 0) {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Audio might be blocked by browser
      });
    }
    setLastOrderCount(orders.length);
  }, [orders.length, lastOrderCount, soundEnabled]);

  const handleReset = () => {
    clearCart();
    clearOrders();
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/presentation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
            Mock-Demo – Simulierte Daten
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
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Demo zurücksetzen
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Split Screen Panels */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Restaurant Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-700 dark:text-blue-300">Restaurant / Besteller</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MockRestaurantPanel />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Supplier Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-b border-green-500/20">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">Lieferanten-Portal</span>
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {orders.filter(o => o.status === 'pending').length} neue
                </Badge>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <MockSupplierPanel />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
