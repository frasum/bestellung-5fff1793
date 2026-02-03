import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, ArrowLeft, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealtimeScribe } from '@/hooks/useRealtimeScribe';
import { VoiceOrderResults, MatchedItem } from './VoiceOrderResults';
import { LiveTranscriptDisplay } from './LiveTranscriptDisplay';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  name: string;
  unit: string;
  order_unit_name?: string;
}

interface VoiceOrderModeProps {
  articles: Article[];
  language: string;
  token: string;
  onBack: () => void;
  onAddToCart: (items: { articleId: string; quantity: number }[]) => void;
}

type VoiceStatus = 'idle' | 'transcribing' | 'processing' | 'results' | 'error';

export function VoiceOrderMode({ 
  articles, 
  language, 
  token,
  onBack, 
  onAddToCart 
}: VoiceOrderModeProps) {
  const { t } = useTranslation();
  
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scribe = useRealtimeScribe({
    token,
    language: language.substring(0, 2),
    onTranscriptUpdate: (text) => {
      setTranscript(text);
    },
    onError: (err) => {
      setError(err);
      setStatus('error');
    },
  });

  const handleStartTranscription = useCallback(async () => {
    setError(null);
    setTranscript('');
    setMatchedItems([]);
    setStatus('transcribing');
    
    try {
      await scribe.connect();
    } catch (err) {
      console.error('Failed to start transcription:', err);
      setError(err instanceof Error ? err.message : 'Failed to start transcription');
      setStatus('error');
    }
  }, [scribe]);

  const handleFinishTranscription = useCallback(async () => {
    // Disconnect from realtime scribe
    await scribe.disconnect();
    
    const finalTranscript = scribe.fullTranscript;
    
    if (!finalTranscript || finalTranscript.trim() === '') {
      setError(t('voice.noSpeechDetected', 'No speech detected'));
      setStatus('error');
      return;
    }

    setStatus('processing');
    setTranscript(finalTranscript);

    try {
      // Call transcribe-order edge function for AI matching (skip audio, use text directly)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            // We pass a minimal audio placeholder since we already have the transcript
            // The edge function will still do AI matching
            transcript: finalTranscript,
            articles: articles.map(a => ({
              id: a.id,
              name: a.name,
              unit: a.unit,
              order_unit_name: a.order_unit_name,
            })),
            language: language.substring(0, 2),
            token,
            skipTranscription: true, // Signal to skip Whisper and use provided transcript
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process order');
      }

      const result = await response.json();
      setMatchedItems(result.items || []);
      setStatus('results');

    } catch (err) {
      console.error('Voice processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process voice input');
      setStatus('error');
    }
  }, [scribe, articles, language, token, t]);

  const handleMicPress = useCallback(async () => {
    if (status === 'transcribing') {
      await handleFinishTranscription();
    } else {
      await handleStartTranscription();
    }
  }, [status, handleStartTranscription, handleFinishTranscription]);

  const handleConfirm = (items: MatchedItem[]) => {
    const cartItems = items
      .filter(item => item.quantity > 0)
      .map(item => ({
        articleId: item.article_id,
        quantity: item.quantity,
      }));
    
    if (cartItems.length > 0) {
      onAddToCart(cartItems);
    }
    onBack();
  };

  const handleRetry = useCallback(() => {
    scribe.disconnect();
    setStatus('idle');
    setError(null);
    setTranscript('');
    setMatchedItems([]);
  }, [scribe]);

  // Results view
  if (status === 'results') {
    return (
      <VoiceOrderResults
        transcript={transcript}
        items={matchedItems}
        articles={articles}
        onConfirm={handleConfirm}
        onRetry={handleRetry}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {t('voice.title', 'Voice Order')}
        </h1>
        <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {t('voice.realtime', 'Live')}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="max-w-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Microphone button */}
        <button
          onClick={handleMicPress}
          disabled={status === 'processing'}
          className={cn(
            "relative h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300",
            "touch-manipulation",
            status === 'idle' && "bg-primary hover:bg-primary/90 text-primary-foreground",
            status === 'transcribing' && "bg-destructive",
            status === 'processing' && "bg-muted cursor-not-allowed",
            status === 'error' && "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {status === 'processing' ? (
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          ) : status === 'transcribing' ? (
            <MicOff className="h-12 w-12 text-destructive-foreground" />
          ) : (
            <Mic className="h-12 w-12" />
          )}
          
          {/* Recording ring animation */}
          {status === 'transcribing' && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
              <span className="absolute inset-[-8px] rounded-full border-2 border-destructive/50 animate-pulse" />
            </>
          )}
        </button>

        {/* Status text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">
            {status === 'idle' && t('voice.tapToStart', 'Tap to start speaking')}
            {status === 'transcribing' && t('voice.listening', 'Listening...')}
            {status === 'processing' && t('voice.processing', 'Processing...')}
            {status === 'error' && t('voice.tapToRetry', 'Tap to try again')}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {status === 'idle' && t('voice.instruction', 'Say your order clearly, e.g. "3 pineapples and 2 boxes of mangos"')}
            {status === 'transcribing' && t('voice.tapToFinish', 'Tap mic when finished')}
            {status === 'processing' && t('voice.pleaseWait', 'Please wait...')}
          </p>
        </div>

        {/* Live transcript display */}
        {(status === 'transcribing' || transcript) && (
          <LiveTranscriptDisplay
            partialTranscript={scribe.partialTranscript}
            committedTranscripts={scribe.committedTranscripts}
            isListening={status === 'transcribing'}
          />
        )}

        {/* Finish button when transcribing */}
        {status === 'transcribing' && (
          <Button
            onClick={handleFinishTranscription}
            className="h-14 px-8 text-lg"
            variant="default"
          >
            <Check className="h-5 w-5 mr-2" />
            {t('voice.finish', 'Fertig')}
          </Button>
        )}
      </div>

      {/* Back button */}
      <div className="p-4 pb-safe">
        <Button 
          variant="outline" 
          className="w-full h-12" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('voice.backToList', 'Back to article list')}
        </Button>
      </div>
    </div>
  );
}
