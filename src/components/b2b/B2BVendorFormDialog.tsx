import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { B2BVendor } from './B2BVendorsTab';

interface B2BVendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: B2BVendor | null;
  accountId: string;
  supplierId?: string;
  onSuccess: () => void;
}

const B2BVendorFormDialog = ({
  open,
  onOpenChange,
  vendor,
  accountId,
  supplierId,
  onSuccess,
}: B2BVendorFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        notes: vendor.notes || '',
        is_active: vendor.is_active,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        is_active: true,
      });
    }
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    setLoading(true);
    try {
      const data = {
        supplier_account_id: accountId,
        supplier_id: supplierId || null,
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
      };

      if (vendor) {
        const { error } = await supabase
          .from('b2b_supplier_vendors')
          .update(data)
          .eq('id', vendor.id);

        if (error) throw error;
        toast.success('Lieferant aktualisiert');
      } else {
        const { error } = await supabase
          .from('b2b_supplier_vendors')
          .insert(data);

        if (error) throw error;
        toast.success('Lieferant hinzugefügt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {vendor ? 'Lieferant bearbeiten' : 'Neuen Lieferanten hinzufügen'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Großhändler XY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="bestellung@lieferant.de"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+49 123 456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Straße, PLZ Ort"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Interne Notizen..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Aktiv</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default B2BVendorFormDialog;