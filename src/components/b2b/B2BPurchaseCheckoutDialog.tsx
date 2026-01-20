import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { B2BVendor } from './B2BVendorsTab';
import type { B2BVendorArticle } from './B2BVendorArticlesTab';

interface CartItem extends B2BVendorArticle {
  quantity: number;
}

interface B2BPurchaseCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  vendorId: string;
  vendor: B2BVendor | undefined;
  items: CartItem[];
  total: number;
  onSuccess: () => void;
}

const B2BPurchaseCheckoutDialog = ({
  open,
  onOpenChange,
  accountId,
  vendorId,
  vendor,
  items,
  total,
  onSuccess,
}: B2BPurchaseCheckoutDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!vendor?.email) {
      toast.error('Der Lieferant hat keine E-Mail-Adresse hinterlegt');
      return;
    }

    setLoading(true);
    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('b2b_supplier_purchase_orders')
        .insert({
          supplier_account_id: accountId,
          vendor_id: vendorId,
          delivery_date: deliveryDate?.toISOString().split('T')[0] || null,
          delivery_address: deliveryAddress.trim() || null,
          notes: notes.trim() || null,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        article_id: item.id,
        article_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('b2b_supplier_purchase_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-b2b-purchase-order', {
        body: {
          orderId: order.id,
          vendorEmail: vendor.email,
          vendorName: vendor.name,
          orderNumber: order.order_number,
          deliveryDate: deliveryDate?.toISOString().split('T')[0],
          deliveryAddress: deliveryAddress.trim(),
          notes: notes.trim(),
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            total: item.price * item.quantity,
          })),
          total,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Update order to mark email failed
        await supabase
          .from('b2b_supplier_purchase_orders')
          .update({ email_sent: false })
          .eq('id', order.id);
        
        toast.warning('Bestellung erstellt, aber E-Mail konnte nicht gesendet werden');
      } else {
        // Update order to mark email sent
        await supabase
          .from('b2b_supplier_purchase_orders')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', order.id);
        
        toast.success(`Bestellung ${order.order_number} an ${vendor.name} gesendet`);
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Error creating order:', error instanceof Error ? error.message : error);
      toast.error('Fehler beim Erstellen der Bestellung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bestellung an {vendor?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <h4 className="font-medium mb-2">Bestellübersicht</h4>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Gesamt</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <Label>Gewünschtes Lieferdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !deliveryDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate 
                    ? format(deliveryDate, 'PPP', { locale: de })
                    : 'Datum wählen (optional)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  locale={de}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Lieferadresse</Label>
            <Textarea
              id="address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Optional - Lieferadresse für diese Bestellung"
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Anmerkungen</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional - Besondere Hinweise für den Lieferanten"
              rows={2}
            />
          </div>

          {!vendor?.email && (
            <p className="text-sm text-destructive">
              ⚠️ Dieser Lieferant hat keine E-Mail-Adresse. Bitte ergänzen Sie diese zuerst.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !vendor?.email}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Senden...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Bestellung senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default B2BPurchaseCheckoutDialog;
