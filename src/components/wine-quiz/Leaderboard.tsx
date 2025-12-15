import { Trophy, Medal, Award, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useWineQuizScores, WineQuizScore } from '@/hooks/useWineQuizScores';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface LeaderboardProps {
  compact?: boolean;
}

export const Leaderboard = ({ compact = false }: LeaderboardProps) => {
  const { topScores, isLoading } = useWineQuizScores();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground font-medium">{rank}</span>;
    }
  };

  const getBadgeColor = (level: number) => {
    if (level > 10) return 'bg-yellow-500/20 text-yellow-600';
    if (level > 5) return 'bg-gray-400/20 text-gray-600';
    return 'bg-amber-600/20 text-amber-700';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Bestenliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topScores.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Bestenliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Noch keine Einträge</p>
            <p className="text-sm">Sei der Erste!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayScores = compact ? topScores.slice(0, 5) : topScores;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Bestenliste
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={compact ? 'h-[200px]' : 'h-[400px]'}>
          <div className="space-y-2">
            {displayScores.map((score, index) => (
              <div
                key={score.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  index === 0 && 'bg-yellow-500/10',
                  index === 1 && 'bg-gray-400/10',
                  index === 2 && 'bg-amber-600/10',
                  index > 2 && 'bg-muted/50'
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{score.employee_name}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      getBadgeColor(score.level_reached)
                    )}>
                      Lvl {score.level_reached}
                    </span>
                  </div>
                  {!compact && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(score.played_at), 'dd. MMM yyyy', { locale: de })}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {score.score.toLocaleString()}
                  </div>
                  {!compact && (
                    <div className="text-xs text-muted-foreground">
                      {score.correct_answers}/{score.questions_answered} richtig
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
