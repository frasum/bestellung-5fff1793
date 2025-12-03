import { MapPin, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocationContext } from '@/contexts/LocationContext';
import { cn } from '@/lib/utils';

interface LocationSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export const LocationSwitcher = ({ className, showIcon = true }: LocationSwitcherProps) => {
  const { locations, activeLocation, setActiveLocation, isLoading } = useLocationContext();

  if (isLoading || locations.length === 0) {
    return null;
  }

  // If only one location, show it without dropdown
  if (locations.length === 1) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-3 text-muted-foreground", className)}>
        {showIcon && <MapPin className="h-4 w-4" />}
        <span className="truncate">{activeLocation?.name || locations[0]?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          {showIcon && <MapPin className="h-4 w-4" />}
          <span className="max-w-[150px] truncate">
            {activeLocation?.name || 'Standort'}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locations.map((location) => (
          <DropdownMenuItem
            key={location.id}
            onClick={() => setActiveLocation(location)}
            className={cn(
              "cursor-pointer",
              activeLocation?.id === location.id && "bg-accent"
            )}
          >
            <MapPin className="h-4 w-4 mr-2" />
            <span className="flex-1 truncate">{location.name}</span>
            {location.short_code && (
              <span className="text-xs text-muted-foreground ml-2">
                {location.short_code}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
