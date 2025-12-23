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
      <div className={cn(
        "flex items-center gap-2 px-5 py-3",
        "bg-accent/10 text-accent rounded-md font-semibold text-base",
        "animate-pulse-glow",
        className
      )}>
        {showIcon && <MapPin className="h-5 w-5" />}
        <span className="truncate">{activeLocation?.short_code || activeLocation?.name || locations[0]?.short_code || locations[0]?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="lg" 
          className={cn(
            "gap-2",
            "bg-accent text-accent-foreground",
            "border-accent/50",
            "hover:bg-accent/90",
            "font-semibold text-base",
            "animate-pulse-glow",
            className
          )}
        >
          {showIcon && <MapPin className="h-5 w-5 text-accent-foreground" />}
          <span className="max-w-[200px] truncate">
            {activeLocation?.short_code || activeLocation?.name || 'Standort'}
          </span>
          <ChevronDown className="h-4 w-4 text-accent-foreground/70" />
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
            <span className="flex-1 truncate">
              {location.short_code || location.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
