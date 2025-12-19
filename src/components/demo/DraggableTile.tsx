import { useRef, useState, useCallback, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TilePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableTileProps {
  id: string;
  position: TilePosition;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
  children: ReactNode;
  title: string;
  icon: ReactNode;
  borderColor: string;
  className?: string;
  minWidth?: number;
  minHeight?: number;
}

export function DraggableTile({
  id,
  position,
  onPositionChange,
  onSizeChange,
  children,
  title,
  icon,
  borderColor,
  className,
  minWidth = 250,
  minHeight = 200
}: DraggableTileProps) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!tileRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    resizeStart.current = {
      width: position.width,
      height: position.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStart.current.mouseX;
      const deltaY = moveEvent.clientY - resizeStart.current.mouseY;
      
      // Calculate new size with grid snap (20px)
      let newWidth = resizeStart.current.width + deltaX;
      let newHeight = resizeStart.current.height + deltaY;
      
      newWidth = Math.round(newWidth / 20) * 20;
      newHeight = Math.round(newHeight / 20) * 20;
      
      // Apply minimum constraints
      newWidth = Math.max(minWidth, newWidth);
      newHeight = Math.max(minHeight, newHeight);
      
      // Apply maximum constraints (parent bounds)
      if (tileRef.current?.parentElement) {
        const parentRect = tileRef.current.parentElement.getBoundingClientRect();
        newWidth = Math.min(newWidth, parentRect.width - position.x);
        newHeight = Math.min(newHeight, parentRect.height - position.y);
      }
      
      onSizeChange(id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [id, position.width, position.height, position.x, position.y, minWidth, minHeight, onSizeChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!tileRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = tileRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!tileRef.current?.parentElement) return;
      
      const parentRect = tileRef.current.parentElement.getBoundingClientRect();
      
      // Calculate new position relative to parent
      let newX = moveEvent.clientX - parentRect.left - dragOffset.current.x;
      let newY = moveEvent.clientY - parentRect.top - dragOffset.current.y;
      
      // Snap to 20px grid
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;
      
      // Constrain to parent bounds
      newX = Math.max(0, Math.min(newX, parentRect.width - position.width));
      newY = Math.max(0, Math.min(newY, parentRect.height - position.height));
      
      onPositionChange(id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [id, position.width, position.height, onPositionChange]);

  return (
    <div
      ref={tileRef}
      className={cn(
        'absolute bg-card rounded-lg shadow-lg border overflow-hidden flex flex-col transition-shadow',
        isDragging ? 'shadow-2xl ring-2 ring-primary/50 z-50 cursor-grabbing' : 'hover:shadow-xl z-10',
        isResizing && 'ring-2 ring-primary/50 z-50',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
    >
      {/* Tile Header with Drag Handle */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 border-b cursor-grab select-none',
          borderColor,
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <span className="font-semibold text-sm">{title}</span>
        </div>
      </div>
      
      {/* Tile Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      
      {/* Resize Handle (bottom-right corner) */}
      <div
        className={cn(
          'absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize',
          'flex items-center justify-center',
          'hover:bg-muted/50 transition-colors rounded-tl',
          isResizing && 'bg-primary/20'
        )}
        onMouseDown={handleResizeMouseDown}
      >
        <svg 
          width="8" 
          height="8" 
          viewBox="0 0 8 8" 
          className="text-muted-foreground/50"
        >
          <path 
            d="M7 1v6H1" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
          <path 
            d="M7 4v3H4" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
