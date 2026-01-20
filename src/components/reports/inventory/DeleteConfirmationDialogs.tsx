import { useTranslation } from 'react-i18next';
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

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteSessionDialogProps) {
  const { t } = useTranslation();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('inventory.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('inventory.deleteConfirmDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteArticleDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteArticleDialogProps) {
  const { t } = useTranslation();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('articles.deleteTitle', 'Artikel löschen')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('articles.deleteConfirmation', 'Möchten Sie diesen Artikel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
