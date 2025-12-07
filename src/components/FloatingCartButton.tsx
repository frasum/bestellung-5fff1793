import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const FloatingCartButton = () => {
  const { getItemCount } = useCart();
  const location = useLocation();
  const itemCount = getItemCount();

  // Hide on cart page or checkout
  if (location.pathname === '/cart' || location.pathname === '/checkout') {
    return null;
  }

  // Hide when cart is empty
  if (itemCount === 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/cart">
          <Button
            size="lg"
            className={cn(
              'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg',
              'hover:scale-105 transition-transform duration-200',
              'bg-primary hover:bg-primary/90'
            )}
          >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-6 min-w-6 flex items-center justify-center rounded-full text-xs font-bold px-1.5"
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
