import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTtsPlayback } from '@/hooks/useTtsPlayback';
import { toast } from 'sonner';

interface MatchedItem {
  name: string;
  quantity: number;
  unit: string;
}

interface TtsReadbackButtonProps {
  items: MatchedItem[];
  token: string;
  autoPlay?: boolean;
}

function formatItemsForSpeech(items: MatchedItem[]): string {
  if (items.length === 0) {
    return 'Keine Artikel erkannt.';
  }

  const itemTexts = items.map(item => {
    // Use simplified unit names for speech
    const unit = item.unit.toLowerCase();
    const unitText = unit === 'stück' || unit === 'stk' ? '' : ` ${item.unit}`;
    return `${item.quantity}${unitText} ${item.name}`;
  });

  if (itemTexts.length === 1) {
    return `Ich habe erkannt: ${itemTexts[0]}.`;
  }

  const lastItem = itemTexts.pop();
  return `Ich habe erkannt: ${itemTexts.join(', ')} und ${lastItem}.`;
}

export function TtsReadbackButton({ items, token, autoPlay = true }: TtsReadbackButtonProps) {
  const { t } = useTranslation();
  const hasAutoPlayed = useRef(false);
  
  const { speak, stop, isPlaying, isLoading } = useTtsPlayback({
    token,
    onError: (error) => {
      console.error('[TtsReadbackButton] TTS error:', error);
      // Silent fail - don't show toast for TTS errors as it's not critical
    },
  });

  const speechText = formatItemsForSpeech(items);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && items.length > 0 && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        speak(speechText);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, items.length, speak, speechText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const handleClick = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(speechText);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('voice.loading', 'Loading...')}
        </>
      ) : isPlaying ? (
        <>
          <VolumeX className="h-4 w-4" />
          {t('voice.stopReadback', 'Stop')}
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          {t('voice.readAloud', 'Read aloud')}
        </>
      )}
    </Button>
  );
}
