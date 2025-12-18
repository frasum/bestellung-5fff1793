import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDemo } from '@/contexts/DemoContext';
import { Package, ShoppingCart, ClipboardList, LogIn, Home, AlertTriangle } from 'lucide-react';

export function DemoLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItemCount, industry } = useDemo();

  const navItems = [
    { path: '/demo/suppliers', label: industry.terminology.supplierPlural, icon: Package },
    { path: '/demo/cart', label: 'Warenkorb', icon: ShoppingCart, badge: cartItemCount },
    { path: '/demo/orders', label: 'Bestellungen', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Demo Banner */}
      <div className="bg-amber-500/90 text-amber-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span>Demo-Modus – Keine Daten werden gespeichert</span>
      </div>

      {/* Header */}
      <header className="border-b bg-card px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/presentation')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Startseite</span>
            </Button>
            <Badge variant="outline" className="hidden sm:flex">
              {industry.name}
            </Badge>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.path)}
                className="gap-2 relative"
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          <Button
            size="sm"
            onClick={() => navigate('/auth')}
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Echtes Konto</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
