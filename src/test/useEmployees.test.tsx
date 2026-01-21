import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock useOrganization hook
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ data: 'org-123' }),
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

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Import after mocks
import { useEmployees } from '@/hooks/useEmployees';

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

describe('useEmployees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch employees for organization', async () => {
    const mockEmployees = [
      { id: '1', name: 'Alice', organization_id: 'org-123', is_active: true },
      { id: '2', name: 'Bob', organization_id: 'org-123', is_active: true },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockEmployees, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useEmployees(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockEmployees);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('employees');
  });

  it('should order employees by name ascending', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      }),
    });

    const { result } = renderHook(() => useEmployees(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(orderMock).toHaveBeenCalledWith('name', { ascending: true });
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

    const { result } = renderHook(() => useEmployees(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
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

    const { result } = renderHook(() => useEmployees(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(eqMock).toHaveBeenCalledWith('organization_id', 'org-123');
  });

  it('should call employees table', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    renderHook(() => useEmployees(), { wrapper: createWrapper() });

    expect(mockSupabaseFrom).toHaveBeenCalledWith('employees');
  });
});
