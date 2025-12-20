import { useState, useEffect, useCallback, useMemo } from 'react';
import { Smartphone, Truck, Mail, RotateCcw, Utensils, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraggableTile, TilePosition } from './DraggableTile';
import { ConnectionArrows, Connection } from './ConnectionArrows';
import { LiveDemoGastroPanel } from './LiveDemoGastroPanel';
import { LiveDemoEasyOrderPanel } from './LiveDemoEasyOrderPanel';
import { LiveDemoSupplierPanel } from './LiveDemoSupplierPanel';
import { LiveDemoEmailPanel } from './LiveDemoEmailPanel';

interface LiveDemoCanvasProps {
  soundEnabled: boolean;
}

const STORAGE_KEY = 'live-demo-tile-positions-v2';

const defaultPositions: TilePosition[] = [
  { id: 'gastro', x: 20, y: 20, width: 380, height: 520 },
  { id: 'easyorder', x: 20, y: 560, width: 380, height: 320 },
  { id: 'supplier', x: 460, y: 20, width: 340, height: 400 },
  { id: 'email', x: 460, y: 440, width: 340, height: 400 },
];

const tileConfig = [
  { 
    id: 'gastro', 
    title: 'Gastro-System', 
    icon: <Utensils className="h-4 w-4 text-blue-500" />,
    borderColor: 'bg-blue-500/10 border-b-blue-500/30',
    Component: LiveDemoGastroPanel
  },
  { 
    id: 'easyorder', 
    title: 'EasyOrder', 
    icon: <Smartphone className="h-4 w-4 text-orange-500" />,
    borderColor: 'bg-orange-500/10 border-b-orange-500/30',
    Component: LiveDemoEasyOrderPanel
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
        const parsed = JSON.parse(saved) as TilePosition[];
        // Validate that all required tile IDs exist
        const requiredIds = defaultPositions.map(p => p.id);
        const savedIds = parsed.map(p => p.id);
        const allIdsPresent = requiredIds.every(id => savedIds.includes(id));
        if (allIdsPresent) {
          return parsed;
        }
        // If IDs don't match (e.g. after restructure), use defaults
        return defaultPositions;
      } catch {
        return defaultPositions;
      }
    }
    return defaultPositions;
  });

  const [isDirectOrder, setIsDirectOrder] = useState(false);

  // Dynamic connections based on direct order mode
  const connections = useMemo((): Connection[] => {
    if (isDirectOrder) {
      return [
        { from: 'easyorder', to: 'supplier', label: 'Direktbestellung', color: '#22c55e' },
        { from: 'easyorder', to: 'email', label: 'E-Mail', color: '#8b5cf6' },
        { from: 'easyorder', to: 'gastro', label: 'Entwurf', color: '#f97316', inactive: true, dashed: true },
        { from: 'gastro', to: 'supplier', label: 'Bestellung', color: '#22c55e' },
        { from: 'gastro', to: 'email', label: 'E-Mail', color: '#8b5cf6' },
      ];
    }
    return [
      { from: 'easyorder', to: 'gastro', label: 'Entwurf', color: '#f97316' },
      { from: 'gastro', to: 'supplier', label: 'Bestellung', color: '#22c55e' },
      { from: 'gastro', to: 'email', label: 'E-Mail', color: '#8b5cf6' },
    ];
  }, [isDirectOrder]);

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

  const handleDirectOrderChange = useCallback((value: boolean) => {
    setIsDirectOrder(value);
  }, []);

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

        // Override EasyOrder tile styling when direct order is active
        const effectiveBorderColor = id === 'easyorder' && isDirectOrder 
          ? 'bg-green-500/10 border-b-green-500/30'
          : borderColor;
        const effectiveIcon = id === 'easyorder' && isDirectOrder
          ? <Zap className="h-4 w-4 text-green-500" />
          : icon;

        return (
          <DraggableTile
            key={id}
            id={id}
            position={position}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
            title={id === 'easyorder' && isDirectOrder ? 'EasyOrder ⚡' : title}
            icon={effectiveIcon}
            borderColor={effectiveBorderColor}
          >
            {id === 'easyorder' ? (
              <LiveDemoEasyOrderPanel soundEnabled={soundEnabled} onDirectOrderChange={handleDirectOrderChange} />
            ) : (
              <Component soundEnabled={soundEnabled} />
            )}
          </DraggableTile>
        );
      })}

      {/* Workflow Legend */}
      <div className="absolute bottom-4 left-4 z-50 bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Workflow {isDirectOrder && <span className="text-green-600">(Direktbestellung)</span>}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {isDirectOrder ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>EasyOrder</span>
              </div>
              <span className="text-green-600 font-medium">→ direkt →</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Lieferant erhält</span>
              </div>
              <span className="text-muted-foreground">+</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span>E-Mail gesendet</span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Tip for Dragging */}
      <div className="absolute bottom-4 right-4 z-50 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border">
        💡 Kacheln können frei verschoben werden
      </div>
    </div>
  );
}
