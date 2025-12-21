import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, MapPin, Building2 } from 'lucide-react';
import type { EmployeeSession } from '@/pages/EmployeeOrder';

interface LocationSelectionScreenProps {
  session: EmployeeSession;
  onSelectLocation: (location: { id: string; name: string }) => void;
  onLogout: () => void;
}

export function LocationSelectionScreen({ 
  session, 
  onSelectLocation, 
  onLogout 
}: LocationSelectionScreenProps) {
  const locations = session.locations;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Angemeldet als</p>
              <p className="font-semibold">{session.employee.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Standort auswählen</h1>
            <p className="text-muted-foreground text-lg">
              Für welchen Standort möchten Sie bestellen?
            </p>
          </div>

          {locations.length === 0 ? (
            <Card className="p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                Ihnen wurden noch keine Standorte zugewiesen.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Bitte kontaktieren Sie Ihren Administrator.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {locations.map((location) => {
                // Count suppliers for this location
                const supplierCount = session.locationSuppliers.filter(
                  ls => ls.location_id === location.id
                ).length;

                return (
                  <Card
                    key={location.id}
                    className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary/50 active:scale-[0.98]"
                    onClick={() => onSelectLocation({ id: location.id, name: location.name })}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{location.name}</h2>
                      {location.short_code && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {location.short_code}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {supplierCount} Lieferant{supplierCount !== 1 ? 'en' : ''} verfügbar
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
