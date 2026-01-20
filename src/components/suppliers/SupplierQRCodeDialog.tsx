import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, RefreshCw, Check } from 'lucide-react';
import { Supplier } from '@/hooks/useSuppliers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface SupplierQRCodeDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupplierQRCodeDialog = ({ supplier, open, onOpenChange }: SupplierQRCodeDialogProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    if (!supplier) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-supplier-portal-token', {
        body: { supplierId: supplier.id }
      });

      if (error) throw error;

      const url = data.portalUrl;
      setPortalUrl(url);
      setExpiresAt(data.expiresAt);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error generating QR code:', message);
      toast.error('Fehler beim Erstellen des QR-Codes: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && supplier) {
      generateToken();
    } else {
      // Reset state when dialog closes
      setQrCodeDataUrl(null);
      setPortalUrl(null);
      setExpiresAt(null);
      setCopied(false);
    }
  }, [open, supplier]);

  const handleCopyLink = async () => {
    if (!portalUrl) return;
    
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success('Link in Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const formatExpiryDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
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
          <DialogTitle>QR-Code für "{supplier?.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {isLoading ? (
            <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-56 h-56" />
              </div>
              
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Scanne diesen Code, um direkt zum Lieferantenportal zu gelangen.
              </p>
              
              {expiresAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  ⏱️ Gültig bis: {formatExpiryDate(expiresAt)}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Link kopieren
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={generateToken}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Neuer QR-Code
                </Button>
              </div>
            </>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Fehler beim Laden</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
