import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface LocationAssignmentSectionProps {
  locations: Location[];
  selectedLocationIds: string[];
  setSelectedLocationIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function LocationAssignmentSection({
  locations,
  selectedLocationIds,
  setSelectedLocationIds,
}: LocationAssignmentSectionProps) {
  if (locations.length <= 1) return null;

  return (
    <div className="space-y-2 pt-2 border-t">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        Verfügbar an Standorten
      </Label>
      <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/30">
        {locations.map(location => (
          <div key={location.id} className="flex items-center gap-2">
            <Checkbox
              id={`loc-${location.id}`}
              checked={selectedLocationIds.includes(location.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedLocationIds(prev => [...prev, location.id]);
                } else {
                  setSelectedLocationIds(prev => prev.filter(id => id !== location.id));
                }
              }}
            />
            <label 
              htmlFor={`loc-${location.id}`} 
              className="text-base font-semibold cursor-pointer"
            >
              {location.short_code || location.name}
            </label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Wähle die Standorte, an denen dieser Artikel verfügbar sein soll
      </p>
    </div>
  );
}
