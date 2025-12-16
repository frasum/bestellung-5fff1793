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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { B2BSupplier } from './B2BSuppliersTab';

interface B2BSupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: B2BSupplier | null;
  accountId: string;
  onSuccess: () => void;
}

const B2BSupplierFormDialog = ({
  open,
  onOpenChange,
  supplier,
  accountId,
  onSuccess,
}: B2BSupplierFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContactEmail(supplier.contact_email || '');
      setContactPhone(supplier.contact_phone || '');
      setDescription(supplier.description || '');
      setIsActive(supplier.is_active);
    } else {
      setName('');
      setContactEmail('');
      setContactPhone('');
      setDescription('');
      setIsActive(true);
    }
  }, [supplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supplier) {
        // Update
        const { error } = await supabase
          .from('b2b_suppliers')
          .update({
            name,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            description: description || null,
            is_active: isActive,
          })
          .eq('id', supplier.id);

        if (error) throw error;
        toast.success('Lieferant aktualisiert');
      } else {
        // Get max sort_order
        const { data: existing } = await supabase
          .from('b2b_suppliers')
          .select('sort_order')
          .eq('account_id', accountId)
          .order('sort_order', { ascending: false })
          .limit(1);

        const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

        // Insert
        const { error } = await supabase
          .from('b2b_suppliers')
          .insert({
            account_id: accountId,
            name,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            description: description || null,
            is_active: isActive,
            sort_order: nextSortOrder,
          });

        if (error) throw error;
        toast.success('Lieferant erstellt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast.error(error.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lieferantenname"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="kontakt@lieferant.de"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+49 123 456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung des Lieferanten"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Aktiv (sichtbar für Kunden)</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default B2BSupplierFormDialog;
