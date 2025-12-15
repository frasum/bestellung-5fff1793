import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Save, Store } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useSupplierLocations, useUpsertSupplierLocation, SupplierLocation } from '@/hooks/useSupplierLocations';
import { Supplier } from '@/hooks/useSuppliers';
import { toast } from 'sonner';

interface SupplierLocationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
}

export const SupplierLocationsDialog = ({ open, onOpenChange, supplier }: SupplierLocationsDialogProps) => {
  const { data: locations = [] } = useLocations();
  const { data: supplierLocations = [] } = useSupplierLocations(supplier.id);
  const upsertSupplierLocation = useUpsertSupplierLocation();
  
  const [formData, setFormData] = useState<Record<string, { 
    customer_number: string; 
    minimum_order_value: string;
    is_active: boolean;
  }>>({});

  // Initialize form data when dialog opens or supplier locations change
  useEffect(() => {
    if (open && locations.length > 0) {
      const data: typeof formData = {};
      locations.forEach(location => {
        const sl = supplierLocations.find(s => s.location_id === location.id);
        data[location.id] = {
          customer_number: sl?.customer_number || '',
          minimum_order_value: sl?.minimum_order_value?.toString() || '',
          is_active: sl?.is_active ?? true,
        };
      });
      setFormData(data);
    }
  }, [open, locations, supplierLocations]);

  const handleSave = async (locationId: string) => {
    const data = formData[locationId];
    if (!data) return;

    upsertSupplierLocation.mutate({
      supplier_id: supplier.id,
      location_id: locationId,
      customer_number: data.customer_number || undefined,
      minimum_order_value: data.minimum_order_value ? parseFloat(data.minimum_order_value.replace(',', '.')) : undefined,
      is_active: data.is_active,
    });
  };

  const handleSaveAll = async () => {
    for (const location of locations) {
      await handleSave(location.id);
    }
    toast.success('Alle Standort-Zuordnungen gespeichert');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Store className="h-5 w-5 shrink-0" />
            <span className="line-clamp-1">Standort-Zuordnungen: {supplier.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Konfigurieren Sie für jeden Standort eine eigene Kundennummer und Mindestbestellwert.
          </p>

          {locations.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Keine Standorte angelegt. Gehen Sie zu Einstellungen → Standorte.
            </p>
          ) : (
            <div className="space-y-4">
              {locations.map(location => (
                <div key={location.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{location.short_code || location.name}</span>
                      {location.short_code && (
                        <span className="text-sm text-muted-foreground ml-1">({location.name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${location.id}`} className="text-sm">Aktiv</Label>
                      <Switch
                        id={`active-${location.id}`}
                        checked={formData[location.id]?.is_active ?? true}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          [location.id]: { ...prev[location.id], is_active: checked }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`customer-${location.id}`} className="text-sm">Kundennummer</Label>
                      <Input
                        id={`customer-${location.id}`}
                        value={formData[location.id]?.customer_number || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [location.id]: { ...prev[location.id], customer_number: e.target.value }
                        }))}
                        placeholder="z.B. KD-12345"
                        className="h-11 sm:h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`min-${location.id}`} className="text-sm">Mindestbestellwert (€)</Label>
                      <Input
                        id={`min-${location.id}`}
                        value={formData[location.id]?.minimum_order_value || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [location.id]: { ...prev[location.id], minimum_order_value: e.target.value }
                        }))}
                        placeholder="0,00"
                        inputMode="decimal"
                        className="h-11 sm:h-9"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {locations.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveAll} className="gap-2 w-full sm:w-auto h-10 sm:h-9">
                <Save className="h-4 w-4" />
                Alle speichern
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
