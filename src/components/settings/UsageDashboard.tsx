import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Users, Truck, Crown, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { useSubscriptionLimits, useUpdateSubscriptionTier, formatLimit, SubscriptionTier } from '@/hooks/useSubscriptionLimits';
import { Skeleton } from '@/components/ui/skeleton';
const tierColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  basic: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
};
const tierNames: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise'
};
const allTiers: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];
interface UsageDashboardProps {
  variant?: 'full' | 'compact';
}
export const UsageDashboard = ({
  variant = 'full'
}: UsageDashboardProps) => {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [advancedMode, setAdvancedMode] = useState(() => localStorage.getItem('advanced-settings-enabled') === 'true');
  const {
    tier,
    limits,
    usage,
    ordersRemaining,
    suppliersRemaining,
    usersRemaining,
    isLoading
  } = useSubscriptionLimits();
  const updateTier = useUpdateSubscriptionTier();
  useEffect(() => {
    const handleStorage = () => {
      setAdvancedMode(localStorage.getItem('advanced-settings-enabled') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  if (isLoading) {
    if (variant === 'compact') {
      return <Skeleton className="h-12 w-full rounded-lg" />;
    }
    return <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>;
  }
  const getUsagePercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.min(100, current / limit * 100);
  };
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };
  const ordersPercentage = getUsagePercentage(usage.ordersThisMonth, limits.ordersPerMonth);
  const suppliersPercentage = getUsagePercentage(usage.suppliersCount, limits.suppliers);
  const usersPercentage = getUsagePercentage(usage.usersCount, limits.users);

  // Compact variant - single row summary
  if (variant === 'compact') {
    const hasWarning = ordersPercentage >= 80 || suppliersPercentage >= 80 || usersPercentage >= 80;
    return <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => navigate('/pricing')}>
        <div className="flex items-center gap-3">
          <Badge className={`${tierColors[tier]} font-medium`}>
            <Crown className="h-3 w-3 mr-1" />
            {tierNames[tier]}
          </Badge>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {usage.ordersThisMonth}/{formatLimit(limits.ordersPerMonth)}
            </span>
            
            
          </div>
          {hasWarning && <AlertTriangle className="h-4 w-4 text-warning" />}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>;
  }

  // Full variant
  const usageItems = [{
    icon: Package,
    label: t('subscription.ordersThisMonth', 'Bestellungen diesen Monat'),
    current: usage.ordersThisMonth,
    limit: limits.ordersPerMonth,
    remaining: ordersRemaining,
    percentage: ordersPercentage
  }, {
    icon: Truck,
    label: t('subscription.activeSuppliers', 'Aktive Lieferanten'),
    current: usage.suppliersCount,
    limit: limits.suppliers,
    remaining: suppliersRemaining,
    percentage: suppliersPercentage
  }, {
    icon: Users,
    label: t('subscription.teamMembers', 'Team-Mitglieder'),
    current: usage.usersCount,
    limit: limits.users,
    remaining: usersRemaining,
    percentage: usersPercentage
  }];
  return <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('subscription.usageDashboard', 'Nutzung & Limits')}
          </CardTitle>
          <CardDescription>
            {t('subscription.usageDescription', 'Übersicht Ihrer aktuellen Nutzung und verbleibenden Kontingente')}
          </CardDescription>
        </div>
        {advancedMode ? <Select value={tier} onValueChange={value => updateTier.mutate(value as SubscriptionTier)}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {allTiers.map(t => <SelectItem key={t} value={t}>
                  {tierNames[t]}
                </SelectItem>)}
            </SelectContent>
          </Select> : <Badge className={`${tierColors[tier]} font-medium`}>
            <Crown className="h-3 w-3 mr-1" />
            {tierNames[tier]}
          </Badge>}
      </CardHeader>
      <CardContent className="space-y-6">
        {usageItems.map(item => {
        const Icon = item.icon;
        const isUnlimited = item.limit === 'unlimited';
        const isNearLimit = item.percentage >= 80;
        return <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isNearLimit && !isUnlimited ? 'bg-warning/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${isNearLimit && !isUnlimited ? 'text-warning' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                  {isNearLimit && !isUnlimited && <AlertTriangle className="h-4 w-4 text-warning" />}
                </div>
                <div className="text-right">
                  <span className="font-semibold">
                    {item.current} / {formatLimit(item.limit)}
                  </span>
                  {!isUnlimited && <p className="text-xs text-muted-foreground">
                      {item.remaining === 'unlimited' ? t('subscription.unlimited', 'Unbegrenzt') : t('subscription.remaining', '{{count}} verbleibend', {
                  count: item.remaining
                })}
                    </p>}
                </div>
              </div>
              {!isUnlimited && <div className="relative">
                  <Progress value={item.percentage} className="h-2" />
                  <div className={`absolute top-0 left-0 h-full rounded-full transition-all ${getProgressColor(item.percentage)}`} style={{
              width: `${item.percentage}%`
            }} />
                </div>}
              {isUnlimited && <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 flex-1 bg-primary/20 rounded-full" />
                  <span>{t('subscription.unlimited', 'Unbegrenzt')}</span>
                </div>}
            </div>;
      })}

        {tier !== 'enterprise' && <div className="pt-4 border-t">
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/pricing')}>
              <Crown className="h-4 w-4" />
              {t('subscription.upgradePlan', 'Plan upgraden')}
            </Button>
          </div>}
      </CardContent>
    </Card>;
};