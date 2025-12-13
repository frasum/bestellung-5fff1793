import { useCallback, useState } from 'react';

export interface RenderMetric {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  timestamp: number;
}

export interface AggregatedMetric {
  id: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  lastPhase: 'mount' | 'update';
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<RenderMetric[]>([]);
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('performance-monitor-enabled') === 'true';
  });

  const onRenderCallback = useCallback((
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    // Only track slow renders (>16ms = below 60fps) or all if debugging
    if (actualDuration > 8) {
      setMetrics(prev => [...prev.slice(-199), {
        id,
        phase,
        actualDuration,
        baseDuration,
        timestamp: commitTime
      }]);
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('performance-monitor-enabled', String(newValue));
      return newValue;
    });
  }, []);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  // Aggregate metrics by component ID
  const aggregatedMetrics: AggregatedMetric[] = Object.values(
    metrics.reduce((acc, metric) => {
      if (!acc[metric.id]) {
        acc[metric.id] = {
          id: metric.id,
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          lastPhase: metric.phase
        };
      }
      acc[metric.id].count += 1;
      acc[metric.id].totalDuration += metric.actualDuration;
      acc[metric.id].avgDuration = acc[metric.id].totalDuration / acc[metric.id].count;
      acc[metric.id].maxDuration = Math.max(acc[metric.id].maxDuration, metric.actualDuration);
      acc[metric.id].lastPhase = metric.phase;
      return acc;
    }, {} as Record<string, AggregatedMetric>)
  ).sort((a, b) => b.avgDuration - a.avgDuration);

  const totalRenders = metrics.length;
  const avgRenderTime = totalRenders > 0 
    ? metrics.reduce((sum, m) => sum + m.actualDuration, 0) / totalRenders 
    : 0;

  return { 
    metrics, 
    aggregatedMetrics,
    onRenderCallback, 
    isEnabled, 
    toggleEnabled,
    clearMetrics,
    totalRenders,
    avgRenderTime
  };
}
