import { useState, useEffect, useCallback } from 'react';
import { Store, Smartphone, LayoutDashboard, Truck, Mail, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraggableTile, TilePosition } from './DraggableTile';
import { ConnectionArrows, Connection } from './ConnectionArrows';
import { LiveDemoRestaurantPanel } from './LiveDemoRestaurantPanel';
import { LiveDemoEasyOrderPanel } from './LiveDemoEasyOrderPanel';
import { LiveDemoAdminPanel } from './LiveDemoAdminPanel';
import { LiveDemoSupplierPanel } from './LiveDemoSupplierPanel';
import { LiveDemoEmailPanel } from './LiveDemoEmailPanel';

interface LiveDemoCanvasProps {
  soundEnabled: boolean;
}

const STORAGE_KEY = 'live-demo-tile-positions';

const defaultPositions: TilePosition[] = [
  { id: 'restaurant', x: 20, y: 20, width: 300, height: 380 },
  { id: 'easyorder', x: 20, y: 420, width: 300, height: 300 },
  { id: 'admin', x: 380, y: 120, width: 340, height: 480 },
  { id: 'supplier', x: 780, y: 20, width: 320, height: 380 },
  { id: 'email', x: 780, y: 420, width: 320, height: 300 },
];

const connections: Connection[] = [
  { from: 'restaurant', to: 'admin', label: '↔ Sync', color: '#3b82f6', bidirectional: true },
  { from: 'easyorder', to: 'admin', label: 'Entwurf', color: '#f97316' },
  { from: 'admin', to: 'supplier', label: 'Bestellung', color: '#22c55e' },
  { from: 'admin', to: 'email', label: 'E-Mail', color: '#8b5cf6' },
];

const tileConfig = [
  { 
    id: 'restaurant', 
    title: 'Restaurant', 
    icon: <Store className="h-4 w-4 text-blue-500" />,
    borderColor: 'bg-blue-500/10 border-b-blue-500/30',
    Component: LiveDemoRestaurantPanel
  },
  { 
    id: 'easyorder', 
    title: 'EasyOrder', 
    icon: <Smartphone className="h-4 w-4 text-orange-500" />,
    borderColor: 'bg-orange-500/10 border-b-orange-500/30',
    Component: LiveDemoEasyOrderPanel
  },
  { 
    id: 'admin', 
    title: 'Admin', 
    icon: <LayoutDashboard className="h-4 w-4 text-blue-500" />,
    borderColor: 'bg-blue-500/10 border-b-blue-500/30',
    Component: LiveDemoAdminPanel
  },
  { 
    id: 'supplier', 
    title: 'Lieferant', 
    icon: <Truck className="h-4 w-4 text-green-500" />,
    borderColor: 'bg-green-500/10 border-b-green-500/30',
    Component: LiveDemoSupplierPanel
  },
  { 
    id: 'email', 
    title: 'E-Mail Log', 
    icon: <Mail className="h-4 w-4 text-violet-500" />,
    borderColor: 'bg-violet-500/10 border-b-violet-500/30',
    Component: LiveDemoEmailPanel
  },
];

export function LiveDemoCanvas({ soundEnabled }: LiveDemoCanvasProps) {
  const [positions, setPositions] = useState<TilePosition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultPositions;
      }
    }
    return defaultPositions;
  });

  // Save positions to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPositions(prev => 
      prev.map(pos => 
        pos.id === id ? { ...pos, x, y } : pos
      )
    );
  }, []);

  const handleSizeChange = useCallback((id: string, width: number, height: number) => {
    setPositions(prev => 
      prev.map(pos => 
        pos.id === id ? { ...pos, width, height } : pos
      )
    );
  }, []);

  const handleResetLayout = () => {
    setPositions(defaultPositions);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="relative flex-1 bg-muted/30 overflow-hidden">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Reset Layout Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleResetLayout}
        className="absolute top-4 right-4 z-50 bg-card/80 backdrop-blur-sm"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Layout zurücksetzen
      </Button>

      {/* Connection Arrows */}
      <ConnectionArrows connections={connections} positions={positions} />

      {/* Draggable Tiles */}
      {tileConfig.map(({ id, title, icon, borderColor, Component }) => {
        const position = positions.find(p => p.id === id);
        if (!position) return null;

        return (
          <DraggableTile
            key={id}
            id={id}
            position={position}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
            title={title}
            icon={icon}
            borderColor={borderColor}
          >
            <Component soundEnabled={soundEnabled} />
          </DraggableTile>
        );
      })}

      {/* Workflow Legend */}
      <div className="absolute bottom-4 left-4 z-50 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
        <div className="text-xs font-medium text-muted-foreground mb-2">Workflow</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Gastro-System</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Lieferant erhält</span>
          </div>
          <span className="text-muted-foreground">→</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span>E-Mail gesendet</span>
          </div>
        </div>
      </div>

      {/* Tip for Dragging */}
      <div className="absolute bottom-4 right-4 z-50 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border">
        💡 Kacheln können frei verschoben werden
      </div>
    </div>
  );
}
