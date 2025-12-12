import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calendar, Package, Pencil, Trash2, ChevronLeft } from 'lucide-react';
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

interface EmployeeOrderHistoryProps {
  drafts: Draft[];
  isLoading: boolean;
  employeeName: string;
  onEdit: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  onBack: () => void;
  isDeleting: string | null;
}

export const EmployeeOrderHistory = ({
  drafts,
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
    // Extract from notes if available
    if (draft.notes?.startsWith('Lieferant:')) {
      return draft.notes.replace('Lieferant:', '').trim();
    }
    return t('common.unknown');
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

      {/* Drafts List */}
      <div className="p-4 space-y-4">
        {drafts.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              {t('simpleOrder.noOrdersYet', 'Noch keine Bestellungen vorhanden')}
            </p>
          </Card>
        ) : (
          drafts.map((draft) => (
            <Card key={draft.id} className="p-4">
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

              {/* Items Preview */}
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
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

              {/* Actions */}
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

              {/* Created timestamp */}
              <p className="text-xs text-muted-foreground mt-3">
                {t('simpleOrder.createdAt', 'Erstellt am')}{' '}
                {format(new Date(draft.created_at), 'dd.MM.yyyy HH:mm', { locale: getLocale() })}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
