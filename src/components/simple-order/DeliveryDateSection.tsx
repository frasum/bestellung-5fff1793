import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DeliveryDateSectionProps {
  deliveryDate: Date | undefined;
  onDeliveryDateChange: (date: Date | undefined) => void;
  timeWindow: string;
  onTimeWindowChange: (window: string) => void;
  hasError?: boolean;
}

const TIME_WINDOWS = [
  { value: 'morning', label: '10-12 Uhr' },
  { value: 'afternoon', label: '12-15 Uhr' },
  { value: 'flexible', label: 'Flexibel' },
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

export const DeliveryDateSection = ({
  deliveryDate,
  onDeliveryDateChange,
  timeWindow,
  onTimeWindowChange,
  hasError = false,
}: DeliveryDateSectionProps) => {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);

  // Disable past dates
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-card border-t border-border px-4 py-4 space-y-4">
      {/* Delivery Date */}
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
          📅 {t('simpleOrder.deliveryDate', 'Gewünschtes Lieferdatum')}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-14 text-base touch-manipulation",
                !deliveryDate && "text-muted-foreground",
                hasError && "border-destructive ring-1 ring-destructive"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5" />
              {deliveryDate ? (
                format(deliveryDate, 'EEEE, d. MMMM yyyy', { locale })
              ) : (
                <span>{t('simpleOrder.selectDate', 'Datum wählen')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="single"
              selected={deliveryDate}
              onSelect={onDeliveryDateChange}
              disabled={disablePastDates}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Window */}
      <div>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
          🕐 {t('simpleOrder.timeWindow', 'Zeitfenster')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TIME_WINDOWS.map((window) => (
            <Button
              key={window.value}
              type="button"
              variant={timeWindow === window.value ? "default" : "outline"}
              className={cn(
                "h-14 flex items-center justify-center p-2 text-sm touch-manipulation",
                timeWindow === window.value && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onTimeWindowChange(window.value)}
            >
              <span className="font-medium">{window.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
