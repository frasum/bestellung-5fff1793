import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  errorMessage: string;
}

export const ErrorState = ({ errorMessage }: ErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold mb-2">{t('quickCapture.tokenError', 'Fehler')}</h1>
      <p className="text-muted-foreground text-center">{errorMessage}</p>
    </div>
  );
};
