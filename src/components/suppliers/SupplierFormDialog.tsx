import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Mail, Globe, Send, MapPin } from 'lucide-react';
import { Supplier, SupplierInput, OrderDeliveryMethod } from '@/hooks/useSuppliers';
import { supplierSchema, SupplierFormData } from './schemas';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier: Supplier | null;
  onSubmit: (data: SupplierInput) => Promise<void>;
  onImportArticles?: (supplierId: string) => void;
  isPending: boolean;
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
          <Alert className="bg-muted/50 border-muted">
            <MapPin className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Kundennummern und Mindestbestellwerte werden <strong>pro Standort</strong> konfiguriert. 
              Nutzen Sie das Standort-Icon in der Lieferantenliste.
            </AlertDescription>
          </Alert>

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
            <Button type="submit" className="flex-1 h-10 sm:h-9" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSupplier ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
