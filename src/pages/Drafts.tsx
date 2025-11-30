import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCartDrafts, useDeleteCartDraft, CartDraft } from '@/hooks/useCartDrafts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Loader2, 
  FileText, 
  Trash2, 
  ShoppingCart, 
  Calendar,
  Package,
  Edit,
} from 'lucide-react';
import { format, Locale } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  de,
  en: enUS,
  fr,
};

const Drafts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: drafts, isLoading } = useCartDrafts();
  const deleteDraft = useDeleteCartDraft();
  const { loadFromDraft, items: cartItems } = useCart();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<CartDraft | null>(null);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const locale = localeMap[i18n.language] || de;

  const filteredDrafts = drafts?.filter(draft => 
    draft.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = (draft: CartDraft) => {
    setSelectedDraft(draft);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDraft) {
      deleteDraft.mutate(selectedDraft.id);
    }
    setDeleteDialogOpen(false);
    setSelectedDraft(null);
  };

  const handleLoadDraft = (draft: CartDraft) => {
    if (cartItems.length > 0) {
      setSelectedDraft(draft);
      setLoadDialogOpen(true);
    } else {
      loadDraftToCart(draft);
    }
  };

  const loadDraftToCart = (draft: CartDraft) => {
    if (draft.items && loadFromDraft) {
      loadFromDraft(draft.items.filter(item => item.article).map(item => ({
        article: item.article!,
        quantity: item.quantity,
      })));
      navigate('/cart');
    }
    setLoadDialogOpen(false);
    setSelectedDraft(null);
  };

  const getDraftTotal = (draft: CartDraft) => {
    return draft.items?.reduce((sum, item) => {
      if (item.article) {
        return sum + Number(item.article.price) * item.quantity;
      }
      return sum;
    }, 0) || 0;
  };

  const getDraftItemCount = (draft: CartDraft) => {
    return draft.items?.length || 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('drafts.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('drafts.description')}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <Input
            placeholder={t('drafts.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDrafts.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery ? t('drafts.noResults') : t('drafts.empty')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? t('drafts.noResultsDescription') : t('drafts.emptyDescription')}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/articles')}>
                {t('drafts.browseArticles')}
              </Button>
            )}
          </div>
        )}

        {/* Drafts List */}
        {!isLoading && filteredDrafts.length > 0 && (
          <div className="grid gap-4">
            {filteredDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Draft Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {draft.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {getDraftItemCount(draft)} {t('drafts.items')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(draft.updated_at), 'PPp', { locale })}
                      </span>
                    </div>
                    {draft.notes && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {draft.notes}
                      </p>
                    )}
                  </div>

                  {/* Draft Items Preview */}
                  <div className="flex-shrink-0 lg:text-right">
                    <p className="text-2xl font-bold text-foreground">
                      €{getDraftTotal(draft).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('drafts.total')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadDraft(draft)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('drafts.loadToCart')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(draft)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Items Preview */}
                {draft.items && draft.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {draft.items.slice(0, 5).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-sm"
                        >
                          {item.quantity}x {item.article?.name || 'Unknown'}
                        </span>
                      ))}
                      {draft.items.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-sm text-muted-foreground">
                          +{draft.items.length - 5} {t('drafts.more')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('drafts.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('drafts.deleteDescription', { name: selectedDraft?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Load Draft Confirmation Dialog */}
        <AlertDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('drafts.loadTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('drafts.loadDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedDraft && loadDraftToCart(selectedDraft)}
              >
                {t('drafts.replaceCart')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Drafts;
