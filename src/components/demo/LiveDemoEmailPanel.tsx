import { useState, useEffect } from 'react';
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
  simulated: { label: 'Simuliert', icon: Eye, color: 'text-violet-500 bg-violet-500/10' },
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
          
          // Immediately add new email to the cache
          queryClient.setQueryData(['communication-logs-demo'], (oldData: CommunicationLog[] | undefined) => {
            if (!oldData) return [newEmail];
            // Add to beginning and avoid duplicates
            if (oldData.some(e => e.id === newEmail.id)) return oldData;
            return [newEmail, ...oldData];
          });
          
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
        (payload) => {
          const updatedEmail = payload.new as CommunicationLog;
          queryClient.setQueryData(['communication-logs-demo'], (oldData: CommunicationLog[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(e => e.id === updatedEmail.id ? updatedEmail : e);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'communication_logs',
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (!deletedId) return;
          queryClient.setQueryData(['communication-logs-demo'], (oldData: CommunicationLog[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.filter(e => e.id !== deletedId);
          });
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const simulatedCount = emails.filter(e => e.status === 'simulated').length;
  const sentCount = emails.filter(e => e.status === 'sent').length;
  const confirmedCount = emails.filter(e => e.confirmed_at).length;
  const failedCount = emails.filter(e => e.status === 'failed').length;

  return (
    <div className="h-full flex flex-col bg-background">

      {/* Email List or Preview */}
      {selectedEmail ? (
        // Email Preview
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-2.5 border-b bg-muted/50">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs truncate">{selectedEmail.subject}</p>
              <p className="text-xs text-muted-foreground truncate">
                An: {selectedEmail.recipient_email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-6 w-6"
              onClick={() => setSelectedEmail(null)}
            >
              <X className="h-3.5 w-3.5" />
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
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1.5">
            {emails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Keine E-Mails</p>
                <p className="text-xs mt-1">E-Mails erscheinen sobald sie generiert werden</p>
              </div>
            ) : (
              emails.map((email) => {
                const status = email.status || 'pending';
                const config = statusConfig[status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const typeLabel = emailTypeLabels[email.email_type] || email.email_type;

                return (
                  <div
                    key={email.id}
                    className={cn(
                      "p-2 rounded-md border cursor-pointer transition-all hover:bg-accent/50",
                      highlightedEmail === email.id && "ring-2 ring-violet-500 animate-pulse bg-violet-500/10",
                      selectedEmail?.id === email.id && "bg-accent"
                    )}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {typeLabel}
                          </Badge>
                          <Badge className={cn("text-xs gap-0.5 h-4 px-1", config.color)}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium truncate">{email.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {email.recipient_name || email.recipient_email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(email.created_at), 'HH:mm', { locale: de })}
                        </span>
                        {email.body_html && (
                          <Eye className="h-3 w-3 text-muted-foreground mt-0.5" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}

    </div>
  );
}
