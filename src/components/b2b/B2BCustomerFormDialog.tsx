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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface B2BCustomer {
  id: string;
  company_name: string;
  email: string;
  customer_number: string | null;
  contact_person: string | null;
  phone: string | null;
  delivery_address: string | null;
  is_active: boolean;
  user_id: string | null;
}

interface B2BCustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: B2BCustomer | null;
  accountId: string;
  onSuccess: () => void;
}

const B2BCustomerFormDialog = ({
  open,
  onOpenChange,
  customer,
  accountId,
  onSuccess,
}: B2BCustomerFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (customer) {
      setCompanyName(customer.company_name);
      setEmail(customer.email);
      setCustomerNumber(customer.customer_number || '');
      setContactPerson(customer.contact_person || '');
      setPhone(customer.phone || '');
      setDeliveryAddress(customer.delivery_address || '');
      setIsActive(customer.is_active);
    } else {
      setCompanyName('');
      setEmail('');
      setCustomerNumber('');
      setContactPerson('');
      setPhone('');
      setDeliveryAddress('');
      setIsActive(true);
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer) {
        // Update existing customer
        const { error } = await supabase
          .from('supplier_b2b_customers')
          .update({
            company_name: companyName,
            email,
            customer_number: customerNumber || null,
            contact_person: contactPerson || null,
            phone: phone || null,
            delivery_address: deliveryAddress || null,
            is_active: isActive,
          })
          .eq('id', customer.id);

        if (error) throw error;
        toast.success('Kunde aktualisiert');
      } else {
        // Create new customer
        const { error: customerError } = await supabase
          .from('supplier_b2b_customers')
          .insert({
            supplier_account_id: accountId,
            company_name: companyName,
            email,
            customer_number: customerNumber || null,
            contact_person: contactPerson || null,
            phone: phone || null,
            delivery_address: deliveryAddress || null,
            is_active: isActive,
          });

        if (customerError) throw customerError;

        // Create invitation token
        const { error: invitationError } = await supabase
          .from('b2b_customer_invitations')
          .insert({
            supplier_account_id: accountId,
            email,
          });

        if (invitationError) {
          console.error('Error creating invitation:', invitationError);
          // Don't throw - customer was still created
        }

        toast.success('Kunde angelegt. Eine Einladung wird gesendet.');
        // TODO: Send invitation email
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('Ein Kunde mit dieser E-Mail existiert bereits');
      } else {
        toast.error(error.message || 'Fehler beim Speichern');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Kunde bearbeiten' : 'Neuen Kunden einladen'}
          </DialogTitle>
          {!customer && (
            <DialogDescription>
              Der Kunde erhält eine E-Mail mit einem Einladungslink
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Firmenname *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Firma GmbH"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kunde@beispiel.de"
              required
              disabled={!!customer?.user_id}
            />
            {customer?.user_id && (
              <p className="text-xs text-muted-foreground">
                E-Mail kann nicht geändert werden, da der Kunde bereits registriert ist
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerNumber">Kundennummer</Label>
              <Input
                id="customerNumber"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                placeholder="K-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 123..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Ansprechpartner</Label>
            <Input
              id="contactPerson"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Max Mustermann"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Lieferadresse</Label>
            <Textarea
              id="deliveryAddress"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Musterstraße 1&#10;12345 Musterstadt"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Aktiv (kann bestellen)</Label>
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
              {loading ? 'Speichern...' : customer ? 'Speichern' : 'Einladen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default B2BCustomerFormDialog;
