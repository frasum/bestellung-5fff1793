import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock useOrganization hook
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ data: 'org-123', isLoading: false }),
}));

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

// Mock supabaseHelpers
vi.mock('@/lib/supabaseHelpers', () => ({
  requireOrganizationId: vi.fn().mockResolvedValue('org-123'),
}));

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { useSuppliers, useSuppliersByLocation, Supplier } from '@/hooks/useSuppliers';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Helper to wait for async state updates
const waitForQuerySuccess = async (result: { current: { isSuccess: boolean; isError: boolean } }) => {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    if (result.current.isSuccess || result.current.isError) break;
    await new Promise((r) => setTimeout(r, 10));
  }
};

const mockSupplier: Supplier = {
  id: 'sup-1',
  organization_id: 'org-123',
  name: 'Test Supplier',
  email: 'test@supplier.com',
  phone: '+49123456789',
  address: 'Test Address 1',
  contact_person: 'John Doe',
  customer_number: 'CUST001',
  minimum_order_value: 50,
  order_delivery_method: 'email',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('useSuppliers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch suppliers for organization', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockSupplier], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual([mockSupplier]);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('suppliers');
  });

  it('should order suppliers by name', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      }),
    });

    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(orderMock).toHaveBeenCalledWith('name');
  });

  it('should filter by organization_id', async () => {
    const eqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
      }),
    });

    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(eqMock).toHaveBeenCalledWith('organization_id', 'org-123');
  });

  it('should handle Supabase error', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error', code: 'PGRST000' } 
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  it('should deduplicate suppliers by ID', async () => {
    const duplicateData = [mockSupplier, mockSupplier, { ...mockSupplier, id: 'sup-2', name: 'Second Supplier' }];
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: duplicateData, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.map(s => s.id)).toEqual(['sup-1', 'sup-2']);
  });

  it('should return empty array when no organization', async () => {
    // Override the organization mock for this test
    vi.doMock('@/hooks/useOrganization', () => ({
      useOrganization: () => ({ data: null, isLoading: false }),
    }));

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockSupplier], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    // Query should not be enabled without organization
    expect(result.current.data).toBeUndefined();
  });
});

describe('useSuppliersByLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch suppliers for a specific location', async () => {
    // First call: get all suppliers
    // Second call: get location assignments
    // Third call: get all assignments
    const mockCalls: Record<string, unknown> = {};
    
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'suppliers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((field: string) => {
              if (field === 'organization_id') {
                return {
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ 
                      data: [mockSupplier], 
                      error: null 
                    }),
                  }),
                };
              }
              return { order: vi.fn().mockResolvedValue({ data: [mockSupplier], error: null }) };
            }),
          }),
        };
      }
      if (table === 'supplier_locations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((field: string, value: string) => {
              if (field === 'location_id') {
                return {
                  eq: vi.fn().mockResolvedValue({ 
                    data: [{ supplier_id: 'sup-1' }], 
                    error: null 
                  }),
                };
              }
              return {
                in: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ 
                    data: [{ supplier_id: 'sup-1' }], 
                    error: null 
                  }),
                }),
              };
            }),
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ 
                data: [{ supplier_id: 'sup-1' }], 
                error: null 
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    const { result } = renderHook(() => useSuppliersByLocation('loc-1'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('suppliers');
  });

  it('should not fetch when locationId is undefined', async () => {
    const { result } = renderHook(() => useSuppliersByLocation(undefined), { wrapper: createWrapper() });

    // Query should not be enabled without locationId
    expect(result.current.isFetching).toBe(false);
  });
});
