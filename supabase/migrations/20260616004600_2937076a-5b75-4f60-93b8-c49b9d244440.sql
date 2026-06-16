
DROP POLICY IF EXISTS "notif_authenticated_insert" ON public.notifications;
CREATE POLICY "notif_insert_as_self_or_admin" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );
