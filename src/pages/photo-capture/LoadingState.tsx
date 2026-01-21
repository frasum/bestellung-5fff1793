import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{t('common.loading', 'Laden...')}</p>
    </div>
  );
};
