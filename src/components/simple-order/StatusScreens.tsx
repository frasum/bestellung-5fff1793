import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-destructive mb-2">
          {t('simpleOrder.error', 'ข้อผิดพลาด / Fehler')}
        </h1>
        <p className="text-muted-foreground text-lg">{error}</p>
      </Card>
    </div>
  );
};

interface SuccessScreenProps {
  onNewOrder: () => void;
}

export const SuccessScreen = ({ onNewOrder }: SuccessScreenProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-primary mb-2">
          {t('simpleOrder.success', 'ส่งสำเร็จ! / Erfolgreich gesendet!')}
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          {t('simpleOrder.successMessage', 'คำสั่งซื้อของคุณถูกส่งเพื่อตรวจสอบแล้ว / Ihre Bestellung wurde zur Prüfung eingereicht.')}
        </p>
        <Button
          size="lg"
          className="w-full h-16 text-xl font-bold touch-manipulation"
          onClick={onNewOrder}
        >
          {t('simpleOrder.newOrder', 'สั่งซื้อใหม่ / Neue Bestellung')}
        </Button>
      </Card>
    </div>
  );
};
