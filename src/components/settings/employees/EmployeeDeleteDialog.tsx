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
import type { Employee } from '@/hooks/useEmployees';

interface EmployeeDeleteDialogProps {
  employee: Employee | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EmployeeDeleteDialog({
  employee,
  onConfirm,
  onCancel,
}: EmployeeDeleteDialogProps) {
  return (
    <AlertDialog
      open={!!employee}
      onOpenChange={() => onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            {employee?.name} und der zugehörige Easy Order Link werden gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
