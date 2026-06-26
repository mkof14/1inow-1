-- Organization-aware RLS for AI audit and translation caches.

ALTER TABLE public.ai_actions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_actions_organization_idx ON public.ai_actions(organization_id);

UPDATE public.ai_actions AS a
SET organization_id = p.organization_id
FROM public.profiles AS p
WHERE p.id = a.user_id
  AND a.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

DROP POLICY IF EXISTS "own actions" ON public.ai_actions;

CREATE POLICY "ai_actions_select_org_scoped" ON public.ai_actions
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR (
      public.has_permission(auth.uid(), 'view_audit_logs')
      AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

CREATE POLICY "ai_actions_insert_own_org" ON public.ai_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

CREATE POLICY "ai_actions_update_own" ON public.ai_actions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_actions_delete_own_or_admin" ON public.ai_actions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

-- Translation memory: scope reads to workspace org.
ALTER TABLE public.translation_memory
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS translation_memory_organization_idx
  ON public.translation_memory(organization_id);

UPDATE public.translation_memory AS tm
SET organization_id = p.organization_id
FROM public.profiles AS p
WHERE p.id = tm.created_by
  AND tm.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

DROP POLICY IF EXISTS "tm read auth" ON public.translation_memory;

CREATE POLICY "translation_memory_select_org_scoped" ON public.translation_memory
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR created_by = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "tm insert auth" ON public.translation_memory;

CREATE POLICY "translation_memory_insert_org_scoped" ON public.translation_memory
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

-- Document translations: org-scoped read/write.
ALTER TABLE public.document_translations
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS document_translations_organization_idx
  ON public.document_translations(organization_id);

UPDATE public.document_translations AS dt
SET organization_id = p.organization_id
FROM public.profiles AS p
WHERE p.id = dt.created_by
  AND dt.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

DROP POLICY IF EXISTS "doc trans read auth" ON public.document_translations;

CREATE POLICY "document_translations_select_org_scoped" ON public.document_translations
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR created_by = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "doc trans write auth" ON public.document_translations;

CREATE POLICY "document_translations_insert_org_scoped" ON public.document_translations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "doc trans update own or admin" ON public.document_translations;

CREATE POLICY "document_translations_update_org_scoped" ON public.document_translations
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "doc trans delete own or admin" ON public.document_translations;

CREATE POLICY "document_translations_delete_org_scoped" ON public.document_translations
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin(auth.uid())
  );
