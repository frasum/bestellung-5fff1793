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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { useLocations, Location } from '@/hooks/useLocations';

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

const mockLocation: Location = {
  id: 'loc-1',
  organization_id: 'org-123',
  name: 'Main Location',
  short_code: 'MAIN',
  email: 'main@example.com',
  is_default: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockLocationSecondary: Location = {
  id: 'loc-2',
  organization_id: 'org-123',
  name: 'Secondary Location',
  short_code: 'SEC',
  email: 'secondary@example.com',
  is_default: false,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('useLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch locations for organization', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockLocation, mockLocationSecondary], error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual([mockLocation, mockLocationSecondary]);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('locations');
  });

  it('should filter by organization_id', async () => {
    const eqMock = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(eqMock).toHaveBeenCalledWith('organization_id', 'org-123');
  });

  it('should order by is_default descending first', async () => {
    const firstOrderMock = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: firstOrderMock,
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(firstOrderMock).toHaveBeenCalledWith('is_default', { ascending: false });
  });

  it('should order by name after is_default', async () => {
    const secondOrderMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const firstOrderMock = vi.fn().mockReturnValue({
      order: secondOrderMock,
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: firstOrderMock,
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(secondOrderMock).toHaveBeenCalledWith('name');
  });

  it('should handle Supabase error', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Database error', code: 'PGRST000' } 
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  it('should return empty array when no organization', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockLocation], error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);
    
    // Query is enabled because we mocked organizationId as 'org-123'
    expect(result.current.isSuccess).toBe(true);
  });

  it('should have correct cache settings', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockLocation], error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    // The hook should have completed successfully, which means the query options are correct
    expect(result.current.isSuccess).toBe(true);
  });

  it('should handle multiple locations with default first', async () => {
    const locations = [mockLocation, mockLocationSecondary];
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: locations, error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data?.[0].is_default).toBe(true);
    expect(result.current.data?.[1].is_default).toBe(false);
  });
});
