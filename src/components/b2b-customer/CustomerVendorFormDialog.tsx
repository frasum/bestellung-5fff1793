import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CustomerVendor } from './CustomerVendorsTab';

interface CustomerVendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: CustomerVendor | null;
  customerId: string;
  onSuccess: () => void;
}

const CustomerVendorFormDialog = ({
  open,
  onOpenChange,
  vendor,
  customerId,
  onSuccess,
}: CustomerVendorFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setEmail(vendor.email || '');
      setPhone(vendor.phone || '');
      setAddress(vendor.address || '');
      setNotes(vendor.notes || '');
      setIsActive(vendor.is_active);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setIsActive(true);
    }
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    setLoading(true);

    try {
      const vendorData = {
        customer_id: customerId,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        is_active: isActive,
      };

      if (vendor) {
        const { error } = await supabase
          .from('b2b_customer_vendors')
          .update(vendorData)
          .eq('id', vendor.id);

        if (error) throw error;
        toast.success('Lieferant aktualisiert');
      } else {
        const { error } = await supabase
          .from('b2b_customer_vendors')
          .insert(vendorData);

        if (error) throw error;
        toast.success('Lieferant hinzugefügt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lieferant@beispiel.de"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 123 456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Straße, PLZ Ort"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Aktiv</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-center items-center gap-6 pt-4">
            <Button 
              type="button" 
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-2 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              title="Abbrechen"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button 
              type="submit" 
              size="icon"
              className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={loading}
              title={vendor ? 'Speichern' : 'Hinzufügen'}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerVendorFormDialog;
