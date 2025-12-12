import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Clock, ChevronRight, Check } from 'lucide-react';
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

type StepStatus = 'pending' | 'active' | 'completed';

interface StepIndicatorProps {
  number: number;
  status: StepStatus;
  title: string;
  completedValue?: string;
  icon: React.ReactNode;
}

const StepIndicator = ({ number, status, title, completedValue, icon }: StepIndicatorProps) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Step number badge */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
          status === 'completed' && "bg-green-500 text-white",
          status === 'active' && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
          status === 'pending' && "bg-muted text-muted-foreground"
        )}
      >
        {status === 'completed' ? (
          <Check className="h-4 w-4" />
        ) : (
          number
        )}
      </div>
      
      {/* Title and completed value */}
      <div className="flex items-center gap-2 flex-1">
        <span className={cn(
          "flex items-center gap-2 font-semibold transition-colors duration-300",
          status === 'completed' && "text-green-600 dark:text-green-400",
          status === 'active' && "text-foreground",
          status === 'pending' && "text-muted-foreground"
        )}>
          {icon}
          {title}
        </span>
        
        {status === 'completed' && completedValue && (
          <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
            {completedValue}
          </span>
        )}
      </div>
    </div>
  );
};

interface StepSectionProps {
  status: StepStatus;
  children: React.ReactNode;
}

const StepSection = ({ status, children }: StepSectionProps) => {
  return (
    <div
      className={cn(
        "transition-all duration-300 rounded-xl p-4 border",
        status === 'completed' && "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
        status === 'active' && "bg-card border-primary/30 ring-2 ring-primary/20",
        status === 'pending' && "bg-muted/30 border-muted opacity-50 pointer-events-none"
      )}
    >
      {children}
    </div>
  );
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

  // Step completion logic
  const showLocationSelection = locations.length > 1 && !isLocationLocked;
  const step1Complete = !!selectedLocationId || locations.length === 1 || isLocationLocked;
  const step2Complete = !!deliveryDate;
  const step3Complete = !!timeWindow;
  const canContinue = step1Complete && step2Complete;

  // Step statuses
  const getStep1Status = (): StepStatus => {
    if (step1Complete) return 'completed';
    return 'active';
  };

  const getStep2Status = (): StepStatus => {
    if (step2Complete) return 'completed';
    if (step1Complete) return 'active';
    return 'pending';
  };

  const getStep3Status = (): StepStatus => {
    if (step3Complete && step2Complete) return 'completed';
    if (step1Complete && step2Complete) return 'active';
    return 'pending';
  };

  const step1Status = getStep1Status();
  const step2Status = getStep2Status();
  const step3Status = getStep3Status();

  // Get selected location name for completed display
  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const selectedLocationName = selectedLocation?.short_code || selectedLocation?.name || '';

  // Get time window label for completed display
  const selectedTimeWindowLabel = TIME_WINDOWS.find(tw => tw.value === timeWindow)?.label || '';

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

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Step 1: Location */}
        <StepSection status={step1Status}>
          <StepIndicator
            number={1}
            status={step1Status}
            title={t('simpleOrder.location', 'Standort')}
            completedValue={step1Complete ? selectedLocationName : undefined}
            icon={<MapPin className="h-5 w-5" />}
          />
          
          {step1Status !== 'completed' && showLocationSelection && (
            <div className="grid grid-cols-2 gap-3 mt-2">
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
          )}

          {step1Status === 'completed' && !showLocationSelection && (
            <div className="text-sm text-muted-foreground">
              {selectedLocationName}
            </div>
          )}
        </StepSection>

        {/* Step 2: Delivery Date */}
        <StepSection status={step2Status}>
          <StepIndicator
            number={2}
            status={step2Status}
            title={t('simpleOrder.deliveryDate', 'Lieferdatum')}
            completedValue={deliveryDate ? format(deliveryDate, 'd. MMM', { locale: dateLocale }) : undefined}
            icon={<CalendarIcon className="h-5 w-5" />}
          />
          
          {step2Status !== 'completed' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-14 justify-start text-left font-normal text-lg",
                    !deliveryDate && "text-muted-foreground border-dashed"
                  )}
                >
                  <CalendarIcon className="mr-3 h-5 w-5" />
                  {deliveryDate ? (
                    format(deliveryDate, 'EEEE, d. MMMM yyyy', { locale: dateLocale })
                  ) : (
                    t('simpleOrder.selectDate', 'Datum wählen')
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
          )}

          {step2Status === 'completed' && (
            <button
              onClick={() => onDeliveryDateChange(undefined)}
              className="text-sm text-primary hover:underline"
            >
              {format(deliveryDate!, 'EEEE, d. MMMM yyyy', { locale: dateLocale })} — {t('common.change', 'ändern')}
            </button>
          )}
        </StepSection>

        {/* Step 3: Time Window */}
        <StepSection status={step3Status}>
          <StepIndicator
            number={3}
            status={step3Status}
            title={t('simpleOrder.timeWindow', 'Zeitfenster')}
            completedValue={step3Complete && step2Complete ? selectedTimeWindowLabel : undefined}
            icon={<Clock className="h-5 w-5" />}
          />
          
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
        </StepSection>

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            className={cn(
              "w-full h-16 text-xl font-semibold touch-manipulation transition-all duration-300",
              canContinue 
                ? "bg-primary hover:bg-primary/90 animate-pulse" 
                : "bg-muted text-muted-foreground"
            )}
            disabled={!canContinue}
            onClick={handleContinue}
          >
            {t('simpleOrder.continueToSuppliers', 'Weiter zu Lieferanten')}
            <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
