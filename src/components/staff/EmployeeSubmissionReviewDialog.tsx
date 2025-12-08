import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertCircle, User, Clock, Mic, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useArticles } from '@/hooks/useArticles';
import { useApproveSubmission, useRejectSubmission, useUpdateSubmissionItem, EmployeeOrderSubmission } from '@/hooks/useEmployeeSubmissions';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface EmployeeSubmissionReviewDialogProps {
  submission: EmployeeOrderSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmployeeSubmissionReviewDialog({
  submission,
  open,
  onOpenChange,
}: EmployeeSubmissionReviewDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: articles = [] } = useArticles();
  const { addItem } = useCart();
  const approveSubmission = useApproveSubmission();
  const rejectSubmission = useRejectSubmission();
  const updateItem = useUpdateSubmissionItem();
  
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<typeof submission['items']>([]);

  // Sync local items when submission changes
  if (submission && localItems !== submission.items) {
    setLocalItems(submission.items || []);
  }

  if (!submission) return null;

  const handleApprove = async () => {
    try {
      await approveSubmission.mutateAsync(submission.id);
      
      // Add items to cart
      for (const item of localItems) {
        if (item.article_id) {
          const article = articles.find(a => a.id === item.article_id);
          if (article) {
            addItem(article, Number(item.quantity));
          }
        }
      }
      
      toast({
        title: t('staffOrders.approved'),
        description: t('staffOrders.itemsAddedToCart'),
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('staffOrders.approveError'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectSubmission.mutateAsync({
        submissionId: submission.id,
        notes: rejectNotes,
      });
      
      toast({
        title: t('staffOrders.rejected'),
        description: t('staffOrders.rejectionSent'),
      });
      
      setShowRejectForm(false);
      setRejectNotes('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('staffOrders.rejectError'),
        variant: 'destructive',
      });
    }
  };

  const handleItemChange = async (itemId: string, field: 'article_id' | 'quantity', value: string | number) => {
    // Update locally first
    setLocalItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
    
    // Then persist to database
    try {
      const item = localItems.find(i => i.id === itemId);
      if (item) {
        await updateItem.mutateAsync({
          itemId,
          article_id: field === 'article_id' ? String(value) : item.article_id,
          quantity: field === 'quantity' ? Number(value) : item.quantity,
        });
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const getArticleName = (articleId: string | null) => {
    if (!articleId) return t('staffOrders.unrecognized');
    const article = articles.find(a => a.id === articleId);
    return article?.name || t('common.unknown');
  };

  const getConfidenceBadge = (confidence: number | null) => {
    if (!confidence) return null;
    if (confidence >= 0.8) {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">Hoch</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Mittel</Badge>;
    }
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Niedrig</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('staffOrders.reviewSubmission')}
            <Badge variant={submission.status === 'pending' ? 'secondary' : submission.status === 'approved' ? 'default' : 'destructive'}>
              {t(`staffOrders.status.${submission.status}`)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Submission Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{submission.submitter?.full_name || submission.submitter?.email || t('common.unknown')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {submission.submission_type === 'voice' ? (
                <Mic className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <span>{submission.submission_type === 'voice' ? t('staffOrders.voice') : t('staffOrders.photo')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(submission.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
            </div>
          </div>

          {/* Transcription */}
          {submission.transcription && (
            <div className="bg-muted/50 rounded-lg p-3">
              <Label className="text-xs text-muted-foreground mb-1 block">{t('staffOrders.transcription')}</Label>
              <p className="text-sm">{submission.transcription}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <Label>{t('staffOrders.recognizedItems')}</Label>
            <div className="border rounded-lg divide-y">
              {localItems.map((item) => (
                <div key={item.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t('staffOrders.recognized')}:</span>
                        <span className="text-sm font-medium">{item.recognized_text || '-'}</span>
                        {getConfidenceBadge(item.confidence)}
                        {item.admin_corrected && (
                          <Badge variant="outline" className="text-xs">{t('staffOrders.corrected')}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {submission.status === 'pending' ? (
                    <div className="flex gap-2 items-center">
                      <Select
                        value={item.article_id || 'unassigned'}
                        onValueChange={(value) => handleItemChange(item.id, 'article_id', value === 'unassigned' ? '' : value)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder={t('staffOrders.selectArticle')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <AlertCircle className="h-4 w-4" />
                              {t('staffOrders.unassigned')}
                            </span>
                          </SelectItem>
                          {articles.map((article) => (
                            <SelectItem key={article.id} value={article.id}>
                              <span className="flex items-center gap-2">
                                {article.name}
                                {article.sku && <span className="text-muted-foreground text-xs">({article.sku})</span>}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                        className="w-20 h-9"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center text-sm">
                      <span className="font-medium">{getArticleName(item.article_id)}</span>
                      <span className="text-muted-foreground">×</span>
                      <span>{item.quantity}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reject Notes */}
          {showRejectForm && (
            <div className="space-y-2">
              <Label>{t('staffOrders.rejectReason')}</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder={t('staffOrders.rejectReasonPlaceholder')}
                className="min-h-[80px]"
              />
            </div>
          )}

          {/* Review Notes (if already reviewed) */}
          {submission.review_notes && (
            <div className="bg-muted/50 rounded-lg p-3">
              <Label className="text-xs text-muted-foreground mb-1 block">{t('staffOrders.reviewNotes')}</Label>
              <p className="text-sm">{submission.review_notes}</p>
            </div>
          )}
        </div>

        {submission.status === 'pending' && (
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            {showRejectForm ? (
              <>
                <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={rejectSubmission.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('staffOrders.confirmReject')}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRejectForm(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('staffOrders.reject')}
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={approveSubmission.isPending || localItems.some(i => !i.article_id)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t('staffOrders.approve')}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
