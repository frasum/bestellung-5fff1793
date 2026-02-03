import { useState, useCallback, useRef, useEffect } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';

interface CommittedTranscript {
  id: string;
  text: string;
}

interface UseRealtimeScribeOptions {
  token: string;
  language?: string;
  onTranscriptUpdate?: (fullText: string) => void;
  onError?: (error: string) => void;
}

interface UseRealtimeScribeReturn {
  isConnected: boolean;
  isConnecting: boolean;
  partialTranscript: string;
  committedTranscripts: CommittedTranscript[];
  fullTranscript: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
}

export function useRealtimeScribe({
  token,
  language = 'de',
  onTranscriptUpdate,
  onError,
}: UseRealtimeScribeOptions): UseRealtimeScribeReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committedTranscripts, setCommittedTranscripts] = useState<CommittedTranscript[]>([]);
  const transcriptIdCounter = useRef(0);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,
    languageCode: language,
    onPartialTranscript: (data) => {
      console.log('[useRealtimeScribe] Partial:', data.text);
    },
    onCommittedTranscript: (data) => {
      console.log('[useRealtimeScribe] Committed:', data.text);
      const newTranscript: CommittedTranscript = {
        id: `transcript-${transcriptIdCounter.current++}`,
        text: data.text,
      };
      setCommittedTranscripts(prev => [...prev, newTranscript]);
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Transcription error';
      console.error('[useRealtimeScribe] Error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  // Compute full transcript from all committed segments
  const fullTranscript = committedTranscripts.map(t => t.text).join(' ').trim();

  // Notify parent of transcript updates
  useEffect(() => {
    const combined = [fullTranscript, scribe.partialTranscript].filter(Boolean).join(' ').trim();
    onTranscriptUpdate?.(combined);
  }, [fullTranscript, scribe.partialTranscript, onTranscriptUpdate]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setCommittedTranscripts([]);
    transcriptIdCounter.current = 0;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-scribe-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get scribe token');
      }

      const data = await response.json();

      if (!data?.token) {
        throw new Error('No token received from server');
      }

      console.log('[useRealtimeScribe] Connecting with token...');

      // Start the scribe session
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[useRealtimeScribe] Connected successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      console.error('[useRealtimeScribe] Connection error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [token, scribe, onError]);

  const disconnect = useCallback(async () => {
    try {
      scribe.disconnect();
      console.log('[useRealtimeScribe] Disconnected');
    } catch (err) {
      console.error('[useRealtimeScribe] Disconnect error:', err);
    }
  }, [scribe]);

  return {
    isConnected: scribe.isConnected,
    isConnecting,
    partialTranscript: scribe.partialTranscript,
    committedTranscripts,
    fullTranscript,
    connect,
    disconnect,
    error,
  };
}
