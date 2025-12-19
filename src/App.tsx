import { Suspense, lazy, Profiler } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { PerformanceMonitor } from "@/components/debug/PerformanceMonitor";
import { DevNavigationPanel } from "@/components/debug/DevNavigationPanel";
import { DemoModeSwitcher } from "@/components/debug/DemoModeSwitcher";
import { DemoLayout } from "@/components/layout/DemoLayout";

// Lazy load pages for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const SupplierLogin = lazy(() => import("./pages/SupplierLogin"));
const SupplierAuth = lazy(() => import("./pages/SupplierAuth"));
const SupplierPortal = lazy(() => import("./pages/SupplierPortal"));
const SupplierPurchasing = lazy(() => import("./pages/SupplierPurchasing"));
const OrderConfirmed = lazy(() => import("./pages/OrderConfirmed"));
const SimpleOrder = lazy(() => import("./pages/SimpleOrder"));
const PhotoCapture = lazy(() => import("./pages/PhotoCapture"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const QuestionOnboarding = lazy(() => import("./pages/QuestionOnboarding"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));
const SystemArchitecture = lazy(() => import("./pages/SystemArchitecture"));
const DatabaseArchitecture = lazy(() => import("./pages/DatabaseArchitecture"));
const Infrastructure = lazy(() => import("./pages/Infrastructure"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const AGB = lazy(() => import("./pages/AGB"));
const WineCatalog = lazy(() => import("./pages/WineCatalog"));
const B2BSupplierLogin = lazy(() => import("./pages/B2BSupplierLogin"));
const B2BSupplierDashboard = lazy(() => import("./pages/B2BSupplierDashboard"));
const B2BAcceptInvitation = lazy(() => import("./pages/B2BAcceptInvitation"));
const B2BCustomerPortal = lazy(() => import("./pages/B2BCustomerPortal"));
const DemoSuppliers = lazy(() => import("./pages/DemoSuppliers"));
const DemoCart = lazy(() => import("./pages/DemoCart"));
const DemoOrders = lazy(() => import("./pages/DemoOrders"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Inner component to use hooks inside providers
const AppContent = () => {
  useRealtimeNotifications();
  const { 
    aggregatedMetrics, 
    totalRenders, 
    avgRenderTime, 
    onRenderCallback, 
    isEnabled, 
    toggleEnabled,
    clearMetrics 
  } = usePerformanceMonitor();
  
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
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
          <Route path="/supplier-purchasing" element={<SupplierPurchasing />} />
          <Route path="/order-confirmed" element={<OrderConfirmed />} />
          <Route path="/simple-order/:token" element={<SimpleOrder />} />
          <Route path="/photo-capture" element={<PhotoCapture />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/questions" element={<QuestionOnboarding />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route path="/system-architecture" element={<SystemArchitecture />} />
          <Route path="/database-architecture" element={<DatabaseArchitecture />} />
          <Route path="/infrastructure" element={<Infrastructure />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/presentation" element={<Presentation />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/agb" element={<AGB />} />
          <Route path="/wines/:token" element={<WineCatalog />} />
          {/* Demo Mode Routes */}
          <Route path="/demo" element={<DemoLayout />}>
            <Route path="suppliers" element={<DemoSuppliers />} />
            <Route path="cart" element={<DemoCart />} />
            <Route path="orders" element={<DemoOrders />} />
          </Route>
          {/* B2B Supplier Portal Routes */}
          <Route path="/b2b/login" element={<B2BSupplierLogin />} />
          <Route path="/b2b/dashboard" element={<B2BSupplierDashboard />} />
          <Route path="/b2b/accept-invitation" element={<B2BAcceptInvitation />} />
          <Route path="/b2b/portal" element={<B2BCustomerPortal />} />
          <Route path="/b2b/portal/:subdomain" element={<B2BCustomerPortal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      
      {isEnabled && (
        <PerformanceMonitor
          aggregatedMetrics={aggregatedMetrics}
          totalRenders={totalRenders}
          avgRenderTime={avgRenderTime}
          onClear={clearMetrics}
          onClose={toggleEnabled}
        />
      )}
      
      <DevNavigationPanel />
      <DemoModeSwitcher />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DemoProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <TooltipProvider>
                <ErrorBoundary>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </ErrorBoundary>
              </TooltipProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </DemoProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
