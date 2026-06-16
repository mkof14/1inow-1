
-- ============ AI INTELLIGENCE LAYER ============

-- Enums
CREATE TYPE public.ai_confidence AS ENUM ('high','medium','low');
CREATE TYPE public.ai_memory_type AS ENUM (
  'user_preference','project_fact','people_fact','company_fact',
  'decision','pattern','correction','workflow','writing_style',
  'communication_style','priority','deadline','risk','personal'
);
CREATE TYPE public.ai_memory_status AS ENUM ('active','paused','rejected','archived');
CREATE TYPE public.ai_agent_status AS ENUM ('proposed','active','expired','revoked');
CREATE TYPE public.ai_action_status AS ENUM ('pending','approved','rejected','executed','failed');
CREATE TYPE public.ai_question_status AS ENUM ('open','answered','dismissed');
CREATE TYPE public.ai_workflow_status AS ENUM ('draft','active','archived');
CREATE TYPE public.ai_privacy_zone AS ENUM ('business','personal','family','health','finance','legal');
CREATE TYPE public.ai_assistant_mode AS ENUM (
  'calm','executive','project_controller','strict_reviewer',
  'fast_operator','personal_helper','silent_observer','critical_monitor'
);
CREATE TYPE public.data_quality_kind AS ENUM (
  'duplicate','outdated','unlinked','no_owner','no_deadline',
  'no_agenda','no_followup','stale','conflict','missing_info'
);

-- Memories
CREATE TABLE public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.ai_memory_type NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  confidence public.ai_confidence NOT NULL DEFAULT 'medium',
  status public.ai_memory_status NOT NULL DEFAULT 'active',
  related_project_id uuid,
  related_person_id uuid,
  zone public.ai_privacy_zone NOT NULL DEFAULT 'business',
  source_text text,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.ai_memories FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_memories_updated BEFORE UPDATE ON public.ai_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Memory sources (multi-source backing)
