import { KeyRound, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Employee } from '@/hooks/useEmployees';

interface EmployeePinDialogProps {
  employee: Employee | null;
  pinValue: string;
  setPinValue: (value: string) => void;
  isSaving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function EmployeePinDialog({
  employee,
  pinValue,
  setPinValue,
  isSaving,
  onSave,
  onClose,
}: EmployeePinDialogProps) {
  const generateRandomPin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPinValue(randomPin);
  };

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            PIN bearbeiten
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            PIN für <span className="font-medium">{employee?.name}</span>
          </p>
          <div className="space-y-2">
            <Label htmlFor="pin-quick-edit">4-stelliger PIN-Code</Label>
            <Input
              id="pin-quick-edit"
              type="text"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]*"
              value={pinValue}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPinValue(value);
              }}
              placeholder="z.B. 1234"
              className="font-mono text-center tracking-widest text-lg"
            />
            {pinValue && pinValue.length !== 4 && pinValue.length > 0 && (
              <p className="text-xs text-destructive">
                PIN muss genau 4 Ziffern haben
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateRandomPin}
              className="flex-1"
            >
              Generieren
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPinValue('')}
              className="flex-1"
              disabled={!pinValue}
            >
              Entfernen
            </Button>
          </div>
        </div>
        <div className="flex justify-center items-center gap-6 pt-4">
          <Button 
            type="button" 
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-2 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            title="Abbrechen"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button 
            type="button"
            size="icon"
            className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={onSave} 
            disabled={isSaving || (pinValue.length > 0 && pinValue.length !== 4)}
            title="Speichern"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
