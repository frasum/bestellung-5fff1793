import { memo, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Loader2, Send, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/pages/EmployeeOrder';
import { TIME_WINDOW_OPTIONS } from './types';

// Memoized cart item row for mobile
interface MobileCartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (articleId: string, quantity: number) => void;
}

const MobileCartItemRow = memo(function MobileCartItemRow({ item, onUpdateQuantity }: MobileCartItemRowProps) {
  const handleDecrease = useCallback(() => {
    onUpdateQuantity(item.articleId, item.quantity - 1);
  }, [item.articleId, item.quantity, onUpdateQuantity]);

  const handleIncrease = useCallback(() => {
    onUpdateQuantity(item.articleId, item.quantity + 1);
  }, [item.articleId, item.quantity, onUpdateQuantity]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    onUpdateQuantity(item.articleId, val);
  }, [item.articleId, onUpdateQuantity]);

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.articleName}</p>
        <p className="text-sm text-muted-foreground">
          {item.orderUnit || item.unit}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrease}
        >
          {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </Button>
        <Input
          type="number"
          value={item.quantity}
          className="w-14 h-8 text-center font-semibold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min={0}
          onClick={(e) => e.currentTarget.select()}
          onFocus={(e) => e.target.select()}
          onChange={handleInputChange}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrease}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
});

interface MobileCartButtonProps {
  cart: CartItem[];
  cartBySupplier: Record<string, CartItem[]>;
  cartItemCount: number;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
  timeWindow: string;
  setTimeWindow: (tw: string) => void;
  mobileCalendarOpen: boolean;
  setMobileCalendarOpen: (open: boolean) => void;
  isSubmitting: boolean;
  onUpdateCartItem: (articleId: string, quantity: number) => void;
  onSubmitOrder: () => void;
}

export const MobileCartButton = memo(function MobileCartButton({
  cart,
  cartBySupplier,
  cartItemCount,
  deliveryDate,
  setDeliveryDate,
  timeWindow,
  setTimeWindow,
  mobileCalendarOpen,
  setMobileCalendarOpen,
  isSubmitting,
  onUpdateCartItem,
  onSubmitOrder,
}: MobileCartButtonProps) {
  if (cartItemCount === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 h-14 px-6 gap-2 shadow-lg sm:hidden"
          size="lg"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount} Artikel
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Warenkorb ({cartItemCount} Artikel)
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {Object.entries(cartBySupplier).map(([supplierId, items]) => (
              <div key={supplierId}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  {items[0].supplierName}
                </h3>
                <div className="space-y-2">
                  {items.map(item => (
                    <MobileCartItemRow
                      key={item.articleId}
                      item={item}
                      onUpdateQuantity={onUpdateCartItem}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Lieferdatum
            </label>
            <Popover open={mobileCalendarOpen} onOpenChange={setMobileCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate 
                    ? format(new Date(deliveryDate), "PPP", { locale: de }) 
                    : "Bitte Datum wählen"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={deliveryDate ? new Date(deliveryDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setDeliveryDate(format(date, 'yyyy-MM-dd'));
                      setMobileCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                  locale={de}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Zeitfenster
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_WINDOW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={timeWindow === option.value ? "default" : "outline"}
                  className={cn(
                    "h-10",
                    timeWindow === option.value && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setTimeWindow(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg gap-2" 
            onClick={onSubmitOrder}
            disabled={isSubmitting || !deliveryDate || !timeWindow}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Jetzt bestellen
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
