-- Invitation preview + acceptance RPCs and missing invitation write policies.

CREATE OR REPLACE FUNCTION public.get_invitation_preview(_token text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', i.id,
    'email', i.email,
    'full_name', i.full_name,
    'role', i.role,
    'organization_name', o.name,
    'custom_message', i.custom_message,
    'expires_at', i.expires_at,
    'status', i.status
  )
  FROM public.invitations AS i
  LEFT JOIN public.organizations AS o
    ON o.id = i.organization_id
    AND o.deleted_at IS NULL
  WHERE i.token = _token
    AND i.status IN ('sent', 'draft')
    AND i.expires_at > now()
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invitations%ROWTYPE;
  inv_id uuid;
  uid uuid := auth.uid();
  user_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT u.email
  INTO user_email
  FROM auth.users AS u
  WHERE u.id = uid;

  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  SELECT id
  INTO inv_id
  FROM public.invitations
  WHERE token = _token
    AND status = 'accepted'
    AND accepted_by = uid
  LIMIT 1;

  IF inv_id IS NOT NULL THEN
    RETURN inv_id;
  END IF;

  SELECT *
  INTO inv
  FROM public.invitations
  WHERE token = _token
    AND status IN ('sent', 'draft')
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  IF lower(trim(inv.email)) <> lower(trim(user_email)) THEN
    RAISE EXCEPTION 'Invitation email does not match signed-in account';
  END IF;

  UPDATE public.profiles
  SET
    organization_id = COALESCE(inv.organization_id, organization_id),
    department_id = COALESCE(inv.department_id, department_id),
    full_name = COALESCE(NULLIF(trim(inv.full_name), ''), full_name),
    language = COALESCE(inv.language, language),
    timezone = COALESCE(inv.timezone, timezone),
    preferred_language = COALESCE(inv.language, preferred_language)
  WHERE id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = uid;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, inv.role);

  IF inv.team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (inv.team_id, uid, 'member')
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  UPDATE public.invitations
  SET
    status = 'accepted',
    accepted_at = now(),
    accepted_by = uid
  WHERE id = inv.id;

  RETURN inv.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "inv_update" ON public.invitations;
CREATE POLICY "inv_update_org_scoped" ON public.invitations
  FOR UPDATE TO authenticated
  USING (
    public.has_permission(auth.uid(), 'invite_users')
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  )
  WITH CHECK (
    public.has_permission(auth.uid(), 'invite_users')
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );

DROP POLICY IF EXISTS "inv_delete" ON public.invitations;
CREATE POLICY "inv_delete_org_scoped" ON public.invitations
  FOR DELETE TO authenticated
  USING (
    public.has_permission(auth.uid(), 'invite_users')
    AND (
      organization_id IS NULL
      OR organization_id IS NOT DISTINCT FROM public.current_organization_id()
    )
  );
