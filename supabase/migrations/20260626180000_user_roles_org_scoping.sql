-- Scope user_roles SELECT to same organization (or self / super admin).

DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.user_roles;

CREATE POLICY "user_roles_select_org_scoped" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR (
      public.has_permission(auth.uid(), 'view_users')
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS viewer
        JOIN public.profiles AS target ON target.id = user_roles.user_id
        WHERE viewer.id = auth.uid()
          AND viewer.organization_id IS NOT NULL
          AND viewer.organization_id IS NOT DISTINCT FROM target.organization_id
      )
    )
  );
