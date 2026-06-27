-- Voice inbox captures (replaces device-localStorage queue for signed-in users).

CREATE TABLE IF NOT EXISTS public.voice_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  raw_text TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (
    kind IN ('task', 'project', 'note', 'reminder', 'risk', 'search', 'navigation', 'unknown')
  ),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'dismissed')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  summary TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_inbox_items TO authenticated;
GRANT ALL ON public.voice_inbox_items TO service_role;
ALTER TABLE public.voice_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS voice_inbox_items_user_idx
  ON public.voice_inbox_items(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS voice_inbox_items_org_idx
  ON public.voice_inbox_items(organization_id);

DO $$ BEGIN
  CREATE TRIGGER trg_voice_inbox_items_updated
    BEFORE UPDATE ON public.voice_inbox_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE POLICY "voice_inbox_select_own" ON public.voice_inbox_items
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "voice_inbox_insert_own_org" ON public.voice_inbox_items
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

CREATE POLICY "voice_inbox_update_own" ON public.voice_inbox_items
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "voice_inbox_delete_own" ON public.voice_inbox_items
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
