import { useMemo, useState, useEffect } from 'react';
import { TilePosition } from './DraggableTile';
import { ParticleConfig, DEFAULT_PARTICLE_CONFIG } from './particleConfig';

export interface Connection {
  from: string;
  to: string;
  label?: string;
  color?: string;
  bidirectional?: boolean;
  dashed?: boolean;
  inactive?: boolean;
  highlighted?: boolean;
  animating?: boolean;
}

// Animated particle component using JavaScript animation instead of SVG animateMotion
function AnimatedParticle({ 
  pathId, 
  color, 
  config = DEFAULT_PARTICLE_CONFIG
}: { 
  pathId: string; 
  color: string; 
  config?: ParticleConfig;
}) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);
  const [trailPositions, setTrailPositions] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Small delay to ensure the path is rendered
    const initTimeout = setTimeout(() => {
      const pathElement = document.getElementById(pathId);
      if (!pathElement || !(pathElement instanceof SVGPathElement)) {
        console.warn('AnimatedParticle: Path not found or not SVGPathElement:', pathId);
        return;
      }
      const path = pathElement;
      if (!path) {
        console.warn('AnimatedParticle: Path not found:', pathId);
        return;
      }

      const totalLength = path.getTotalLength();
      const startTime = performance.now();
      let animationFrame: number;
      
      // Initialize position at start
      const startPoint = path.getPointAtLength(0);
      setPosition({ x: startPoint.x, y: startPoint.y });

      function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / config.duration, 1);
        
        // Easing function for smoother animation
        const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        
        const point = path!.getPointAtLength(totalLength * easedProgress);
        setPosition({ x: point.x, y: point.y });
        
        // Trail positions (delayed versions of current position) - use config offsets
        const trail1Progress = Math.max(0, easedProgress - config.trailOffset1);
        const trail2Progress = Math.max(0, easedProgress - config.trailOffset2);
        const trail1 = path!.getPointAtLength(totalLength * trail1Progress);
        const trail2 = path!.getPointAtLength(totalLength * trail2Progress);
        setTrailPositions([
          { x: trail2.x, y: trail2.y },
          { x: trail1.x, y: trail1.y }
        ]);
        
        // Pulsating scale effect - use config pulse intensity
        const pulsePhase = (elapsed / 150) % (2 * Math.PI);
        setScale(1 + config.pulseIntensity * Math.sin(pulsePhase));
        
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
    }, 50); // Small delay to ensure DOM is ready

    return () => clearTimeout(initTimeout);
  }, [pathId, config]);

  if (!position) return null;

  return (
    <g style={{ opacity }}>
      {/* Glow filter - use config glow blur */}
      <defs>
        <filter id={`particle-glow-js-${pathId}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation={config.glowBlur} result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Trail particle 1 - smallest - use config sizes */}
      {trailPositions[0] && (
        <circle
          cx={trailPositions[0].x}
          cy={trailPositions[0].y}
          r={config.trail1Size}
          fill={color}
          opacity={config.trail1Opacity}
        />
      )}
      
      {/* Trail particle 2 - medium - use config sizes */}
      {trailPositions[1] && (
        <circle
          cx={trailPositions[1].x}
          cy={trailPositions[1].y}
          r={config.trail2Size}
          fill={color}
          opacity={config.trail2Opacity}
        />
      )}

      {/* Main particle - large with white border and glow - use config sizes */}
      <circle
        cx={position.x}
        cy={position.y}
        r={config.mainParticleSize * scale}
        fill={color}
        stroke="white"
        strokeWidth={config.strokeWidth}
        filter={`url(#particle-glow-js-${pathId})`}
        style={{ 
          filter: `url(#particle-glow-js-${pathId}) drop-shadow(0 0 20px ${color})` 
        }}
      />
      
      {/* Inner bright core - use config sizes */}
      <circle
        cx={position.x}
        cy={position.y}
        r={config.coreSize * scale}
        fill="white"
        opacity={config.coreOpacity}
      />
    </g>
  );
}

interface ConnectionArrowsProps {
  connections: Connection[];
  positions: TilePosition[];
  particleConfig?: ParticleConfig;
}

type Direction = 'right' | 'left' | 'down' | 'up';

interface ConnectionPoints {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromDirection: Direction;
  toDirection: Direction;
}

function getConnectionPoints(from: TilePosition, to: TilePosition): ConnectionPoints {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  let fromX: number, fromY: number, toX: number, toY: number;
  let fromDirection: Direction, toDirection: Direction;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      fromX = from.x + from.width;
      fromY = from.y + from.height / 2;
      toX = to.x;
      toY = to.y + to.height / 2;
      fromDirection = 'right';
      toDirection = 'left';
    } else {
      fromX = from.x;
      fromY = from.y + from.height / 2;
      toX = to.x + to.width;
      toY = to.y + to.height / 2;
      fromDirection = 'left';
      toDirection = 'right';
    }
  } else {
    if (dy > 0) {
      fromX = from.x + from.width / 2;
      fromY = from.y + from.height;
      toX = to.x + to.width / 2;
      toY = to.y;
      fromDirection = 'down';
      toDirection = 'up';
    } else {
      fromX = from.x + from.width / 2;
      fromY = from.y;
      toX = to.x + to.width / 2;
      toY = to.y + to.height;
      fromDirection = 'up';
      toDirection = 'down';
    }
  }

  return { fromX, fromY, toX, toY, fromDirection, toDirection };
}

