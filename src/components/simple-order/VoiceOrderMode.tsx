import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { VoiceOrderResults, MatchedItem } from './VoiceOrderResults';
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

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'results' | 'error';

export function VoiceOrderMode({ 
  articles, 
  language, 
  token,
  onBack, 
  onAddToCart 
}: VoiceOrderModeProps) {
  const { t } = useTranslation();
  const { state: recorderState, startRecording, stopRecording, reset } = useVoiceRecorder();
  
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync recorder state with status
  useEffect(() => {
    if (recorderState.isRecording) {
      setStatus('recording');
    } else if (recorderState.error) {
      setError(recorderState.error);
      setStatus('error');
    }
  }, [recorderState.isRecording, recorderState.error]);

  const handleMicPress = async () => {
    if (status === 'recording') {
      // Stop recording and process
      setStatus('processing');
      const audioBlob = await stopRecording();
      
      if (!audioBlob) {
        setError(t('voice.noAudioCaptured', 'No audio captured'));
        setStatus('error');
        return;
      }

      try {
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        const audioBase64 = await base64Promise;

        // Call edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-order`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              audioBase64,
              articles: articles.map(a => ({
                id: a.id,
                name: a.name,
                unit: a.unit,
                order_unit_name: a.order_unit_name,
              })),
              language: language.substring(0, 2), // Use first 2 chars (e.g., 'th' from 'th-TH')
              token, // Include token for authentication
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process audio');
        }

        const result = await response.json();
        setTranscript(result.transcript || '');
        setMatchedItems(result.items || []);
        setStatus('results');

      } catch (err) {
        console.error('Voice processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process voice input');
        setStatus('error');
      }
    } else {
      // Start recording
      setError(null);
      setTranscript('');
      setMatchedItems([]);
      await startRecording();
    }
  };

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

  const handleRetry = () => {
    reset();
    setStatus('idle');
    setError(null);
    setTranscript('');
    setMatchedItems([]);
  };

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
        <span className="ml-auto text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
          {t('voice.prototype', 'Prototype')}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
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
            status === 'recording' && "bg-destructive animate-pulse",
            status === 'processing' && "bg-muted cursor-not-allowed",
            status === 'error' && "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {status === 'processing' ? (
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
          ) : status === 'recording' ? (
            <MicOff className="h-12 w-12 text-destructive-foreground" />
          ) : (
            <Mic className="h-12 w-12" />
          )}
          
          {/* Recording ring animation */}
          {status === 'recording' && (
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
            {status === 'recording' && t('voice.listening', 'Listening...')}
            {status === 'processing' && t('voice.processing', 'Processing...')}
            {status === 'error' && t('voice.tapToRetry', 'Tap to try again')}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {status === 'idle' && t('voice.instruction', 'Say your order clearly, e.g. "3 pineapples and 2 boxes of mangos"')}
            {status === 'recording' && t('voice.tapToStop', 'Tap again when finished')}
            {status === 'processing' && t('voice.pleaseWait', 'Please wait...')}
          </p>
        </div>
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
