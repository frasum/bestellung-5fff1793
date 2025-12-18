import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { orders as mockOrders } from '@/data/mockData';
import { ClipboardList, Package, ArrowRight, Calendar, Euro } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DemoOrders() {
  const navigate = useNavigate();
  const { industry } = useDemo();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500">Geliefert</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500">Versendet</Badge>;
      case 'pending':
        return <Badge variant="secondary">Ausstehend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bestellungen</h1>
          <p className="text-muted-foreground">
            Demo-Bestellhistorie mit Beispieldaten
          </p>
        </div>
        <Button onClick={() => navigate('/demo/suppliers')}>
          <Package className="w-4 h-4 mr-2" />
          Neue Bestellung
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {mockOrders.map(order => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.supplierName}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(order.createdAt, 'dd.MM.yyyy', { locale: de })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span>{order.items.length} Artikel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">€{order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Details
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map(item => (
                    <Badge key={item.id} variant="outline">
                      {item.quantity}x {item.articleName}
                    </Badge>
                  ))}
                  {order.items.length > 3 && (
                    <Badge variant="outline">+{order.items.length - 3} weitere</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockOrders.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Noch keine Bestellungen</p>
          <Button className="mt-4" onClick={() => navigate('/demo/suppliers')}>
            Erste Bestellung erstellen
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Dies sind Beispiel-Bestellungen zur Demonstration. Erstellen Sie ein echtes Konto, um Ihre eigenen Bestellungen zu verwalten.
          </p>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Echtes Konto erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
