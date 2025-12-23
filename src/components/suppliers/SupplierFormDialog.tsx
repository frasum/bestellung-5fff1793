import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, Mail, Globe, Send, MapPin } from 'lucide-react';
import { Supplier, SupplierInput, OrderDeliveryMethod } from '@/hooks/useSuppliers';
import { supplierSchema, SupplierFormData } from './schemas';
import { useLocations } from '@/hooks/useLocations';
import { useSupplierLocations, useUpsertSupplierLocation } from '@/hooks/useSupplierLocations';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier: Supplier | null;
  onSubmit: (data: SupplierInput) => Promise<void>;
  onImportArticles?: (supplierId: string) => void;
  isPending: boolean;
}

interface LocationFormData {
  is_active: boolean;
  customer_number: string;
  minimum_order_value: string;
}

export const SupplierFormDialog = ({
  open,
  onOpenChange,
  editingSupplier,
  onSubmit,
  onImportArticles,
  isPending
}: SupplierFormDialogProps) => {
  const form = useForm<SupplierFormData & { order_delivery_method: OrderDeliveryMethod }>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '', email: '', phone: '', address: '', contact_person: '',
      order_delivery_method: 'email'
    }
  });

  const { data: locations = [] } = useLocations();
  const { data: supplierLocations = [] } = useSupplierLocations(editingSupplier?.id);
  const upsertLocation = useUpsertSupplierLocation();
  
  const [locationData, setLocationData] = useState<Record<string, LocationFormData>>({});

  // Initialize form with supplier data
  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        name: editingSupplier.name,
        email: editingSupplier.email,
        phone: editingSupplier.phone || '',
        address: editingSupplier.address || '',
        contact_person: editingSupplier.contact_person || '',
        order_delivery_method: editingSupplier.order_delivery_method || 'email',
      });
    } else {
      form.reset({
        name: '', email: '', phone: '', address: '', contact_person: '',
        order_delivery_method: 'email'
      });
    }
  }, [editingSupplier, form]);

  // Initialize location data when supplier locations are loaded
  useEffect(() => {
    if (locations.length > 0) {
      const initial: Record<string, LocationFormData> = {};
      locations.forEach(loc => {
        const existing = supplierLocations.find(sl => sl.location_id === loc.id);
        initial[loc.id] = {
          is_active: existing?.is_active ?? false,
          customer_number: existing?.customer_number || '',
          minimum_order_value: existing?.minimum_order_value?.toString() || '',
        };
      });
      setLocationData(initial);
    }
  }, [locations, supplierLocations]);

  const updateLocationField = (locationId: string, field: keyof LocationFormData, value: string | boolean) => {
    setLocationData(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (data: SupplierFormData & { order_delivery_method: OrderDeliveryMethod }) => {
    const input: SupplierInput = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      contact_person: data.contact_person || undefined,
      order_delivery_method: data.order_delivery_method,
    };
    await onSubmit(input);
    
    // Save location assignments if editing
    if (editingSupplier) {
      for (const location of locations) {
        const locData = locationData[location.id];
        if (locData) {
          await upsertLocation.mutateAsync({
            supplier_id: editingSupplier.id,
            location_id: location.id,
            is_active: locData.is_active,
            customer_number: locData.customer_number || undefined,
            minimum_order_value: locData.minimum_order_value ? parseFloat(locData.minimum_order_value) : undefined,
          });
        }
      }
    }
    
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSupplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Firmenname *</Label>
            <Input id="name" {...form.register('name')} placeholder="Fresh Farms Italia" />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...form.register('email')} placeholder="orders@supplier.com" />
            {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" {...form.register('phone')} placeholder="+39 02 1234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" {...form.register('address')} placeholder="Via Roma 123, Milano" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person">Ansprechpartner</Label>
            <Input id="contact_person" {...form.register('contact_person')} placeholder="Marco Rossi" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_delivery_method">Bestellungs-Zustellung</Label>
            <Select 
              value={form.watch('order_delivery_method')} 
              onValueChange={(value: OrderDeliveryMethod) => form.setValue('order_delivery_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Per E-Mail
                  </div>
                </SelectItem>
                <SelectItem value="portal">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Ins Lieferantenportal
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    E-Mail + Portal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {form.watch('order_delivery_method') === 'email' && 'Bestellungen werden per E-Mail an den Lieferanten gesendet'}
              {form.watch('order_delivery_method') === 'portal' && 'Bestellungen werden im Lieferantenportal angezeigt (keine E-Mail)'}
              {form.watch('order_delivery_method') === 'both' && 'Bestellungen werden per E-Mail gesendet und im Portal angezeigt'}
            </p>
          </div>

          {/* Location assignments - only when editing */}
          {editingSupplier && locations.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Standort-Zuordnungen
                </Label>
                {locations.map(location => {
                  const locData = locationData[location.id] || { is_active: false, customer_number: '', minimum_order_value: '' };
                  return (
                    <div key={location.id} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {location.short_code || location.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${location.id}`} className="text-sm text-muted-foreground">
                            Aktiv
                          </Label>
                          <Switch
                            id={`active-${location.id}`}
                            checked={locData.is_active}
                            onCheckedChange={(checked) => updateLocationField(location.id, 'is_active', checked)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`customer-${location.id}`} className="text-xs text-muted-foreground">
                            Kundennummer
                          </Label>
                          <Input
                            id={`customer-${location.id}`}
                            value={locData.customer_number}
                            onChange={(e) => updateLocationField(location.id, 'customer_number', e.target.value)}
                            placeholder="z.B. 12345"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`min-order-${location.id}`} className="text-xs text-muted-foreground">
                            Mindestbestellwert (€)
                          </Label>
                          <Input
                            id={`min-order-${location.id}`}
                            type="number"
                            step="0.01"
                            value={locData.minimum_order_value}
                            onChange={(e) => updateLocationField(location.id, 'minimum_order_value', e.target.value)}
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          
          {editingSupplier && onImportArticles && (
            <div className="pt-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => onImportArticles(editingSupplier.id)}>
                <Package className="w-4 h-4 mr-2" />
                Artikel für {editingSupplier.name} importieren
              </Button>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-10 sm:h-9" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1 h-10 sm:h-9" disabled={isPending || upsertLocation.isPending}>
              {(isPending || upsertLocation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSupplier ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
