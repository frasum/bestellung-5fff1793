import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';

interface DeleteConfirmationDialogsProps {
  deletingSupplier: Supplier | null;
  onSupplierClose: () => void;
  onSupplierDelete: () => void;
  isSupplierDeleting: boolean;
  deletingArticle: Article | null;
  onArticleClose: () => void;
  onArticleDelete: () => void;
  isArticleDeleting: boolean;
}

export const DeleteConfirmationDialogs = ({
  deletingSupplier,
  onSupplierClose,
  onSupplierDelete,
  isSupplierDeleting,
  deletingArticle,
  onArticleClose,
  onArticleDelete,
  isArticleDeleting
}: DeleteConfirmationDialogsProps) => {
  return (
    <>
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => onSupplierClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie "{deletingSupplier?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={onSupplierDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSupplierDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingArticle} onOpenChange={() => onArticleClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie "{deletingArticle?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={onArticleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isArticleDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
