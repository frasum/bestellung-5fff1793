import { memo } from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LocationSuppliersInfo {
  locationName: string;
  supplierNames: string[];
}

interface EmployeeLocationInfoProps {
  locationSuppliersInfo: LocationSuppliersInfo[];
}

export const EmployeeLocationInfo = memo(function EmployeeLocationInfo({
  locationSuppliersInfo,
}: EmployeeLocationInfoProps) {
  if (locationSuppliersInfo.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {locationSuppliersInfo.map((info, idx) => (
        <div key={idx} className="flex items-center gap-1 flex-wrap text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">{info.locationName}:</span>
          {info.supplierNames.length > 0 ? (
            info.supplierNames.length > 3 ? (
              <Badge variant="secondary" className="text-xs">
                {info.supplierNames.length} Lieferanten
              </Badge>
            ) : (
              info.supplierNames.map((name, sIdx) => (
                <Badge key={sIdx} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))
            )
          ) : (
            <span className="text-xs text-amber-600">Keine Lieferanten</span>
          )}
        </div>
      ))}
    </div>
  );
});

EmployeeLocationInfo.displayName = 'EmployeeLocationInfo';
