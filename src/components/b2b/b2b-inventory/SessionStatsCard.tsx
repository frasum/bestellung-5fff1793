import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, CheckCircle } from 'lucide-react';
import { SessionStats } from './types';

interface SessionStatsCardProps {
  stats: SessionStats;
  hasChanges: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  onSave: () => void;
  onComplete: () => void;
}

export const SessionStatsCard = React.memo(function SessionStatsCard({
  stats,
  hasChanges,
  isSaving,
  isCompleting,
  onSave,
  onComplete,
}: SessionStatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Fortschritt</div>
              <div className="text-2xl font-bold">{stats.progressPercent}%</div>
              <div className="text-xs text-muted-foreground">
                {stats.capturedArticles} / {stats.totalArticles} Artikel
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Gesamtwert</div>
              <div className="text-2xl font-bold">
                {stats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              Speichern
            </Button>
            <Button
              size="sm"
              onClick={onComplete}
              disabled={isCompleting}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Abschließen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SessionStatsCard.displayName = 'SessionStatsCard';
