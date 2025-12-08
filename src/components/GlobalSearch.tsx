import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useArticles } from '@/hooks/useArticles';
import { useOrders } from '@/hooks/useOrders';
import { useRecentlyActiveSuppliers } from '@/hooks/useSupplierChanges';
import {
  Users,
  Package,
  ShoppingCart,
  LayoutDashboard,
  Settings,
  FileText,
  BarChart3,
  ClipboardList,
  Search,
} from 'lucide-react';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const suppliersQuery = useSuppliers();
  const articlesQuery = useArticles();
  const ordersQuery = useOrders();
  const { data: recentlyActiveSuppliers } = useRecentlyActiveSuppliers();
  
  const suppliers = suppliersQuery.data;
  const articles = articlesQuery.data;
  const orders = ordersQuery.data;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const pages = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.suppliers'), href: '/suppliers', icon: Users },
    { name: t('nav.articles'), href: '/articles', icon: Package },
    { name: t('nav.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('nav.drafts'), href: '/drafts', icon: FileText },
    { name: t('nav.inventory'), href: '/inventory', icon: ClipboardList },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>{t('common.search')}...</span>
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={`${t('common.search')}...`} />
        <CommandList>
          <CommandEmpty>{t('common.noResults')}</CommandEmpty>

          <CommandGroup heading={t('nav.pages') || 'Seiten'}>
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                value={page.name}
                onSelect={() => runCommand(() => navigate(page.href))}
              >
                <page.icon className="mr-2 h-4 w-4" />
                {page.name}
              </CommandItem>
            ))}
          </CommandGroup>

          {suppliers && suppliers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('nav.suppliers')}>
                {suppliers.slice(0, 5).map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={`supplier ${supplier.name}`}
                    onSelect={() => runCommand(() => navigate('/suppliers'))}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {supplier.name}
                    {recentlyActiveSuppliers?.has(supplier.id) && (
                      <span 
                        className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2 shrink-0" 
                        title="Kürzlich aktiv - Änderungen eingereicht in den letzten 4 Monaten"
                      />
                    )}
                    {supplier.main_category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {supplier.main_category}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {articles && articles.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('nav.articles')}>
                {articles.slice(0, 5).map((article) => (
                  <CommandItem
                    key={article.id}
                    value={`article ${article.name} ${article.sku || ''}`}
                    onSelect={() => runCommand(() => navigate('/articles'))}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {article.name}
                    {article.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {article.sku}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {orders && orders.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t('nav.orders')}>
                {orders.slice(0, 5).map((order) => (
                  <CommandItem
                    key={order.id}
                    value={`order ${order.order_number}`}
                    onSelect={() => runCommand(() => navigate('/orders'))}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {order.order_number}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
