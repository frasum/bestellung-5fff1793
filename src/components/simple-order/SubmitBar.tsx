import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, ClipboardCheck } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SubmitBarProps {
  totalItems: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  isAutoApproveEmployee?: boolean;
}

export const SubmitBar = ({ totalItems, isSubmitting, onSubmit, isAutoApproveEmployee = false }: SubmitBarProps) => {
  const { t } = useTranslation();
  const { heavyTap } = useHapticFeedback();

  const handleSubmit = () => {
    heavyTap();
    onSubmit();
  };

  const buttonText = isAutoApproveEmployee 
    ? t('simpleOrder.reviewOrder', 'Zur Bestätigung')
    : t('simpleOrder.submit', 'ส่งคำสั่งซื้อ / Bestellung senden');

  const ButtonIcon = isAutoApproveEmployee ? ClipboardCheck : ShoppingCart;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="max-w-2xl mx-auto">
        <Button
          size="lg"
          className="w-full h-16 text-xl font-bold gap-3 touch-manipulation"
          onClick={handleSubmit}
          disabled={totalItems === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              {t('simpleOrder.submitting', 'กำลังส่ง... / Wird gesendet...')}
            </>
          ) : (
            <>
              <ButtonIcon className="h-6 w-6" />
              {buttonText}
              {totalItems > 0 && (
                <span className="bg-primary-foreground text-primary px-3 py-1 rounded-full text-lg">
                  {totalItems}
                </span>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
