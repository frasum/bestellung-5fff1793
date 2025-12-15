import { useState } from 'react';
import { Wine, Trophy, Phone, Users, Percent, XCircle, ArrowRight, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Article } from '@/hooks/useArticles';
import { useWineQuiz, LEVEL_POINTS, SAFE_LEVELS } from '@/hooks/useWineQuiz';
import { useWineQuizScores } from '@/hooks/useWineQuizScores';
import { QuizQuestion } from './QuizQuestion';
import { QuizResult } from './QuizResult';
import { Leaderboard } from './Leaderboard';

interface WineQuizGameProps {
  wines: Article[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WineQuizGame = ({ wines, open, onOpenChange }: WineQuizGameProps) => {
  const { t } = useTranslation();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { saveScore } = useWineQuizScores();
  
  const {
    state,
    validWinesCount,
    startGame,
    answerQuestion,
    useFiftyFifty,
    useAudience,
    usePhone,
    takeTheMoney,
  } = useWineQuiz(wines);

  const handleSaveScore = (name: string) => {
    saveScore.mutate({
      employee_name: name,
      score: state.score,
      questions_answered: state.questionsAnswered,
      correct_answers: state.correctAnswers,
      level_reached: state.currentLevel,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Not enough wines
  if (validWinesCount < 4) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              {t('wineQuiz.title', 'Wer wird Weinkenner?')}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <Wine className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {t('wineQuiz.notEnoughWines', 'Mindestens 4 Weine mit vollständigen Daten benötigt.')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Aktuell: {validWinesCount} Weine verfügbar
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Start screen
  if (!state.currentQuestion && !state.isGameOver) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Wine className="h-6 w-6 text-primary" />
              {t('wineQuiz.title', 'Wer wird Weinkenner?')} 🍷
            </DialogTitle>
            <DialogDescription>
              Teste dein Weinwissen in 15 Fragen!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Game info */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Spielregeln
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 15 Fragen mit steigender Schwierigkeit</li>
                    <li>• 3 Joker: 50:50, Publikum, Telefon</li>
                    <li>• Sicherheitsstufen bei Level 5, 10, 15</li>
                    <li>• Jederzeit aufhören und Punkte mitnehmen</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Abzeichen
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-amber-600/20">
                      <div className="font-bold text-amber-600">Bronze</div>
                      <div className="text-muted-foreground">Level 5</div>
                    </div>
                    <div className="p-2 rounded bg-gray-400/20">
                      <div className="font-bold text-gray-500">Silber</div>
                      <div className="text-muted-foreground">Level 10</div>
                    </div>
                    <div className="p-2 rounded bg-yellow-500/20">
                      <div className="font-bold text-yellow-600">Gold</div>
                      <div className="text-muted-foreground">Level 15</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={startGame}>
                  <Wine className="h-4 w-4 mr-2" />
                  Spiel starten
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                >
                  <Trophy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Leaderboard */}
            <div className={cn(showLeaderboard ? 'block' : 'hidden md:block')}>
              <Leaderboard compact />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Game over screen
  if (state.isGameOver) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <QuizResult
            score={state.score}
            levelReached={state.currentLevel}
            correctAnswers={state.correctAnswers}
            questionsAnswered={state.questionsAnswered}
            isWinner={state.isWinner}
            onPlayAgain={startGame}
            onSaveScore={handleSaveScore}
            onClose={handleClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Active game
  const currentPoints = LEVEL_POINTS[state.currentLevel - 1] || 0;
  const nextSafeLevel = SAFE_LEVELS.find(l => l >= state.currentLevel) || 15;
  const safePoints = state.safeLevel > 0 ? LEVEL_POINTS[state.safeLevel - 1] : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="space-y-4">
          {/* Level and score bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Level {state.currentLevel}/15
              </Badge>
              {state.safeLevel > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Sicher: {safePoints.toLocaleString()} Pkt
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Aktuell</div>
              <div className="text-xl font-bold text-primary">
                {currentPoints.toLocaleString()} Pkt
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={(state.currentLevel / 15) * 100} className="h-2" />
            {/* Safe level markers */}
            {SAFE_LEVELS.map(level => (
              <div
                key={level}
                className={cn(
                  'absolute top-0 w-1 h-2 rounded',
                  state.currentLevel > level ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
                style={{ left: `${(level / 15) * 100}%` }}
              />
            ))}
          </div>

          {/* Jokers */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={useFiftyFifty}
                disabled={state.usedJokers.fiftyFifty}
                className={cn(
                  'gap-1.5',
                  state.usedJokers.fiftyFifty && 'opacity-40'
                )}
              >
                <Percent className="h-4 w-4" />
                <span className="hidden sm:inline">50:50</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={useAudience}
                disabled={state.usedJokers.audience}
                className={cn(
                  'gap-1.5',
                  state.usedJokers.audience && 'opacity-40'
                )}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Publikum</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={usePhone}
                disabled={state.usedJokers.phone}
                className={cn(
                  'gap-1.5',
                  state.usedJokers.phone && 'opacity-40'
                )}
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Telefon</span>
              </Button>
            </div>

            {/* Take the money button */}
            {state.currentLevel > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={takeTheMoney}
                className="text-muted-foreground hover:text-foreground"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Aufhören</span>
              </Button>
            )}
          </div>

          {/* Phone hint */}
          {state.phoneHint && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-start gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm italic">"{state.phoneHint}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Question */}
        {state.currentQuestion && (
          <QuizQuestion
            question={state.currentQuestion}
            eliminatedOptions={state.eliminatedOptions}
            audienceVotes={state.audienceVotes}
            onAnswer={answerQuestion}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
