import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface RouteConfig {
  labelKey: string;
  parent: string | null;
  tabs?: Record<string, string>;
}

const routeConfig: Record<string, RouteConfig> = {
  '/suppliers': {
    labelKey: 'nav.catalog',
    parent: null,
    tabs: {
      suppliers: 'suppliers.title',
      articles: 'suppliers.articlesTab',
      wines: 'suppliers.winesTab',
      suggestions: 'suppliers.suggestionsTab',
    },
  },
  '/orders': {
    labelKey: 'nav.orders',
    parent: null,
    tabs: {
      orders: 'orders.allOrders',
      drafts: 'orders.drafts',
      'simple-order': 'orders.easyOrderTab',
    },
  },
  '/cart': {
    labelKey: 'cart.title',
    parent: null,
  },
  '/settings': {
    labelKey: 'nav.settings',
    parent: null,
    tabs: {
      profile: 'settings.profile',
      organization: 'settings.organization',
      communication: 'settings.communication',
      employees: 'settings.employees',
      locations: 'settings.locations',
      categories: 'settings.categories',
      units: 'settings.units',
      'order-units': 'settings.orderUnits',
      notifications: 'settings.notifications',
      'easy-order': 'settings.simpleOrder',
      'article-organization': 'settings.articleOrganization',
      team: 'settings.team',
      'price-watch': 'settings.priceWatch',
      'demo-accounts': 'settings.demoAccounts',
      'b2b-portal': 'settings.b2bPortal',
      'developer-checklist': 'settings.developerChecklist',
      'friends-family': 'settings.friendsAndFamily',
    },
  },
  '/reports': {
    labelKey: 'nav.reports',
    parent: null,
    tabs: {
      overview: 'reports.overview',
      inventur: 'reports.inventory',
      pricewatch: 'reports.priceWatch',
    },
  },
};

interface PageHeaderProps {
  title: string;
  description?: string;
  activeTab?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  activeTab,
  sidebarCollapsed,
  onToggleSidebar,
  children,
}: PageHeaderProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const currentPath = location.pathname;

  const config = routeConfig[currentPath];

  // Build breadcrumb path
  const buildBreadcrumbs = () => {
    const crumbs: { label: string; path: string | null }[] = [];

    // Add parent (Dashboard/Reports)
    if (config?.parent) {
      const parentConfig = routeConfig[config.parent];
      if (parentConfig) {
        crumbs.push({
          label: t(parentConfig.labelKey),
          path: config.parent,
        });
      }
    }

    // Add current page
    if (config) {
      crumbs.push({
        label: t(config.labelKey),
        path: activeTab ? currentPath : null,
      });
    }

    // Add active tab if present
    if (activeTab && config?.tabs && config.tabs[activeTab]) {
      crumbs.push({
        label: t(config.tabs[activeTab]),
        path: null,
      });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="space-y-1 mb-4 md:mb-6">
      {/* Breadcrumb row with sidebar toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden xl:flex h-8 w-8 shrink-0"
          title={sidebarCollapsed ? t('common.showSidebar') : t('common.hideSidebar')}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>

        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {crumb.path ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/* Title and description row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
