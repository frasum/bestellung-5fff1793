import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export const FloatingCartButton = () => {
  const { getItemCount } = useCart();
  const location = useLocation();
  const itemCount = getItemCount();
  const prevCountRef = useRef(itemCount);
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger pulse animation when items are added
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = itemCount;
  }, [itemCount]);

  // Hide on cart page or checkout
  if (location.pathname === '/cart' || location.pathname === '/checkout') {
    return null;
  }

  // Hide when cart is empty
  if (itemCount === 0) {
    return null;
  }

  // Hide on mobile (we have bottom nav now)
  // Only show on desktop

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/cart" className="hidden lg:block">
          <Button
            size="lg"
            className={cn(
              'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
              'hover:scale-105 transition-transform duration-200',
              'bg-primary hover:bg-primary/90',
              isPulsing && 'animate-[pulse-cart_0.6s_ease-in-out]'
            )}
          >
            <ShoppingCart className={cn('h-6 w-6', isPulsing && 'animate-[wiggle_0.3s_ease-in-out]')} />
            {itemCount > 0 && (
              <Badge 
                variant="destructive" 
                className={cn(
                  'absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center rounded-full text-xs font-bold px-1.5',
                  isPulsing && 'animate-[bounce_0.5s_ease-in-out]'
                )}
              >
                {itemCount > 99 ? '99+' : itemCount}
              </Badge>
            )}
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>Zum Warenkorb ({itemCount} Artikel)</p>
      </TooltipContent>
    </Tooltip>
  );
};
