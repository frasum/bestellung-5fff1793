import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Eye,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface CommunicationLog {
  id: string;
  email_type: string;
  direction: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
  body_html: string | null;
}

const emailTypeLabels: Record<string, string> = {
  order_sent: 'Bestellung',
  order_confirmed: 'Bestätigung',
  preorder_received: 'Vorbestellung',
  invitation: 'Einladung',
  magic_link: 'Magic Link',
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Wartend', icon: Clock, color: 'text-yellow-500 bg-yellow-500/10' },
  sent: { label: 'Gesendet', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  failed: { label: 'Fehlgeschlagen', icon: AlertCircle, color: 'text-red-500 bg-red-500/10' },
  confirmed: { label: 'Bestätigt', icon: CheckCircle2, color: 'text-blue-500 bg-blue-500/10' },
};

interface LiveDemoEmailPanelProps {
  soundEnabled: boolean;
}

export function LiveDemoEmailPanel({ soundEnabled }: LiveDemoEmailPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<CommunicationLog | null>(null);
  const [highlightedEmail, setHighlightedEmail] = useState<string | null>(null);
  const prevCountRef = useRef(0);

  // Fetch communication logs
  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['communication-logs-demo'],
    queryFn: async () => {
      // Get emails from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching communication logs:', error);
        throw error;
      }

      return data as CommunicationLog[];
    },
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('live-demo-emails')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communication_logs',
        },
        (payload) => {
          const newEmail = payload.new as CommunicationLog;
          
          // Invalidate query to refetch
          queryClient.invalidateQueries({ queryKey: ['communication-logs-demo'] });
          
          // Highlight new email
          setHighlightedEmail(newEmail.id);
          
          if (soundEnabled) {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          }
          
          toast.info('Neue E-Mail generiert', {
            description: newEmail.subject,
          });
          
          setTimeout(() => setHighlightedEmail(null), 3000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'communication_logs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['communication-logs-demo'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, soundEnabled]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Email List or Preview */}
      {selectedEmail ? (
        // Email Preview
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedEmail.subject}</p>
              <p className="text-xs text-muted-foreground truncate">
                An: {selectedEmail.recipient_email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setSelectedEmail(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedEmail.body_html ? (
              <iframe
                srcDoc={selectedEmail.body_html}
                className="w-full h-full border-0 bg-white"
                title="E-Mail Vorschau"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Kein E-Mail-Inhalt verfügbar</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Email List
        <ScrollArea className="flex-1 p-4">
          {emails.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine E-Mails</p>
                <p className="text-sm">E-Mails erscheinen hier sobald sie generiert werden</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => {
                const status = email.status || 'pending';
                const config = statusConfig[status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const typeLabel = emailTypeLabels[email.email_type] || email.email_type;

                return (
                  <div
                    key={email.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50",
                      highlightedEmail === email.id && "ring-2 ring-violet-500 animate-pulse bg-violet-500/10",
                      selectedEmail?.id === email.id && "bg-accent"
                    )}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {typeLabel}
                          </Badge>
                          <Badge className={cn("text-xs gap-1 shrink-0", config.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{email.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {email.recipient_name || email.recipient_email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(email.created_at), 'HH:mm', { locale: de })}
                        </span>
                        {email.body_html && (
                          <Eye className="h-3 w-3 text-muted-foreground mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Summary Footer */}
      <div className="border-t p-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 rounded bg-green-500/10">
          <p className="text-green-600 font-bold">{emails.filter(e => e.status === 'sent').length}</p>
          <p className="text-xs text-muted-foreground">Gesendet</p>
        </div>
        <div className="p-2 rounded bg-blue-500/10">
          <p className="text-blue-600 font-bold">{emails.filter(e => e.confirmed_at).length}</p>
          <p className="text-xs text-muted-foreground">Bestätigt</p>
        </div>
        <div className="p-2 rounded bg-red-500/10">
          <p className="text-red-600 font-bold">{emails.filter(e => e.status === 'failed').length}</p>
          <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
        </div>
      </div>
    </div>
  );
}
