import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WineQuizScore {
  id: string;
  organization_id: string;
  employee_id: string | null;
  employee_name: string;
  score: number;
  questions_answered: number;
  correct_answers: number;
  level_reached: number;
  played_at: string;
}

export const useWineQuizScores = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch organization_id from profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const organizationId = profile?.organization_id;

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['wine-quiz-scores', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('wine_quiz_scores')
        .select('*')
        .eq('organization_id', organizationId)
        .order('score', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as WineQuizScore[];
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000,
  });

  const saveScore = useMutation({
    mutationFn: async (scoreData: {
      employee_name: string;
      score: number;
      questions_answered: number;
      correct_answers: number;
      level_reached: number;
      employee_id?: string;
    }) => {
      if (!organizationId) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('wine_quiz_scores')
        .insert({
          organization_id: organizationId,
          employee_id: scoreData.employee_id || null,
          employee_name: scoreData.employee_name,
          score: scoreData.score,
          questions_answered: scoreData.questions_answered,
          correct_answers: scoreData.correct_answers,
          level_reached: scoreData.level_reached,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-quiz-scores', organizationId] });
    },
  });

  const topScores = scores.slice(0, 10);
  const personalBest = scores.find(s => s.employee_id === user?.id);

  return {
    scores,
    topScores,
    personalBest,
    isLoading,
    saveScore,
  };
};
