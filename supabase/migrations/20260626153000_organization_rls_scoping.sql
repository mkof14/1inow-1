-- Organization-scoped RLS and project organization linkage.

CREATE OR REPLACE FUNCTION public.current_organization_id(_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = COALESCE(_user_id, auth.uid())
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_organization_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_organization_id(uuid) TO authenticated, service_role;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_organization_idx ON public.projects(organization_id);

UPDATE public.projects AS p
SET organization_id = COALESCE(
  (
    SELECT pr.organization_id
    FROM public.profiles AS pr
    WHERE pr.id = COALESCE(p.owner_id, p.created_by)
  ),
  public.default_organization_id()
)
WHERE p.organization_id IS NULL;

-- Profiles
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "profiles_select_org_scoped" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
  );

-- Projects
DROP POLICY IF EXISTS "Projects viewable by authenticated" ON public.projects;
CREATE POLICY "projects_select_org_scoped" ON public.projects
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    OR owner_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.project_members AS pm
      WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated can create projects" ON public.projects;
CREATE POLICY "projects_insert_org_scoped" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- Tasks
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.tasks;
CREATE POLICY "tasks_select_org_scoped" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR created_by = auth.uid()
    OR assignee_id = auth.uid()
    OR (
      project_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS pr
        WHERE pr.id = tasks.created_by
          AND pr.organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = tasks.project_id
        AND (
          p.organization_id IS NOT DISTINCT FROM public.current_organization_id()
          OR p.owner_id = auth.uid()
          OR p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.project_members AS pm
            WHERE pm.project_id = p.id
              AND pm.user_id = auth.uid()
          )
        )
    )
  );

-- Departments
DROP POLICY IF EXISTS "departments_select" ON public.departments;
CREATE POLICY "departments_select_org_scoped" ON public.departments
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NULL
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
  );

DROP POLICY IF EXISTS "departments_insert" ON public.departments;
CREATE POLICY "departments_insert_org_scoped" ON public.departments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      organization_id IS NOT NULL
      AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- Teams
DROP POLICY IF EXISTS "teams_select" ON public.teams;
CREATE POLICY "teams_select_org_scoped" ON public.teams
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NULL
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
  );

DROP POLICY IF EXISTS "teams_insert" ON public.teams;
CREATE POLICY "teams_insert_org_scoped" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      organization_id IS NOT NULL
      AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- Team members
DROP POLICY IF EXISTS "tm_select" ON public.team_members;
CREATE POLICY "tm_select_org_scoped" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.teams AS t
      WHERE t.id = team_members.team_id
        AND (
          t.organization_id IS NULL
          OR t.organization_id IS NOT DISTINCT FROM public.current_organization_id()
        )
    )
  );

-- Invitations
DROP POLICY IF EXISTS "inv_select" ON public.invitations;
CREATE POLICY "inv_select_org_scoped" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    public.has_permission(auth.uid(), 'invite_users')
    OR invited_by = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
      AND public.is_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "inv_insert" ON public.invitations;
CREATE POLICY "inv_insert_org_scoped" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_permission(auth.uid(), 'invite_users')
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );
