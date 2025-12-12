import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface LocationDateStepProps {
  locations: Location[];
  selectedLocationId: string | null;
  onLocationSelect: (locationId: string) => void;
  isLocationLocked: boolean;
  deliveryDate: Date | undefined;
  onDeliveryDateChange: (date: Date | undefined) => void;
  timeWindow: string;
  onTimeWindowChange: (timeWindow: string) => void;
  onContinue: () => void;
  employeeName?: string;
}

const TIME_WINDOWS = [
  { value: '10:00-12:00', label: '10-12', icon: '🌅' },
  { value: '12:00-15:00', label: '12-15', icon: '☀️' },
  { value: 'flexible', label: 'Flex', icon: '🔄' },
];

const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'de': return de;
    case 'fr': return fr;
    case 'it': return it;
    case 'th': return th;
    case 'vi': return vi;
    default: return enUS;
  }
};

export const LocationDateStep = ({
  locations,
  selectedLocationId,
  onLocationSelect,
  isLocationLocked,
  deliveryDate,
  onDeliveryDateChange,
  timeWindow,
  onTimeWindowChange,
  onContinue,
  employeeName,
}: LocationDateStepProps) => {
  const { t, i18n } = useTranslation();
  const { mediumTap, lightTap } = useHapticFeedback();
  const dateLocale = getDateLocale(i18n.language);

  const canContinue = selectedLocationId && deliveryDate;
  const showLocationSelection = locations.length > 1 && !isLocationLocked;

  const handleLocationSelect = (locationId: string) => {
    mediumTap();
    onLocationSelect(locationId);
  };

  const handleTimeWindowChange = (value: string) => {
    lightTap();
    onTimeWindowChange(value);
  };

  const handleContinue = () => {
    if (canContinue) {
      mediumTap();
      onContinue();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {employeeName && (
            <p className="text-2xl font-semibold mb-1">
              👋 {t('simpleOrder.hello', 'Hallo')}, {employeeName}!
            </p>
          )}
          <p className="text-muted-foreground">
            {t('simpleOrder.selectLocationAndDate', 'Wähle Standort und Lieferdatum')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Location Selection */}
        {showLocationSelection && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('simpleOrder.location', 'Standort')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className={cn(
                    "p-4 min-h-[72px] cursor-pointer transition-all active:scale-[0.98] touch-manipulation flex items-center justify-center text-center",
                    selectedLocationId === location.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => handleLocationSelect(location.id)}
                >
                  <span className="text-lg font-semibold">
                    {location.short_code || location.name}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Single location display */}
        {(locations.length === 1 || isLocationLocked) && selectedLocationId && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t('simpleOrder.location', 'Standort')}
            </h2>
            <Card className="p-4 border-primary bg-primary/5">
              <span className="text-lg font-semibold">
                {locations.find(l => l.id === selectedLocationId)?.short_code ||
                 locations.find(l => l.id === selectedLocationId)?.name}
              </span>
            </Card>
          </div>
        )}

        {/* Delivery Date */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {t('simpleOrder.deliveryDate', 'Lieferdatum')}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 justify-start text-left font-normal text-lg",
                  !deliveryDate && "text-muted-foreground",
                  !deliveryDate && "border-orange-400"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                {deliveryDate ? (
                  format(deliveryDate, 'EEEE, d. MMMM yyyy', { locale: dateLocale })
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    {t('simpleOrder.selectDate', 'Datum wählen')}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deliveryDate}
                onSelect={onDeliveryDateChange}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={dateLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Window */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t('simpleOrder.timeWindow', 'Zeitfenster')}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {TIME_WINDOWS.map((tw) => (
              <Button
                key={tw.value}
                variant={timeWindow === tw.value ? "default" : "outline"}
                className={cn(
                  "h-14 text-lg font-medium touch-manipulation",
                  timeWindow === tw.value && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => handleTimeWindowChange(tw.value)}
              >
                <span className="mr-1">{tw.icon}</span>
                {tw.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            className={cn(
              "w-full h-16 text-xl font-semibold touch-manipulation",
              !canContinue && "bg-muted text-muted-foreground"
            )}
            disabled={!canContinue}
            onClick={handleContinue}
          >
            {t('simpleOrder.continueToSuppliers', 'Weiter zu Lieferanten')}
            <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>

        {/* Validation hints */}
        {!canContinue && (
          <div className="text-center text-sm text-muted-foreground">
            {!selectedLocationId && showLocationSelection && (
              <p className="flex items-center justify-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                {t('simpleOrder.pleaseSelectLocation', 'Bitte Standort wählen')}
              </p>
            )}
            {!deliveryDate && (
              <p className="flex items-center justify-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                {t('simpleOrder.pleaseSelectDate', 'Bitte Lieferdatum wählen')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
