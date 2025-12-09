import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Loader2, Package } from 'lucide-react';
import StaffOrdersTab from '@/components/orders/StaffOrdersTab';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('orders.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('orders.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/suppliers?tab=articles')}>
            <Package className="w-4 h-4 mr-2" />
            {t('orders.newOrder')}
          </Button>
        </div>

        <StaffOrdersTab />
      </div>
    </DashboardLayout>
  );
};

export default Orders;
