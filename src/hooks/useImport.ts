import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useImportSuppliers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suppliers: Record<string, string>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const suppliersToInsert = suppliers.map(s => ({
        organization_id: profile.organization_id,
        name: s.name?.trim(),
        email: s.email?.trim(),
        phone: s.phone?.trim() || null,
        address: s.address?.trim() || null,
        contact_person: s.contact_person?.trim() || null,
        is_active: true,
      })).filter(s => s.name && s.email);

      if (suppliersToInsert.length === 0) {
        throw new Error('No valid suppliers to import');
      }

      const { error } = await supabase
        .from('suppliers')
        .insert(suppliersToInsert);

      if (error) throw error;
      return suppliersToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(`Successfully imported ${count} suppliers`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useImportArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articles, defaultSupplierId }: { articles: Record<string, string>[], defaultSupplierId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Get suppliers for mapping
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('organization_id', profile.organization_id);

      const supplierMap = new Map(suppliers?.map(s => [s.name.toLowerCase(), s.id]) || []);

      const articlesToInsert = articles.map(a => {
        // Try to find supplier by name, fall back to default supplier
        let supplierId = a.supplier ? supplierMap.get(a.supplier.toLowerCase().trim()) : undefined;
        
        // If no supplier found by name and we have a default, use it
        if (!supplierId && defaultSupplierId) {
          supplierId = defaultSupplierId;
        }
        
        if (!supplierId) return null;

        return {
          organization_id: profile.organization_id,
          supplier_id: supplierId,
          name: a.name?.trim(),
          description: a.description?.trim() || null,
          sku: a.sku?.trim() || null,
          unit: a.unit?.trim() || 'pcs',
          price: parseFloat(a.price?.replace(',', '.')) || 0,
          category: a.category?.trim() || null,
          is_active: true,
        };
      }).filter((a): a is NonNullable<typeof a> => a !== null && !!a.name && a.price > 0);

      if (articlesToInsert.length === 0) {
        throw new Error('No valid articles to import. Make sure to select a supplier or that supplier names match existing suppliers.');
      }

      const { error } = await supabase
        .from('articles')
        .insert(articlesToInsert);

      if (error) throw error;
      return articlesToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(`Successfully imported ${count} articles`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
