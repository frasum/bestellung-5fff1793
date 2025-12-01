import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const SupplierAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Kein Token angegeben');
        return;
      }

      try {
        // Fetch the token
        const { data: tokenData, error: tokenError } = await supabase
          .from('supplier_portal_tokens')
          .select('*, supplier:suppliers(*)')
          .eq('token', token)
          .single();

        if (tokenError || !tokenData) {
          setStatus('error');
          setErrorMessage('Ungültiger Token');
          return;
        }

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          setStatus('expired');
          setErrorMessage('Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.');
          return;
        }

        // Check if token was already used
        if (tokenData.used_at) {
          setStatus('error');
          setErrorMessage('Dieser Link wurde bereits verwendet.');
          return;
        }

        // Mark token as used
        await supabase
          .from('supplier_portal_tokens')
          .update({ used_at: new Date().toISOString() })
          .eq('id', tokenData.id);

        // Store supplier session in localStorage
        const supplierSession = {
          supplierId: tokenData.supplier_id,
          supplierName: tokenData.supplier?.name || 'Lieferant',
          organizationId: tokenData.supplier?.organization_id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };
        localStorage.setItem('supplierSession', JSON.stringify(supplierSession));

        setStatus('success');
        
        // Redirect to supplier portal after short delay
        setTimeout(() => {
          navigate('/supplier-portal');
        }, 1500);
      } catch (error: any) {
        console.error('Token verification error:', error);
        setStatus('error');
        setErrorMessage('Ein Fehler ist aufgetreten');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="OrderFox.pro" className="h-16 w-16 mx-auto mb-4" />
          <CardTitle>Lieferantenportal</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'verifying' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Link wird überprüft...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-600 font-medium">Erfolgreich angemeldet!</p>
              <p className="text-muted-foreground">Sie werden weitergeleitet...</p>
            </div>
          )}
          
          {(status === 'error' || status === 'expired') && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-destructive font-medium">{errorMessage}</p>
              <Button variant="outline" onClick={() => navigate('/')}>
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