function createPath(points: ConnectionPoints): string {
  const { fromX, fromY, toX, toY, fromDirection } = points;
  const isHorizontal = fromDirection === 'left' || fromDirection === 'right';
  
  if (isHorizontal) {
    const deltaX = toX - fromX;
    const controlOffset = Math.min(Math.abs(deltaX) * 0.4, 80);
    const sign = fromDirection === 'right' ? 1 : -1;
    return `M ${fromX} ${fromY} C ${fromX + controlOffset * sign} ${fromY}, ${toX - controlOffset * sign} ${toY}, ${toX} ${toY}`;
  } else {
    const deltaY = toY - fromY;
    const controlOffset = Math.min(Math.abs(deltaY) * 0.4, 80);
    const sign = fromDirection === 'down' ? 1 : -1;
    return `M ${fromX} ${fromY} C ${fromX} ${fromY + controlOffset * sign}, ${toX} ${toY - controlOffset * sign}, ${toX} ${toY}`;
  }
}

function getArrowPoints(x: number, y: number, direction: Direction, size: number = 8): string {
  switch (direction) {
    case 'left':
      return `${x + size},${y - size * 0.625} ${x},${y} ${x + size},${y + size * 0.625}`;
    case 'right':
      return `${x - size},${y - size * 0.625} ${x},${y} ${x - size},${y + size * 0.625}`;
    case 'up':
      return `${x - size * 0.625},${y + size} ${x},${y} ${x + size * 0.625},${y + size}`;
    case 'down':
      return `${x - size * 0.625},${y - size} ${x},${y} ${x + size * 0.625},${y - size}`;
  }
}

function getOppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case 'left': return 'right';
    case 'right': return 'left';
    case 'up': return 'down';
    case 'down': return 'up';
  }
}

export function ConnectionArrows({ connections, positions, particleConfig = DEFAULT_PARTICLE_CONFIG }: ConnectionArrowsProps) {
  const positionMap = useMemo(() => {
    return positions.reduce((acc, pos) => {
      acc[pos.id] = pos;
      return acc;
    }, {} as Record<string, TilePosition>);
  }, [positions]);

  const arrows = useMemo(() => {
    return connections.map((conn, index) => {
      const fromPos = positionMap[conn.from];
      const toPos = positionMap[conn.to];
      
      if (!fromPos || !toPos) return null;

      const points = getConnectionPoints(fromPos, toPos);
      const { fromX, fromY, toX, toY, fromDirection, toDirection } = points;
      const path = createPath(points);
      const pathId = `path-${conn.from}-${conn.to}-${index}`;
      
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;

      const color = conn.color || '#10b981';
      const isActive = !conn.inactive;

      return (
        <g key={`${conn.from}-${conn.to}-${index}`}>
          {/* Glow filter for highlighted connections */}
          {conn.highlighted && (
            <defs>
              <filter id={`glow-${pathId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          )}

          {/* Shadow path for depth */}
          <path
            d={path}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={4}
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          
          {/* Main path */}
          <path
            id={pathId}
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={conn.inactive ? 1.5 : conn.highlighted ? 3.5 : 2.5}
            strokeLinecap="round"
            className="connection-path"
            opacity={conn.inactive ? 0.3 : 1}
            filter={conn.highlighted ? `url(#glow-${pathId})` : 'none'}
            style={conn.bidirectional ? {} : {
              strokeDasharray: conn.dashed ? '4, 8' : '8, 4',
              animation: conn.inactive ? 'none' : 'dashFlow 0.8s linear infinite',
            }}
          />

          {/* Animated particle using JavaScript animation with config */}
          {conn.animating && (
            <AnimatedParticle pathId={pathId} color={color} config={particleConfig} />
          )}
          
          {/* Arrow head at destination */}
          <polygon
            points={getArrowPoints(toX, toY, toDirection)}
            fill={color}
            opacity={conn.inactive ? 0.3 : 1}
            className="drop-shadow-sm"
            filter={conn.highlighted ? `url(#glow-${pathId})` : 'none'}
          />
          
          {/* Arrow head at source (for bidirectional) */}
          {conn.bidirectional && (
            <polygon
              points={getArrowPoints(fromX, fromY, getOppositeDirection(fromDirection))}
              fill={color}
              opacity={conn.inactive ? 0.3 : 1}
              className="drop-shadow-sm"
            />
          )}
          
          {/* Connection label with dynamic arrow when animating */}
          {conn.label && (() => {
            const displayLabel = conn.animating ? `${conn.label} →` : conn.label;
            return (
              <g transform={`translate(${midX}, ${midY - 12})`}>
                <rect
                  x={-displayLabel.length * 4 - 8}
                  y={-10}
                  width={displayLabel.length * 8 + 16}
                  height={20}
                  rx={10}
                  fill="hsl(var(--card))"
                  stroke={color}
                  strokeWidth={conn.highlighted ? 2 : 1.5}
                  className="drop-shadow"
                  opacity={conn.inactive ? 0.5 : 1}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-medium fill-foreground"
                  opacity={conn.inactive ? 0.5 : 1}
                >
                  {displayLabel}
                </text>
              </g>
            );
          })()}

          {/* Pulse effect for highlighted connections */}
          {conn.highlighted && (
            <circle cx={toX} cy={toY} r={12} fill={color} opacity={0}>
              <animate
                attributeName="r"
                from="8"
                to="24"
                dur="0.8s"
                repeatCount="3"
              />
              <animate
                attributeName="opacity"
                from="0.6"
                to="0"
                dur="0.8s"
                repeatCount="3"
              />
            </circle>
          )}
        </g>
      );
    }).filter(Boolean);
  }, [connections, positionMap]);

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      style={{ zIndex: 5 }}
    >
      <defs>
        <style>
          {`
            @keyframes dashFlow {
              to {
                stroke-dashoffset: -12;
              }
            }
          `}
        </style>
      </defs>
      {arrows}
    </svg>
  );
}