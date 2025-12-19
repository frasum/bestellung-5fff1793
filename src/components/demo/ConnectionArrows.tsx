import { useMemo } from 'react';
import { TilePosition } from './DraggableTile';

export interface Connection {
  from: string;
  to: string;
  label?: string;
  color?: string;
  bidirectional?: boolean;
}

interface ConnectionArrowsProps {
  connections: Connection[];
  positions: TilePosition[];
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
  // Calculate centers
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;

  // Calculate direction vector
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  let fromX: number, fromY: number, toX: number, toY: number;
  let fromDirection: Direction, toDirection: Direction;

  // Determine based on dominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    if (dx > 0) {
      // Target is to the right → from right edge to left edge
      fromX = from.x + from.width;
      fromY = from.y + from.height / 2;
      toX = to.x;
      toY = to.y + to.height / 2;
      fromDirection = 'right';
      toDirection = 'left';
    } else {
      // Target is to the left → from left edge to right edge
      fromX = from.x;
      fromY = from.y + from.height / 2;
      toX = to.x + to.width;
      toY = to.y + to.height / 2;
      fromDirection = 'left';
      toDirection = 'right';
    }
  } else {
    // Vertical dominant
    if (dy > 0) {
      // Target is below → from bottom edge to top edge
      fromX = from.x + from.width / 2;
      fromY = from.y + from.height;
      toX = to.x + to.width / 2;
      toY = to.y;
      fromDirection = 'down';
      toDirection = 'up';
    } else {
      // Target is above → from top edge to bottom edge
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
  
  // Calculate control points based on direction
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
    case 'left': // Arrow pointing left (entering from right)
      return `${x + size},${y - size * 0.625} ${x},${y} ${x + size},${y + size * 0.625}`;
    case 'right': // Arrow pointing right (entering from left)
      return `${x - size},${y - size * 0.625} ${x},${y} ${x - size},${y + size * 0.625}`;
    case 'up': // Arrow pointing up (entering from below)
      return `${x - size * 0.625},${y + size} ${x},${y} ${x + size * 0.625},${y + size}`;
    case 'down': // Arrow pointing down (entering from above)
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

export function ConnectionArrows({ connections, positions }: ConnectionArrowsProps) {
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

      // Get dynamic connection points
      const points = getConnectionPoints(fromPos, toPos);
      const { fromX, fromY, toX, toY, fromDirection, toDirection } = points;
      
      // Create curved path
      const path = createPath(points);
      
      // Calculate midpoint for label
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;

      const color = conn.color || '#10b981';

      return (
        <g key={`${conn.from}-${conn.to}-${index}`}>
          {/* Shadow path for depth */}
          <path
            d={path}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={4}
            strokeLinecap="round"
            transform="translate(2, 2)"
          />
          
          {/* Main path with gradient */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            className="connection-path"
            style={conn.bidirectional ? {} : {
              strokeDasharray: '8, 4',
              animation: 'dashFlow 0.8s linear infinite',
            }}
          />
          
          {/* Arrow head at destination */}
          <polygon
            points={getArrowPoints(toX, toY, toDirection)}
            fill={color}
            className="drop-shadow-sm"
          />
          
          {/* Arrow head at source (for bidirectional) */}
          {conn.bidirectional && (
            <polygon
              points={getArrowPoints(fromX, fromY, getOppositeDirection(fromDirection))}
              fill={color}
              className="drop-shadow-sm"
            />
          )}
          
          {/* Connection label */}
          {conn.label && (
            <g transform={`translate(${midX}, ${midY - 12})`}>
              <rect
                x={-conn.label.length * 4 - 8}
                y={-10}
                width={conn.label.length * 8 + 16}
                height={20}
                rx={10}
                fill="hsl(var(--card))"
                stroke={color}
                strokeWidth={1.5}
                className="drop-shadow"
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-medium fill-foreground"
              >
                {conn.label}
              </text>
            </g>
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
