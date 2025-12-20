import { useState, useEffect, useCallback, useMemo } from 'react';
import { Smartphone, Truck, Mail, RotateCcw, Utensils, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraggableTile, TilePosition } from './DraggableTile';
import { ConnectionArrows, Connection } from './ConnectionArrows';
import { LiveDemoGastroPanel } from './LiveDemoGastroPanel';
import { LiveDemoEasyOrderPanel } from './LiveDemoEasyOrderPanel';
import { LiveDemoSupplierPanel } from './LiveDemoSupplierPanel';
import { LiveDemoEmailPanel } from './LiveDemoEmailPanel';
import { ParticleConfigPanel } from './ParticleConfigPanel';
import { ParticleConfig, DEFAULT_PARTICLE_CONFIG, DataPackageType, OrderData } from './particleConfig';

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
    title: 'Zentrales Bestellsystem', 
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

interface AnimationStep {
  from: string;
  to: string;
  dataType: DataPackageType;
  orderData?: OrderData;
  reverse?: boolean;
}

export function LiveDemoCanvas({ soundEnabled }: LiveDemoCanvasProps) {
  const [positions, setPositions] = useState<TilePosition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TilePosition[];
        const requiredIds = defaultPositions.map(p => p.id);
        const savedIds = parsed.map(p => p.id);
        const allIdsPresent = requiredIds.every(id => savedIds.includes(id));
        if (allIdsPresent) {
          return parsed;
        }
        return defaultPositions;
      } catch {
        return defaultPositions;
      }
    }
    return defaultPositions;
  });

  const [isDirectOrder, setIsDirectOrder] = useState(false);
  const [highlightedConnection, setHighlightedConnection] = useState<string | null>(null);
  const [animatingConnections, setAnimatingConnections] = useState<Map<string, { dataType: DataPackageType; orderData?: OrderData; reverse?: boolean }>>(new Map());
  const [particleConfig, setParticleConfig] = useState<ParticleConfig>(DEFAULT_PARTICLE_CONFIG);

  // Dynamic connections based on direct order mode
  // Korrigiert um den echten Bestellfluss abzubilden:
  // - Direktbestellung: EasyOrder → Lieferant (bidirectional für Bestätigung) + E-Mail
  // - Freigabe-Modus: EasyOrder → Gastro, Gastro → Lieferant (bidirectional) + E-Mail
  const connections = useMemo((): Connection[] => {
    const baseConnections: Connection[] = isDirectOrder
      ? [
          // Direktbestellung: EasyOrder-Verbindungen + Info an Gastro
          { from: 'easyorder', to: 'supplier', label: 'Direktbestellung', reverseLabel: 'Bestätigung', color: '#22c55e', bidirectional: true },
          { from: 'easyorder', to: 'email', label: 'E-Mail', color: '#8b5cf6' },
          // Info an Gastro, dass Bestellung aufgegeben wurde (passiv, gestrichelt)
          { from: 'easyorder', to: 'gastro', label: 'Info', color: '#64748b', dashed: true },
        ]
      : [
          // Freigabe-Modus: EasyOrder → Gastro → Lieferant
          { from: 'easyorder', to: 'gastro', label: 'Entwurf', color: '#f97316' },
          { from: 'gastro', to: 'supplier', label: 'Bestellung', reverseLabel: 'Bestätigung', color: '#22c55e', bidirectional: true },
          { from: 'gastro', to: 'email', label: 'E-Mail', color: '#8b5cf6' },
          // supplier → email ENTFERNT - Bestätigung geht an Gastro, nicht separat an E-Mail
        ];

    // Add highlighted, animating state, and data package info to matching connections
    return baseConnections.map(conn => {
      const forwardKey = `${conn.from}-${conn.to}`;
      const reverseKey = `${conn.to}-${conn.from}`;
      const forwardAnim = animatingConnections.get(forwardKey);
      const reverseAnim = animatingConnections.get(reverseKey);

      return {
        ...conn,
        highlighted: highlightedConnection === forwardKey || 
                     (conn.bidirectional && highlightedConnection === reverseKey),
        animating: !!forwardAnim,
        reverseAnimating: conn.bidirectional && !!reverseAnim,
        dataType: forwardAnim?.dataType,
        orderData: forwardAnim?.orderData,
        reverseDataType: reverseAnim?.dataType,
        reverseOrderData: reverseAnim?.orderData,
      };
    });
  }, [isDirectOrder, highlightedConnection, animatingConnections]);

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

  // Start animation for a single connection with data
  const startAnimation = useCallback((from: string, to: string, dataType: DataPackageType, orderData?: OrderData, reverse?: boolean) => {
    const connectionId = `${from}-${to}`;
    
    // Highlight the connection
    setHighlightedConnection(connectionId);
    setTimeout(() => setHighlightedConnection(null), particleConfig.duration + 200);
    
    // Start data package animation
    setAnimatingConnections(prev => {
      const next = new Map(prev);
      next.set(connectionId, { dataType, orderData, reverse });
      return next;
    });
    
    setTimeout(() => {
      setAnimatingConnections(prev => {
        const next = new Map(prev);
        next.delete(connectionId);
        return next;
      });
    }, particleConfig.duration + 100);
  }, [particleConfig.duration]);

  // Step-by-step order sequence animation
  // Korrigiert um den echten Bestellfluss abzubilden:
  // - Direktbestellung: Bestätigung geht an EasyOrder zurück (nicht an E-Mail)
  // - Freigabe-Modus: Bestätigung geht an Gastro zurück (nicht separat an E-Mail)
  const handleOrderSequence = useCallback((orderData: OrderData, source: 'easyorder' | 'gastro') => {
    const steps: (AnimationStep & { delay: number })[] = isDirectOrder && source === 'easyorder'
      ? [
          // Direktbestellung von EasyOrder
          { from: 'easyorder', to: 'supplier', dataType: 'order', orderData, delay: 0 },
          { from: 'easyorder', to: 'email', dataType: 'email', orderData, delay: 600 },
          // Info an Gastro (parallel zur E-Mail)
          { from: 'easyorder', to: 'gastro', dataType: 'draft', orderData, delay: 800 },
          // Bestätigung geht an EasyOrder zurück
          { from: 'supplier', to: 'easyorder', dataType: 'confirmation', orderData, delay: 2000, reverse: true },
        ]
      : source === 'easyorder'
      ? [
          // EasyOrder erstellt Entwurf zur Freigabe
          { from: 'easyorder', to: 'gastro', dataType: 'draft', orderData, delay: 0 },
        ]
      : [
          // Gastro sendet freigegebene Bestellung
          { from: 'gastro', to: 'supplier', dataType: 'order', orderData, delay: 0 },
          { from: 'gastro', to: 'email', dataType: 'email', orderData, delay: 400 },
          // Bestätigung geht an Gastro zurück (bidirectional), nicht separat an E-Mail
          { from: 'supplier', to: 'gastro', dataType: 'confirmation', orderData, delay: 2200, reverse: true },
        ];

    steps.forEach(step => {
      setTimeout(() => {
        startAnimation(step.from, step.to, step.dataType, step.orderData, step.reverse);
      }, step.delay);
    });
  }, [isDirectOrder, startAnimation]);

  // Legacy handler for simple order created events
  const handleOrderCreated = useCallback((from: string, to: string) => {
    // Determine data type based on connection
    let dataType: DataPackageType = 'order';
    if (from === 'easyorder' && to === 'gastro') dataType = 'draft';
    else if (to === 'email') dataType = 'email';
    else if (from === 'supplier') dataType = 'confirmation';
    
    // Create sample order data
    const sampleData: OrderData = {
      supplier: from === 'easyorder' ? 'Diverse' : 'Lieferant',
      itemCount: Math.floor(Math.random() * 5) + 1,
      total: `€${(Math.random() * 100 + 20).toFixed(2)}`,
    };

    startAnimation(from, to, dataType, sampleData);
  }, [startAnimation]);

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

      {/* Particle Configuration Panel */}
      <ParticleConfigPanel config={particleConfig} onChange={setParticleConfig} />

      {/* Connection Arrows */}
      <ConnectionArrows connections={connections} positions={positions} particleConfig={particleConfig} />

      {/* Draggable Tiles */}
      {tileConfig.map(({ id, title, icon, borderColor, Component }) => {
        const position = positions.find(p => p.id === id);
        if (!position) return null;

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
              <LiveDemoEasyOrderPanel 
                soundEnabled={soundEnabled} 
                onDirectOrderChange={handleDirectOrderChange}
                onOrderCreated={handleOrderCreated}
              />
            ) : id === 'gastro' ? (
              <LiveDemoGastroPanel 
                soundEnabled={soundEnabled} 
                onOrderCreated={handleOrderCreated}
              />
            ) : id === 'supplier' ? (
              <LiveDemoSupplierPanel 
                soundEnabled={soundEnabled} 
                onOrderCreated={handleOrderCreated}
              />
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
                <span>Zentrales Bestellsystem</span>
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