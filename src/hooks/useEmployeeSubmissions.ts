import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
export interface EmployeeOrderItem {
  id: string;
  submission_id: string;
  recognized_text: string | null;
  article_id: string | null;
  quantity: number;
  confidence: number | null;
  admin_corrected: boolean;
  article?: {
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    price: number;
    supplier_id: string;
  };
}

export interface EmployeeOrderSubmission {
  id: string;
  organization_id: string;
  location_id: string | null;
  submitted_by: string;
  submission_type: 'photo' | 'voice' | 'manual' | 'simple';
  source_data: Record<string, unknown>;
  transcription: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  items?: EmployeeOrderItem[];
  submitter?: {
    full_name: string | null;
    email: string;
  };
}

export function useEmployeeSubmissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_order_submissions' as any)
        .select(`
          *,
          items:employee_order_items(
            *,
            article:articles(id, name, sku, unit, price, supplier_id)
          ),
          submitter:profiles!submitted_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as EmployeeOrderSubmission[];
    },
    enabled: !!user,
  });
}

export function usePendingSubmissionsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['employee-submissions-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employee_order_submissions' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useMySubmissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_order_submissions' as any)
        .select(`
          *,
          items:employee_order_items(
            *,
            article:articles(id, name, sku, unit, price, supplier_id)
          )
        `)
        .eq('submitted_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as EmployeeOrderSubmission[];
    },
    enabled: !!user,
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeLocation } = useLocationContext();

  return useMutation({
    mutationFn: async (data: {
      submission_type: 'photo' | 'voice' | 'manual';
      source_data?: Record<string, unknown>;
      transcription?: string;
      items: Array<{
        recognized_text?: string;
        article_id: string | null;
        quantity: number;
        confidence?: number;
      }>;
    }) => {
      // Get organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      // Create submission - cast to any to handle new table not yet in types
      const { data: submission, error: submissionError } = await supabase
        .from('employee_order_submissions' as any)
        .insert({
          organization_id: profile.organization_id,
          location_id: activeLocation?.id || null,
          submitted_by: user?.id,
          submission_type: data.submission_type,
          source_data: data.source_data || {},
          transcription: data.transcription || null,
        } as any)
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Create items
      if (data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('employee_order_items' as any)
          .insert(
            data.items.map(item => ({
              submission_id: (submission as any).id,
              recognized_text: item.recognized_text || null,
              article_id: item.article_id,
              quantity: item.quantity,
              confidence: item.confidence || null,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-submissions-pending-count'] });
    },
  });
}

export function useApproveSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase
        .from('employee_order_submissions' as any)
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-submissions-pending-count'] });
    },
  });
}

export function useRejectSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ submissionId, notes }: { submissionId: string; notes?: string }) => {
      const { error } = await supabase
        .from('employee_order_submissions' as any)
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-submissions-pending-count'] });
    },
  });
}

export function useUpdateSubmissionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, article_id, quantity }: { 
      itemId: string; 
      article_id: string | null; 
      quantity: number;
    }) => {
      const { error } = await supabase
        .from('employee_order_items' as any)
        .update({
          article_id,
          quantity,
          admin_corrected: true,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-submissions'] });
    },
  });
}
