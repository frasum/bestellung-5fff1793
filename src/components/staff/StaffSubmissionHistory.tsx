import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Check, X, Mic, Camera, FileText, User, ShoppingCart, CheckCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useArticles } from '@/hooks/useArticles';
import { useToast } from '@/hooks/use-toast';
import { useApproveSubmission } from '@/hooks/useEmployeeSubmissions';
import type { EmployeeOrderSubmission } from '@/hooks/useEmployeeSubmissions';

interface StaffSubmissionHistoryProps {
  submissions: EmployeeOrderSubmission[];
  onSubmissionClick?: (submission: EmployeeOrderSubmission) => void;
  showSubmitter?: boolean;
}

export default function StaffSubmissionHistory({ 
  submissions, 
  onSubmissionClick,
  showSubmitter = false 
}: StaffSubmissionHistoryProps) {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const { data: articles = [] } = useArticles();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addedSubmissionIds, setAddedSubmissionIds] = useState<string[]>([]);
  const approveSubmission = useApproveSubmission();

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('staffOrders.noSubmissions')}</p>
      </div>
    );
  }

  const handleAddToCart = async (e: React.MouseEvent, submission: EmployeeOrderSubmission) => {
    e.stopPropagation(); // Prevent card click
    
    if (!submission.items || submission.items.length === 0) {
      toast({
        title: t('common.error'),
        description: 'Keine Artikel in dieser Einreichung',
        variant: 'destructive',
      });
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    submission.items.forEach((item) => {
      if (item.article_id) {
        // Find the full article from our articles list
        const fullArticle = articles.find(a => a.id === item.article_id);
        if (fullArticle) {
          addItem(fullArticle, item.quantity);
          addedCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    });

    if (addedCount > 0) {
      setAddedSubmissionIds(prev => [...prev, submission.id]);
      
      // Auto-approve pending kiosk orders when added to cart
      if (submission.status === 'pending' && submission.submission_type === 'simple') {
        try {
          await approveSubmission.mutateAsync(submission.id);
        } catch (error) {
          console.error('Failed to auto-approve submission:', error);
        }
      }
      
      toast({
        title: 'In Warenkorb übernommen',
        description: `${addedCount} Artikel wurden zum Warenkorb hinzugefügt${skippedCount > 0 ? ` (${skippedCount} ohne Artikelzuordnung übersprungen)` : ''}`,
        action: (
          <Button size="sm" variant="outline" onClick={() => navigate('/cart')}>
            Zum Warenkorb
          </Button>
        ),
      });
    } else {
      toast({
        title: 'Keine Artikel übernommen',
        description: 'Alle Artikel in dieser Einreichung haben keine Artikelzuordnung',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">{t('staffOrders.status.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('staffOrders.status.rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{t('staffOrders.status.pending')}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="h-4 w-4" />;
      case 'photo':
        return <Camera className="h-4 w-4" />;
      case 'simple':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'voice':
        return t('staffOrders.voice');
      case 'photo':
        return t('staffOrders.photo');
      case 'simple':
        return 'Kiosk';
      default:
        return 'Manual';
    }
  };

  const getEmployeeName = (submission: EmployeeOrderSubmission): string | null => {
    const sourceData = submission.source_data as { employee_name?: string } | null;
    return sourceData?.employee_name || null;
  };

  const getSupplierName = (submission: EmployeeOrderSubmission): string | null => {
    const sourceData = submission.source_data as { supplier_name?: string } | null;
    return sourceData?.supplier_name || null;
  };

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card 
          key={submission.id} 
          className={onSubmissionClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
          onClick={() => onSubmissionClick?.(submission)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(submission.submission_type)}
                <span className="text-sm font-medium">
                  {getTypeName(submission.submission_type)}
                </span>
                {/* Show supplier name for simple orders */}
                {submission.submission_type === 'simple' && getSupplierName(submission) && (
                  <Badge variant="outline" className="text-xs">
                    {getSupplierName(submission)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(submission.status)}
                {/* Show cart button for approved orders OR for pending kiosk orders (for quick processing) */}
                {submission.items && submission.items.length > 0 && 
                 (submission.status === 'approved' || (submission.status === 'pending' && submission.submission_type === 'simple')) && (
                  <>
                    {addedSubmissionIds.includes(submission.id) && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span className="hidden sm:inline">Im Warenkorb</span>
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={submission.status === 'pending' ? 'default' : 'outline'}
                      className="h-7 gap-1.5 text-xs"
                      onClick={(e) => handleAddToCart(e, submission)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        {addedSubmissionIds.includes(submission.id) ? 'Erneut hinzufügen' : 'In Warenkorb'}
                      </span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Show employee name for simple orders or submitter for other types */}
            {submission.submission_type === 'simple' && getEmployeeName(submission) ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                <User className="h-4 w-4 text-primary" />
                <span>👤 {getEmployeeName(submission)}</span>
              </div>
            ) : showSubmitter && submission.submitter && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <User className="h-3 w-3" />
                <span>{submission.submitter.full_name || submission.submitter.email}</span>
              </div>
            )}

            {submission.transcription && (
              <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                "{submission.transcription}"
              </p>
            )}

            {submission.items && submission.items.length > 0 && (
              <div className="space-y-1 mb-3">
                {submission.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm flex justify-between">
                    <span>{item.article?.name || item.recognized_text || t('common.unknown')}</span>
                    <span className="text-muted-foreground">
                      {item.quantity} {item.article?.unit || 'Stk'}
                    </span>
                  </div>
                ))}
                {submission.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{submission.items.length - 3} {t('orders.moreItems', { count: submission.items.length - 3 })}
                  </p>
                )}
              </div>
            )}

            {submission.review_notes && submission.status === 'rejected' && (
              <div className="p-2 bg-destructive/10 rounded text-sm text-destructive mb-3">
                {submission.review_notes}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {format(new Date(submission.created_at), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
