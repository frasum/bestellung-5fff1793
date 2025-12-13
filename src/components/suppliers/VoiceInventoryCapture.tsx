import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface ExtractedArticle {
  name: string;
  quantity?: number;
  unit: string;
  size?: string;
  category: string;
  suggested_order_unit?: string;
  confidence: 'high' | 'medium' | 'low';
}

interface VoiceInventoryCaptureProps {
  language: string;
  onResult: (transcript: string, articles: ExtractedArticle[]) => void;
  onError?: (error: string) => void;
}

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'error';

const MAX_RECORDING_TIME = 180; // 3 minutes in seconds

export function VoiceInventoryCapture({ 
  language, 
  onResult,
  onError,
}: VoiceInventoryCaptureProps) {
  const { t } = useTranslation();
  const { state: recorderState, startRecording, stopRecording, reset } = useVoiceRecorder();
  
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Sync recorder state with status
  useEffect(() => {
    if (recorderState.isRecording) {
      setStatus('recording');
    } else if (recorderState.error) {
      setError(recorderState.error);
      setStatus('error');
      onError?.(recorderState.error);
    }
  }, [recorderState.isRecording, recorderState.error, onError]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (status === 'recording') {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const handleStopRecording = async () => {
    setStatus('processing');
    const audioBlob = await stopRecording();
    
    if (!audioBlob) {
      setError(t('voiceInventory.noAudioCaptured', 'Keine Audioaufnahme erkannt'));
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
      const { data, error: fnError } = await supabase.functions.invoke('transcribe-inventory', {
        body: {
          audioBase64,
          language: language.substring(0, 2),
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to process audio');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      onResult(data.transcript || '', data.articles || []);

    } catch (err) {
      console.error('Voice processing error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Fehler bei der Verarbeitung';
      setError(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
    }
  };

  const handleMicPress = async () => {
    if (status === 'recording') {
      await handleStopRecording();
    } else {
      // Start recording
      setError(null);
      setRecordingTime(0);
      await startRecording();
    }
  };

  const handleRetry = () => {
    reset();
    setStatus('idle');
    setError(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recording timer */}
      {status === 'recording' && (
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-primary">
            {formatTime(recordingTime)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {t('voiceInventory.maxDuration', 'max. {{max}} Minuten', { max: MAX_RECORDING_TIME / 60 })}
          </div>
        </div>
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
          {status === 'idle' && t('voiceInventory.tapToStart', 'Tippen zum Starten')}
          {status === 'recording' && t('voiceInventory.listening', 'Aufnahme läuft...')}
          {status === 'processing' && t('voiceInventory.processing', 'Wird analysiert...')}
          {status === 'error' && t('voiceInventory.tapToRetry', 'Tippen zum Wiederholen')}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {status === 'idle' && t('voiceInventory.instruction', 'Beschreibe dein Inventar, z.B. "Drei 50L-Fässer Helmbier, zwei Träger Cola..."')}
          {status === 'recording' && t('voiceInventory.tapToStop', 'Tippen wenn fertig')}
          {status === 'processing' && t('voiceInventory.pleaseWait', 'Die KI extrahiert die Artikel...')}
        </p>
      </div>

      {/* Retry button for error state */}
      {status === 'error' && (
        <button
          onClick={handleRetry}
          className="text-sm text-primary hover:underline"
        >
          {t('voiceInventory.retry', 'Erneut versuchen')}
        </button>
      )}
    </div>
  );
}
