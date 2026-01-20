import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocations, Location } from '@/hooks/useLocations';
import { useOrganization } from '@/hooks/useOrganization';

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
  const queryClient = useQueryClient();
  const { data: organizationId } = useOrganization();
  const { data: locations = [], isLoading } = useLocations();
  const [activeLocation, setActiveLocationState] = useState<Location | null>(null);

  // Organization Consistency Guard: detect mismatch between org and location
  useEffect(() => {
    if (organizationId && activeLocation && activeLocation.organization_id !== organizationId) {
      // Organization mismatch detected - clearing stale location data
      
      // Clear stale localStorage
      localStorage.removeItem('activeLocationId');
      setActiveLocationState(null);
      
      // Invalidate ALL org-bound queries to force refetch with correct org
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions-with-stats'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-articles'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-articles-count'] });
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
    }
  }, [organizationId, activeLocation, queryClient]);

  // Load active location from localStorage or set default
  useEffect(() => {
    if (locations.length > 0 && organizationId) {
      // Filter locations to only those matching current organization
      const orgLocations = locations.filter(l => l.organization_id === organizationId);
      
      if (orgLocations.length === 0) {
        console.warn('No locations found for current organization');
        localStorage.removeItem('activeLocationId');
        setActiveLocationState(null);
        return;
      }
      
      const savedLocationId = localStorage.getItem('activeLocationId');
      const savedLocation = savedLocationId 
        ? orgLocations.find(l => l.id === savedLocationId)
        : null;
      
      // Wenn gespeicherte Location nicht in den erlaubten Locations ist, 
      // localStorage bereinigen
      if (savedLocationId && !savedLocation) {
        localStorage.removeItem('activeLocationId');
      }
      
      const defaultLocation = savedLocation || orgLocations.find(l => l.is_default) || orgLocations[0];
      
      // Immer aktualisieren wenn sich die Locations ändern oder aktive Location ungültig ist
      if (!activeLocation || !orgLocations.find(l => l.id === activeLocation.id)) {
        setActiveLocationState(defaultLocation);
      }
    }
  }, [locations, organizationId]);

  const setActiveLocation = (location: Location) => {
    // Only allow setting location if it belongs to current organization
    if (organizationId && location.organization_id !== organizationId) {
      console.error('Attempted to set location from different organization', {
        organizationId,
        locationOrgId: location.organization_id,
      });
      return;
    }
    setActiveLocationState(location);
    localStorage.setItem('activeLocationId', location.id);
  };

  return (
    <LocationContext.Provider value={{ 
      locations: locations.filter(l => !organizationId || l.organization_id === organizationId), 
      activeLocation, 
      setActiveLocation, 
      isLoading 
    }}>
      {children}
    </LocationContext.Provider>
  );
};
