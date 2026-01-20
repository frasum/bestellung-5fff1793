import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
// Timeout in milliseconds for stuck invoices (10 minutes)
const INVOICE_PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

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
  analysis_started_at?: string | null;
  analysis_updated_at?: string | null;
  suppliers?: { name: string } | null;
  orders?: { order_number: string } | null;
  invoice_items?: InvoiceItem[];
  invoice_discrepancies?: InvoiceDiscrepancy[];
}

// Helper to check if an invoice is stuck in processing
export function isInvoiceStuck(invoice: Invoice): boolean {
  if (invoice.status !== 'processing') return false;
  
  const updatedAt = new Date(invoice.updated_at).getTime();
  const now = Date.now();
  
  return (now - updatedAt) > INVOICE_PROCESSING_TIMEOUT_MS;
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
        message: string;
        foundPdfs: number;
        skipped: number;
        processing: boolean;
        statusId?: string;
      };
    },
    onSuccess: (data) => {
      // Only show toast for immediate feedback - progress is handled by useInvoiceProcessingStatus
      if (!data.processing) {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        toast({
          title: 'E-Mails geprüft',
          description: data.message,
        });
      }
      // If processing=true, the useInvoiceProcessingStatus hook will handle updates
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

// Real-time progress tracking for background invoice processing
export interface InvoiceProcessingStatus {
  id: string;
  organization_id: string;
  total_pdfs: number;
  processed_pdfs: number;
  new_invoices: number;
  skipped_duplicates: number;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export function useInvoiceProcessingStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<InvoiceProcessingStatus | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('invoice-processing-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_processing_status',
        },
        (payload) => {
          // Invoice processing status realtime update received
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const status = payload.new as InvoiceProcessingStatus;
            setCurrentStatus(status);
            
            // Show toast notifications based on status
            if (status.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              toast({
                title: 'Rechnungsimport abgeschlossen',
                description: `${status.new_invoices} neue Rechnung(en) importiert`,
              });
              // Clear status after showing completion
              setTimeout(() => setCurrentStatus(null), 5000);
            } else if (status.status === 'failed') {
              toast({
                title: 'Fehler beim Rechnungsimport',
                description: status.error_message || 'Unbekannter Fehler',
                variant: 'destructive',
              });
              // Clear status after showing error
              setTimeout(() => setCurrentStatus(null), 5000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast]);

  // Check for any active processing on mount
  useEffect(() => {
    if (!user) return;

    const checkActiveProcessing = async () => {
      const { data } = await supabase
        .from('invoice_processing_status')
        .select('*')
        .eq('status', 'processing')
        .order('started_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setCurrentStatus(data[0] as InvoiceProcessingStatus);
      }
    };

    checkActiveProcessing();
  }, [user]);

  const clearStatus = useCallback(() => {
    setCurrentStatus(null);
  }, []);

  return {
    status: currentStatus,
    isProcessing: currentStatus?.status === 'processing',
    progress: currentStatus 
      ? Math.round((currentStatus.processed_pdfs / currentStatus.total_pdfs) * 100)
      : 0,
    clearStatus,
  };
}

export function useReanalyzeInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // First reset the invoice status to pending to allow re-analysis
      await supabase
        .from('invoices')
        .update({ 
          status: 'pending',
          analysis_error: null,
          analysis_started_at: null,
          analysis_updated_at: null,
        })
        .eq('id', invoiceId);
      
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

// Hook to reset stuck invoices
export function useResetStuckInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'pending',
          analysis_error: null,
          analysis_started_at: null,
          analysis_updated_at: null,
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Rechnung zurückgesetzt',
        description: 'Die Rechnung kann jetzt erneut analysiert werden.',
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

export function useCreateArticlesFromInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, supplierId }: { invoiceId: string; supplierId: string }) => {
      // Fetch invoice items
      const { data: invoiceItems, error: fetchError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (fetchError) throw fetchError;
      if (!invoiceItems || invoiceItems.length === 0) {
        throw new Error('Keine Rechnungspositionen gefunden');
      }

      // Get organization ID
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Keine Organisation gefunden');
      }

      // Get existing articles for this supplier to avoid duplicates
      const { data: existingArticles } = await supabase
        .from('articles')
        .select('name, sku')
        .eq('supplier_id', supplierId);

      const existingNames = new Set(existingArticles?.map(a => a.name.toLowerCase()) || []);
      const existingSkus = new Set(existingArticles?.filter(a => a.sku).map(a => a.sku?.toLowerCase()) || []);

      // Filter out items that already exist
      const newItems = invoiceItems.filter(item => {
        const nameExists = existingNames.has(item.article_name.toLowerCase());
        const skuExists = item.article_sku && existingSkus.has(item.article_sku.toLowerCase());
        return !nameExists && !skuExists;
      });

      if (newItems.length === 0) {
        return { created: 0, skipped: invoiceItems.length };
      }

      // Create new articles
      const articlesToCreate = newItems.map(item => ({
        organization_id: profile.organization_id,
        supplier_id: supplierId,
        name: item.article_name,
        sku: item.article_sku,
        price: item.unit_price || 0,
        unit: item.unit || 'Stk',
        is_active: true,
      }));

      const { data: createdArticles, error: createError } = await supabase
        .from('articles')
        .insert(articlesToCreate)
        .select();

      if (createError) throw createError;

      // Link invoice items to newly created articles
      for (const created of createdArticles || []) {
        const matchingItem = newItems.find(
          item => item.article_name === created.name && 
                  (item.article_sku === created.sku || (!item.article_sku && !created.sku))
        );
        
        if (matchingItem) {
          await supabase
            .from('invoice_items')
            .update({ matched_article_id: created.id })
            .eq('id', matchingItem.id);
        }
      }

      return { 
        created: createdArticles?.length || 0, 
        skipped: invoiceItems.length - newItems.length 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast({
        title: 'Artikel übernommen',
        description: `${data.created} neue Artikel erstellt${data.skipped > 0 ? `, ${data.skipped} bereits vorhanden` : ''}`,
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

export function useDeleteInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: { id: string; pdf_url: string | null }) => {
      // 1. Delete related discrepancies first (foreign key constraint)
      const { error: discrepancyError } = await supabase
        .from('invoice_discrepancies')
        .delete()
        .eq('invoice_id', invoice.id);

      if (discrepancyError) {
        console.warn('Error deleting discrepancies:', discrepancyError);
      }

      // 2. Delete related invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      if (itemsError) {
        console.warn('Error deleting invoice items:', itemsError);
      }

      // 3. Delete PDF from storage if exists
      if (invoice.pdf_url) {
        // URL format: .../storage/v1/object/public/invoices/{org_id}/{filename}
        const urlParts = invoice.pdf_url.split('/storage/v1/object/public/invoices/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1]; // e.g. "org-id/1234567890-rechnung.pdf"
          const { error: storageError } = await supabase.storage
            .from('invoices')
            .remove([filePath]);

          if (storageError) {
            console.warn('PDF could not be deleted from storage:', storageError);
            // Don't throw - we still want to delete the invoice record
          }
        }
      }

      // 4. Delete the invoice record itself
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Rechnung gelöscht',
        description: 'Die Rechnung und die zugehörige PDF wurden entfernt.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler beim Löschen',
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
