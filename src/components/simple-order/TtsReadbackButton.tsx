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
  language?: string;
  autoPlay?: boolean;
}

// Localized phrases for TTS readback
const readbackPhrases: Record<string, { prefix: string; and: string; noItems: string; skipUnits: string[] }> = {
  de: { 
    prefix: 'Ich habe erkannt:', 
    and: 'und', 
    noItems: 'Keine Artikel erkannt.',
    skipUnits: ['stück', 'stk']
  },
  th: { 
    prefix: 'ฉันได้รับ:', 
    and: 'และ', 
    noItems: 'ไม่พบรายการ',
    skipUnits: ['ชิ้น']
  },
  en: { 
    prefix: 'I recognized:', 
    and: 'and', 
    noItems: 'No items recognized.',
    skipUnits: ['piece', 'pieces', 'pcs']
  },
  fr: { 
    prefix: 'J\'ai reconnu:', 
    and: 'et', 
    noItems: 'Aucun article reconnu.',
    skipUnits: ['pièce', 'pièces']
  },
  vi: { 
    prefix: 'Tôi đã nhận:', 
    and: 'và', 
    noItems: 'Không có mặt hàng nào.',
    skipUnits: ['cái', 'chiếc']
  },
};

function formatItemsForSpeech(items: MatchedItem[], language: string): string {
  const langCode = language.substring(0, 2);
  const phrases = readbackPhrases[langCode] || readbackPhrases.de;
  
  if (items.length === 0) {
    return phrases.noItems;
  }

  const itemTexts = items.map(item => {
    const unit = item.unit.toLowerCase();
    const skipUnit = phrases.skipUnits.some(u => unit.includes(u));
    const unitText = skipUnit ? '' : ` ${item.unit}`;
    return `${item.quantity}${unitText} ${item.name}`;
  });

  if (itemTexts.length === 1) {
    return `${phrases.prefix} ${itemTexts[0]}.`;
  }

  const lastItem = itemTexts.pop();
  return `${phrases.prefix} ${itemTexts.join(', ')} ${phrases.and} ${lastItem}.`;
}

export function TtsReadbackButton({ items, token, language = 'de', autoPlay = true }: TtsReadbackButtonProps) {
  const { t } = useTranslation();
  const hasAutoPlayed = useRef(false);
  
  const { speak, stop, isPlaying, isLoading } = useTtsPlayback({
    token,
    language,
    onError: (error) => {
      console.error('[TtsReadbackButton] TTS error:', error);
      // Silent fail - don't show toast for TTS errors as it's not critical
    },
  });

  const speechText = formatItemsForSpeech(items, language);

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
