import { ArrowLeft, LogOut, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { EmployeeSession } from '@/pages/EmployeeOrder';
import { OrderHistorySheet } from './OrderHistorySheet';
import { CartSheet } from './CartSheet';
import type { CartItem } from '@/pages/EmployeeOrder';
import { EmployeeOrder } from './types';

interface OrderHeaderProps {
  session: EmployeeSession;
  selectedLocation: { id: string; name: string };
  cart: CartItem[];
  cartBySupplier: Record<string, CartItem[]>;
  cartItemCount: number;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
  timeWindow: string;
  setTimeWindow: (tw: string) => void;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  isSubmitting: boolean;
  showOrderHistory: boolean;
  setShowOrderHistory: (show: boolean) => void;
  employeeOrders: EmployeeOrder[];
  isLoadingOrders: boolean;
  expandedOrders: Set<string>;
  onUpdateCartItem: (articleId: string, quantity: number) => void;
  onSubmitOrder: () => void;
  loadEmployeeOrders: () => void;
  toggleOrderExpanded: (orderId: string) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const OrderHeader = ({
  session,
  selectedLocation,
  cart,
  cartBySupplier,
  cartItemCount,
  deliveryDate,
  setDeliveryDate,
  timeWindow,
  setTimeWindow,
  calendarOpen,
  setCalendarOpen,
  isSubmitting,
  showOrderHistory,
  setShowOrderHistory,
  employeeOrders,
  isLoadingOrders,
  expandedOrders,
  onUpdateCartItem,
  onSubmitOrder,
  loadEmployeeOrders,
  toggleOrderExpanded,
  onBack,
  onLogout,
}: OrderHeaderProps) => {
  return (
    <header className="bg-card border-b px-4 py-3 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Bestellung für</p>
            <p className="font-semibold">{selectedLocation.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:block text-sm font-medium text-muted-foreground mr-2">
            Hallo, <span className="text-foreground font-semibold">{session.employee.name.split(' ')[0]}</span>!
          </span>

          <OrderHistorySheet
            open={showOrderHistory}
            onOpenChange={setShowOrderHistory}
            orders={employeeOrders}
            isLoading={isLoadingOrders}
            expandedOrders={expandedOrders}
            onLoad={loadEmployeeOrders}
            onToggleExpanded={toggleOrderExpanded}
          />

          <CartSheet
            cart={cart}
            cartBySupplier={cartBySupplier}
            cartItemCount={cartItemCount}
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            timeWindow={timeWindow}
            setTimeWindow={setTimeWindow}
            calendarOpen={calendarOpen}
            setCalendarOpen={setCalendarOpen}
            isSubmitting={isSubmitting}
            onUpdateCartItem={onUpdateCartItem}
            onSubmitOrder={onSubmitOrder}
          />

          <Button variant="outline" size="icon" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
