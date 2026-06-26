-- Organization-scoped RLS for communication, decisions, activity, and relations.

-- ============ COLUMNS ============
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.decisions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.relations
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS channels_organization_idx ON public.channels(organization_id);
CREATE INDEX IF NOT EXISTS decisions_organization_idx ON public.decisions(organization_id);
CREATE INDEX IF NOT EXISTS activity_logs_organization_idx ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS relations_organization_idx ON public.relations(organization_id);

-- ============ BACKFILL ============
UPDATE public.channels AS c
SET organization_id = COALESCE(
  (SELECT p.organization_id FROM public.projects AS p WHERE p.id = c.project_id),
  (SELECT pr.organization_id FROM public.profiles AS pr WHERE pr.id = c.created_by),
  public.default_organization_id()
)
WHERE c.organization_id IS NULL;

UPDATE public.decisions AS d
SET organization_id = COALESCE(
  (SELECT p.organization_id FROM public.projects AS p WHERE p.id = d.project_id),
  (SELECT pr.organization_id FROM public.profiles AS pr WHERE pr.id = d.requested_by),
  public.default_organization_id()
)
WHERE d.organization_id IS NULL;

UPDATE public.activity_logs AS a
SET organization_id = COALESCE(
  (SELECT p.organization_id FROM public.projects AS p WHERE p.id = a.project_id),
  (SELECT pr.organization_id FROM public.profiles AS pr WHERE pr.id = a.user_id),
  public.default_organization_id()
)
WHERE a.organization_id IS NULL;

UPDATE public.relations AS r
SET organization_id = COALESCE(
  (SELECT pr.organization_id FROM public.profiles AS pr WHERE pr.id = r.created_by),
  public.default_organization_id()
)
WHERE r.organization_id IS NULL;

