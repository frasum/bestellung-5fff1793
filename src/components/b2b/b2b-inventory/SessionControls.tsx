import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, History, Mic, FileSpreadsheet } from 'lucide-react';
import { B2BInventorySessionWithStats } from '@/hooks/useB2BInventory';

interface SessionControlsProps {
  sessions: B2BInventorySessionWithStats[] | undefined;
  activeSessionId: string | null;
  activeSessionStatus?: string;
  onSessionChange: (value: string | null) => void;
  onNewSession: () => void;
  onHistoryOpen: () => void;
  onVoiceOpen: () => void;
  onExport: () => void;
}

export const SessionControls = React.memo(function SessionControls({
  sessions,
  activeSessionId,
  activeSessionStatus,
  onSessionChange,
  onNewSession,
  onHistoryOpen,
  onVoiceOpen,
  onExport,
}: SessionControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-between pb-4 border-b border-border">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Select
          value={activeSessionId || ''}
          onValueChange={(value) => onSessionChange(value || null)}
        >
          <SelectTrigger className="w-full max-w-xs h-9 bg-background border-border">
            <SelectValue placeholder="Inventur auswählen..." />
          </SelectTrigger>
          <SelectContent>
            {sessions?.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                <div className="flex items-center gap-2">
                  <span>{session.name}</span>
                  <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
                    {session.status === 'in_progress' ? 'Aktiv' : 'Abgeschlossen'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onNewSession}>
          <Plus className="h-4 w-4 mr-1" />
          Neu
        </Button>
        <Button variant="outline" size="sm" onClick={onHistoryOpen}>
          <History className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onVoiceOpen}
          disabled={!activeSessionId || activeSessionStatus === 'completed'}
        >
          <Mic className="h-4 w-4 mr-1" />
          Sprache
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={!activeSessionId}
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>
    </div>
  );
});

SessionControls.displayName = 'SessionControls';
