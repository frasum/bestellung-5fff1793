import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Check, X, Mic, Camera, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EmployeeOrderSubmission } from '@/hooks/useEmployeeSubmissions';

interface StaffSubmissionHistoryProps {
  submissions: EmployeeOrderSubmission[];
}

export default function StaffSubmissionHistory({ submissions }: StaffSubmissionHistoryProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Noch keine Bestellungen eingereicht</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="secondary">Ausstehend</Badge>;
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
        <Card key={submission.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(submission.submission_type)}
                <span className="text-sm font-medium">
                  {submission.submission_type === 'voice' ? 'Sprachbestellung' : 
                   submission.submission_type === 'photo' ? 'Foto-Bestellung' : 'Manuelle Bestellung'}
                </span>
              </div>
              {getStatusBadge(submission.status)}
            </div>

            {submission.transcription && (
              <p className="text-sm text-muted-foreground italic mb-3">
                "{submission.transcription}"
              </p>
            )}

            {submission.items && submission.items.length > 0 && (
              <div className="space-y-1 mb-3">
                {submission.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm flex justify-between">
                    <span>{item.article?.name || item.recognized_text || 'Unbekannter Artikel'}</span>
                    <span className="text-muted-foreground">
                      {item.quantity} {item.article?.unit || 'Stk'}
                    </span>
                  </div>
                ))}
                {submission.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{submission.items.length - 3} weitere Artikel
                  </p>
                )}
              </div>
            )}

            {submission.review_notes && submission.status === 'rejected' && (
              <div className="p-2 bg-destructive/10 rounded text-sm text-destructive mb-3">
                Grund: {submission.review_notes}
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
