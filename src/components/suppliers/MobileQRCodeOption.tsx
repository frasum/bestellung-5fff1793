import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotoCaptureToken } from '@/hooks/usePhotoCaptureToken';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface MobileQRCodeOptionProps {
  onBack: () => void;
}

export const MobileQRCodeOption = ({ onBack }: MobileQRCodeOptionProps) => {
  const { t } = useTranslation();
  const { createToken, getQrCodeUrl, isCreating } = usePhotoCaptureToken();
  const [token, setToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate token on mount
  useEffect(() => {
    generateToken();
  }, []);

  // Generate QR code locally when URL changes
  useEffect(() => {
    if (qrUrl) {
      QRCode.toDataURL(qrUrl, { 
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(setQrCodeDataUrl)
        .catch((err) => {
          console.error('QR code generation failed:', err);
          toast.error(t('quickCapture.qrError', 'QR-Code konnte nicht generiert werden'));
        });
    }
  }, [qrUrl, t]);

  const generateToken = async () => {
    setQrCodeDataUrl(null);
    const newToken = await createToken();
    if (newToken) {
      setToken(newToken);
      setQrUrl(getQrCodeUrl(newToken));
    } else {
      toast.error(t('quickCapture.tokenError', 'Fehler beim Erstellen des QR-Codes'));
    }
  };

  const copyLink = async () => {
    if (!qrUrl) return;
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success(t('quickCapture.linkCopied', 'Link kopiert'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR link to clipboard:', error);
      toast.error(t('quickCapture.copyError', 'Kopieren fehlgeschlagen'));
    }
  };

  if (isCreating || !qrCodeDataUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t('quickCapture.generatingQR', 'QR-Code wird generiert...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 text-primary">
        <Smartphone className="h-6 w-6" />
        <span className="font-medium">{t('quickCapture.mobileCapture', 'Mit Handy fotografieren')}</span>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border">
          <img 
            src={qrCodeDataUrl} 
            alt="QR Code"
            className="w-48 h-48"
          />
        </div>
        
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {t('quickCapture.scanQRHint', 'Scanne diesen QR-Code mit deinem Handy, um Artikel zu fotografieren und hinzuzufügen.')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={copyLink} className="w-full">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              {t('quickCapture.copied', 'Kopiert!')}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              {t('quickCapture.copyLink', 'Link kopieren')}
            </>
          )}
        </Button>
        
        <Button variant="ghost" onClick={generateToken} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('quickCapture.newQR', 'Neuen QR-Code generieren')}
        </Button>
      </div>

      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="w-full">
        {t('common.back', 'Zurück')}
      </Button>
    </div>
  );
};
