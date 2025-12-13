import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Check, 
  X, 
  Loader2, 
  User, 
  Truck, 
  Package,
  PenLine,
  CheckCircle2,
  XCircle,
  Camera,
  ZoomIn
} from 'lucide-react';
import { 
  useSuggestedArticles, 
  useApproveSuggestedArticle, 
  useRejectSuggestedArticle,
  useApproveAllSuggestedArticles,
  useRejectAllSuggestedArticles,
  SuggestedArticle
} from '@/hooks/useSuggestedArticles';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface SuggestionsTabProps {
  suppliers: { id: string; name: string }[];
}

export function SuggestionsTab({ suppliers }: SuggestionsTabProps) {
  const { t, i18n } = useTranslation();
  const [sourceFilter, setSourceFilter] = useState<'all' | 'supplier' | 'employee' | 'employee_photo'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const locale = i18n.language === 'de' ? de : enUS;

  const { data: suggestions, isLoading } = useSuggestedArticles(sourceFilter);
  const approveMutation = useApproveSuggestedArticle();
  const rejectMutation = useRejectSuggestedArticle();
  const approveAllMutation = useApproveAllSuggestedArticles();
  const rejectAllMutation = useRejectAllSuggestedArticles();

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || t('common.unknown');
  };

  const handleApprove = (suggestion: SuggestedArticle) => {
    approveMutation.mutate(suggestion);
  };

  const handleReject = (suggestionId: string) => {
    rejectMutation.mutate(suggestionId);
  };

  const handleApproveAll = () => {
    if (suggestions && suggestions.length > 0) {
      approveAllMutation.mutate(suggestions as SuggestedArticle[]);
    }
  };

  const handleRejectAll = () => {
    if (suggestions && suggestions.length > 0) {
      rejectAllMutation.mutate(suggestions.map(s => s.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('suggestions.filterBySource', 'Quelle:')}</span>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all', 'Alle')}</SelectItem>
              <SelectItem value="employee_photo">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-purple-500" />
                  {t('suggestions.sourcePhoto', 'Foto-Erfassung')}
                </div>
              </SelectItem>
              <SelectItem value="employee">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('suggestions.sourceEmployee', 'Mitarbeiter')}
                </div>
              </SelectItem>
              <SelectItem value="supplier">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {t('suggestions.sourceSupplier', 'Lieferant')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {suggestions && suggestions.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveAll}
              disabled={approveAllMutation.isPending}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              {approveAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              {t('suggestions.approveAll', 'Alle übernehmen')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              disabled={rejectAllMutation.isPending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {rejectAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              {t('suggestions.rejectAll', 'Alle ablehnen')}
            </Button>
          </div>
        )}
      </div>

      {/* Suggestions List */}
      {!suggestions || suggestions.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('suggestions.noSuggestions', 'Keine Vorschläge vorhanden')}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {t('suggestions.noSuggestionsDesc', 'Vorschläge von Mitarbeitern oder Lieferanten erscheinen hier')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const isPhotoSuggestion = suggestion.source === 'employee_photo';
            
            return (
              <Card key={suggestion.id} className={`p-4 ${isPhotoSuggestion ? 'border-purple-200 dark:border-purple-800' : ''}`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image Preview for photo suggestions */}
                  {suggestion.image_url && (
                    <div 
                      className="relative flex-shrink-0 cursor-pointer group"
                      onClick={() => setPreviewImage(suggestion.image_url)}
                    >
                      <img 
                        src={suggestion.image_url} 
                        alt={suggestion.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                    {/* Source Badge */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {!suggestion.image_url && (
                        <div className={`
                          flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center
                          ${isPhotoSuggestion 
                            ? 'bg-purple-100 dark:bg-purple-900/30'
                            : suggestion.source === 'employee' 
                              ? 'bg-amber-100 dark:bg-amber-900/30' 
                              : 'bg-blue-100 dark:bg-blue-900/30'}
                        `}>
                          {isPhotoSuggestion ? (
                            <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          ) : suggestion.source === 'employee' ? (
                            <PenLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{suggestion.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={isPhotoSuggestion
                              ? 'border-purple-500/50 text-purple-700 dark:text-purple-400'
                              : suggestion.source === 'employee' 
                                ? 'border-amber-500/50 text-amber-700 dark:text-amber-400'
                                : 'border-blue-500/50 text-blue-700 dark:text-blue-400'
                            }
                          >
                            {isPhotoSuggestion ? (
                              <>
                                <Camera className="h-3 w-3 mr-1" />
                                {t('suggestions.sourcePhoto', 'Foto')}
                              </>
                            ) : suggestion.source === 'employee' 
                              ? t('suggestions.sourceEmployee', 'Mitarbeiter')
                              : t('suggestions.sourceSupplier', 'Lieferant')
                            }
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span>{getSupplierName(suggestion.supplier_id)}</span>
                          <span>•</span>
                          <span>{suggestion.unit}</span>
                          {suggestion.category && (
                            <>
                              <span>•</span>
                              <span>{suggestion.category}</span>
                            </>
                          )}
                          {suggestion.price > 0 && (
                            <>
                              <span>•</span>
                              <span>€{suggestion.price.toFixed(2)}</span>
                            </>
                          )}
                        </div>

                        {/* Employee/Supplier info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70 mt-1">
                          {(suggestion.source === 'employee' || isPhotoSuggestion) && suggestion.employees?.name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {suggestion.employees.name}
                            </span>
                          )}
                          <span>
                            {format(new Date(suggestion.created_at), 'dd.MM.yyyy HH:mm', { locale })}
                          </span>
                        </div>

                        {suggestion.supplier_comment && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{suggestion.supplier_comment}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(suggestion)}
                        disabled={approveMutation.isPending}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        {t('suggestions.approve', 'Übernehmen')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(suggestion.id)}
                        disabled={rejectMutation.isPending}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-1" />
                        )}
                        {t('suggestions.reject', 'Ablehnen')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl p-2">
          <DialogTitle className="sr-only">{t('photoCapture.preview', 'Bildvorschau')}</DialogTitle>
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
