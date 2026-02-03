import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errorUtils';

interface UseTtsPlaybackOptions {
  token: string;
  onError?: (error: string) => void;
}

interface UseTtsPlaybackReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
}

export function useTtsPlayback({ token, onError }: UseTtsPlaybackOptions): UseTtsPlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) {
      return;
    }

    // Stop any currently playing audio
    stop();

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { token, text },
      });

      if (error) {
        throw new Error(error.message || 'TTS request failed');
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Use data URI for playback (browser handles base64 decoding)
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
        onError?.('Audio playback failed');
      };

      await audio.play();

    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('[useTtsPlayback] Error:', message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, stop, onError]);

  return {
    speak,
    stop,
    isPlaying,
    isLoading,
  };
}