-- ============ CHANNEL HELPERS ============
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channels AS c
    WHERE c.id = _channel_id
      AND (
        public.is_super_admin(_user_id)
        OR c.organization_id IS NULL
        OR c.organization_id IS NOT DISTINCT FROM public.current_organization_id(_user_id)
      )
      AND (
        c.type = 'company'
        OR EXISTS (
          SELECT 1
          FROM public.channel_members AS cm
          WHERE cm.channel_id = _channel_id
            AND cm.user_id = _user_id
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) TO authenticated, service_role;

-- ============ CHANNELS RLS ============
DROP POLICY IF EXISTS "channels_select_member_or_company" ON public.channels;
CREATE POLICY "channels_select_org_scoped" ON public.channels
  FOR SELECT TO authenticated
  USING (public.is_channel_member(id, auth.uid()));

DROP POLICY IF EXISTS "channels_insert_authenticated" ON public.channels;
CREATE POLICY "channels_insert_org_scoped" ON public.channels
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "channels_update_admin" ON public.channels;
CREATE POLICY "channels_update_org_admin" ON public.channels
  FOR UPDATE TO authenticated
  USING (
    public.is_channel_admin(id, auth.uid())
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "channels_delete_admin" ON public.channels;
CREATE POLICY "channels_delete_org_admin" ON public.channels
  FOR DELETE TO authenticated
  USING (
    public.is_channel_admin(id, auth.uid())
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- ============ DECISIONS RLS ============
DROP POLICY IF EXISTS "auth read decisions" ON public.decisions;
CREATE POLICY "decisions_select_org_scoped" ON public.decisions
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    OR EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = decisions.project_id
        AND p.organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "auth create decisions" ON public.decisions;
CREATE POLICY "decisions_insert_org_scoped" ON public.decisions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requested_by
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "auth update decisions" ON public.decisions;
CREATE POLICY "decisions_update_org_scoped" ON public.decisions
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    OR EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = decisions.project_id
        AND p.organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "auth delete decisions" ON public.decisions;
CREATE POLICY "decisions_delete_org_scoped" ON public.decisions
  FOR DELETE TO authenticated
  USING (
    (
      requested_by = auth.uid()
      OR public.is_admin(auth.uid())
    )
    AND (
      public.is_super_admin(auth.uid())
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      OR organization_id IS NULL
    )
  );

-- ============ DECISION APPROVALS RLS ============
DROP POLICY IF EXISTS "auth read approvals" ON public.decision_approvals;
CREATE POLICY "decision_approvals_select_org_scoped" ON public.decision_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.decisions AS d
      WHERE d.id = decision_approvals.decision_id
        AND (
          public.is_super_admin(auth.uid())
          OR d.organization_id IS NOT DISTINCT FROM public.current_organization_id()
        )
    )
  );

DROP POLICY IF EXISTS "auth vote approvals" ON public.decision_approvals;
CREATE POLICY "decision_approvals_insert_org_scoped" ON public.decision_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.decisions AS d
      WHERE d.id = decision_approvals.decision_id
        AND d.organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "auth update own vote" ON public.decision_approvals;
CREATE POLICY "decision_approvals_update_org_scoped" ON public.decision_approvals
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.decisions AS d
      WHERE d.id = decision_approvals.decision_id
        AND d.organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "auth delete own vote" ON public.decision_approvals;
CREATE POLICY "decision_approvals_delete_org_scoped" ON public.decision_approvals
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.decisions AS d
      WHERE d.id = decision_approvals.decision_id
        AND d.organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- ============ ACTIVITY LOGS RLS ============
DROP POLICY IF EXISTS "Activity viewable by authenticated" ON public.activity_logs;
CREATE POLICY "activity_logs_select_org_scoped" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    OR (organization_id IS NULL AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users log own activity" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_org_scoped" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- ============ RELATIONS RLS + MIRROR ============
DROP POLICY IF EXISTS "Auth users can view relations" ON public.relations;
CREATE POLICY "relations_select_org_scoped" ON public.relations
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    OR (organization_id IS NULL AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Auth users can create relations" ON public.relations;
CREATE POLICY "relations_insert_org_scoped" ON public.relations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "Creator or admin can delete relations" ON public.relations;
CREATE POLICY "relations_delete_org_scoped" ON public.relations
  FOR DELETE TO authenticated
  USING (
    (
      auth.uid() = created_by
      OR public.is_admin(auth.uid())
    )
    AND (
      public.is_super_admin(auth.uid())
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      OR organization_id IS NULL
    )
  );

DROP POLICY IF EXISTS "Creator or admin can update relations" ON public.relations;
CREATE POLICY "relations_update_org_scoped" ON public.relations
  FOR UPDATE TO authenticated
  USING (
    (
      auth.uid() = created_by
      OR public.is_admin(auth.uid())
    )
    AND (
      public.is_super_admin(auth.uid())
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      OR organization_id IS NULL
    )
  );

CREATE OR REPLACE FUNCTION public.relations_mirror()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source_type = NEW.target_type AND NEW.source_id = NEW.target_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.relations (
    source_type,
    source_id,
    target_type,
    target_id,
    relation_type,
    created_by,
    note,
    organization_id
  )
  VALUES (
    NEW.target_type,
    NEW.target_id,
    NEW.source_type,
    NEW.source_id,
    NEW.relation_type,
    NEW.created_by,
    NEW.note,
    NEW.organization_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============ DEPARTMENTS / TEAMS UPDATE+DELETE ============
DROP POLICY IF EXISTS "departments_update" ON public.departments;
CREATE POLICY "departments_update_org_scoped" ON public.departments
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin(auth.uid())
      AND (
        organization_id IS NULL
        OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin(auth.uid())
      AND (
        organization_id IS NULL
        OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
  );

DROP POLICY IF EXISTS "departments_delete" ON public.departments;
CREATE POLICY "departments_delete_org_scoped" ON public.departments
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin(auth.uid())
      AND (
        organization_id IS NULL
        OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
  );

DROP POLICY IF EXISTS "teams_update" ON public.teams;
CREATE POLICY "teams_update_org_scoped" ON public.teams
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin(auth.uid())
      AND (
        organization_id IS NULL
        OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin(auth.uid())
      AND (
        organization_id IS NULL
        OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
  );

DROP POLICY IF EXISTS "teams_delete" ON public.teams;
CREATE POLICY "teams_delete_org_scoped" ON public.teams
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      public.is_admin(auth.uid())
      AND (
        organization_id IS NULL
        OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
      )
    )
  );
