import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { industryTemplates } from '@/data/industryTemplates';
import { cn } from '@/lib/utils';

interface VoiceIndustrySelectorProps {
  open: boolean;
  onClose: () => void;
  onIndustrySelected: (industryId: string) => void;
}

export function VoiceIndustrySelector({ open, onClose, onIndustrySelected }: VoiceIndustrySelectorProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [selectedIndustryName, setSelectedIndustryName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    clientTools: {
      select_industry: (params: { industry_id: string; industry_name: string }) => {
        console.log('Industry selected:', params);
        setSelectedIndustryName(params.industry_name);
        
        // Delay to let the agent finish speaking
        setTimeout(() => {
          onIndustrySelected(params.industry_id);
          conversation.endSession();
          onClose();
        }, 2000);
        
        return `Branche "${params.industry_name}" wurde ausgewählt. Das Onboarding wird jetzt fortgesetzt.`;
      },
      list_industries: () => {
        return industryTemplates.map(t => `${t.id}: ${t.name} - ${t.description}`).join('\n');
      },
    },
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setIsConnecting(false);
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setIsConnecting(false);
    },
    onMessage: (message) => {
      console.log('Message:', message);
      const msg = message as unknown as { type?: string; user_transcription_event?: { user_transcript?: string }; agent_response_event?: { agent_response?: string } };
      if (msg.type === 'user_transcript') {
        const userText = msg.user_transcription_event?.user_transcript;
        if (userText) {
          setTranscript(prev => [...prev, `Du: ${userText}`]);
        }
      } else if (msg.type === 'agent_response') {
        const agentText = msg.agent_response_event?.agent_response;
        if (agentText) {
          setTranscript(prev => [...prev, `Assistent: ${agentText}`]);
        }
      }
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setTranscript([]);
    setError(null);
    setSelectedIndustryName(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-industry-token');

      if (fnError || !data?.token) {
        throw new Error(fnError?.message || 'Kein Token erhalten');
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Auto-start when dialog opens
  useEffect(() => {
    if (open && conversation.status === 'disconnected' && !isConnecting) {
      startConversation();
    }
  }, [open, conversation.status, isConnecting, startConversation]);

  // Cleanup on close
  useEffect(() => {
    if (!open && conversation.status === 'connected') {
      stopConversation();
    }
  }, [open, conversation.status, stopConversation]);

  const handleClose = () => {
    if (conversation.status === 'connected') {
      stopConversation();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Sprachauswahl</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Microphone visualization */}
          <div className="relative">
            <div
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
                conversation.status === 'connected'
                  ? conversation.isSpeaking
                    ? 'bg-primary/20 ring-4 ring-primary/30'
                    : 'bg-primary/10 ring-4 ring-primary/20 animate-pulse'
                  : 'bg-muted'
              )}
            >
              {conversation.status === 'connected' ? (
                conversation.isSpeaking ? (
                  <Volume2 className="w-10 h-10 text-primary animate-pulse" />
                ) : (
                  <Mic className="w-10 h-10 text-primary" />
                )
              ) : isConnecting ? (
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <MicOff className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            
            {/* Pulsing rings when listening */}
            {conversation.status === 'connected' && !conversation.isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                <div className="absolute inset-[-8px] rounded-full border border-primary/20 animate-pulse" />
              </>
            )}
          </div>

          {/* Status text */}
          <div className="text-center space-y-1">
            {isConnecting && (
              <p className="text-muted-foreground">Verbindung wird hergestellt...</p>
            )}
            {conversation.status === 'connected' && !conversation.isSpeaking && !selectedIndustryName && (
              <p className="text-muted-foreground">Ich höre zu...</p>
            )}
            {conversation.status === 'connected' && conversation.isSpeaking && (
              <p className="text-muted-foreground">Assistent spricht...</p>
            )}
            {selectedIndustryName && (
              <p className="text-primary font-medium">
                ✓ {selectedIndustryName} ausgewählt
              </p>
            )}
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
          </div>

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="w-full max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-3 space-y-2">
              {transcript.slice(-4).map((line, index) => (
                <p
                  key={index}
                  className={cn(
                    'text-sm',
                    line.startsWith('Du:') ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {error && (
              <Button onClick={startConversation} disabled={isConnecting}>
                <Mic className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
