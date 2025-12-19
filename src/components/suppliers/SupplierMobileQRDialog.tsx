import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  supplierId: string;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupplierMobileQRDialog = ({ supplierId, supplierName, open, onOpenChange }: Props) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const generateToken = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-supplier-portal-token', {
        body: { supplierId },
      });

      if (error) throw error;

      const url = data.portalUrl.replace('/supplier-auth', '/supplier-purchasing');
      setPortalUrl(url);
      setExpiresAt(data.expiresAt);

      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error: any) {
      console.error('Error generating token:', error);
      toast.error('Fehler beim Erstellen des QR-Codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && supplierId) {
      generateToken();
    }
    if (!open) {
      setQrCodeDataUrl(null);
      setPortalUrl(null);
      setExpiresAt(null);
      setCopied(false);
    }
  }, [open, supplierId]);

  const handleCopyLink = async () => {
    if (!portalUrl) return;
    
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success('Link kopiert');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            Scannen Sie den QR-Code mit Ihrem Handy oder Tablet, um die mobile Einkaufs-App zu öffnen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {loading ? (
            <div className="h-64 w-64 flex items-center justify-center bg-muted rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img src={qrCodeDataUrl} alt="QR Code für Mobile App" className="h-64 w-64" />
              </div>
              {expiresAt && (
                <p className="text-sm text-muted-foreground mt-3">
                  Gültig bis: {formatExpiryDate(expiresAt)}
                </p>
              )}
            </>
          ) : (
            <div className="h-64 w-64 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-muted-foreground">QR-Code konnte nicht geladen werden</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            disabled={!portalUrl}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Kopiert
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Link kopieren
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            onClick={generateToken}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Neuen QR-Code generieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
