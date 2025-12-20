import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, Package, Shield, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { LiveDemoOrdersList } from './LiveDemoOrdersList';
interface CartDraft {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  organization_id: string;
  items: CartDraftItem[];
}

interface CartDraftItem {
  id: string;
  article_id: string | null;
  quantity: number;
  supplier_id: string | null;
  article?: {
    id: string;
    name: string;
    unit: string;
    price: number;
  } | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
}

interface LiveDemoAdminPanelProps {
  soundEnabled?: boolean;
  onOrderCreated?: (from: string, to: string) => void;
}

export function LiveDemoAdminPanel({ soundEnabled, onOrderCreated }: LiveDemoAdminPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<CartDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);

  // Fetch EasyOrder drafts
  const fetchDrafts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from('cart_drafts')
        .select(`
          id,
          name,
          notes,
          created_at,
          organization_id,
          cart_draft_items (
            id,
            article_id,
            quantity,
            supplier_id,
            articles:article_id (id, name, unit, price),
            suppliers:supplier_id (id, name)
          )
        `)
        .eq('organization_id', profile.organization_id)
        .ilike('name', 'EasyOrder:%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDrafts = (data || []).map(d => ({
        ...d,
        items: (d.cart_draft_items || []).map((item: any) => ({
          id: item.id,
          article_id: item.article_id,
          quantity: item.quantity,
          supplier_id: item.supplier_id,
          article: item.articles,
          supplier: item.suppliers
        }))
      }));

      setDrafts(formattedDrafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders count
  const fetchOrdersCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('is_test_order', true);

      setOrdersCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders count:', error);
    }
  };

  useEffect(() => {
    fetchDrafts();
    fetchOrdersCount();
    
    // Realtime subscription for drafts - single consolidated subscription
    const channel = supabase
      .channel('admin-drafts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_drafts'
      }, (payload) => {
        // Immediately refetch on any change
        fetchDrafts();
        
        if (payload.eventType === 'INSERT') {
          const newDraft = payload.new as any;
          if (newDraft.name?.startsWith('EasyOrder:')) {
            if (soundEnabled) {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            }
            toast.info('Neue Vorbestellung eingegangen!', {
              description: newDraft.name.replace('EasyOrder: ', '')
            });
          }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_draft_items'
      }, () => {
        // Also refetch when items change
        fetchDrafts();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        // Refetch orders count when orders change
        fetchOrdersCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Generate simulated email HTML for demo (admin approval)
  const generateApprovalEmailHtml = (draft: CartDraft, orderNumber: string) => {
    const supplierName = draft.items[0]?.supplier?.name || 'Unbekannt';
    const employeeName = draft.name.replace('EasyOrder: ', '').split(' (')[0];
    const totalAmount = draft.items.reduce((sum, item) => sum + (item.article?.price || 0) * item.quantity, 0);
    
    const itemRows = draft.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.article?.name || 'Unbekannt'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.article?.unit || 'Stk'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${(item.article?.price || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${((item.article?.price || 0) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bestellung ${orderNumber}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f472b6 0%, #ec4899 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">EasyOrder Bestellung</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${orderNumber} • Freigegeben</p>
        </div>
        
        <div style="background: #fdf2f8; padding: 15px; border-left: 4px solid #ec4899;">
          <p style="margin: 0;"><strong>Mitarbeiter:</strong> ${employeeName}</p>
          <p style="margin: 5px 0 0 0;"><strong>Status:</strong> ✅ Freigegeben vom Admin</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p>Sehr geehrte Damen und Herren von <strong>${supplierName}</strong>,</p>
          <p>wir möchten folgende Artikel bestellen (EasyOrder - Admin freigegeben):</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Artikel</th>
                <th style="padding: 10px; text-align: center;">Menge</th>
                <th style="padding: 10px; text-align: center;">Einheit</th>
                <th style="padding: 10px; text-align: right;">Preis</th>
                <th style="padding: 10px; text-align: right;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background: #f3f4f6;">
                <td colspan="4" style="padding: 10px; text-align: right;">Gesamtsumme:</td>
                <td style="padding: 10px; text-align: right;">€${totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <p><strong>Lieferadresse:</strong><br>EasyOrder Demo<br>Live-Demo Adresse</p>
          
          <p style="margin-top: 20px;">Mit freundlichen Grüßen<br>Live-Demo Restaurant</p>
        </div>
        
        <div style="background: #fdf2f8; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #9d174d;">
          <p style="margin: 0;">🛡️ Diese E-Mail wurde simuliert für die Live-Demo (Admin-Freigabe)</p>
        </div>
      </body>
      </html>
    `;
  };

  // Approve draft - create real order with simulated email
  const approveDraft = useMutation({
    mutationFn: async (draft: CartDraft) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get supplier from first item
      const supplierId = draft.items[0]?.supplier_id;
      const supplierName = draft.items[0]?.supplier?.name || 'Unbekannt';
      if (!supplierId) throw new Error('No supplier found');

      const { data: orderNumber } = await supabase.rpc('generate_order_number');

      const totalAmount = draft.items.reduce((sum, item) => {
        return sum + (item.article?.price || 0) * item.quantity;
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          organization_id: draft.organization_id,
          supplier_id: supplierId,
          user_id: user.id,
          total_amount: totalAmount,
          delivery_address: 'EasyOrder Demo',
          notes: draft.notes || `Freigegeben aus: ${draft.name}`,
          is_test_order: true,
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = draft.items
        .filter(item => item.article)
        .map(item => ({
          order_id: order.id,
          article_id: item.article_id,
          article_name: item.article!.name,
          quantity: item.quantity,
          unit: item.article!.unit,
          unit_price: item.article!.price,
          total_price: item.article!.price * item.quantity,
        }));

      await supabase.from('order_items').insert(orderItems);

      // Create SIMULATED email log (no real email sent)
      const emailHtml = generateApprovalEmailHtml(draft, orderNumber);
      
      await supabase.from('communication_logs').insert({
        organization_id: draft.organization_id,
        order_id: order.id,
        supplier_id: supplierId,
        email_type: 'order_sent',
        direction: 'outgoing',
        recipient_email: 'demo@example.com',
        recipient_name: supplierName,
        subject: `EasyOrder Bestellung ${orderNumber} (Freigegeben)`,
        status: 'simulated',
        body_html: emailHtml,
      });

      // Delete draft items first, then draft
      await supabase.from('cart_draft_items').delete().eq('draft_id', draft.id);
      await supabase.from('cart_drafts').delete().eq('id', draft.id);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['communication-logs-demo'] });
      toast.success('Bestellung freigegeben! (Demo)');
      fetchDrafts();
      
      // Trigger particle animations
      onOrderCreated?.('gastro', 'supplier');
      onOrderCreated?.('gastro', 'email');
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast.error('Fehler beim Freigeben');
    }
  });

  // Reject draft - delete it
  const rejectDraft = useMutation({
    mutationFn: async (draftId: string) => {
      await supabase.from('cart_draft_items').delete().eq('draft_id', draftId);
      await supabase.from('cart_drafts').delete().eq('id', draftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      toast.success('Vorbestellung abgelehnt');
      fetchDrafts();
    },
    onError: (error) => {
      console.error('Reject error:', error);
      toast.error('Fehler beim Ablehnen');
    }
  });

  const pendingCount = drafts.length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tabs */}
      <Tabs defaultValue="drafts" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 mx-2 mt-2" style={{ width: 'calc(100% - 1rem)' }}>
          <TabsTrigger value="drafts" className="text-xs gap-1">
            <Clock className="h-3 w-3" />
            Vorbestellungen
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs gap-1">
            <ClipboardList className="h-3 w-3" />
            Bestellungen
            {ordersCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px]">
                {ordersCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {drafts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Keine Vorbestellungen</p>
                  <p className="text-xs mt-1">Warten auf EasyOrder...</p>
                </div>
              ) : (
                drafts.map(draft => {
                  const employeeName = draft.name.replace('EasyOrder: ', '').split(' (')[0];
                  const supplierName = draft.items[0]?.supplier?.name || 'Unbekannt';
                  const totalItems = draft.items.reduce((sum, item) => sum + item.quantity, 0);
                  const totalAmount = draft.items.reduce((sum, item) => 
                    sum + (item.article?.price || 0) * item.quantity, 0
                  );

                  return (
                    <div key={draft.id} className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-2.5 space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{employeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(draft.created_at), 'HH:mm', { locale: de })} • {supplierName}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          {totalItems}
                        </Badge>
                      </div>

                      {/* Items Preview */}
                      <div className="text-xs text-muted-foreground space-y-0.5 max-h-14 overflow-y-auto">
                        {draft.items.slice(0, 3).map(item => (
                          <div key={item.id} className="flex justify-between">
                            <span className="truncate">{item.quantity}x {item.article?.name || 'Unbekannt'}</span>
                            <span>€{((item.article?.price || 0) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {draft.items.length > 3 && (
                          <div className="text-muted-foreground/70">
                            +{draft.items.length - 3} weitere...
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between text-sm font-medium pt-1 border-t">
                        <span>Gesamt</span>
                        <span>€{totalAmount.toFixed(2)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => rejectDraft.mutate(draft.id)}
                          disabled={rejectDraft.isPending}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Ablehnen
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => approveDraft.mutate(draft)}
                          disabled={approveDraft.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Freigeben
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="orders" className="flex-1 overflow-hidden m-0">
          <LiveDemoOrdersList />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-2 border-t bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">EasyOrder Freigabe-Workflow</p>
      </div>
    </div>
  );
}
