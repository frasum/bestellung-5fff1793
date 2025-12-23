import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, MoreHorizontal, BarChart3, Settings, LogOut, Bell } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCartDrafts } from '@/hooks/useCartDrafts';

const mainNavItems = [
  { href: '/suppliers', label: 'Katalog', icon: Users },
  { href: '/cart', label: 'Warenkorb', icon: ShoppingCart, showBadge: true },
  { href: '/reports', label: 'Berichte', icon: BarChart3 },
];

// More nav items will be built dynamically based on user role

export const MobileBottomNav = () => {
  const location = useLocation();
  const { getItemCount } = useCart();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const itemCount = getItemCount();
  const { data: drafts } = useCartDrafts(undefined, true);
  const openDraftsCount = drafts?.length || 0;

  const moreNavItems = [
    { href: '/orders', label: t('nav.orders'), icon: ShoppingCart },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    setSheetOpen(false);
  };

  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 md:h-20 px-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 relative',
                'transition-all duration-200 touch-manipulation',
                isActive 
                  ? 'text-accent' 
                  : 'text-muted-foreground active:text-accent'
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform duration-200", isActive && "scale-110")} />
                {item.showBadge && itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-3 h-4 min-w-4 md:h-5 md:min-w-5 flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold px-1"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] md:text-xs mt-1 font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 md:w-10 h-1 bg-accent rounded-full" />
              )}
            </Link>
          );
        })}
        
        {/* More Menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 relative',
                'text-muted-foreground active:text-primary transition-colors touch-manipulation'
              )}
            >
              <div className="relative">
                <MoreHorizontal className="w-5 h-5 md:w-6 md:h-6" />
                {openDraftsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-3 h-4 min-w-4 md:h-5 md:min-w-5 flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold px-1"
                  >
                    {openDraftsCount > 99 ? '99+' : openDraftsCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] md:text-xs mt-1 font-medium">Mehr</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-md border-t border-border">
            <SheetHeader className="pb-4">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 md:gap-4 pb-6">
            {moreNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                const showDraftsBadge = item.href === '/orders' && openDraftsCount > 0;
                return (
                  <Link
                    key={item.href}
                    to={showDraftsBadge ? '/orders?tab=drafts' : item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 p-4 md:p-5 min-h-[52px] md:min-h-[60px] rounded-lg transition-all duration-200 relative',
                      isActive 
                        ? 'bg-accent text-accent-foreground shadow-sm' 
                        : 'bg-muted hover:bg-accent/10 hover:text-accent'
                    )}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-medium flex-1">{item.label}</span>
                    {showDraftsBadge && (
                      <div className="flex items-center gap-1">
                        <Bell className={cn("w-4 h-4 animate-pulse", isActive ? "text-primary-foreground" : "text-destructive")} />
                        <Badge variant={isActive ? "secondary" : "destructive"} className="h-5 min-w-5 text-xs px-1.5">
                          {openDraftsCount}
                        </Badge>
                      </div>
                    )}
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
