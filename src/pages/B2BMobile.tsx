import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clipboard, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import B2BMobilePurchaseTab from '@/components/b2b/B2BMobilePurchaseTab';
import B2BMobileInventoryTab from '@/components/b2b/B2BMobileInventoryTab';

interface MobileSession {
  accountId: string;
  supplierId: string | null;
  companyName: string;
  supplierName: string | null;
  expiresAt: string;
}

const B2BMobile = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [activeTab, setActiveTab] = useState('purchase');

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError('Kein Token angegeben');
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-b2b-mobile-token', {
        body: { token }
      });

      if (fnError || !data?.success) {
        setError(data?.error || 'Token ungültig oder abgelaufen');
        setLoading(false);
        return;
      }

      setSession(data.session);
      setLoading(false);
    } catch (err) {
      console.error('Error verifying token:', err);
      setError('Fehler bei der Token-Verifizierung');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">Zugriff verweigert</h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Bitte scannen Sie einen gültigen QR-Code aus dem B2B Dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 sticky top-0 z-10">
        <h1 className="font-semibold text-lg">{session.companyName}</h1>
        {session.supplierName && (
          <p className="text-sm text-muted-foreground">{session.supplierName}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="purchase" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Einkauf
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Clipboard className="h-4 w-4" />
            Inventur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="flex-1 mt-0 p-4">
          <B2BMobilePurchaseTab
            accountId={session.accountId}
            supplierId={session.supplierId}
          />
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 mt-0 p-4">
          <B2BMobileInventoryTab
            accountId={session.accountId}
            supplierId={session.supplierId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default B2BMobile;
