import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ConfirmationStatus = "success" | "already_confirmed" | "error" | "expired" | "not_found" | "loading";

const OrderConfirmed = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  
  const orderNumber = searchParams.get("order") || "";
  const supplierName = searchParams.get("supplier") || "";
  const statusParam = searchParams.get("status") as ConfirmationStatus;

  useEffect(() => {
    if (statusParam) {
      setStatus(statusParam);
    }
  }, [statusParam]);

  const getStatusContent = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="h-20 w-20 text-green-500" />,
          title: "Bestellung bestätigt!",
          description: `Vielen Dank${supplierName ? `, ${supplierName}` : ""}! Sie haben die Bestellung erfolgreich bestätigt.`,
          bgGradient: "from-green-50 to-emerald-50",
          cardBg: "bg-green-50 border-green-200",
        };
      case "already_confirmed":
        return {
          icon: <AlertCircle className="h-20 w-20 text-amber-500" />,
          title: "Bereits bestätigt",
          description: "Diese Bestellung wurde bereits bestätigt.",
          bgGradient: "from-amber-50 to-yellow-50",
          cardBg: "bg-amber-50 border-amber-200",
        };
      case "expired":
        return {
          icon: <XCircle className="h-20 w-20 text-red-500" />,
          title: "Link abgelaufen",
          description: "Der Bestätigungslink ist abgelaufen. Bitte kontaktieren Sie den Besteller.",
          bgGradient: "from-red-50 to-rose-50",
          cardBg: "bg-red-50 border-red-200",
        };
      case "not_found":
        return {
          icon: <XCircle className="h-20 w-20 text-red-500" />,
          title: "Link ungültig",
          description: "Der Bestätigungslink ist ungültig oder wurde nicht gefunden.",
          bgGradient: "from-red-50 to-rose-50",
          cardBg: "bg-red-50 border-red-200",
        };
      case "error":
        return {
          icon: <XCircle className="h-20 w-20 text-red-500" />,
          title: "Fehler aufgetreten",
          description: "Bei der Bestätigung ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
          bgGradient: "from-red-50 to-rose-50",
          cardBg: "bg-red-50 border-red-200",
        };
      default:
        return {
          icon: <Loader2 className="h-20 w-20 text-primary animate-spin" />,
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
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            {content.icon}
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {content.title}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {content.description}
          </p>
          
          {orderNumber && (
            <div className={`rounded-lg p-4 ${content.cardBg} border mb-6`}>
              <p className="text-sm text-muted-foreground">Bestellnummer</p>
              <p className="text-xl font-bold text-foreground">{orderNumber}</p>
            </div>
          )}
          
          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              Der Kunde wurde über Ihre Bestätigung informiert. Bitte bearbeiten Sie die Bestellung entsprechend.
            </p>
          )}
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Powered by OrderFox.pro
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmed;
