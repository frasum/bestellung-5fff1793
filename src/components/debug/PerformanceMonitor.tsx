import { useState, useEffect } from 'react';
import { X, Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AggregatedMetric } from '@/hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  aggregatedMetrics: AggregatedMetric[];
  totalRenders: number;
  avgRenderTime: number;
  onClear: () => void;
  onClose: () => void;
}

export function PerformanceMonitor({
  aggregatedMetrics,
  totalRenders,
  avgRenderTime,
  onClear,
  onClose
}: PerformanceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Check if advanced settings is enabled
  useEffect(() => {
    const checkAdvancedSettings = () => {
      const enabled = localStorage.getItem('advanced-settings-enabled') === 'true';
      setIsVisible(enabled);
    };
    
    checkAdvancedSettings();
    window.addEventListener('storage', checkAdvancedSettings);
    return () => window.removeEventListener('storage', checkAdvancedSettings);
  }, []);

  if (!isVisible) return null;

  const getStatusColor = (avgDuration: number) => {
    if (avgDuration > 32) return 'text-destructive'; // Very slow
    if (avgDuration > 16) return 'text-orange-500'; // Below 60fps
    return 'text-green-500'; // Good
  };

  const getStatusIcon = (avgDuration: number) => {
    if (avgDuration > 32) return '🔴';
    if (avgDuration > 16) return '🟡';
    return '🟢';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Performance Monitor</span>
          {totalRenders > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalRenders}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
          {aggregatedMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine langsamen Renders erfasst.<br />
              <span className="text-xs">Renders &gt;8ms werden getrackt.</span>
            </p>
          ) : (
            <>
              {/* Metrics List */}
              <div className="space-y-1">
                {aggregatedMetrics.slice(0, 10).map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{getStatusIcon(metric.avgDuration)}</span>
                      <span className="truncate font-mono text-xs">
                        {metric.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("font-mono text-xs", getStatusColor(metric.avgDuration))}>
                        {metric.avgDuration.toFixed(1)}ms
                      </span>
                      <Badge variant="outline" className="text-xs px-1">
                        ×{metric.count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Ø {avgRenderTime.toFixed(1)}ms</span>
                  <span>{totalRenders} Renders</span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onClear}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Leeren
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
