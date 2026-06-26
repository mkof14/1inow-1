-- Default workspace organization for profile bootstrap.
-- Safe to run multiple times.

INSERT INTO public.organizations (id, name, slug, settings)
VALUES (
  'a1000000-0000-4000-8000-000000000001',
  '1inow Workspace',
  '1inow-workspace',
  '{}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.default_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.organizations
  WHERE slug = '1inow-workspace'
    AND deleted_at IS NULL
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.default_organization_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.default_organization_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ensure_profile_organization(_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  target_user uuid := COALESCE(_user_id, auth.uid());
BEGIN
  IF target_user IS NULL THEN
    RETURN NULL;
  END IF;

  org_id := public.default_organization_id();
  IF org_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.profiles
  SET organization_id = org_id
  WHERE id = target_user
    AND organization_id IS NULL;

  RETURN org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_profile_organization(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile_organization(uuid) TO authenticated, service_role;

-- Attach existing profiles that were created before org bootstrap.
SELECT public.ensure_profile_organization(id)
FROM public.profiles
WHERE organization_id IS NULL;
