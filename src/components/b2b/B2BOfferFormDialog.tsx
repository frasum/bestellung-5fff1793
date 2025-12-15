import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface B2BOfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  offer?: any;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  company_name: string;
  email: string;
}

interface Article {
  id: string;
  name: string;
  base_price: number;
  unit: string;
}

interface OfferItem {
  id?: string;
  article_id: string | null;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export default function B2BOfferFormDialog({
  open,
  onOpenChange,
  accountId,
  offer,
  onSuccess,
}: B2BOfferFormDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
      if (offer) {
        setSelectedCustomer(offer.customer.id);
        setValidUntil(offer.valid_until ? offer.valid_until.split('T')[0] : '');
        setNotes(offer.notes || '');
        setItems(
          offer.items.map((item: any) => ({
            id: item.id,
            article_id: item.article_id,
            article_name: item.article_name,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
          }))
        );
      } else {
        resetForm();
      }
    }
  }, [open, offer]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersRes, articlesRes] = await Promise.all([
        supabase
          .from('supplier_b2b_customers')
          .select('id, company_name, email')
          .eq('supplier_account_id', accountId)
          .eq('is_active', true),
        supabase
          .from('supplier_b2b_articles')
          .select('id, name, base_price, unit')
          .eq('supplier_account_id', accountId)
          .eq('is_active', true),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (articlesRes.error) throw articlesRes.error;

      setCustomers(customersRes.data || []);
      setArticles(articlesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer('');
    setValidUntil('');
    setNotes('');
    setItems([]);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        article_id: null,
        article_name: '',
        quantity: 1,
        unit: 'Stk',
        unit_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<OfferItem>) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const selectArticle = (index: number, articleId: string) => {
    const article = articles.find((a) => a.id === articleId);
    if (article) {
      updateItem(index, {
        article_id: articleId,
        article_name: article.name,
        unit: article.unit,
        unit_price: article.base_price,
      });
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Kunden aus.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte fügen Sie mindestens einen Artikel hinzu.',
        variant: 'destructive',
      });
      return;
    }

    if (items.some((item) => !item.article_name || item.quantity <= 0)) {
      toast({
        title: 'Fehler',
        description: 'Bitte füllen Sie alle Artikel vollständig aus.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const totalAmount = calculateTotal();
      const offerData = {
        supplier_account_id: accountId,
        customer_id: selectedCustomer,
        valid_until: validUntil || null,
        notes: notes || null,
        total_amount: totalAmount,
      };

      let offerId: string;

      if (offer) {
        // Update existing offer
        const { error: updateError } = await supabase
          .from('supplier_b2b_offers')
          .update(offerData)
          .eq('id', offer.id);

        if (updateError) throw updateError;
        offerId = offer.id;

        // Delete old items
        await supabase
          .from('supplier_b2b_offer_items')
          .delete()
          .eq('offer_id', offerId);
      } else {
        // Create new offer
        const { data: newOffer, error: insertError } = await supabase
          .from('supplier_b2b_offers')
          .insert(offerData)
          .select()
          .single();

        if (insertError) throw insertError;
        offerId = newOffer.id;
      }

      // Insert items
      const offerItems = items.map((item) => ({
        offer_id: offerId,
        article_id: item.article_id,
        article_name: item.article_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('supplier_b2b_offer_items')
        .insert(offerItems);

      if (itemsError) throw itemsError;

      toast({
        title: offer ? 'Angebot aktualisiert' : 'Angebot erstellt',
        description: offer
          ? 'Das Angebot wurde erfolgreich aktualisiert.'
          : 'Das Angebot wurde erfolgreich erstellt.',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: 'Fehler',
        description: 'Angebot konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {offer ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Kunde *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label>Gültig bis</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Artikel *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Artikel hinzufügen
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keine Artikel hinzugefügt. Klicken Sie auf "Artikel hinzufügen".
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <Label className="text-xs">Artikel</Label>
                        <Select
                          value={item.article_id || ''}
                          onValueChange={(value) => selectArticle(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {articles.map((article) => (
                              <SelectItem key={article.id} value={article.id}>
                                {article.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-xs">Menge</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, { quantity: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-xs">Einheit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(index, { unit: e.target.value })}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="text-xs">Preis (€)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-sm font-medium sm:hidden">
                          = €{(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                        <span className="text-sm font-medium hidden sm:block">
                          €{(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex justify-end p-3 bg-muted/50 rounded-lg">
                    <span className="font-bold">
                      Gesamtsumme: €{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optionale Anmerkungen zum Angebot..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {offer ? 'Speichern' : 'Angebot erstellen'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
