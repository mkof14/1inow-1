-- Attach workspace organization_id to audit log writes.

CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _severity text DEFAULT 'info',
  _module text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  org_id uuid;
BEGIN
  SELECT organization_id
  INTO org_id
  FROM public.profiles
  WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    severity,
    module,
    metadata
  )
  VALUES (
    auth.uid(),
    org_id,
    _action,
    _entity_type,
    _entity_id,
    _severity,
    _module,
    _metadata
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, text, text, text, jsonb) TO authenticated, service_role;
