import { useMemo } from 'react';
import { TilePosition } from './DraggableTile';
import { ParticleConfig, DataPackageType, OrderData, DEFAULT_PARTICLE_CONFIG } from './particleConfig';
import { AnimatedDataPackage } from './AnimatedDataPackage';

export interface Connection {
  from: string;
  to: string;
  label?: string;
  reverseLabel?: string;
  color?: string;
  bidirectional?: boolean;
  dashed?: boolean;
  inactive?: boolean;
  highlighted?: boolean;
  animating?: boolean;
  reverseAnimating?: boolean;
  // New: Data package properties
  dataType?: DataPackageType;
  orderData?: OrderData;
  reverseDataType?: DataPackageType;
  reverseOrderData?: OrderData;
}

interface ConnectionArrowsProps {
  connections: Connection[];
  positions: TilePosition[];
  particleConfig?: ParticleConfig;
  activeStep?: string | null; // ID of active connection for spotlight effect
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

export function ConnectionArrows({ 
  connections, 
  positions, 
  particleConfig = DEFAULT_PARTICLE_CONFIG,
  activeStep = null
}: ConnectionArrowsProps) {
  const positionMap = useMemo(() => {
    return positions.reduce((acc, pos) => {
      acc[pos.id] = pos;
      return acc;
    }, {} as Record<string, TilePosition>);
  }, [positions]);

  // Check if any connection is currently animating (for spotlight effect)
  const hasActiveAnimation = useMemo(() => {
    return connections.some(c => c.animating || c.reverseAnimating);
  }, [connections]);

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
      const isAnimating = conn.animating || conn.reverseAnimating;
      
      // Spotlight effect: dim non-active connections when something is animating
      const spotlightOpacity = hasActiveAnimation && !isAnimating ? 0.15 : 1;
      // Keep "inactive" connections visible when they are highlighted/animating
      const effectiveOpacity = conn.inactive && !isAnimating && !conn.highlighted ? 0.3 : spotlightOpacity;
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
            opacity={effectiveOpacity}
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
            opacity={effectiveOpacity}
            filter={conn.highlighted ? `url(#glow-${pathId})` : 'none'}
            style={conn.bidirectional ? {} : {
              strokeDasharray: conn.dashed ? '4, 8' : '8, 4',
              animation: conn.inactive || effectiveOpacity < 1 ? 'none' : 'dashFlow 0.8s linear infinite',
            }}
          />

          {/* Animated Data Package (new) - uses icons instead of particles */}
          {conn.animating && particleConfig.showDataIcons && conn.dataType && (
            <AnimatedDataPackage 
              pathId={pathId} 
              type={conn.dataType}
              data={conn.orderData}
              color={color} 
              config={particleConfig} 
            />
          )}
          
          {/* Reverse animated data package */}
          {conn.reverseAnimating && conn.bidirectional && particleConfig.showDataIcons && (
            <AnimatedDataPackage 
              pathId={pathId} 
              type={conn.reverseDataType || 'confirmation'}
              data={conn.reverseOrderData}
              color={color} 
              config={particleConfig} 
              reverse 
            />
          )}
          
          {/* Arrow head at destination */}
          <polygon
            points={getArrowPoints(toX, toY, toDirection)}
            fill={color}
            opacity={effectiveOpacity}
            className="drop-shadow-sm"
            filter={conn.highlighted ? `url(#glow-${pathId})` : 'none'}
          />
          
          {/* Arrow head at source (for bidirectional) */}
          {conn.bidirectional && (
            <polygon
              points={getArrowPoints(fromX, fromY, getOppositeDirection(fromDirection))}
              fill={color}
              opacity={effectiveOpacity}
              className="drop-shadow-sm"
            />
          )}
          
          {/* Connection label - hide when spotlight dimmed */}
          {conn.label && effectiveOpacity > 0.5 && (() => {
            let displayLabel: string;
            if (conn.bidirectional && conn.reverseLabel) {
              if (conn.animating) {
                displayLabel = `${conn.label} →`;
              } else if (conn.reverseAnimating) {
                displayLabel = `← ${conn.reverseLabel}`;
              } else {
                displayLabel = `${conn.label} ↔ ${conn.reverseLabel}`;
              }
            } else {
              const hasAnimatingReverse = connections.some(
                other => other.from === conn.to && 
                         other.to === conn.from && 
                         other.animating
              );
              
              if (!conn.animating && hasAnimatingReverse) {
                return null;
              }
              
              displayLabel = conn.animating ? `${conn.label} →` : conn.label;
            }

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
                  opacity={effectiveOpacity}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-medium fill-foreground"
                  opacity={effectiveOpacity}
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
  }, [connections, positionMap, particleConfig, hasActiveAnimation]);

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