import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package } from 'lucide-react';
import { Supplier, SupplierInput } from '@/hooks/useSuppliers';
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
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '', email: '', phone: '', address: '', contact_person: '',
      customer_number: '', minimum_order_value: ''
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
        customer_number: editingSupplier.customer_number || '',
        minimum_order_value: editingSupplier.minimum_order_value?.toString() || '',
      });
    } else {
      form.reset({
        name: '', email: '', phone: '', address: '', contact_person: '',
        customer_number: '', minimum_order_value: ''
      });
    }
  }, [editingSupplier, form]);

  const handleSubmit = async (data: SupplierFormData) => {
    const input: SupplierInput = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      contact_person: data.contact_person || undefined,
      customer_number: data.customer_number || undefined,
      minimum_order_value: data.minimum_order_value ? parseFloat(data.minimum_order_value) : undefined,
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
          <div className="space-y-2">
            <Label htmlFor="customer_number">Kundennummer</Label>
            <Input id="customer_number" {...form.register('customer_number')} placeholder="KD-12345" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimum_order_value">Mindestbestellwert (€)</Label>
            <Input id="minimum_order_value" type="number" step="0.01" min="0" {...form.register('minimum_order_value')} placeholder="50.00" onFocus={(e) => e.target.select()} />
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
