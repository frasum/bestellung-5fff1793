import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import sidebarToggleIcon from '@/assets/sidebar-toggle-icon.png';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface SubTabConfig {
  [key: string]: string; // subtab key -> translation key
}

interface TabConfig {
  labelKey: string;
  subTabs?: SubTabConfig;
}

interface RouteConfig {
  labelKey: string;
  parent: string | null;
  tabs?: Record<string, TabConfig | string>; // string for backward compat (no subtabs)
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
      organization: {
        labelKey: 'settings.organization',
        subTabs: {
          general: 'settings.general',
          team: 'settings.team',
          locations: 'locations.title',
          'units-categories': 'settings.unitsAndCategories',
        },
      },
      communication: {
        labelKey: 'settings.communication',
        subTabs: {
          notifications: 'settings.notifications',
          'email-templates': 'settings.emailTemplates',
          'supplier-portal': 'settings.supplierPortal',
        },
      },
      'demo-accounts': 'settings.demoAccounts',
      'b2b-portal': 'settings.b2bPortal',
      'friends-family': 'settings.friendsAndFamily',
      'price-watch': 'settings.priceWatch',
      'developer-checklist': 'settings.developerChecklist',
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

// Default sub-tabs (same as Settings.tsx)
const DEFAULT_SUB_TABS: Record<string, string> = {
  organization: 'general',
  communication: 'notifications',
};

interface PageHeaderProps {
  title?: string;
  description?: string;
  activeTab?: string;
  activeSubTab?: string | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  activeTab,
  activeSubTab,
  sidebarCollapsed,
  onToggleSidebar,
  children,
}: PageHeaderProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const currentPath = location.pathname;

  const config = routeConfig[currentPath];

  // Build breadcrumb path with up to 3 levels
  const buildBreadcrumbs = () => {
    const crumbs: { label: string; path: string | null }[] = [];

    // Add parent if exists
    if (config?.parent) {
      const parentConfig = routeConfig[config.parent];
      if (parentConfig) {
        crumbs.push({
          label: t(parentConfig.labelKey),
          path: config.parent,
        });
      }
    }

    // Get tab config
    const tabConfig = activeTab && config?.tabs ? config.tabs[activeTab] : null;
    const isTabWithSubTabs = tabConfig && typeof tabConfig === 'object' && 'subTabs' in tabConfig;
    const hasActiveSubTab = isTabWithSubTabs && activeSubTab && activeSubTab !== DEFAULT_SUB_TABS[activeTab];

    // Level 1: Current page (e.g., "Einstellungen")
    if (config) {
      const isClickable = !!activeTab; // Clickable if we're on a tab (not default view)
      crumbs.push({
        label: t(config.labelKey),
        path: isClickable ? currentPath : null,
      });
    }

    // Level 2: Tab (e.g., "Organisation")
    if (activeTab && tabConfig) {
      const tabLabelKey = typeof tabConfig === 'string' ? tabConfig : tabConfig.labelKey;
      const isClickable = hasActiveSubTab; // Clickable if there's an active sub-tab
      
      crumbs.push({
        label: t(tabLabelKey),
        path: isClickable ? `${currentPath}?tab=${activeTab}` : null,
      });
    }

    // Level 3: Sub-tab (e.g., "Team")
    if (hasActiveSubTab && isTabWithSubTabs) {
      const subTabConfig = (tabConfig as TabConfig).subTabs;
      if (subTabConfig && subTabConfig[activeSubTab]) {
        crumbs.push({
          label: t(subTabConfig[activeSubTab]),
          path: null, // Current location - not clickable
        });
      }
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <div className="space-y-1 mb-4 md:mb-6">
      {/* Breadcrumb row with sidebar toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4DB8A8] hover:bg-[#3EA89A] transition-colors"
          title={sidebarCollapsed ? t('common.showSidebar') : t('common.hideSidebar')}
        >
          <img 
            src={sidebarToggleIcon} 
            alt="Toggle Sidebar" 
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </button>

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