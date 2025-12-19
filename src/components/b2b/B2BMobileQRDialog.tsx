import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Check, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface B2BMobileQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  supplierId: string;
}

const B2BMobileQRDialog = ({ open, onOpenChange, accountId, supplierId }: B2BMobileQRDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (open && !mobileUrl) {
      generateToken();
    }
  }, [open]);

  const generateToken = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-b2b-mobile-token', {
        body: { accountId, supplierId }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create token');
      }

      setMobileUrl(data.mobileUrl);
      setExpiresAt(data.expiresAt);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(data.mobileUrl, {
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
