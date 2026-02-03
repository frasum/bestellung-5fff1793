import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CommittedTranscript {
  id: string;
  text: string;
}

interface LiveTranscriptDisplayProps {
  partialTranscript: string;
  committedTranscripts: CommittedTranscript[];
  isListening: boolean;
}

export function LiveTranscriptDisplay({
  partialTranscript,
  committedTranscripts,
  isListening,
}: LiveTranscriptDisplayProps) {
  const { t } = useTranslation();

  const hasContent = partialTranscript || committedTranscripts.length > 0;

  if (!hasContent && !isListening) {
    return null;
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      {/* Live transcript area */}
      {(isListening || partialTranscript) && (
        <div className="bg-muted/50 rounded-lg p-4 min-h-[60px] relative">
          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-muted-foreground">
                {t('voice.listening', 'Listening...')}
              </span>
            </div>
          )}
          
          {/* Partial transcript (live text) */}
          <p className={cn(
            "text-base transition-all",
            partialTranscript 
              ? "text-foreground" 
              : "text-muted-foreground italic"
          )}>
            {partialTranscript || (isListening ? t('voice.speakNow', 'Sprechen Sie jetzt...') : '')}
          </p>
        </div>
      )}

      {/* Committed transcripts */}
      {committedTranscripts.length > 0 && (
        <div className="space-y-2">
          <div className="h-px bg-border" />
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {t('voice.recognized', 'Erkannt')}
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {committedTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className="bg-primary/10 text-primary-foreground rounded px-3 py-2 text-sm animate-in slide-in-from-bottom-2 duration-200"
              >
                {transcript.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
