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
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartDraft } from '@/hooks/useCartDrafts';
import { EasyOrderGroup } from './types';

interface DeleteDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CartDraft | null;
  onConfirm: () => void;
}

export const DeleteDraftDialog = ({
  open,
  onOpenChange,
  draft,
  onConfirm,
}: DeleteDraftDialogProps) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('drafts.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('drafts.deleteConfirmDescription', { name: draft?.name })}
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
            <Trash2 className="w-4 h-4 mr-2" />
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: EasyOrderGroup | null;
  onConfirm: () => void;
}

export const DeleteGroupDialog = ({
  open,
  onOpenChange,
  group,
  onConfirm,
}: DeleteGroupDialogProps) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Alle Vorbestellungen löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese EasyOrder-Gruppe von {group?.employeeName} enthält {group?.drafts.length} Vorbestellung(en). 
            Alle werden unwiderruflich gelöscht.
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
            <Trash2 className="w-4 h-4 mr-2" />
            Alle löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface LoadDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const LoadDraftDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: LoadDraftDialogProps) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('drafts.loadConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('drafts.loadConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full sm:w-auto h-10 sm:h-9"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('drafts.loadToCart')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
