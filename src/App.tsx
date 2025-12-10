import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import Auth from "./pages/Auth";
import Suppliers from "./pages/Suppliers";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SupplierLogin from "./pages/SupplierLogin";
import SupplierAuth from "./pages/SupplierAuth";
import SupplierPortal from "./pages/SupplierPortal";
import OrderConfirmed from "./pages/OrderConfirmed";
import SimpleOrder from "./pages/SimpleOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/signup" element={<Auth />} />
                <Route path="/dashboard" element={<Navigate to="/reports" replace />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/articles" element={<Navigate to="/suppliers?tab=articles" replace />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/drafts" element={<Navigate to="/orders?tab=drafts" replace />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/inventory" element={<Navigate to="/reports?tab=inventur" replace />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/supplier-login" element={<SupplierLogin />} />
                <Route path="/supplier-auth" element={<SupplierAuth />} />
                <Route path="/supplier-portal" element={<SupplierPortal />} />
                <Route path="/order-confirmed" element={<OrderConfirmed />} />
                <Route path="/simple-order/:token" element={<SimpleOrder />} />
                <Route path="/staff-orders" element={<Navigate to="/orders?tab=staff" replace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
