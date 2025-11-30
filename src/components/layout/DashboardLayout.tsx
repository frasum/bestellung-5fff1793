import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { ChefHat, LayoutDashboard, Users, Package, ShoppingCart, FileText, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
interface DashboardLayoutProps {
  children: ReactNode;
}
export const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const navItems = [{
    href: '/dashboard',
    label: t('nav.dashboard'),
    icon: LayoutDashboard
  }, {
    href: '/suppliers',
    label: t('nav.suppliers'),
    icon: Users
  }, {
    href: '/articles',
    label: t('nav.articles'),
    icon: Package
  }, {
    href: '/orders',
    label: t('nav.orders'),
    icon: ShoppingCart
  }, {
    href: '/drafts',
    label: t('nav.drafts'),
    icon: FileText
  }, {
    href: '/reports',
    label: t('nav.reports'),
    icon: BarChart3
  }, {
    href: '/settings',
    label: t('nav.settings'),
    icon: Settings
  }];
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">ProcureResto</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn('fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border transition-transform duration-300', 'lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">OrderFox.pro</span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
            const isActive = location.pathname === item.href;
            return <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>;
          })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-background/80 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>;
};