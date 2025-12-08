import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SupplierRevenue {
  id: string;
  name: string;
  totalRevenue: number;
  articleCount: number;
  articlesWithValue: number;
}

export const useSupplierAnnualRevenue = () => {
  return useQuery({
    queryKey: ['supplier-annual-revenue'],
    queryFn: async () => {
      const { data: articles, error } = await supabase
        .from('articles')
        .select('supplier_id, annual_order_value, suppliers(id, name)')
        .eq('is_active', true);

      if (error) throw error;

      // Aggregate per supplier
      const supplierTotals: Record<string, SupplierRevenue> = {};
      
      articles?.forEach((article) => {
        const supplierId = article.supplier_id;
        const supplierData = article.suppliers as { id: string; name: string } | null;
        
        if (!supplierTotals[supplierId]) {
          supplierTotals[supplierId] = {
            id: supplierId,
            name: supplierData?.name || 'Unbekannt',
            totalRevenue: 0,
            articleCount: 0,
            articlesWithValue: 0,
          };
        }
        
        supplierTotals[supplierId].articleCount++;
        
        if (article.annual_order_value !== null && article.annual_order_value !== undefined) {
          supplierTotals[supplierId].totalRevenue += Number(article.annual_order_value);
          supplierTotals[supplierId].articlesWithValue++;
        }
      });

      const suppliers = Object.values(supplierTotals).sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      const totalRevenue = suppliers.reduce((sum, s) => sum + s.totalRevenue, 0);
      const totalArticles = suppliers.reduce((sum, s) => sum + s.articleCount, 0);
      const totalWithValue = suppliers.reduce((sum, s) => sum + s.articlesWithValue, 0);

      return {
        suppliers,
        totalRevenue,
        totalArticles,
        totalWithValue,
        completeness: totalArticles > 0 ? (totalWithValue / totalArticles) * 100 : 0,
      };
    },
  });
};
