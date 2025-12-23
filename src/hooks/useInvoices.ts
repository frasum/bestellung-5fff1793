import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  organization_id: string;
  supplier_id: string | null;
  matched_order_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  delivery_date: string | null;
  due_date: string | null;
  net_amount: number | null;
  vat_amount: number | null;
  gross_amount: number | null;
  currency: string;
  pdf_url: string | null;
  status: 'pending' | 'processing' | 'matched' | 'discrepancy' | 'approved' | 'rejected';
  notes: string | null;
  parsed_data: any;
  created_at: string;
  updated_at: string;
  suppliers?: { name: string } | null;
  orders?: { order_number: string } | null;
  invoice_items?: InvoiceItem[];
  invoice_discrepancies?: InvoiceDiscrepancy[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  matched_order_item_id: string | null;
  matched_article_id: string | null;
  position_number: number | null;
  article_name: string;
  article_sku: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  created_at: string;
}

export interface InvoiceDiscrepancy {
  id: string;
  invoice_id: string;
  invoice_item_id: string | null;
  order_item_id: string | null;
  discrepancy_type: 'price_increase' | 'price_decrease' | 'quantity_mismatch' | 'missing_item' | 'extra_item' | 'other';
  expected_value: string | null;
  actual_value: string | null;
  difference_amount: number | null;
  difference_percent: number | null;
  is_resolved: boolean;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useInvoices() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          suppliers (name),
          orders (order_number),
          invoice_items (*),
          invoice_discrepancies (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!user,
    // Auto-refresh every 5 seconds if any invoice is still processing
    refetchInterval: (query) => {
      const data = query.state.data as Invoice[] | undefined;
      const hasProcessing = data?.some(inv => inv.status === 'processing');
      return hasProcessing ? 5000 : false;
    },
  });
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          suppliers (name),
          orders (order_number, order_items(*)),
          invoice_items (*),
          invoice_discrepancies (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!invoiceId,
  });
}

export function useUploadInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      // Get organization ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      // Upload PDF to storage
      const fileName = `${profile.organization_id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      // Create invoice record
      const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          organization_id: profile.organization_id,
          pdf_url: publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Convert file to base64 for AI parsing
      const base64 = await fileToBase64(file);

      // Trigger parsing
      const { data: { session } } = await supabase.auth.getSession();
      const parseResponse = await supabase.functions.invoke('parse-invoice', {
        body: {
          invoiceId: invoice.id,
          pdfUrl: publicUrl,
          pdfBase64: base64,
        },
      });

      if (parseResponse.error) {
        console.error('Parse error:', parseResponse.error);
        throw new Error('Failed to parse invoice');
      }

      return parseResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Rechnung hochgeladen',
        description: 'Die Rechnung wird analysiert...',
      });
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      // Also invalidate queries on error to refresh status
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Fehler beim Hochladen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, status, notes }: { 
      invoiceId: string; 
      status: Invoice['status'];
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status, notes })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Status aktualisiert',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useResolveDiscrepancy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ discrepancyId, notes }: { discrepancyId: string; notes?: string }) => {
      const { error } = await supabase
        .from('invoice_discrepancies')
        .update({
          is_resolved: true,
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', discrepancyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}

export function useCheckInvoiceEmails() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-invoice-emails');

      if (error) throw error;
      return data as {
        success: boolean;
        newInvoices: number;
        skipped: number;
        errors: number;
        message: string;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: data.newInvoices > 0 ? 'Neue Rechnungen gefunden' : 'E-Mails geprüft',
        description: data.message,
      });
    },
    onError: (error: Error) => {
      console.error('Email check error:', error);
      toast({
        title: 'Fehler beim E-Mail-Abruf',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useReanalyzeInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('parse-invoice', {
        body: { invoiceId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({
        title: 'Analyse gestartet',
        description: 'Die Rechnung wird erneut analysiert...',
      });
    },
    onError: (error: Error) => {
      console.error('Reanalyze error:', error);
      toast({
        title: 'Analyse fehlgeschlagen',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
  });
}
