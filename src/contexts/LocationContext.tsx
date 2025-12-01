import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocations, Location } from '@/hooks/useLocations';

interface LocationContextType {
  locations: Location[];
  activeLocation: Location | null;
  setActiveLocation: (location: Location) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const { data: locations = [], isLoading } = useLocations();
  const [activeLocation, setActiveLocationState] = useState<Location | null>(null);

  // Load active location from localStorage or set default
  useEffect(() => {
    if (locations.length > 0 && !activeLocation) {
      const savedLocationId = localStorage.getItem('activeLocationId');
      const savedLocation = savedLocationId 
        ? locations.find(l => l.id === savedLocationId)
        : null;
      
      const defaultLocation = savedLocation || locations.find(l => l.is_default) || locations[0];
      setActiveLocationState(defaultLocation);
    }
  }, [locations, activeLocation]);

  const setActiveLocation = (location: Location) => {
    setActiveLocationState(location);
    localStorage.setItem('activeLocationId', location.id);
  };

  return (
    <LocationContext.Provider value={{ 
      locations, 
      activeLocation, 
      setActiveLocation, 
      isLoading 
    }}>
      {children}
    </LocationContext.Provider>
  );
};
