
-- Decisions module
CREATE TYPE public.decision_status AS ENUM ('pending','approved','rejected','deferred','review');
CREATE TYPE public.decision_impact AS ENUM ('low','medium','high','critical');

CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  context TEXT,
  recommendation TEXT,
  status public.decision_status NOT NULL DEFAULT 'pending',
  impact public.decision_impact NOT NULL DEFAULT 'medium',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  review_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  rationale TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.decision_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve','reject','abstain')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (decision_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.decisions TO authenticated;
GRANT ALL ON public.decisions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_approvals TO authenticated;
GRANT ALL ON public.decision_approvals TO service_role;

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read decisions" ON public.decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth create decisions" ON public.decisions FOR INSERT TO authenticated WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "auth update decisions" ON public.decisions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete decisions" ON public.decisions FOR DELETE TO authenticated USING (requested_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "auth read approvals" ON public.decision_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth vote approvals" ON public.decision_approvals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth update own vote" ON public.decision_approvals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "auth delete own vote" ON public.decision_approvals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER decisions_updated_at BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
