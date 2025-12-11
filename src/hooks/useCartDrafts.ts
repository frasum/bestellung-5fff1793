import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface CartDraft {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  notes: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  desired_delivery_date: string | null;
  desired_time_window: string | null;
  location_id: string | null;
  items?: CartDraftItem[];
}

export interface CartDraftItem {
  id: string;
  draft_id: string;
  article_id: string;
  quantity: number;
  created_at: string;
  article?: {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    sku: string | null;
    price: number;
    unit: string;
    category: string | null;
    top_category: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    supplier_id: string;
    suppliers?: {
      id: string;
      name: string;
      minimum_order_value: number | null;
    };
  };
}

export const useCartDrafts = (locationId?: string, showAllLocations?: boolean) => {
  return useQuery({
    queryKey: ['cart-drafts', showAllLocations ? 'all' : locationId],
    queryFn: async () => {
      let query = supabase
        .from('cart_drafts')
        .select(`
          *,
          items:cart_draft_items(
            *,
            article:articles(
              id,
              organization_id,
              name,
              description,
              sku,
              price,
              unit,
              category,
              top_category,
              is_active,
              created_at,
              updated_at,
              supplier_id,
              suppliers(id, name, minimum_order_value)
            )
          ),
          location:locations(id, name, short_code)
        `)
        .order('updated_at', { ascending: false });

      // Only apply location filter if not showing all locations
      if (!showAllLocations && locationId) {
        // Show drafts for this location OR drafts without location (backward compatibility)
        query = query.or(`location_id.eq.${locationId},location_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (CartDraft & { location?: { id: string; name: string; short_code: string | null } })[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCartDraft = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      name, 
      notes, 
      deliveryAddress, 
      items,
      locationId 
    }: { 
      name: string; 
      notes?: string; 
      deliveryAddress?: string;
      items: { articleId: string; quantity: number }[];
      locationId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('Organization not found');

      // Create draft
      const { data: draft, error: draftError } = await supabase
        .from('cart_drafts')
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          name,
          notes: notes || null,
          delivery_address: deliveryAddress || null,
          location_id: locationId || null,
        })
        .select()
        .single();

      if (draftError) throw draftError;

      // Create draft items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('cart_draft_items')
          .insert(
            items.map(item => ({
              draft_id: draft.id,
              article_id: item.articleId,
              quantity: item.quantity,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return draft;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      toast.success('Entwurf gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    },
  });
};

export const useUpdateCartDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      notes, 
      deliveryAddress, 
      items 
    }: { 
      id: string;
      name?: string; 
      notes?: string; 
      deliveryAddress?: string;
      items?: { articleId: string; quantity: number }[];
    }) => {
      // Update draft
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (notes !== undefined) updateData.notes = notes;
      if (deliveryAddress !== undefined) updateData.delivery_address = deliveryAddress;

      if (Object.keys(updateData).length > 0) {
        const { error: draftError } = await supabase
          .from('cart_drafts')
          .update(updateData)
          .eq('id', id);

        if (draftError) throw draftError;
      }

      // Update items if provided
      if (items !== undefined) {
        // Delete existing items
        await supabase
          .from('cart_draft_items')
          .delete()
          .eq('draft_id', id);

        // Insert new items
        if (items.length > 0) {
          const { error: itemsError } = await supabase
            .from('cart_draft_items')
            .insert(
              items.map(item => ({
                draft_id: id,
                article_id: item.articleId,
                quantity: item.quantity,
              }))
            );

          if (itemsError) throw itemsError;
        }
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      toast.success('Entwurf aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    },
  });
};

export const useDeleteCartDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cart_drafts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
      toast.success('Entwurf gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });
};
