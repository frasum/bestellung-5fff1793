import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmployeeLoginScreen } from '@/components/employee-order/EmployeeLoginScreen';
import { LocationSelectionScreen } from '@/components/employee-order/LocationSelectionScreen';
import { SupplierOrderScreen } from '@/components/employee-order/SupplierOrderScreen';
import { OrderConfirmationScreen } from '@/components/employee-order/OrderConfirmationScreen';

export interface EmployeeSession {
  sessionToken: string;
  employee: {
    id: string;
    name: string;
    email: string;
    organizationId: string;
    autoApproveOrders: boolean;
  };
  locations: Array<{
    id: string;
    name: string;
    short_code: string;
  }>;
  locationSuppliers: Array<{
    location_id: string;
    supplier_id: string;
  }>;
}

export interface CartItem {
  articleId: string;
  articleName: string;
  quantity: number;
  unit: string;
  supplierId: string;
  supplierName: string;
  price: number;
}

type Screen = 'login' | 'location' | 'order' | 'confirmation';

const EmployeeOrder = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [screen, setScreen] = useState<Screen>('login');
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem('employee_session_token');
      if (storedToken) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-employee-login', {
            body: { action: 'verify', sessionToken: storedToken },
          });

          if (data?.success) {
            setSession({
              sessionToken: storedToken,
              employee: data.employee,
              locations: data.locations,
              locationSuppliers: data.locationSuppliers,
            });
            setScreen('location');
          } else {
            localStorage.removeItem('employee_session_token');
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('employee_session_token');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = (sessionData: EmployeeSession) => {
    localStorage.setItem('employee_session_token', sessionData.sessionToken);
    setSession(sessionData);
    setScreen('location');
  };

  const handleLogout = () => {
    localStorage.removeItem('employee_session_token');
    setSession(null);
    setSelectedLocation(null);
    setCart([]);
    setScreen('login');
  };

  const handleLocationSelect = (location: { id: string; name: string }) => {
    setSelectedLocation(location);
    setCart([]); // Clear cart when switching location
    setScreen('order');
  };

  const handleBackToLocations = () => {
    setSelectedLocation(null);
    setScreen('location');
  };

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.articleId === item.articleId);
      if (existing) {
        return prev.map(i => 
          i.articleId === item.articleId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const handleUpdateCartItem = (articleId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.articleId !== articleId));
    } else {
      setCart(prev => prev.map(i => 
        i.articleId === articleId ? { ...i, quantity } : i
      ));
    }
  };

  const handleOrderSubmitted = () => {
    setCart([]);
    setScreen('confirmation');
  };

  const handleNewOrder = () => {
    setScreen('location');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {screen === 'login' && (
        <EmployeeLoginScreen onLogin={handleLogin} />
      )}

      {screen === 'location' && session && (
        <LocationSelectionScreen
          session={session}
          onSelectLocation={handleLocationSelect}
          onLogout={handleLogout}
        />
      )}

      {screen === 'order' && session && selectedLocation && (
        <SupplierOrderScreen
          session={session}
          selectedLocation={selectedLocation}
          cart={cart}
          onAddToCart={handleAddToCart}
          onUpdateCartItem={handleUpdateCartItem}
          onBack={handleBackToLocations}
          onOrderSubmitted={handleOrderSubmitted}
          onLogout={handleLogout}
        />
      )}

      {screen === 'confirmation' && session && (
        <OrderConfirmationScreen
          employeeName={session.employee.name}
          onNewOrder={handleNewOrder}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default EmployeeOrder;
