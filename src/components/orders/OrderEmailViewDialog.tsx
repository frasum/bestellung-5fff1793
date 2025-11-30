import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface OrderEmailViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    order_number: string;
    created_at: string;
    delivery_address: string;
    notes?: string | null;
    total_amount: number;
    suppliers?: { name: string; email: string } | null;
    order_items?: OrderItem[] | null;
  } | null;
  restaurantName: string;
}

const localeMap = { de, en: enUS, fr };

export const OrderEmailViewDialog = ({
  open,
  onOpenChange,
  order,
  restaurantName,
}: OrderEmailViewDialogProps) => {
  const { t, i18n } = useTranslation();
  const locale = localeMap[i18n.language as keyof typeof localeMap] || de;

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {t('orders.emailPreview')} - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[70vh]">
          <div className="space-y-4">
            {/* Email Header */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">{t('orders.emailTo')}:</span>
                <span className="font-medium">{order.suppliers?.email}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">{t('orders.emailFrom')}:</span>
                <span>ProcureResto &lt;onboarding@resend.dev&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">{t('orders.emailSubject')}:</span>
                <span className="font-medium">{t('orders.newOrderFrom')} {restaurantName}</span>
              </div>
            </div>

            {/* Email Body Preview */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-primary px-6 py-4">
                <h2 className="text-primary-foreground text-xl font-semibold">{t('orders.newOrderReceived')}</h2>
                <p className="text-primary-foreground/80 text-sm mt-1">{order.order_number}</p>
              </div>

              <div className="p-6 space-y-6 bg-card">
                {/* Order Details */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t('orders.orderDetails')}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">{t('orders.from')}:</span> {restaurantName}</p>
                    <p><span className="font-medium">{t('orders.to')}:</span> {order.suppliers?.name}</p>
                    <p><span className="font-medium">{t('orders.date')}:</span> {format(new Date(order.created_at), 'PPP', { locale })}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{t('orders.deliveryAddress')}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {order.delivery_address}
                  </p>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">📝 {t('orders.notes')}</h3>
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <p className="text-sm text-warning-foreground/80 whitespace-pre-line">
                        {order.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold">{t('orders.article')}</th>
                        <th className="text-center p-3 font-semibold">{t('orders.quantity')}</th>
                        <th className="text-right p-3 font-semibold">{t('orders.unitPrice')}</th>
                        <th className="text-right p-3 font-semibold">{t('orders.total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {order.order_items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">{item.article_name}</td>
                          <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                          <td className="p-3 text-right">€{Number(item.unit_price).toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">€{Number(item.total_price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary text-primary-foreground">
                        <td colSpan={3} className="p-3 font-semibold">{t('orders.totalAmount')}</td>
                        <td className="p-3 text-right font-bold text-lg">€{Number(order.total_amount).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
