
DROP POLICY IF EXISTS "auth update decisions" ON public.decisions;
CREATE POLICY "auth update decisions" ON public.decisions
  FOR UPDATE TO authenticated
  USING (requested_by = auth.uid() OR decided_by = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (requested_by = auth.uid() OR decided_by = auth.uid() OR public.is_admin(auth.uid()));
