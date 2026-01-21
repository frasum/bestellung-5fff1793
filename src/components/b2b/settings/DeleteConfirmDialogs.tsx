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
import type { B2BSupplier, B2BSupplierUser } from './useB2BSettingsState';

interface DeleteSupplierDialogProps {
  supplier: B2BSupplier | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteSupplierDialog({
  supplier,
  onOpenChange,
  onConfirm,
}: DeleteSupplierDialogProps) {
  return (
    <AlertDialog open={!!supplier} onOpenChange={() => onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lieferant löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie den Lieferanten "{supplier?.name}" wirklich löschen?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteUserDialogProps {
  user: B2BSupplierUser | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteUserDialog({
  user,
  onOpenChange,
  onConfirm,
}: DeleteUserDialogProps) {
  return (
    <AlertDialog open={!!user} onOpenChange={() => onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Benutzer-Zugang entfernen?</AlertDialogTitle>
          <AlertDialogDescription>
            Der Benutzer "{user?.email}" verliert seinen Zugang zum Lieferanten-Portal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Entfernen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
