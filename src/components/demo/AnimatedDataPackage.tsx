import { useState, useEffect } from 'react';
import { Package, Check, Mail, FileText } from 'lucide-react';
import { ParticleConfig, DataPackageType, OrderData, DEFAULT_PARTICLE_CONFIG } from './particleConfig';

interface AnimatedDataPackageProps {
  pathId: string;
  type: DataPackageType;
  data?: OrderData;
  config?: ParticleConfig;
  reverse?: boolean;
  color: string;
}

const iconConfig = {
  order: { 
    Icon: Package, 
    label: 'Bestellung', 
    bgColor: 'bg-green-500',
    borderColor: 'border-green-600'
  },
  confirmation: { 
    Icon: Check, 
    label: 'Bestätigung', 
    bgColor: 'bg-green-500',
    borderColor: 'border-green-600'
  },
  email: { 
    Icon: Mail, 
    label: 'E-Mail', 
    bgColor: 'bg-violet-500',
    borderColor: 'border-violet-600'
  },
  draft: { 
    Icon: FileText, 
    label: 'Vorbestellung', 
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-600'
  },
};

export function AnimatedDataPackage({ 
  pathId, 
  type, 
  data,
  config = DEFAULT_PARTICLE_CONFIG,
  reverse = false,
  color
}: AnimatedDataPackageProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const initTimeout = setTimeout(() => {
      const pathElement = document.getElementById(pathId);
      if (!pathElement || !(pathElement instanceof SVGPathElement)) {
        return;
      }
      const path = pathElement;
      const totalLength = path.getTotalLength();
      const startTime = performance.now();
      let animationFrame: number;
      
      const startPoint = path.getPointAtLength(reverse ? totalLength : 0);
      setPosition({ x: startPoint.x, y: startPoint.y });

      function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / config.duration, 1);
        
        // Easing function - ease-out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const pathProgress = reverse ? (1 - easedProgress) : easedProgress;
        
        const point = path!.getPointAtLength(totalLength * pathProgress);
        setPosition({ x: point.x, y: point.y });
        
        // Subtle bounce effect
        const pulsePhase = (elapsed / 200) % (2 * Math.PI);
        setScale(1 + 0.05 * Math.sin(pulsePhase));
        
        // Fade out in the last 15%
        if (progress > 0.85) {
          setOpacity(1 - ((progress - 0.85) / 0.15));
        }
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      }

      animationFrame = requestAnimationFrame(animate);

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }, 50);

    return () => clearTimeout(initTimeout);
  }, [pathId, config.duration, reverse]);

  if (!position) return null;

  const { Icon, label, bgColor, borderColor } = iconConfig[type];
  const iconSizeHalf = config.iconSize / 2;

  return (
    <g style={{ opacity }}>
      {/* Glow effect */}
      <defs>
        <filter id={`data-glow-${pathId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Icon container with foreignObject */}
      <foreignObject 
        x={position.x - iconSizeHalf} 
        y={position.y - iconSizeHalf} 
        width={config.iconSize} 
        height={config.iconSize}
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: `${position.x}px ${position.y}px`,
          filter: `drop-shadow(0 0 12px ${color})`
        }}
      >
        <div 
          className={`flex items-center justify-center w-full h-full ${bgColor} rounded-full border-2 ${borderColor} shadow-xl`}
          style={{ 
            boxShadow: `0 0 20px ${color}, 0 4px 12px rgba(0,0,0,0.3)` 
          }}
        >
          <Icon className="text-white" style={{ width: config.iconSize * 0.5, height: config.iconSize * 0.5 }} />
        </div>
      </foreignObject>
      
      {/* Info popup */}
      {config.showInfoPopup && data && (
        <foreignObject 
          x={position.x + iconSizeHalf + 8} 
          y={position.y - 35} 
          width={config.popupWidth} 
          height={80}
          style={{ opacity }}
        >
          <div className="bg-card border rounded-lg shadow-xl p-2 text-xs animate-fade-in">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <Icon className="h-3 w-3" style={{ color }} />
              {label}
            </div>
            {data.supplier && (
              <div className="text-muted-foreground truncate">{data.supplier}</div>
            )}
            {data.itemCount !== undefined && (
              <div className="text-foreground">{data.itemCount} Artikel</div>
            )}
            {data.total && (
              <div className="font-medium text-foreground">{data.total}</div>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}