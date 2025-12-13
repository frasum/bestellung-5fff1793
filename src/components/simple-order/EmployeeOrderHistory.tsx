import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, Package, Pencil, Trash2, ChevronLeft, CheckCircle2, Clock, Eye } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { format } from 'date-fns';
import { de, th, enUS } from 'date-fns/locale';

interface DraftItem {
  id: string;
  quantity: number;
  article: {
    id: string;
    name: string;
    unit: string;
    price: number;
    supplier_id: string;
    supplier: {
      id: string;
      name: string;
    };
  };
}

interface Draft {
  id: string;
  name: string;
  notes: string | null;
  location_id: string | null;
  desired_delivery_date: string | null;
  desired_time_window: string | null;
  created_at: string;
  location: {
    id: string;
    name: string;
    short_code: string | null;
  } | null;
  items: DraftItem[];
}

interface OrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  notes: string | null;
  created_at: string;
  location_id: string | null;
  location: {
    id: string;
    name: string;
    short_code: string | null;
  } | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  items: OrderItem[];
}

interface EmployeeOrderHistoryProps {
  drafts: Draft[];
  orders?: Order[];
  isLoading: boolean;
  employeeName: string;
  onEdit: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  onBack: () => void;
  isDeleting: string | null;
}

export const EmployeeOrderHistory = ({
  drafts,
  orders = [],
  isLoading,
  employeeName,
  onEdit,
  onDelete,
  onBack,
  isDeleting,
}: EmployeeOrderHistoryProps) => {
  const { t, i18n } = useTranslation();
  const { mediumTap, lightTap } = useHapticFeedback();

  const getLocale = () => {
    switch (i18n.language) {
      case 'de': return de;
      case 'th': return th;
      default: return enUS;
    }
  };

  const getSupplierName = (draft: Draft) => {
    if (draft.items.length > 0 && draft.items[0].article?.supplier) {
      return draft.items[0].article.supplier.name;
    }
    if (draft.notes?.startsWith('Lieferant:')) {
      return draft.notes.replace('Lieferant:', '').trim();
    }
    return t('common.unknown');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">{t('orders.confirmed')}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{t('orders.pending')}</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">{t('orders.delivered')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEdit = (draftId: string) => {
    mediumTap();
    onEdit(draftId);
  };

  const handleDelete = (draftId: string) => {
    mediumTap();
    onDelete(draftId);
  };

  const handleBack = () => {
    lightTap();
    onBack();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  const hasDrafts = drafts.length > 0;
  const hasOrders = orders.length > 0;
  const hasAny = hasDrafts || hasOrders;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-11 w-11 touch-manipulation"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {t('simpleOrder.myOrders', 'Meine Bestellungen')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {employeeName}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!hasAny ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {t('simpleOrder.noOrdersYet', 'Noch keine Bestellungen vorhanden')}
            </p>
          </Card>
        ) : (
          <>
            {/* Open Drafts Section */}
            {hasDrafts && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  {t('simpleOrder.openOrders', 'Offene Bestellungen')}
                  <Badge variant="secondary">{drafts.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <Card key={draft.id} className="p-4 border-warning/30">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {getSupplierName(draft)}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            {draft.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{draft.location.short_code || draft.location.name}</span>
                              </div>
                            )}
                            {draft.desired_delivery_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {format(new Date(draft.desired_delivery_date), 'dd.MM.yyyy', { locale: getLocale() })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {draft.items.length} {t('simpleOrder.items', 'Artikel')}
                        </Badge>
                      </div>

                      <div className="bg-muted/30 rounded-md p-3 mb-3">
                        {draft.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm py-1">
                            <span className="truncate flex-1 mr-2">{item.article?.name || 'Artikel'}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {item.quantity} {item.article?.unit || 'Stk'}
                            </span>
                          </div>
                        ))}
                        {draft.items.length > 3 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{draft.items.length - 3} {t('simpleOrder.moreItems', 'weitere')}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 touch-manipulation"
                          onClick={() => handleEdit(draft.id)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          {t('simpleOrder.edit', 'Bearbeiten')}
                        </Button>
                        <Button
                          variant="destructive"
                          className="h-12 touch-manipulation px-4"
                          onClick={() => handleDelete(draft.id)}
                          disabled={isDeleting === draft.id}
                        >
                          {isDeleting === draft.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">
                        {t('simpleOrder.createdAt', 'Erstellt am')}{' '}
                        {format(new Date(draft.created_at), 'dd.MM.yyyy HH:mm', { locale: getLocale() })}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Orders Section */}
            {hasOrders && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {t('simpleOrder.completedOrders', 'Abgeschlossene Bestellungen')}
                  <Badge variant="secondary">{orders.length}</Badge>
                </h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-4 bg-muted/30">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {order.supplier?.name || t('common.unknown')}
                          </h3>
                          <p className="text-sm font-mono text-muted-foreground">
                            {order.order_number.replace(/^ORD/, order.supplier?.name || 'ORD')}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            {order.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{order.location.short_code || order.location.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-sm font-semibold mt-1">
                            €{Number(order.total_amount).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-md p-3 mb-3">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm py-1">
                            <span className="truncate flex-1 mr-2">{item.article_name}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{order.items.length - 3} {t('simpleOrder.moreItems', 'weitere')}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: getLocale() })}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {t('simpleOrder.viewOnly', 'Nur Ansicht')}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
