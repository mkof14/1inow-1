-- Task-scoped comments with organization-aware RLS.

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS task_comments_task_idx ON public.task_comments(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS task_comments_org_idx ON public.task_comments(organization_id);

DO $$ BEGIN
  CREATE TRIGGER trg_task_comments_updated
    BEFORE UPDATE ON public.task_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.can_access_task(_task_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks AS t
    WHERE t.id = _task_id
      AND (
        public.is_super_admin(_user_id)
        OR t.created_by = _user_id
        OR t.assignee_id = _user_id
        OR (
          t.project_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM public.profiles AS pr
            WHERE pr.id = t.created_by
              AND pr.organization_id IS NOT DISTINCT FROM public.current_organization_id()
          )
        )
        OR EXISTS (
          SELECT 1
          FROM public.projects AS p
          WHERE p.id = t.project_id
            AND (
              p.organization_id IS NOT DISTINCT FROM public.current_organization_id()
              OR p.owner_id = _user_id
              OR p.created_by = _user_id
              OR EXISTS (
                SELECT 1
                FROM public.project_members AS pm
                WHERE pm.project_id = p.id
                  AND pm.user_id = _user_id
              )
            )
        )
      )
  );
$$;

DROP POLICY IF EXISTS "task_comments_select" ON public.task_comments;
CREATE POLICY "task_comments_select" ON public.task_comments
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND public.can_access_task(task_id, auth.uid())
  );

DROP POLICY IF EXISTS "task_comments_insert" ON public.task_comments;
CREATE POLICY "task_comments_insert" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND public.can_access_task(task_id, auth.uid())
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
    AND (
      public.has_permission(auth.uid(), 'send_messages')
      OR public.has_permission(auth.uid(), 'edit_tasks')
    )
  );

DROP POLICY IF EXISTS "task_comments_update" ON public.task_comments;
CREATE POLICY "task_comments_update" ON public.task_comments
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.is_admin(auth.uid())
  );
