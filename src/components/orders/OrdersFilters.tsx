import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, X, Filter, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '@/hooks/useOrders';
import { DateFilter, LocationOption, getLocationDisplayName } from './types';

interface OrdersFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: Order['status'] | 'all';
  setStatusFilter: (status: Order['status'] | 'all') => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  locationFilter: string;
  setLocationFilter: (filter: string) => void;
  locations: LocationOption[] | undefined;
  activeLocation: LocationOption | null;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export const OrdersFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  locationFilter,
  setLocationFilter,
  locations,
  activeLocation,
  hasActiveFilters,
  clearFilters,
}: OrdersFiltersProps) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile Filters */}
      <div className="flex gap-2 sm:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('orders.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative">
              <Filter className="w-4 h-4" />
              {(statusFilter !== 'all' || dateFilter !== 'all' || locationFilter !== 'active') && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-card border border-border" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('orders.filterByStatus')}</label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Order['status'] | 'all')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
                    <SelectItem value="confirmed">{t('orders.status.confirmed')}</SelectItem>
                    <SelectItem value="processing">{t('orders.status.processing')}</SelectItem>
                    <SelectItem value="shipped">{t('orders.status.shipped')}</SelectItem>
                    <SelectItem value="delivered">{t('orders.status.delivered')}</SelectItem>
                    <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('orders.filterByDate')}</label>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('orders.allDates')}</SelectItem>
                    <SelectItem value="today">{t('orders.today')}</SelectItem>
                    <SelectItem value="week">{t('orders.lastWeek')}</SelectItem>
                    <SelectItem value="month">{t('orders.lastMonth')}</SelectItem>
                    <SelectItem value="3months">{t('orders.last3Months')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {locations && locations.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('orders.filterByLocation')}</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {activeLocation ? getLocationDisplayName(activeLocation) : t('orders.currentLocation')}
                      </SelectItem>
                      <SelectItem value="all">{t('orders.allLocations')}</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {getLocationDisplayName(loc)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  {t('orders.clearFilters')}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop Filters */}
      <div className="hidden sm:flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('orders.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Order['status'] | 'all')}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder={t('orders.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('orders.status.pending')}</SelectItem>
            <SelectItem value="confirmed">{t('orders.status.confirmed')}</SelectItem>
            <SelectItem value="processing">{t('orders.status.processing')}</SelectItem>
            <SelectItem value="shipped">{t('orders.status.shipped')}</SelectItem>
            <SelectItem value="delivered">{t('orders.status.delivered')}</SelectItem>
            <SelectItem value="cancelled">{t('orders.status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder={t('orders.filterByDate')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('orders.allDates')}</SelectItem>
            <SelectItem value="today">{t('orders.today')}</SelectItem>
            <SelectItem value="week">{t('orders.lastWeek')}</SelectItem>
            <SelectItem value="month">{t('orders.lastMonth')}</SelectItem>
            <SelectItem value="3months">{t('orders.last3Months')}</SelectItem>
          </SelectContent>
        </Select>
        {locations && locations.length > 1 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40 h-10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">
                  {locationFilter === 'active' 
                    ? (activeLocation ? getLocationDisplayName(activeLocation) : t('orders.currentLocation'))
                    : locationFilter === 'all'
                      ? t('orders.allLocations')
                      : getLocationDisplayName(locations.find(l => l.id === locationFilter) || { name: '', short_code: null })
                  }
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                {activeLocation ? getLocationDisplayName(activeLocation) : t('orders.currentLocation')} ({t('orders.currentLocation')})
              </SelectItem>
              <SelectItem value="all">{t('orders.allLocations')}</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>
                  {getLocationDisplayName(loc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </>
  );
};
