import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { CalendarDays, Clock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeliveryInfoBarProps {
  deliveryDate: Date | undefined;
  timeWindow: string;
  onEdit?: () => void;
  hasError?: boolean;
}

const TIME_WINDOW_LABELS: Record<string, string> = {
  '10:00-12:00': '10-12 Uhr',
  '12:00-15:00': '12-15 Uhr',
  'flexible': 'Flexibel',
};

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

export const DeliveryInfoBar = ({
  deliveryDate,
  timeWindow,
  onEdit,
  hasError = false,
}: DeliveryInfoBarProps) => {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language);

  const formattedDate = deliveryDate 
    ? format(deliveryDate, 'EEE, d. MMM', { locale })
    : null;

  const timeLabel = TIME_WINDOW_LABELS[timeWindow] || timeWindow;

  // Don't render if no date selected
  if (!deliveryDate) return null;

  return (
    <div 
      className={cn(
        "bg-muted/50 border-b border-border px-4 py-2.5",
        "flex items-center justify-between gap-3",
        "animate-fade-in",
        hasError && "bg-destructive/10 border-destructive/30"
      )}
    >
      <div className="flex items-center gap-4 text-sm font-medium">
        {/* Delivery Date */}
        <div className="flex items-center gap-1.5 text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>{formattedDate}</span>
        </div>

        <span className="text-muted-foreground/50">•</span>

        {/* Time Window */}
        <div className="flex items-center gap-1.5 text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{timeLabel}</span>
        </div>
      </div>

      {/* Edit Button */}
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3 mr-1" />
          {t('common.edit', 'ändern')}
        </Button>
      )}
    </div>
  );
};
