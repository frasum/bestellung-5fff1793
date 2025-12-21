import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, LogOut, Plus } from 'lucide-react';

interface OrderConfirmationScreenProps {
  employeeName: string;
  onNewOrder: () => void;
  onLogout: () => void;
}

export function OrderConfirmationScreen({
  employeeName,
  onNewOrder,
  onLogout,
}: OrderConfirmationScreenProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Angemeldet als</p>
            <p className="font-semibold">{employeeName}</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center p-8">
          <CardContent className="pt-0">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Bestellung gesendet!</h1>
            <p className="text-muted-foreground mb-8">
              Ihre Bestellung wurde erfolgreich übermittelt und wird bearbeitet.
            </p>

            <div className="space-y-3">
              <Button onClick={onNewOrder} className="w-full h-12 gap-2" size="lg">
                <Plus className="w-5 h-5" />
                Neue Bestellung
              </Button>
              <Button variant="outline" onClick={onLogout} className="w-full gap-2">
                <LogOut className="w-4 h-4" />
                Abmelden
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
