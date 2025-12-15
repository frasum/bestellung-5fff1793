import { useState } from 'react';
import { Trophy, Star, Medal, Wine, RotateCcw, Home, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LEVEL_POINTS, SAFE_LEVELS } from '@/hooks/useWineQuiz';

interface QuizResultProps {
  score: number;
  levelReached: number;
  correctAnswers: number;
  questionsAnswered: number;
  isWinner: boolean;
  onPlayAgain: () => void;
  onSaveScore: (name: string) => void;
  onClose: () => void;
  defaultPlayerName?: string;
}

export const QuizResult = ({
  score,
  levelReached,
  correctAnswers,
  questionsAnswered,
  isWinner,
  onPlayAgain,
  onSaveScore,
  onClose,
  defaultPlayerName,
}: QuizResultProps) => {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState(defaultPlayerName || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (playerName.trim()) {
      onSaveScore(playerName.trim());
      setSaved(true);
    }
  };

  // Determine badge level
  const getBadge = () => {
    if (isWinner || levelReached > 15) return { icon: Trophy, label: 'Weinmeister', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (levelReached > 10) return { icon: Award, label: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (levelReached > 5) return { icon: Medal, label: 'Silber', color: 'text-gray-400', bg: 'bg-gray-400/20' };
    if (levelReached > 0) return { icon: Star, label: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/20' };
    return { icon: Wine, label: 'Einsteiger', color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const badge = getBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-8 animate-fade-in">
      {/* Confetti effect for winners */}
      {isWinner && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <Sparkles 
              key={i}
              className={cn(
                'absolute text-yellow-500 animate-bounce',
                i % 2 === 0 ? 'text-yellow-400' : 'text-amber-500'
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* Badge */}
      <div className={cn('w-24 h-24 rounded-full flex items-center justify-center mb-6', badge.bg)}>
        <BadgeIcon className={cn('h-12 w-12', badge.color)} />
      </div>

      {/* Title */}
      <h2 className={cn(
        'text-2xl font-bold mb-2',
        isWinner ? 'text-yellow-500' : 'text-foreground'
      )}>
        {isWinner ? '🎉 Glückwunsch, Weinmeister!' : `${badge.label}-Abzeichen erreicht!`}
      </h2>

      {/* Score */}
      <div className="text-4xl font-bold text-primary mb-6">
        {score.toLocaleString()} Punkte
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{levelReached}</div>
            <div className="text-xs text-muted-foreground">Level erreicht</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{correctAnswers}</div>
            <div className="text-xs text-muted-foreground">Richtig</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Quote</div>
          </CardContent>
        </Card>
      </div>

      {/* Save score */}
      {!saved ? (
        <div className="w-full max-w-sm space-y-3 mb-6">
          <Label htmlFor="playerName">Name für Bestenliste</Label>
          <div className="flex gap-2">
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Dein Name"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button onClick={handleSave} disabled={!playerName.trim()}>
              Speichern
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-green-500 mb-6">
          <Trophy className="h-5 w-5" />
          <span>In Bestenliste eingetragen!</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose}>
          <Home className="h-4 w-4 mr-2" />
          Beenden
        </Button>
        <Button onClick={onPlayAgain}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Nochmal spielen
        </Button>
      </div>
    </div>
  );
};
