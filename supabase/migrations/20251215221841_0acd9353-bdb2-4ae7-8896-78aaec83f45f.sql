-- Create wine quiz scores table
CREATE TABLE public.wine_quiz_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  level_reached INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wine_quiz_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view quiz scores in their organization"
ON public.wine_quiz_scores FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert quiz scores in their organization"
ON public.wine_quiz_scores FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Service role can manage quiz scores"
ON public.wine_quiz_scores FOR ALL
USING (true)
WITH CHECK (true);

-- Index for leaderboard queries
CREATE INDEX idx_wine_quiz_scores_org_score ON public.wine_quiz_scores(organization_id, score DESC);