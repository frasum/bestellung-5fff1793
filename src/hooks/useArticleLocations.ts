import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ArticleLocation {
  id: string;
  article_id: string;
  location_id: string;
  is_active: boolean;
  custom_price: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch all article locations for an article
export const useArticleLocations = (articleId?: string) => {
  return useQuery({
    queryKey: ['article-locations', articleId],
    enabled: !!articleId,
    queryFn: async () => {
      let query = supabase.from('article_locations').select('*');
      
      if (articleId) {
        query = query.eq('article_id', articleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArticleLocation[];
    },
  });
};

// Fetch all article_locations for a specific location
export const useArticleLocationsByLocation = (locationId?: string) => {
  return useQuery({
    queryKey: ['article-locations-by-location', locationId],
    enabled: !!locationId,
    queryFn: async () => {
      if (!locationId) return [];
      const { data, error } = await supabase
        .from('article_locations')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true);


      if (error) throw error;
      return data as ArticleLocation[];
    },
  });
};

// Fetch all articles that are available at a specific location
export const useArticlesByLocation = (locationId?: string) => {
  return useQuery({
    queryKey: ['articles-by-location', locationId],
    enabled: !!locationId,
    queryFn: async () => {
      if (!locationId) return [];
      // Get article IDs for this location
      const { data: articleLocations, error: alError } = await supabase
        .from('article_locations')
        .select('article_id')
        .eq('location_id', locationId)
        .eq('is_active', true);


      if (alError) throw alError;

      if (!articleLocations || articleLocations.length === 0) {
        return [];
      }

      const articleIds = articleLocations.map(al => al.article_id);

      // Get the actual articles
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*, supplier:suppliers(id, name)')
        .in('id', articleIds)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return articles;
    },
  });
};

// Update article location assignments (add/remove locations for an article)
export const useUpdateArticleLocations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, locationIds }: { articleId: string; locationIds: string[] }) => {
      // Get current locations for this article
      const { data: existing, error: fetchError } = await supabase
        .from('article_locations')
        .select('location_id')
        .eq('article_id', articleId);

      if (fetchError) throw fetchError;

      const existingLocationIds = existing?.map(e => e.location_id) || [];
      const toAdd = locationIds.filter(id => !existingLocationIds.includes(id));
      const toRemove = existingLocationIds.filter(id => !locationIds.includes(id));

      // Delete removed locations
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('article_locations')
          .delete()
          .eq('article_id', articleId)
          .in('location_id', toRemove);

        if (deleteError) throw deleteError;
      }

      // Add new locations
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('article_locations')
          .insert(toAdd.map(locationId => ({
            article_id: articleId,
            location_id: locationId,
          })));

        if (insertError) throw insertError;
      }

      return { added: toAdd, removed: toRemove };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-locations'] });
      queryClient.invalidateQueries({ queryKey: ['article-locations-by-location'] });
      queryClient.invalidateQueries({ queryKey: ['articles-by-location'] });
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren der Standorte: ' + error.message);
    },
  });
};

// Create article locations when a new article is created
// If locationIds provided, use those; otherwise assign to all locations
export const useCreateArticleLocationsForNewArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, organizationId, locationIds }: { 
      articleId: string; 
      organizationId: string;
      locationIds?: string[];
    }) => {
      let targetLocationIds = locationIds;
      
      // If no specific locations provided, get all locations for this organization
      if (!targetLocationIds || targetLocationIds.length === 0) {
        const { data: locations, error: locError } = await supabase
          .from('locations')
          .select('id')
          .eq('organization_id', organizationId);

        if (locError) throw locError;
        if (!locations || locations.length === 0) return;
        
        targetLocationIds = locations.map(loc => loc.id);
      }

      if (!targetLocationIds || targetLocationIds.length === 0) return;

      // Insert article_locations for each selected location
      const { error: insertError } = await supabase
        .from('article_locations')
        .insert(targetLocationIds.map(locationId => ({
          article_id: articleId,
          location_id: locationId,
        })));

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-locations'] });
      queryClient.invalidateQueries({ queryKey: ['articles-by-location'] });
    },
  });
};
