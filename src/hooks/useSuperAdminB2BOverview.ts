import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface B2BAccountOverview {
  id: string;
  company_name: string;
  subdomain: string;
  email: string;
  created_at: string;
  is_active: boolean;
  suppliers: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
  supplier_users: {
    id: string;
    email: string;
    role: string;
    supplier_id: string;
    created_at: string;
  }[];
}

export function useB2BAccountsOverview() {
  return useQuery({
    queryKey: ['super-admin', 'b2b-accounts-overview'],
    queryFn: async () => {
      // Fetch accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('supplier_b2b_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;
      if (!accounts) return [];

      // Fetch suppliers for each account
      const { data: suppliers, error: suppliersError } = await supabase
        .from('b2b_suppliers')
        .select('id, name, is_active, account_id')
        .order('name');

      if (suppliersError) throw suppliersError;

      // Fetch supplier users
      const { data: supplierUsers, error: usersError } = await supabase
        .from('b2b_supplier_users')
        .select('id, email, role, supplier_id, account_id, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Combine data
      const result: B2BAccountOverview[] = accounts.map(account => ({
        id: account.id,
        company_name: account.company_name,
        subdomain: account.subdomain,
        email: account.email,
        created_at: account.created_at,
        is_active: account.is_active ?? true,
        suppliers: (suppliers || [])
          .filter(s => s.account_id === account.id)
          .map(s => ({ id: s.id, name: s.name, is_active: s.is_active ?? true })),
        supplier_users: (supplierUsers || []).filter(u => u.account_id === account.id),
      }));

      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useB2BStats() {
  const { data: accounts } = useB2BAccountsOverview();

  if (!accounts) {
    return {
      totalAccounts: 0,
      totalSuppliers: 0,
      totalUsers: 0,
      activeSuppliers: 0,
    };
  }

  const totalSuppliers = accounts.reduce((sum, acc) => sum + acc.suppliers.length, 0);
  const activeSuppliers = accounts.reduce(
    (sum, acc) => sum + acc.suppliers.filter(s => s.is_active).length, 
    0
  );
  const totalUsers = accounts.reduce((sum, acc) => sum + acc.supplier_users.length, 0);

  return {
    totalAccounts: accounts.length,
    totalSuppliers,
    totalUsers,
    activeSuppliers,
  };
}
