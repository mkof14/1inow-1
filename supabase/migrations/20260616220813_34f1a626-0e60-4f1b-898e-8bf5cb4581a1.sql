
-- 1. Narrow translation_memory INSERT policy
DROP POLICY IF EXISTS "tm insert auth" ON public.translation_memory;
CREATE POLICY "tm insert auth"
  ON public.translation_memory
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

-- 2. Lock down SECURITY DEFINER helpers: revoke from anon/public, allow authenticated where needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_channel_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, text, text, text, jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_channel_admin(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, text, text, text, jsonb) TO authenticated, service_role;

-- relations_mirror / relations_mirror_delete are trigger functions — keep default, but lock down anyway
REVOKE EXECUTE ON FUNCTION public.relations_mirror() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.relations_mirror_delete() FROM PUBLIC, anon, authenticated;
