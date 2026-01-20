import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FlaskConical, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TestModeBannerProps {
  testEmail: string;
  testOrdersCount: number;
  onDeleteTestOrders: () => void;
  isDeleting: boolean;
}

export const TestModeBanner = ({
  testEmail,
  testOrdersCount,
  onDeleteTestOrders,
  isDeleting,
}: TestModeBannerProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-warning" />
          <div>
            <p className="font-medium text-warning">{t('orders.testMode.banner')}</p>
            <p className="text-sm text-muted-foreground">
              {t('orders.testMode.bannerDescription', { email: testEmail })}
            </p>
          </div>
        </div>
        {testOrdersCount > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('orders.testMode.deleteAll')} ({testOrdersCount})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('orders.testMode.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('orders.testMode.deleteConfirmDescription', { count: testOrdersCount })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteTestOrders}
                  className="w-full sm:w-auto h-10 sm:h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('orders.testMode.noTestOrders')}
          </span>
        )}
      </div>
    </div>
  );
};
