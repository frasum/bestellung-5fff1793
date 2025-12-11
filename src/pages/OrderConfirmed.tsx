import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Loader2, MapPin, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type ConfirmationStatus = "success" | "already_confirmed" | "error" | "expired" | "not_found" | "loading";

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface OrderDetails {
  orderNumber: string;
  supplierName: string;
  deliveryAddress: string;
  notes: string | null;
  totalAmount: number;
  confirmedAt: string;
  items: OrderItem[];
}

const OrderConfirmed = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  const orderNumber = searchParams.get("order") || "";
  const supplierName = searchParams.get("supplier") || "";
  const orderId = searchParams.get("orderId") || "";
  const statusParam = searchParams.get("status") as ConfirmationStatus;

  useEffect(() => {
    if (statusParam) {
      setStatus(statusParam);
      
      // If success and we have orderId, fetch full details
      if (statusParam === "success" && orderId) {
        fetchOrderDetails(orderId);
      }
    }
  }, [statusParam, orderId]);

  const fetchOrderDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-details?orderId=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const details = await response.json();
        setOrderDetails(details);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusContent = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Bestellung bestätigt!",
          description: `Vielen Dank${supplierName ? `, ${supplierName}` : ""}! Sie haben die Bestellung erfolgreich bestätigt.`,
          bgGradient: "from-green-50 to-emerald-50",
          cardBg: "bg-green-50 border-green-200",
        };
      case "already_confirmed":
        return {
          icon: <AlertCircle className="h-16 w-16 text-amber-500" />,
          title: "Bereits bestätigt",
          description: "Diese Bestellung wurde bereits bestätigt.",
          bgGradient: "from-amber-50 to-yellow-50",
          cardBg: "bg-amber-50 border-amber-200",
        };
      case "expired":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Link abgelaufen",
          description: "Der Bestätigungslink ist abgelaufen. Bitte kontaktieren Sie den Besteller.",
          bgGradient: "from-red-50 to-rose-50",
          cardBg: "bg-red-50 border-red-200",
        };
      case "not_found":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Link ungültig",
          description: "Der Bestätigungslink ist ungültig oder wurde nicht gefunden.",
          bgGradient: "from-red-50 to-rose-50",
          cardBg: "bg-red-50 border-red-200",
        };
      case "error":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Fehler aufgetreten",
          description: "Bei der Bestätigung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
          bgGradient: "from-red-50 to-rose-50",
          cardBg: "bg-red-50 border-red-200",
        };
      default:
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Wird geladen...",
          description: "Bitte warten Sie einen Moment.",
          bgGradient: "from-blue-50 to-indigo-50",
          cardBg: "bg-blue-50 border-blue-200",
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${content.bgGradient} flex items-center justify-center p-4`}>
      <Card className="max-w-lg w-full shadow-xl border-0">
        <CardContent className="pt-8 pb-8">
          {/* Header with icon and status */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {content.icon}
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {content.title}
            </h1>
            
            <p className="text-muted-foreground">
              {content.description}
            </p>
          </div>
          
          {/* Order Number */}
          {orderNumber && (
            <div className={`rounded-lg p-4 ${content.cardBg} border mb-4`}>
              <p className="text-sm text-muted-foreground">Bestellnummer</p>
              <p className="text-xl font-bold text-foreground">{orderNumber}</p>
            </div>
          )}

          {/* Order Details - Only show on success */}
          {status === "success" && (
            <>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Lade Bestelldetails...</span>
                </div>
              ) : orderDetails ? (
                <div className="space-y-4">
                  {/* Confirmation Date */}
                  <div className="rounded-lg p-4 bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">Bestätigt am</p>
                    <p className="font-medium text-foreground">{formatDate(orderDetails.confirmedAt)}</p>
                  </div>

                  {/* Delivery Address */}
                  {orderDetails.deliveryAddress && (
                    <div className="rounded-lg p-4 bg-muted/50 border">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Lieferadresse</p>
                          <p className="font-medium text-foreground whitespace-pre-line">{orderDetails.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {orderDetails.notes && (
                    <div className="rounded-lg p-4 bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">Anmerkungen</p>
                      <p className="font-medium text-foreground">{orderDetails.notes}</p>
                    </div>
                  )}

                  {/* Order Items */}
                  {orderDetails.items && orderDetails.items.length > 0 && (
                    <div className="rounded-lg p-4 bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Bestellte Artikel</p>
                      </div>
                      <div className="space-y-2">
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium text-foreground">{item.article_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-foreground">€{item.total_price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-3 border-t-2">
                        <p className="font-bold text-foreground">Gesamtbetrag</p>
                        <p className="text-xl font-bold text-green-600">€{orderDetails.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Der Kunde wurde über Ihre Bestätigung informiert. Bitte bearbeiten Sie die Bestellung entsprechend.
                </p>
              )}
            </>
          )}
          
          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Bestellung.pro
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmed;
