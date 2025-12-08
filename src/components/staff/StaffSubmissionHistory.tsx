import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Check, X, Mic, Camera, FileText, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('staffOrders.noSubmissions')}</p>
      </div>
    );
  }

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
      default:
        return <FileText className="h-4 w-4" />;
    }
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
                  {submission.submission_type === 'voice' ? t('staffOrders.voice') : 
                   submission.submission_type === 'photo' ? t('staffOrders.photo') : 'Manual'}
                </span>
              </div>
              {getStatusBadge(submission.status)}
            </div>

            {showSubmitter && submission.submitter && (
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
