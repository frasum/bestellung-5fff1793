import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseRpc = vi.fn();
const mockSupabaseFunctionsInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    rpc: (...args: unknown[]) => mockSupabaseRpc(...args),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
    functions: {
      invoke: (...args: unknown[]) => mockSupabaseFunctionsInvoke(...args),
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
import { useOrders, useUpdateOrderStatus, useUpdateOrderLocation, Order } from '@/hooks/useOrders';

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

const waitForQuerySuccess = async (result: { current: { isSuccess: boolean; isError: boolean } }) => {
  const maxAttempts = 50;
  for (let i = 0; i < maxAttempts; i++) {
    if (result.current.isSuccess || result.current.isError) break;
    await new Promise((r) => setTimeout(r, 10));
  }
};

const mockOrder: Order = {
  id: 'order-1',
  order_number: 'ORD-001',
  organization_id: 'org-456',
  supplier_id: 'sup-1',
  user_id: 'user-123',
  status: 'pending',
  total_amount: 100.50,
  notes: 'Test order',
  delivery_address: 'Test Address 123',
  email_sent: false,
  email_sent_at: null,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
  is_test_order: false,
  suppliers: { id: 'sup-1', name: 'Test Supplier', email: 'test@supplier.com' },
  order_items: [
    {
      id: 'item-1',
      order_id: 'order-1',
      article_id: 'art-1',
      article_name: 'Test Article',
      quantity: 5,
      unit: 'kg',
      unit_price: 20.10,
      total_price: 100.50,
      created_at: '2024-01-01T10:00:00Z',
    },
  ],
};

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when organizationId is null', async () => {
    const { result } = renderHook(() => useOrders(null, null), { wrapper: createWrapper() });

    // Should not be loading since query is disabled
    expect(result.current.isFetching).toBe(false);
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  it('should fetch orders when organizationId is provided', async () => {
    const eqMock = vi.fn().mockResolvedValue({ data: [mockOrder], error: null });
    const orderMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: orderMock,
      }),
    });

    const { result } = renderHook(() => useOrders(null, 'org-456'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual([mockOrder]);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('orders');
  });

  it('should filter by locationId when provided', async () => {
    const locationEqMock = vi.fn().mockResolvedValue({ data: [mockOrder], error: null });
    const orgEqMock = vi.fn().mockReturnValue({ eq: locationEqMock });
    const orderMock = vi.fn().mockReturnValue({ eq: orgEqMock });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: orderMock,
      }),
    });

    const { result } = renderHook(() => useOrders('loc-123', 'org-456'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(orgEqMock).toHaveBeenCalledWith('organization_id', 'org-456');
    expect(locationEqMock).toHaveBeenCalledWith('location_id', 'loc-123');
  });

  it('should include related data in select query', async () => {
    const selectMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: selectMock,
    });

    const { result } = renderHook(() => useOrders(null, 'org-456'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(selectMock).toHaveBeenCalledWith(
      '*, suppliers(id, name, email, customer_number), order_items(*), locations(id, name, short_code), employees(id, name)'
    );
  });

  it('should order by created_at descending', async () => {
    const orderMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: orderMock,
      }),
    });

    const { result } = renderHook(() => useOrders(null, 'org-456'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should handle Supabase error', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error', code: 'PGRST000' } 
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useOrders(null, 'org-456'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });
});

describe('useUpdateOrderStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update order status successfully', async () => {
    const selectMock = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { ...mockOrder, status: 'confirmed' }, error: null }),
    });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    mockSupabaseFrom.mockReturnValue({
      update: updateMock,
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ orderId: 'order-1', status: 'confirmed' });

    expect(updateMock).toHaveBeenCalledWith({ status: 'confirmed' });
    expect(eqMock).toHaveBeenCalledWith('id', 'order-1');
  });

  it('should handle update error', async () => {
    const selectMock = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Update failed' } 
      }),
    });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    
    mockSupabaseFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    });

    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync({ orderId: 'order-1', status: 'confirmed' }))
      .rejects.toEqual({ message: 'Update failed' });
  });
});

describe('useUpdateOrderLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update order location successfully', async () => {
    const selectMock = vi.fn().mockResolvedValue({ 
      data: [{ ...mockOrder, location_id: 'loc-new' }], 
      error: null 
    });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    mockSupabaseFrom.mockReturnValue({
      update: updateMock,
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateOrderLocation(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ orderId: 'order-1', locationId: 'loc-new' });

    expect(updateMock).toHaveBeenCalledWith({ location_id: 'loc-new' });
    expect(eqMock).toHaveBeenCalledWith('id', 'order-1');
  });

  it('should handle null location assignment', async () => {
    const selectMock = vi.fn().mockResolvedValue({ 
      data: [{ ...mockOrder, location_id: null }], 
      error: null 
    });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    mockSupabaseFrom.mockReturnValue({
      update: updateMock,
    });

    const { result } = renderHook(() => useUpdateOrderLocation(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ orderId: 'order-1', locationId: null });

    expect(updateMock).toHaveBeenCalledWith({ location_id: null });
  });

  it('should throw error when no permission', async () => {
    const selectMock = vi.fn().mockResolvedValue({ 
      data: [], // Empty array = no permission
      error: null 
    });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    
    mockSupabaseFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    });

    const { result } = renderHook(() => useUpdateOrderLocation(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync({ orderId: 'order-1', locationId: 'loc-new' }))
      .rejects.toThrow('Keine Berechtigung zum Aktualisieren dieser Bestellung');
  });
});
