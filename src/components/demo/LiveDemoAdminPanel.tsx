import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Clock, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
}

export function LiveDemoAdminPanel({ soundEnabled }: LiveDemoAdminPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<CartDraft[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchDrafts();
  }, []);

  // Realtime subscription for new drafts
  useEffect(() => {
    const channel = supabase
      .channel('admin-drafts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_drafts'
      }, (payload) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Approve draft - create real order
  const approveDraft = useMutation({
    mutationFn: async (draft: CartDraft) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get supplier from first item
      const supplierId = draft.items[0]?.supplier_id;
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

      // Delete draft items first, then draft
      await supabase.from('cart_draft_items').delete().eq('draft_id', draft.id);
      await supabase.from('cart_drafts').delete().eq('id', draft.id);

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      toast.success('Bestellung freigegeben!');
      fetchDrafts();
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
      {/* Header with count */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Vorbestellungen</span>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount} ausstehend
            </Badge>
          )}
        </div>
      </div>

      {/* Drafts List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Keine Vorbestellungen</p>
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
                <Card key={draft.id} className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                  <CardContent className="p-3 space-y-2">
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
                    <div className="text-xs text-muted-foreground space-y-0.5 max-h-16 overflow-y-auto">
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
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => rejectDraft.mutate(draft.id)}
                        disabled={rejectDraft.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Ablehnen
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => approveDraft.mutate(draft)}
                        disabled={approveDraft.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Freigeben
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          EasyOrder Freigabe-Workflow
        </p>
      </div>
    </div>
  );
}
