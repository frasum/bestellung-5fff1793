import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PortalColumnKey = 'image' | 'name' | 'sku' | 'description' | 'unit' | 'packaging_unit' | 'price' | 'annual_order_value' | 'reference_price' | 'reference_unit';

export const PORTAL_COLUMN_OPTIONS: { key: PortalColumnKey; label: string }[] = [
  { key: 'image', label: 'Produktfoto' },
  { key: 'name', label: 'Artikelname' },
  { key: 'sku', label: 'SKU (Artikelnummer)' },
  { key: 'description', label: 'Beschreibung' },
  { key: 'unit', label: 'Einheit' },
  { key: 'packaging_unit', label: 'BE (Bestelleinheit)' },
  { key: 'price', label: 'Preis (€)' },
  { key: 'annual_order_value', label: 'Bestellwert (365T)' },
  { key: 'reference_price', label: 'Referenzpreis (€)' },
  { key: 'reference_unit', label: 'Referenzeinheit' },
];

export const DEFAULT_VISIBLE_COLUMNS: PortalColumnKey[] = ['image', 'name', 'sku', 'description', 'unit', 'packaging_unit', 'price', 'annual_order_value'];

export interface SupplierPortalSettings {
  id: string;
  organization_id: string;
  portal_title: string;
  welcome_message: string | null;
  card_title: string;
  card_description: string;
  info_text: string | null;
  footer_text: string | null;
  logo_url: string | null;
  visible_columns: PortalColumnKey[] | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PORTAL_SETTINGS: Omit<SupplierPortalSettings, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
  portal_title: 'Lieferantenportal',
  welcome_message: null,
  card_title: 'Meine Artikel',
  card_description: 'Änderungen werden zur Genehmigung eingereicht.',
  info_text: null,
  footer_text: null,
  logo_url: null,
  visible_columns: DEFAULT_VISIBLE_COLUMNS,
};

export const useSupplierPortalSettings = () => {
  return useQuery({
    queryKey: ['supplier-portal-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_portal_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as SupplierPortalSettings | null;
    },
  });
};

export const useUpsertSupplierPortalSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<Omit<SupplierPortalSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      // Get user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.organization_id) throw new Error('No organization found');
      
      // Check if settings already exist
      const { data: existing } = await supabase
        .from('supplier_portal_settings')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();
      
      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('supplier_portal_settings')
          .update(settings)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('supplier_portal_settings')
          .insert({
            ...DEFAULT_PORTAL_SETTINGS,
            ...settings,
            organization_id: profile.organization_id,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-portal-settings'] });
      toast.success('Portal-Einstellungen gespeichert');
    },
    onError: (error: any) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    },
  });
};
