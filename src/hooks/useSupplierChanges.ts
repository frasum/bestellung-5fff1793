import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierArticleChange {
  id: string;
  supplier_id: string;
  organization_id: string;
  article_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface GroupedChange {
  articleId: string;
  articleName: string;
  supplierId: string;
  supplierName: string;
  changes: SupplierArticleChange[];
}

export const useSupplierPendingChanges = () => {
  return useQuery({
    queryKey: ['supplier-pending-changes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_article_changes')
        .select(`
          *,
          articles:article_id (name),
          suppliers:supplier_id (name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (SupplierArticleChange & { 
        articles: { name: string } | null; 
        suppliers: { name: string } | null;
      })[];
    },
  });
};

export const usePendingChangesCount = () => {
  return useQuery({
    queryKey: ['supplier-pending-changes-count'],
    queryFn: async () => {
      // Count pending article changes
      const { count: changesCount, error: changesError } = await supabase
        .from('supplier_article_changes')
        .select('supplier_id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (changesError) throw changesError;

      // Count pending suggested articles
      const { count: suggestionsCount, error: suggestionsError } = await supabase
        .from('suggested_articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (suggestionsError) throw suggestionsError;

      return (changesCount || 0) + (suggestionsCount || 0);
    },
  });
};

export const usePendingChangesBySupplier = (supplierId: string | null) => {
  return useQuery({
    queryKey: ['supplier-pending-changes', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('supplier_article_changes')
        .select(`
          *,
          articles:article_id (name, sku, unit, price, category, description)
        `)
        .eq('supplier_id', supplierId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (SupplierArticleChange & { 
        articles: { name: string; sku: string | null; unit: string; price: number; category: string | null; description: string | null } | null;
      })[];
    },
    enabled: !!supplierId,
  });
};

export const useApproveChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeId: string) => {
      // Get the change details
      const { data: change, error: fetchError } = await supabase
        .from('supplier_article_changes')
        .select('*')
        .eq('id', changeId)
        .single();

      if (fetchError || !change) throw new Error('Change not found');

      // Apply the change to the article - convert price to number
      let valueToUpdate: any = change.new_value;
      if (change.field_name === 'price' && change.new_value !== null) {
        valueToUpdate = parseFloat(change.new_value);
        
        // Save price history
        await supabase
          .from('article_price_history')
          .insert({
            article_id: change.article_id,
            organization_id: change.organization_id,
            old_price: parseFloat(change.old_value || '0'),
            new_price: valueToUpdate,
            change_source: 'supplier_portal',
          });
      }
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ [change.field_name]: valueToUpdate })
        .eq('id', change.article_id);

      if (updateError) throw updateError;

      // Mark change as approved
      const { error: approveError } = await supabase
        .from('supplier_article_changes')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', changeId);

      if (approveError) throw approveError;

      return change;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes-count'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast.success('Änderung übernommen');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};

export const useRejectChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeId: string) => {
      const { error } = await supabase
        .from('supplier_article_changes')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', changeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes-count'] });
      toast.success('Änderung abgelehnt');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};

export const useApproveAllChanges = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeIds: string[]) => {
      for (const changeId of changeIds) {
        // Get the change details
        const { data: change, error: fetchError } = await supabase
          .from('supplier_article_changes')
          .select('*')
          .eq('id', changeId)
          .single();

        if (fetchError || !change) continue;

        // Apply the change to the article - convert price to number
        let valueToUpdate: any = change.new_value;
        if (change.field_name === 'price' && change.new_value !== null) {
          valueToUpdate = parseFloat(change.new_value);
          
          // Save price history
          await supabase
            .from('article_price_history')
            .insert({
              article_id: change.article_id,
              organization_id: change.organization_id,
              old_price: parseFloat(change.old_value || '0'),
              new_price: valueToUpdate,
              change_source: 'supplier_portal',
            });
        }
        
        await supabase
          .from('articles')
          .update({ [change.field_name]: valueToUpdate })
          .eq('id', change.article_id);

        // Mark change as approved
        await supabase
          .from('supplier_article_changes')
          .update({ 
            status: 'approved', 
            reviewed_at: new Date().toISOString() 
          })
          .eq('id', changeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes-count'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast.success('Alle Änderungen übernommen');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};

export const useRejectAllChanges = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeIds: string[]) => {
      const { error } = await supabase
        .from('supplier_article_changes')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .in('id', changeIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-pending-changes-count'] });
      toast.success('Alle Änderungen abgelehnt');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};
