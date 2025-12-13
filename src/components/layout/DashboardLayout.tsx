import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Settings, LogOut, Menu, X, FlaskConical, Search, Sparkles } from 'lucide-react';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LocationSwitcher } from '@/components/LocationSwitcher';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useOrganization } from '@/hooks/useSettings';
import { Badge } from '@/components/ui/badge';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { FloatingCartButton } from '@/components/FloatingCartButton';
import { TooltipProvider } from '@/components/ui/tooltip';
import logoImage from '@/assets/logo.png';


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
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  
  const { data: organization } = useOrganization();
  
  // Calculate demo days remaining
  const getDemoDaysRemaining = () => {
    if (!organization?.is_demo || !organization?.demo_expires_at) return null;
    const expiresAt = new Date(organization.demo_expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const demoDaysRemaining = getDemoDaysRemaining();
  
  const navItems = [
    { href: '/suppliers', label: t('nav.catalog'), icon: Users },
    { href: '/orders', label: t('nav.orders'), icon: ShoppingCart },
    { href: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return <div className="min-h-screen bg-muted/30">
      {/* Global Search */}
      <GlobalSearch />
      
      {/* Mobile Header */}
      <header className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-14 flex items-center justify-between px-4">
        <Link to="/reports" className="flex items-center gap-2">
          <img src={logoImage} alt="Bestellung.pro" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg text-foreground">Bestellung.pro</span>
        </Link>
        <div className="flex items-center gap-2">
          {organization?.is_demo && demoDaysRemaining !== null && (
            <Badge 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20"
              onClick={() => navigate('/settings')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Demo ({demoDaysRemaining}d)
            </Badge>
          )}
          {organization?.test_mode_enabled && !organization?.is_demo && (
            <Badge 
              variant="warning" 
              className="opacity-80 cursor-pointer"
              onClick={() => navigate('/settings')}
            >
              <FlaskConical className="w-3 h-3 mr-1" />
              Test
            </Badge>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop Top Bar */}
      <div className="hidden xl:flex fixed top-0 left-64 right-0 z-30 h-14 bg-card/80 backdrop-blur-sm border-b border-border items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <GlobalSearch />
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="icon" />
            <ThemeToggle />
          {organization?.is_demo && demoDaysRemaining !== null && (
            <Badge 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20"
              onClick={() => navigate('/settings')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Demo-Modus (noch {demoDaysRemaining} Tage)
            </Badge>
          )}
          {organization?.test_mode_enabled && !organization?.is_demo && (
            <Badge 
              variant="warning" 
              className="opacity-80 cursor-pointer"
              onClick={() => navigate('/settings')}
            >
              <FlaskConical className="w-3 h-3 mr-1" />
              Testmodus aktiv
            </Badge>
          )}
          </div>
        </TooltipProvider>
      </div>

      {/* Sidebar */}
      <aside className={cn('fixed top-0 left-0 z-40 h-full w-64 bg-background border-r border-border transition-transform duration-300', 'xl:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Bestellung.pro" className="w-9 h-9 rounded-lg object-cover" />
              <span className="font-bold text-xl text-foreground">Bestellung.pro</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {/* Location Switcher */}
            <div className="mb-3">
              <LocationSwitcher className="w-full justify-start" />
            </div>
            
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
              <Link 
                  key={item.href} 
                  to={item.href} 
                  onClick={() => setSidebarOpen(false)} 
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors',
                    isActive ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
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
            <div className="xl:hidden mb-2 flex items-center gap-2">
              <LanguageSwitcher variant="full" />
              <ThemeToggle />
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-background/80 z-30 xl:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="xl:ml-64 pt-14 pb-20 xl:pb-0 min-h-screen">
        <div className="px-4 pt-0 pb-4 md:px-5 md:pt-4 md:pb-5 xl:p-8">{children}</div>
      </main>

      {/* Floating Cart Button (Desktop) */}
      <FloatingCartButton />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>;
};