import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { B2BInventorySessionWithStats } from '@/hooks/useB2BInventory';
import { VoiceInventoryCapture, ExtractedArticle } from '@/components/suppliers/VoiceInventoryCapture';
import { toast } from 'sonner';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  onSessionNameChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const NewSessionDialog = React.memo(function NewSessionDialog({
  open,
  onOpenChange,
  sessionName,
  onSessionNameChange,
  onSubmit,
  isPending,
}: NewSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Inventur starten</DialogTitle>
          <DialogDescription>
            Geben Sie einen Namen für die neue Inventur ein.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Name</Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => onSessionNameChange(e.target.value)}
              placeholder={`Inventur ${format(new Date(), 'dd.MM.yyyy')}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            Starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: B2BInventorySessionWithStats[] | undefined;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const HistoryDialog = React.memo(function HistoryDialog({
  open,
  onOpenChange,
  sessions,
  onLoadSession,
  onDeleteSession,
}: HistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventur-Verlauf</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Artikel</TableHead>
                <TableHead>Wert</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>
                    {format(new Date(session.created_at), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell>{session.itemCount}</TableCell>
                  <TableCell>
                    {session.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                      {session.status === 'in_progress' ? 'Aktiv' : 'Abgeschlossen'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLoadSession(session.id)}
                      >
                        Laden
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
});

interface VoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  onResult: (transcript: string, articles: ExtractedArticle[]) => void;
}

export const VoiceDialog = React.memo(function VoiceDialog({
  open,
  onOpenChange,
  language,
  onResult,
}: VoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Spracherfassung</DialogTitle>
          <DialogDescription>
            Sprechen Sie Ihr Inventar ein, z.B. "Drei Flaschen Rotwein, zwei Kisten Mineralwasser..."
          </DialogDescription>
        </DialogHeader>
        <VoiceInventoryCapture
          language={language}
          onResult={onResult}
          onError={(error) => toast.error(error)}
        />
      </DialogContent>
    </Dialog>
  );
});

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog = React.memo(function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inventur löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Alle erfassten Daten gehen verloren.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

NewSessionDialog.displayName = 'NewSessionDialog';
HistoryDialog.displayName = 'HistoryDialog';
VoiceDialog.displayName = 'VoiceDialog';
DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';
