import { useMemo } from 'react';
import { TilePosition } from './DraggableTile';

export interface Connection {
  from: string;
  to: string;
  label?: string;
  color?: string;
}

interface ConnectionArrowsProps {
  connections: Connection[];
  positions: TilePosition[];
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

      // Calculate connection points (from right edge of source to left edge of target)
      const fromX = fromPos.x + fromPos.width;
      const fromY = fromPos.y + fromPos.height / 2;
      const toX = toPos.x;
      const toY = toPos.y + toPos.height / 2;

      // Calculate control points for smooth Bézier curve
      const deltaX = toX - fromX;
      const controlOffset = Math.min(Math.abs(deltaX) * 0.4, 80);
      
      const path = `M ${fromX} ${fromY} C ${fromX + controlOffset} ${fromY}, ${toX - controlOffset} ${toY}, ${toX} ${toY}`;
      
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
            style={{
              strokeDasharray: '8, 4',
              animation: 'dashFlow 0.8s linear infinite',
            }}
          />
          
          {/* Arrow head */}
          <polygon
            points={`${toX - 8},${toY - 5} ${toX},${toY} ${toX - 8},${toY + 5}`}
            fill={color}
            className="drop-shadow-sm"
          />
          
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
