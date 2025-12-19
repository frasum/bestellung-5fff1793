import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, Check, QrCode, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

// Helper to detect if we're in a preview environment
const isPreviewEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return hostname.includes('--') || hostname === 'localhost' || hostname === '127.0.0.1';
};

// Get the production URL for QR codes
const getProductionUrl = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (!hostname.includes('--') && 
      (hostname.endsWith('.lovable.app') || hostname.endsWith('.lovableproject.com'))) {
    return window.location.origin;
  }
  
  if (hostname.includes('--') && hostname.includes('lovableproject.com')) {
    const projectId = hostname.split('--')[0];
    if (projectId) {
      return `${protocol}//${projectId}.lovableproject.com`;
    }
  }
  
  return window.location.origin;
};

interface B2BMobileQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}

const B2BMobileQRDialog = ({ open, onOpenChange, accountId }: B2BMobileQRDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (open && !mobileUrl) {
      generateToken();
    }
  }, [open]);

  const generateToken = async () => {
    setLoading(true);
    try {
      // With 1 Account = 1 Supplier, we don't need to pass supplierId
      // The edge function will find the supplier automatically
      const { data, error } = await supabase.functions.invoke('create-b2b-mobile-token', {
        body: { accountId }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create token');
      }

      const productionOrigin = getProductionUrl();
      const generatedUrl = `${productionOrigin}/b2b/mobile?token=${data.token}`;
      setMobileUrl(generatedUrl);
      setExpiresAt(data.expiresAt);
      setIsPreview(isPreviewEnvironment());

      const qrDataUrl = await QRCode.toDataURL(generatedUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating token:', error);
      toast({
        title: 'Fehler',
        description: 'QR-Code konnte nicht generiert werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!mobileUrl) return;
    
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      toast({
        title: 'Link kopiert',
        description: 'Der Link wurde in die Zwischenablage kopiert',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Link konnte nicht kopiert werden',
        variant: 'destructive',
      });
    }
  };

  const regenerateToken = () => {
    setMobileUrl(null);
    setQrCodeDataUrl(null);
    generateToken();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile App
          </DialogTitle>
          <DialogDescription>
            Scannen Sie den QR-Code mit Ihrem Smartphone, um die mobile Einkaufs- und Inventur-App zu öffnen.
          </DialogDescription>
        </DialogHeader>

        {isPreview && (
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Hinweis: Sie befinden sich in der Vorschau-Umgebung. Der QR-Code verweist auf die veröffentlichte App-URL.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code für Mobile App"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {expiresAt && (
                <p className="text-sm text-muted-foreground text-center">
                  Gültig bis: {new Date(expiresAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={mobileUrl || ''}
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={regenerateToken}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Neuen Code generieren
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">QR-Code wird generiert...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default B2BMobileQRDialog;
