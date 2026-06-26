-- Org-scoped project membership: prevent cross-tenant member visibility and assignment.

CREATE OR REPLACE FUNCTION public.can_manage_project_members(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects AS p
    WHERE p.id = _project_id
      AND (
        public.is_super_admin(_user_id)
        OR (
          (
            p.organization_id IS NULL
            OR p.organization_id IS NOT DISTINCT FROM public.current_organization_id()
          )
          AND (
            public.is_admin(_user_id)
            OR (
              (p.owner_id = _user_id OR p.created_by = _user_id)
              AND public.has_permission(_user_id, 'assign_project_members')
            )
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.profile_in_project_org(_project_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects AS p
    JOIN public.profiles AS pr ON pr.id = _profile_id
    WHERE p.id = _project_id
      AND (
        p.organization_id IS NULL
        OR pr.organization_id IS NOT DISTINCT FROM p.organization_id
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_project_members(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.profile_in_project_org(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Members viewable by authenticated" ON public.project_members;

CREATE POLICY "project_members_select_org_scoped" ON public.project_members
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = project_members.project_id
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

DROP POLICY IF EXISTS "Project owner/admin manage members" ON public.project_members;

CREATE POLICY "project_members_insert_org_scoped" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_project_members(project_id, auth.uid())
    AND public.profile_in_project_org(project_id, user_id)
  );

CREATE POLICY "project_members_update_org_scoped" ON public.project_members
  FOR UPDATE TO authenticated
  USING (public.can_manage_project_members(project_id, auth.uid()))
  WITH CHECK (
    public.can_manage_project_members(project_id, auth.uid())
    AND public.profile_in_project_org(project_id, user_id)
  );

CREATE POLICY "project_members_delete_org_scoped" ON public.project_members
  FOR DELETE TO authenticated
  USING (public.can_manage_project_members(project_id, auth.uid()));
