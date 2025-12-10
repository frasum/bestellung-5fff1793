import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, MapPin } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface EmployeeInfoSectionProps {
  employeeName: string;
  setEmployeeName: (name: string) => void;
  isEmployeeNameLocked: boolean;
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string) => void;
  isLocationLocked: boolean;
  locations: Location[];
  validationErrors: { name?: boolean; location?: boolean };
  setValidationErrors: (errors: { name?: boolean; location?: boolean }) => void;
  variant?: 'default' | 'supplier-selection';
}

export const EmployeeInfoSection = ({
  employeeName,
  setEmployeeName,
  isEmployeeNameLocked,
  selectedLocationId,
  setSelectedLocationId,
  isLocationLocked,
  locations,
  validationErrors,
  setValidationErrors,
  variant = 'default',
}: EmployeeInfoSectionProps) => {
  const { t } = useTranslation();

  const containerClass = variant === 'supplier-selection' 
    ? 'bg-muted/50 rounded-lg p-4 mb-6 space-y-4'
    : 'bg-muted/50 border-b p-4';

  const innerClass = variant === 'supplier-selection'
    ? ''
    : 'max-w-2xl mx-auto space-y-4';

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {/* Employee Name - Show greeting if locked, input if not */}
        {isEmployeeNameLocked ? (
          <div className="text-center py-2">
            <p className="text-2xl font-bold text-primary">
              👋 {t('simpleOrder.hello', 'สวัสดี / Hallo')}, {employeeName}!
            </p>
          </div>
        ) : (
          <div>
            <Label htmlFor="employeeName" className="flex items-center gap-2 text-base font-medium mb-2">
              <User className="h-5 w-5" />
              {t('simpleOrder.yourName', 'ชื่อของคุณ / Ihr Name')} *
            </Label>
            <Input
              id="employeeName"
              type="text"
              placeholder={t('simpleOrder.namePlaceholder', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
              value={employeeName}
              onChange={(e) => {
                setEmployeeName(e.target.value);
                if (e.target.value.trim()) {
                  setValidationErrors({ ...validationErrors, name: false });
                }
              }}
              className={`h-14 text-lg ${validationErrors.name ? 'border-destructive ring-destructive' : ''}`}
            />
            {validationErrors.name && variant === 'default' && (
              <p className="text-destructive text-sm mt-1">
                {t('simpleOrder.nameRequired', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
              </p>
            )}
          </div>
        )}

        {/* Location Selection */}
        {variant === 'supplier-selection' ? (
          <div>
            <Label className="flex items-center gap-2 text-base font-medium mb-2">
              <MapPin className="h-5 w-5" />
              {t('simpleOrder.selectLocation', 'เลือกสถานที่ / Standort wählen')} *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {locations.map((location) => (
                <Button
                  key={location.id}
                  type="button"
                  variant={selectedLocationId === location.id ? "default" : "outline"}
                  className="h-14 text-lg font-medium"
                  onClick={() => {
                    setSelectedLocationId(location.id);
                    setValidationErrors({ ...validationErrors, location: false });
                  }}
                >
                  {location.short_code || location.name}
                </Button>
              ))}
            </div>
          </div>
        ) : isLocationLocked ? (
          <div className="text-center py-2">
            <Label className="flex items-center justify-center gap-2 text-base font-medium mb-1">
              <MapPin className="h-5 w-5" />
              {t('simpleOrder.location', 'Standort')}
            </Label>
            <p className="text-xl font-semibold text-primary">
              {locations.find(l => l.id === selectedLocationId)?.short_code || 
               locations.find(l => l.id === selectedLocationId)?.name}
            </p>
          </div>
        ) : (
          <div>
            <Label className="flex items-center gap-2 text-base font-medium mb-2">
              <MapPin className="h-5 w-5" />
              {t('simpleOrder.selectLocation', 'เลือกสถานที่ / Standort wählen')} *
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {locations.map((location) => (
                <Button
                  key={location.id}
                  type="button"
                  variant={selectedLocationId === location.id ? "default" : "outline"}
                  className={`h-14 text-lg font-medium ${
                    validationErrors.location && !selectedLocationId ? 'border-destructive' : ''
                  }`}
                  onClick={() => {
                    setSelectedLocationId(location.id);
                    setValidationErrors({ ...validationErrors, location: false });
                  }}
                >
                  {location.short_code || location.name}
                </Button>
              ))}
            </div>
            {validationErrors.location && (
              <p className="text-destructive text-sm mt-1">
                {t('simpleOrder.locationRequired', 'กรุณาเลือกสถานที่ / Bitte Standort wählen')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
