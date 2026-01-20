import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Send, 
  Check, 
  X, 
  Clock,
  Mail,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import B2BOfferFormDialog from './B2BOfferFormDialog';

interface B2BOffer {
  id: string;
  offer_number: string;
  status: string;
  valid_until: string | null;
  notes: string | null;
  total_amount: number;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  supplier_id: string | null;
  customer: {
    id: string;
    company_name: string;
    email: string;
    contact_person: string | null;
  };
  items: {
    id: string;
    article_id: string | null;
    article_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
  }[];
}

interface B2BSupplier {
  id: string;
  name: string;
}

interface B2BOffersTabProps {
  accountId: string;
  selectedSupplierId?: string;
  suppliers?: B2BSupplier[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-500', icon: FileText },
  sent: { label: 'Gesendet', color: 'bg-blue-500', icon: Send },
  accepted: { label: 'Angenommen', color: 'bg-green-500', icon: Check },
  rejected: { label: 'Abgelehnt', color: 'bg-red-500', icon: X },
  expired: { label: 'Abgelaufen', color: 'bg-orange-500', icon: Clock },
};

export default function B2BOffersTab({ accountId, selectedSupplierId = 'all', suppliers = [] }: B2BOffersTabProps) {
  const [offers, setOffers] = useState<B2BOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<B2BOffer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOffers();
  }, [accountId, selectedSupplierId]);

  const loadOffers = async () => {
    try {
      let query = supabase
        .from('supplier_b2b_offers')
        .select(`
          *,
          customer:supplier_b2b_customers(id, company_name, email, contact_person)
        `)
        .eq('supplier_account_id', accountId)
        .order('created_at', { ascending: false });

      if (selectedSupplierId && selectedSupplierId !== 'all') {
        query = query.eq('supplier_id', selectedSupplierId);
      }

      const { data: offersData, error: offersError } = await query;

      if (offersError) throw offersError;

      // Load items for each offer
      const offersWithItems = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { data: items } = await supabase
            .from('supplier_b2b_offer_items')
            .select('*')
            .eq('offer_id', offer.id)
            .order('created_at');

          return {
            ...offer,
            items: items || [],
          };
        })
      );

      setOffers(offersWithItems);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast({
        title: 'Fehler',
        description: 'Angebote konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendOffer = async (offer: B2BOffer) => {
    try {
      const { error } = await supabase.functions.invoke('send-b2b-offer', {
        body: { offerId: offer.id },
      });

      if (error) throw error;

      await supabase
        .from('supplier_b2b_offers')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', offer.id);

      toast({
        title: 'Angebot gesendet',
        description: `Angebot ${offer.offer_number} wurde an ${offer.customer.email} gesendet.`,
      });

      loadOffers();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: 'Fehler',
        description: 'Angebot konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    }
  };

  const convertToOrder = async (offer: B2BOffer) => {
    try {
      // Generate order number
      const orderNumber = `B2B-${new Date().toISOString().slice(0, 7)}-${String(Date.now()).slice(-4)}`;
      
      // Create order from offer
      const { data: order, error: orderError } = await supabase
        .from('supplier_b2b_orders')
        .insert({
          order_number: orderNumber,
          supplier_account_id: accountId,
          supplier_id: offer.supplier_id,
          customer_id: offer.customer.id,
          total_amount: offer.total_amount,
          notes: `Erstellt aus Angebot ${offer.offer_number}`,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = offer.items.map((item) => ({
        order_id: order.id,
        article_id: item.article_id,
        article_name: item.article_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('supplier_b2b_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update offer status
      await supabase
        .from('supplier_b2b_offers')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', offer.id);

      toast({
        title: 'Bestellung erstellt',
        description: `Bestellung ${order.order_number} wurde aus Angebot ${offer.offer_number} erstellt.`,
      });

      loadOffers();
    } catch (error) {
      console.error('Error converting offer to order:', error);
      toast({
        title: 'Fehler',
        description: 'Bestellung konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  const deleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_b2b_offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: 'Angebot gelöscht',
        description: 'Das Angebot wurde erfolgreich gelöscht.',
      });

      loadOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Fehler',
        description: 'Angebot konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const toggleExpanded = (offerId: string) => {
    setExpandedOffers((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    return suppliers.find(s => s.id === supplierId)?.name;
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.offer_number.toLowerCase().includes(search.toLowerCase()) ||
      offer.customer.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Angebote durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">Alle Status</option>
            <option value="draft">Entwurf</option>
            <option value="sent">Gesendet</option>
            <option value="accepted">Angenommen</option>
            <option value="rejected">Abgelehnt</option>
            <option value="expired">Abgelaufen</option>
          </select>
          <Button onClick={() => { setEditingOffer(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Angebot
          </Button>
        </div>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Keine Angebote</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? 'Keine Angebote gefunden, die Ihren Filterkriterien entsprechen.'
                : 'Erstellen Sie Ihr erstes Angebot für einen Kunden.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => { setEditingOffer(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Angebot erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => {
            const isExpanded = expandedOffers.has(offer.id);
            const StatusIcon = STATUS_CONFIG[offer.status]?.icon || FileText;
            const statusConfig = STATUS_CONFIG[offer.status];
            const supplierName = getSupplierName(offer.supplier_id);

            return (
              <Card key={offer.id}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(offer.id)}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{offer.offer_number}</span>
                              <Badge className={`${statusConfig.color} text-white`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {supplierName && selectedSupplierId === 'all' && (
                                <Badge variant="outline">{supplierName}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {offer.customer.company_name} • {offer.items.length} Artikel
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">€{offer.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(offer.created_at), 'dd.MM.yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t pt-4">
                      {/* Items Table */}
                      <div className="rounded-md border mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Artikel</th>
                              <th className="text-right p-2 font-medium">Menge</th>
                              <th className="text-right p-2 font-medium">Preis</th>
                              <th className="text-right p-2 font-medium">Gesamt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {offer.items.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="p-2">{item.article_name}</td>
                                <td className="p-2 text-right">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="p-2 text-right">€{item.unit_price.toFixed(2)}</td>
                                <td className="p-2 text-right font-medium">
                                  €{item.total_price.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted/50">
                            <tr>
                              <td colSpan={3} className="p-2 text-right font-medium">
                                Gesamtsumme:
                              </td>
                              <td className="p-2 text-right font-bold">
                                €{offer.total_amount.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Offer Details */}
                      {(offer.valid_until || offer.notes) && (
                        <div className="mb-4 space-y-1 text-sm text-muted-foreground">
                          {offer.valid_until && (
                            <p>
                              Gültig bis: {format(new Date(offer.valid_until), 'dd.MM.yyyy', { locale: de })}
                            </p>
                          )}
                          {offer.notes && <p>Notizen: {offer.notes}</p>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {offer.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                sendOffer(offer);
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Angebot senden
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOffer(offer);
                                setDialogOpen(true);
                              }}
                            >
                              Bearbeiten
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteOffer(offer.id);
                              }}
                            >
                              Löschen
                            </Button>
                          </>
                        )}
                        {offer.status === 'sent' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              convertToOrder(offer);
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            In Bestellung umwandeln
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <B2BOfferFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accountId={accountId}
        offer={editingOffer}
        selectedSupplierId={selectedSupplierId}
        suppliers={suppliers}
        onSuccess={loadOffers}
      />
    </div>
  );
}
