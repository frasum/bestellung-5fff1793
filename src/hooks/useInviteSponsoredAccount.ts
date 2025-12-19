import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SponsoredFeatures {
  suppliers: boolean;
  articles: boolean;
  orders: boolean;
  inventory: boolean;
  simple_order: boolean;
  b2b_portal: boolean;
  voice_order: boolean;
  wine_catalog: boolean;
  multi_location: boolean;
  supplier_portal: boolean;
  advanced_reports: boolean;
}

export const DEFAULT_SPONSORED_FEATURES: SponsoredFeatures = {
  suppliers: true,
  articles: true,
  orders: true,
  inventory: true,
  simple_order: false,
  b2b_portal: false,
  voice_order: false,
  wine_catalog: false,
  multi_location: false,
  supplier_portal: false,
  advanced_reports: false,
};

interface InviteParams {
  email: string;
  organizationName: string;
  sponsoredNote?: string;
  sponsoredFeatures: SponsoredFeatures;
}

export function useInviteSponsoredAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InviteParams) => {
      const { data, error } = await supabase.functions.invoke('invite-sponsored-account', {
        body: params
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsored-accounts'] });
      toast.success('Einladung erfolgreich versendet');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
      console.error('Invite error:', error);
    },
  });
}