CREATE TABLE public.ai_memory_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.ai_memories(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid,
  excerpt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory_sources TO authenticated;
GRANT ALL ON public.ai_memory_sources TO service_role;
ALTER TABLE public.ai_memory_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory sources" ON public.ai_memory_sources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_memories m WHERE m.id=memory_id AND m.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_memories m WHERE m.id=memory_id AND m.user_id=auth.uid()));

-- Agents
CREATE TABLE public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text NOT NULL,
  scope text,
  allowed_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  output_format text,
  min_confidence public.ai_confidence NOT NULL DEFAULT 'medium',
  action_permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.ai_agent_status NOT NULL DEFAULT 'proposed',
  expires_at timestamptz,
  system_prompt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agents TO authenticated;
GRANT ALL ON public.ai_agents TO service_role;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own agents" ON public.ai_agents FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_agents_updated BEFORE UPDATE ON public.ai_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent runs
CREATE TABLE public.ai_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input jsonb,
  output jsonb,
  analyzed jsonb,
  found jsonb,
  missing jsonb,
  recommendation text,
  confidence public.ai_confidence,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_runs TO authenticated;
GRANT ALL ON public.ai_agent_runs TO service_role;
ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own agent runs" ON public.ai_agent_runs FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Workflows
CREATE TABLE public.ai_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status public.ai_workflow_status NOT NULL DEFAULT 'draft',
  trigger text,
  expected_output text,
  reminders jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workflows TO authenticated;
GRANT ALL ON public.ai_workflows TO service_role;
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workflows" ON public.ai_workflows FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_workflows_updated BEFORE UPDATE ON public.ai_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workflow steps
CREATE TABLE public.ai_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  owner_id uuid,
  template_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workflow_steps TO authenticated;
GRANT ALL ON public.ai_workflow_steps TO service_role;
ALTER TABLE public.ai_workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wf steps" ON public.ai_workflow_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_workflows w WHERE w.id=workflow_id AND w.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_workflows w WHERE w.id=workflow_id AND w.user_id=auth.uid()));

-- Rules
CREATE TABLE public.ai_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule text NOT NULL,
  scope text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_rules TO authenticated;
GRANT ALL ON public.ai_rules TO service_role;
ALTER TABLE public.ai_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rules" ON public.ai_rules FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Questions
CREATE TABLE public.ai_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  kind text NOT NULL DEFAULT 'clarify',
  context jsonb,
  status public.ai_question_status NOT NULL DEFAULT 'open',
  answer text,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_questions TO authenticated;
GRANT ALL ON public.ai_questions TO service_role;
ALTER TABLE public.ai_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own questions" ON public.ai_questions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Actions
CREATE TABLE public.ai_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.ai_action_status NOT NULL DEFAULT 'pending',
  needs_approval boolean NOT NULL DEFAULT true,
  prompt text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_actions TO authenticated;
GRANT ALL ON public.ai_actions TO service_role;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own actions" ON public.ai_actions FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_actions_updated BEFORE UPDATE ON public.ai_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Action approvals (audit log)
CREATE TABLE public.ai_action_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.ai_actions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_action_approvals TO authenticated;
GRANT ALL ON public.ai_action_approvals TO service_role;
ALTER TABLE public.ai_action_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own approvals" ON public.ai_action_approvals FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Confidence logs
CREATE TABLE public.ai_confidence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  subject_id uuid,
  confidence public.ai_confidence NOT NULL,
  rationale text,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_confidence_logs TO authenticated;
GRANT ALL ON public.ai_confidence_logs TO service_role;
ALTER TABLE public.ai_confidence_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conf logs" ON public.ai_confidence_logs FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Context graph
CREATE TABLE public.context_graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type text NOT NULL,
  node_ref uuid,
  label text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.context_graph_nodes TO authenticated;
GRANT ALL ON public.context_graph_nodes TO service_role;
ALTER TABLE public.context_graph_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own graph nodes" ON public.context_graph_nodes FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.context_graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node uuid NOT NULL REFERENCES public.context_graph_nodes(id) ON DELETE CASCADE,
  target_node uuid NOT NULL REFERENCES public.context_graph_nodes(id) ON DELETE CASCADE,
  edge_type text NOT NULL DEFAULT 'related',
  weight numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.context_graph_edges TO authenticated;
GRANT ALL ON public.context_graph_edges TO service_role;
ALTER TABLE public.context_graph_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own graph edges" ON public.context_graph_edges FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Data quality issues
CREATE TABLE public.data_quality_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.data_quality_kind NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  description text NOT NULL,
  suggested_fix text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_quality_issues TO authenticated;
GRANT ALL ON public.data_quality_issues TO service_role;
ALTER TABLE public.data_quality_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dq" ON public.data_quality_issues FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Privacy zones
CREATE TABLE public.user_privacy_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone public.ai_privacy_zone NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  cross_zone_allowed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, zone)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_privacy_zones TO authenticated;
GRANT ALL ON public.user_privacy_zones TO service_role;
ALTER TABLE public.user_privacy_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own zones" ON public.user_privacy_zones FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Assistant preferences
CREATE TABLE public.assistant_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode public.ai_assistant_mode NOT NULL DEFAULT 'calm',
  proactive_level int NOT NULL DEFAULT 2,
  notification_level int NOT NULL DEFAULT 2,
  strictness int NOT NULL DEFAULT 2,
  quiet_hours_start time,
  quiet_hours_end time,
  monitoring_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  memory_enabled boolean NOT NULL DEFAULT true,
  disabled_memory_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_preferences TO authenticated;
GRANT ALL ON public.assistant_preferences TO service_role;
ALTER TABLE public.assistant_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.assistant_preferences FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER assistant_prefs_updated BEFORE UPDATE ON public.assistant_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ON public.ai_memories(user_id, type, status);
CREATE INDEX ON public.ai_actions(user_id, status);
CREATE INDEX ON public.ai_questions(user_id, status);
CREATE INDEX ON public.data_quality_issues(user_id, resolved);
CREATE INDEX ON public.context_graph_edges(user_id, source_node);
