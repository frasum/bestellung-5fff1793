import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import logo from '@/assets/logo.png';

const SupplierAuth = () => {
  // Force light theme for supplier portal pages
  useForceLightTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [expiredSupplierId, setExpiredSupplierId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Kein Token angegeben');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-supplier-token', {
          body: { token },
        });

        if (error) {
          setStatus('error');
          setErrorMessage('Fehler bei der Überprüfung');
          return;
        }

        if (data.status === 'expired') {
          setStatus('expired');
          setExpiredSupplierId(data.supplierId || null);
          setErrorMessage('Dieser Link ist abgelaufen.');
          return;
        }

        if (data.status === 'error' || !data.supplierId) {
          setStatus('error');
          setErrorMessage(data.error || 'Ungültiger Token');
          return;
        }

        // Generate session token
        const timestamp = Date.now();
        const randomHash = Math.random().toString(36).substring(2, 15);
        const sessionToken = `${data.supplierId}:${data.organizationId}:${timestamp}:${randomHash}`;
        
        // Store supplier session with token expiry and price edit permission
        const supplierSession = {
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          organizationId: data.organizationId,
          sessionToken,
          expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priceEditExpiresAt: data.priceEditExpiresAt,
          canEditPrices: data.canEditPrices,
        };
        localStorage.setItem('supplierSession', JSON.stringify(supplierSession));

        setStatus('success');
        
        setTimeout(() => {
          navigate('/supplier-portal');
        }, 1500);
    } catch (error) {
      console.error('Token verification failed:', error);
      setStatus('error');
      setErrorMessage('Ein Fehler ist aufgetreten');
      }
    };

    verifyToken();
  }, [token, navigate]);

  const handleRequestNewLink = async () => {
    if (!expiredSupplierId) {
      toast({
        title: 'Fehler',
        description: 'Lieferanten-ID nicht verfügbar. Bitte kontaktieren Sie den Administrator.',
        variant: 'destructive',
      });
      return;
    }

    setRequesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-new-magic-link', {
        body: { supplierId: expiredSupplierId },
      });

      if (error) throw error;

      setLinkSent(true);
      toast({
        title: 'Link gesendet',
        description: 'Ein neuer Zugangslink wurde an Ihre E-Mail-Adresse gesendet.',
      });
    } catch (error) {
      console.error('Failed to request new magic link:', error);
      toast({
        title: 'Fehler',
        description: 'Der Link konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-gray-100">
        <CardHeader className="text-center">
          <img src={logo} alt="Bestellung.pro" className="h-16 w-16 mx-auto mb-4" />
          <CardTitle className="text-gray-900">Lieferantenportal</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'verifying' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-gray-500">Link wird überprüft...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-600 font-medium">Erfolgreich angemeldet!</p>
              <p className="text-gray-500">Sie werden weitergeleitet...</p>
            </div>
          )}
          
          {status === 'expired' && !linkSent && (
            <div className="space-y-4">
              <Clock className="h-12 w-12 mx-auto text-amber-500" />
              <p className="text-amber-600 font-medium">{errorMessage}</p>
              <p className="text-gray-500 text-sm">
                Fordern Sie einen neuen Zugangslink an:
              </p>
              {expiredSupplierId ? (
                <Button onClick={handleRequestNewLink} disabled={requesting} className="gap-2">
                  {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Neuen Link anfordern
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Bitte kontaktieren Sie Ihren Ansprechpartner für einen neuen Link.
                </p>
              )}
            </div>
          )}

          {status === 'expired' && linkSent && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-600 font-medium">Link gesendet!</p>
              <p className="text-gray-500 text-sm">
                Bitte überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den neuen Link.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-red-600 font-medium">{errorMessage}</p>
              <Button variant="outline" onClick={() => navigate('/')} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                Zur Startseite
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierAuth;
