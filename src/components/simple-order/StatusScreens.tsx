import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ClipboardList } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface LoadingScreenProps {}

export const LoadingScreen = (_: LoadingScreenProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">
          {t('simpleOrder.loading', 'กำลังโหลด... / Laden...')}
        </p>
      </div>
    </div>
  );
};

interface ErrorScreenProps {
  error: string | null;
}

export const ErrorScreen = ({ error }: ErrorScreenProps) => {
  const { t } = useTranslation();
  const { error: errorVibration } = useHapticFeedback();

  useEffect(() => {
    errorVibration();
  }, []);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md border-destructive/30">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-xl font-semibold text-destructive mb-2">
          {t('simpleOrder.error', 'ข้อผิดพลาด / Fehler')}
        </h1>
        <p className="text-muted-foreground">{error}</p>
      </Card>
    </div>
  );
};

interface SuccessScreenProps {
  onNewOrder: () => void;
  onViewOrders?: () => void;
  hasEmployee?: boolean;
  orderNumber?: string | null;
  isAutoApproved?: boolean;
}

export const SuccessScreen = ({ 
  onNewOrder, 
  onViewOrders, 
  hasEmployee = false,
  orderNumber = null,
  isAutoApproved = false 
}: SuccessScreenProps) => {
  const { t } = useTranslation();
  const { success, heavyTap } = useHapticFeedback();

  useEffect(() => {
    success();
  }, []);

  const handleNewOrder = () => {
    heavyTap();
    onNewOrder();
  };

  const handleViewOrders = () => {
    heavyTap();
    onViewOrders?.();
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md w-full">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-xl font-semibold text-primary mb-2">
          {isAutoApproved 
            ? t('simpleOrder.orderSent', 'Bestellung gesendet!')
            : t('simpleOrder.success', 'ส่งสำเร็จ! / Erfolgreich gesendet!')
          }
        </h1>
        {isAutoApproved && orderNumber && (
          <p className="text-base font-medium text-muted-foreground mb-2">
            {t('simpleOrder.orderNumber', 'Bestellnummer')}: {orderNumber}
          </p>
        )}
        <p className="text-muted-foreground mb-6">
          {isAutoApproved
            ? t('simpleOrder.orderSentMessage', 'Ihre Bestellung wurde direkt an den Lieferanten gesendet.')
            : t('simpleOrder.successMessage', 'คำสั่งซื้อของคุณถูกส่งเพื่อตรวจสอบแล้ว / Ihre Bestellung wurde zur Prüfung eingereicht.')
          }
        </p>
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold touch-manipulation"
            onClick={handleNewOrder}
          >
            {t('simpleOrder.newOrder', 'สั่งซื้อใหม่ / Neue Bestellung')}
          </Button>
          {hasEmployee && onViewOrders && (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 text-base font-medium touch-manipulation"
              onClick={handleViewOrders}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {t('simpleOrder.viewMyOrders', 'Meine Bestellungen ansehen')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
