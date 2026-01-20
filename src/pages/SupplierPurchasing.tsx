import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, ClipboardList, LogOut } from 'lucide-react';
import logo from '@/assets/logo.png';
import { SupplierMobilePurchaseTab } from '@/components/suppliers/SupplierMobilePurchaseTab';
import { SupplierMobileInventoryTab } from '@/components/suppliers/SupplierMobileInventoryTab';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
  expiresAt: string;
}

const SupplierPurchasing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SupplierSession | null>(null);
  const [activeTab, setActiveTab] = useState('purchase');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        // Check for existing session
        const storedSession = localStorage.getItem('supplierMobileSession');
        if (storedSession) {
          const parsed = JSON.parse(storedSession) as SupplierSession;
          if (new Date(parsed.expiresAt) > new Date()) {
            setSession(parsed);
            setLoading(false);
            return;
          }
        }
        toast.error('Kein Token gefunden');
        navigate('/supplier-login');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-supplier-token', {
          body: { token },
        });

        if (error || !data?.valid) {
          throw new Error(data?.error || 'Token ungültig');
        }

        const newSession: SupplierSession = {
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          organizationId: data.organizationId,
          sessionToken: `${data.supplierId}:${data.organizationId}:${Date.now()}`,
          expiresAt: data.expiresAt,
        };

        localStorage.setItem('supplierMobileSession', JSON.stringify(newSession));
        setSession(newSession);
        
        // Remove token from URL
        window.history.replaceState({}, '', '/supplier-purchasing');
      } catch (error: unknown) {
        console.error('Token verification failed:', error);
        const message = error instanceof Error ? error.message : 'Token ungültig';
        toast.error(message);
        navigate('/supplier-login');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('supplierMobileSession');
    toast.success('Abgemeldet');
    navigate('/supplier-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            <div>
              <h1 className="font-semibold text-sm truncate max-w-[180px]">
                {session.supplierName}
              </h1>
              <p className="text-xs text-muted-foreground">Mobile App</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-none border-b bg-muted/30">
            <TabsTrigger 
              value="purchase" 
              className="h-12 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Einkauf
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="h-12 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <ClipboardList className="h-5 w-5" />
              Inventur
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchase" className="flex-1 mt-0 data-[state=inactive]:hidden">
            <SupplierMobilePurchaseTab session={session} />
          </TabsContent>
          
          <TabsContent value="inventory" className="flex-1 mt-0 data-[state=inactive]:hidden">
            <SupplierMobileInventoryTab session={session} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SupplierPurchasing;
