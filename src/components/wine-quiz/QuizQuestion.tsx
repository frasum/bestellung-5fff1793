import { useState, useEffect } from 'react';
import { Wine, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QuizQuestion as QuizQuestionType } from '@/hooks/useWineQuiz';

interface QuizQuestionProps {
  question: QuizQuestionType;
  eliminatedOptions: string[];
  audienceVotes: Record<string, number> | null;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export const QuizQuestion = ({
  question,
  eliminatedOptions,
  audienceVotes,
  onAnswer,
  disabled,
}: QuizQuestionProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  }, [question.id]);

  const handleSelect = (answer: string) => {
    if (disabled || showResult || eliminatedOptions.includes(answer)) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    setIsCorrect(answer === question.correctAnswer);
    
    // Delay before moving to next question
    setTimeout(() => {
      onAnswer(answer);
    }, 1500);
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 border border-primary/20">
        {question.type === 'image' && question.wine.image_url ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-40 rounded-lg overflow-hidden bg-muted shadow-lg">
              <img
                src={question.wine.image_url}
                alt="Weinbild"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-lg font-medium text-center">{question.question}</p>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Wine className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-medium flex-1">{question.question}</p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          const isEliminated = eliminatedOptions.includes(option);
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === question.correctAnswer;
          const showCorrect = showResult && isCorrectAnswer;
          const showWrong = showResult && isSelected && !isCorrectAnswer;
          const audiencePercent = audienceVotes?.[option];

          return (
            <Button
              key={option}
              variant="outline"
              className={cn(
                'h-auto min-h-[60px] p-4 justify-start text-left relative overflow-hidden transition-all duration-300',
                isEliminated && 'opacity-30 cursor-not-allowed line-through',
                isSelected && !showResult && 'ring-2 ring-primary bg-primary/10',
                showCorrect && 'bg-green-500/20 border-green-500 ring-2 ring-green-500',
                showWrong && 'bg-red-500/20 border-red-500 ring-2 ring-red-500 animate-shake',
                !isEliminated && !disabled && !showResult && 'hover:bg-primary/5 hover:border-primary',
              )}
              onClick={() => handleSelect(option)}
              disabled={disabled || isEliminated || showResult}
            >
              {/* Audience vote background bar */}
              {audiencePercent !== undefined && !showResult && (
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${audiencePercent}%` }}
                />
              )}
              
              <span className="relative flex items-center gap-3 w-full">
                <span className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  showCorrect ? 'bg-green-500 text-white' : 
                  showWrong ? 'bg-red-500 text-white' :
                  'bg-primary/20 text-primary'
                )}>
                  {showCorrect ? <Check className="h-4 w-4" /> : 
                   showWrong ? <X className="h-4 w-4" /> :
                   optionLabels[index]}
                </span>
                <span className="flex-1 text-sm">{option}</span>
                {audiencePercent !== undefined && !showResult && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {audiencePercent}%
                  </span>
                )}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
