
-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'admin', 'project_manager', 'team_lead',
  'employee', 'contractor', 'client', 'investor', 'guest'
);

CREATE TYPE public.project_status AS ENUM (
  'idea', 'planning', 'active', 'in_progress', 'review',
  'paused', 'completed', 'archived', 'canceled'
);

CREATE TYPE public.project_priority AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE public.task_status AS ENUM (
  'backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'blocked', 'canceled'
);

CREATE TYPE public.task_priority AS ENUM ('critical', 'high', 'medium', 'low');

-- =====================================================
-- UPDATED_AT TRIGGER FN
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  position TEXT,
  department TEXT,
  timezone TEXT DEFAULT 'UTC',
  country TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- USER ROLES
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'admin'))
$$;

CREATE POLICY "Roles viewable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- PROJECTS
-- =====================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  priority project_priority NOT NULL DEFAULT 'medium',
  color TEXT DEFAULT '#06b6d4',
  icon TEXT,
  category TEXT,
  start_date DATE,
  deadline DATE,
  budget NUMERIC(14,2),
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  health TEXT NOT NULL DEFAULT 'on_track',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects viewable by authenticated" ON public.projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update" ON public.projects
  FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Owner or admin can delete" ON public.projects
  FOR DELETE TO authenticated USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX projects_status_idx ON public.projects(status);
CREATE INDEX projects_owner_idx ON public.projects(owner_id);

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by authenticated" ON public.project_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Project owner/admin manage members" ON public.project_members
  FOR ALL TO authenticated USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  ) WITH CHECK (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  );

-- =====================================================
-- TASKS
-- =====================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  position INT NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks viewable by authenticated" ON public.tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Assignee owner or admin update" ON public.tasks
  FOR UPDATE TO authenticated USING (
    assignee_id = auth.uid() OR created_by = auth.uid() OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR p.created_by = auth.uid()))
  );
CREATE POLICY "Owner or admin delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR p.created_by = auth.uid()))
  );

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX tasks_project_idx ON public.tasks(project_id);
CREATE INDEX tasks_assignee_idx ON public.tasks(assignee_id);
CREATE INDEX tasks_status_idx ON public.tasks(status);

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity viewable by authenticated" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users log own activity" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX activity_project_idx ON public.activity_logs(project_id, created_at DESC);

-- =====================================================
-- AUTO-CREATE PROFILE + GRANT FIRST USER super_admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED 10 STARTER PROJECTS
-- =====================================================
INSERT INTO public.projects (name, slug, description, status, priority, color, category, progress, health) VALUES
  ('Digital Invest', 'digital-invest', 'Holding company operations and portfolio coordination.', 'active', 'critical', '#0a2540', 'Holding', 82, 'on_track'),
  ('AGRON', 'agron', 'Agri-tech vertical farming and supply chain.', 'in_progress', 'high', '#22c55e', 'Agri-Tech', 45, 'watchlist'),
  ('BioMath Core', 'biomath-core', 'Computational biology research platform.', 'review', 'critical', '#ef4444', 'Research', 12, 'at_risk'),
  ('SAVEN', 'saven', 'Cybersecurity infrastructure and managed services.', 'active', 'high', '#3b82f6', 'Cyber-Security', 94, 'on_track'),
  ('Adamas Materials', 'adamas-materials', 'Industrial materials and synthetic diamond production.', 'paused', 'medium', '#78716c', 'Industrial', 60, 'on_hold'),
  ('Origin Diamond', 'origin-diamond', 'Luxury goods and certified diamond marketplace.', 'active', 'high', '#f59e0b', 'Luxury', 28, 'on_track'),
  ('Abu Mall', 'abu-mall', 'Commercial real-estate development and operations.', 'active', 'medium', '#a855f7', 'Real Estate', 77, 'on_track'),
  ('MyDay', 'myday', 'Consumer productivity mobile app.', 'in_progress', 'medium', '#06b6d4', 'Consumer App', 50, 'on_track'),
  ('TableServed', 'tableserved', 'Hospitality SaaS for restaurants.', 'planning', 'low', '#fb923c', 'Hospitality SaaS', 33, 'on_track'),
  ('TerraAero', 'terraaero', 'Aviation and aerospace ventures.', 'review', 'high', '#0ea5e9', 'Aviation', 19, 'elevated');

-- =====================================================
-- SEED SAMPLE TASKS PER PROJECT
-- =====================================================
INSERT INTO public.tasks (project_id, title, description, status, priority, position) 
SELECT p.id, t.title, t.description, t.status::task_status, t.priority::task_priority, t.position
FROM public.projects p
CROSS JOIN LATERAL (VALUES
  ('Define Q4 strategic objectives', 'Outline top-level OKRs for the quarter.', 'in_progress', 'high', 1),
  ('Review financial model', 'Audit projections and assumptions.', 'todo', 'high', 2),
  ('Schedule stakeholder sync', 'Coordinate calendar invites for leadership.', 'todo', 'medium', 3),
  ('Prepare operations brief', 'One-page executive summary.', 'review', 'medium', 4),
  ('Archive legacy documents', 'Move old files to cold storage.', 'done', 'low', 5)
) AS t(title, description, status, priority, position);
