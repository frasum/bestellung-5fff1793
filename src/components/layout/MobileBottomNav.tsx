import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, ClipboardList, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FileText, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/suppliers', label: 'Katalog', icon: Users },
  { href: '/cart', label: 'Warenkorb', icon: ShoppingCart, showBadge: true },
  { href: '/inventory', label: 'Inventur', icon: ClipboardList },
];

const moreNavItems = [
  { href: '/orders', label: 'Bestellungen', icon: ShoppingCart },
  { href: '/reports', label: 'Berichte', icon: BarChart3 },
  { href: '/settings', label: 'Einstellungen', icon: Settings },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const { getItemCount } = useCart();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const itemCount = getItemCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    setSheetOpen(false);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 relative',
                'transition-colors touch-manipulation',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground active:text-primary'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.showBadge && itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
        
        {/* More Menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2',
                'text-muted-foreground active:text-primary transition-colors touch-manipulation'
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Mehr</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 pb-6">
              {moreNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl transition-colors',
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav.signOut')}
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
