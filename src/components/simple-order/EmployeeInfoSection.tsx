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

  // For article list view (default variant): hide section if everything is already set
  const isArticleView = variant === 'default';
  const allInfoComplete = isArticleView && isEmployeeNameLocked && (isLocationLocked || selectedLocationId);
  
  // Don't show anything in article view if all info is complete (shown in header)
  if (allInfoComplete) {
    return null;
  }

  // Compact layout for article view when name is locked but location needs selection
  if (isArticleView && isEmployeeNameLocked && !isLocationLocked && locations.length > 1) {
    return (
      <div className="bg-muted/50 border-b px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {t('simpleOrder.location', 'Standort')}:
            </span>
            <div className="flex gap-2 flex-wrap">
              {locations.map((location) => (
                <Button
                  key={location.id}
                  type="button"
                  variant={selectedLocationId === location.id ? "default" : "outline"}
                  size="sm"
                  className="h-11 px-4 touch-manipulation"
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
          {validationErrors.location && (
            <p className="text-destructive text-sm mt-1">
              {t('simpleOrder.locationRequired', 'กรุณาเลือกสถานที่ / Bitte Standort wählen')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const containerClass = variant === 'supplier-selection' 
    ? 'bg-muted/50 rounded-lg p-4 mb-6 space-y-4'
    : 'bg-muted/50 border-b p-4';

  const innerClass = variant === 'supplier-selection'
    ? ''
    : 'max-w-2xl mx-auto space-y-4';

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {/* Employee Name - input only if not locked (no greeting) */}
        {!isEmployeeNameLocked && (
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
              className={`h-14 text-lg touch-manipulation ${validationErrors.name ? 'border-destructive ring-destructive' : ''}`}
            />
            {validationErrors.name && (
              <p className="text-destructive text-sm mt-1">
                {t('simpleOrder.nameRequired', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
              </p>
            )}
          </div>
        )}

        {/* Show employee name label if locked in supplier selection */}
        {isEmployeeNameLocked && variant === 'supplier-selection' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="font-medium">{employeeName}</span>
          </div>
        )}

        {/* Location Selection */}
        {variant === 'supplier-selection' ? (
          <div>
            <Label className="flex items-center gap-2 text-base font-medium mb-2">
              <MapPin className="h-5 w-5" />
              {t('simpleOrder.selectLocation', 'เลือกสถานที่ / Standort wählen')} *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locations.map((location) => (
                <Button
                  key={location.id}
                  type="button"
                  variant={selectedLocationId === location.id ? "default" : "outline"}
                  className="h-14 text-lg font-medium touch-manipulation"
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
        ) : isLocationLocked || locations.length <= 1 ? null : (
          <div>
            <Label className="flex items-center gap-2 text-base font-medium mb-2">
              <MapPin className="h-5 w-5" />
              {t('simpleOrder.selectLocation', 'เลือกสถานที่ / Standort wählen')} *
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locations.map((location) => (
                <Button
                  key={location.id}
                  type="button"
                  variant={selectedLocationId === location.id ? "default" : "outline"}
                  className={`h-14 text-lg font-medium touch-manipulation ${
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
