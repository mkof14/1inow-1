
-- Universal relations table
CREATE TABLE IF NOT EXISTS public.relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'related',
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id, relation_type)
);

CREATE INDEX IF NOT EXISTS relations_source_idx ON public.relations (source_type, source_id);
CREATE INDEX IF NOT EXISTS relations_target_idx ON public.relations (target_type, target_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relations TO authenticated;
GRANT ALL ON public.relations TO service_role;

ALTER TABLE public.relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view relations"
  ON public.relations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth users can create relations"
  ON public.relations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or admin can delete relations"
  ON public.relations FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

CREATE POLICY "Creator or admin can update relations"
  ON public.relations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

-- Symmetric inverse: when A->B is created, ensure B->A exists too.
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
  INSERT INTO public.relations (source_type, source_id, target_type, target_id, relation_type, created_by, note)
  VALUES (NEW.target_type, NEW.target_id, NEW.source_type, NEW.source_id, NEW.relation_type, NEW.created_by, NEW.note)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS relations_mirror_trg ON public.relations;
CREATE TRIGGER relations_mirror_trg
AFTER INSERT ON public.relations
FOR EACH ROW EXECUTE FUNCTION public.relations_mirror();

-- Symmetric delete
CREATE OR REPLACE FUNCTION public.relations_mirror_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.relations
  WHERE source_type = OLD.target_type
    AND source_id = OLD.target_id
    AND target_type = OLD.source_type
    AND target_id = OLD.source_id
    AND relation_type = OLD.relation_type;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS relations_mirror_delete_trg ON public.relations;
CREATE TRIGGER relations_mirror_delete_trg
AFTER DELETE ON public.relations
FOR EACH ROW EXECUTE FUNCTION public.relations_mirror_delete();
