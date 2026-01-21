import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock useOrganization hook
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ data: 'org-456' }),
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
import { useArticles, useArticlesBySupplier, Article } from '@/hooks/useArticles';

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

const mockArticle: Article = {
  id: 'art-1',
  organization_id: 'org-456',
  supplier_id: 'sup-1',
  name: 'Test Article',
  description: null,
  sku: 'SKU001',
  unit: 'kg',
  price: 10.5,
  category: 'Food',
  top_category: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  suppliers: { id: 'sup-1', name: 'Test Supplier', minimum_order_value: null },
};

describe('useArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch articles for organization', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockArticle], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useArticles(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual([mockArticle]);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('articles');
  });

  it('should include supplier relationship in query', async () => {
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: selectMock,
    });

    const { result } = renderHook(() => useArticles(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(selectMock).toHaveBeenCalledWith('*, suppliers(id, name, minimum_order_value)');
  });

  it('should order articles by name', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: orderMock,
        }),
      }),
    });

    const { result } = renderHook(() => useArticles(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(orderMock).toHaveBeenCalledWith('name');
  });

  it('should handle Supabase error', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Connection error', code: 'PGRST000' } 
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useArticles(), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
  });

  it('should call articles table', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    renderHook(() => useArticles(), { wrapper: createWrapper() });

    expect(mockSupabaseFrom).toHaveBeenCalledWith('articles');
  });
});

describe('useArticlesBySupplier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should filter by supplier_id when provided', async () => {
    const eqMock = vi.fn().mockImplementation((field: string) => {
      if (field === 'supplier_id') {
        return { data: [mockArticle], error: null };
      }
      return {
        eq: eqMock,
        order: vi.fn().mockResolvedValue({ data: [mockArticle], error: null }),
      };
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
      }),
    });

    const { result } = renderHook(() => useArticlesBySupplier('sup-1'), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);
    expect(result.current.isSuccess).toBe(true);
  });

  it('should only fetch active articles', async () => {
    const eqMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
      }),
    });

    const { result } = renderHook(() => useArticlesBySupplier(null), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(eqMock).toHaveBeenCalledWith('organization_id', 'org-456');
  });

  it('should fetch all articles when supplierId is null', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockArticle], error: null }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useArticlesBySupplier(null), { wrapper: createWrapper() });

    await waitForQuerySuccess(result);

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toBeDefined();
  });
});
