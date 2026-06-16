
-- ============ CHANNELS ============
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  type text NOT NULL CHECK (type IN ('dm','project','company','private','group')),
  description text,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- ============ CHANNEL MEMBERS ============
CREATE TABLE public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  last_read_at timestamptz,
  muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT ALL ON public.channel_members TO service_role;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- ============ HELPER: is_channel_member ============
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = _channel_id
    AND (
      c.type = 'company'
      OR EXISTS (
        SELECT 1 FROM public.channel_members cm
        WHERE cm.channel_id = _channel_id AND cm.user_id = _user_id
      )
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_channel_admin(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = _channel_id
      AND cm.user_id = _user_id
      AND cm.role IN ('owner','admin')
  ) OR public.is_admin(_user_id)
$$;

-- ============ CHANNELS RLS ============
CREATE POLICY "channels_select_member_or_company" ON public.channels
  FOR SELECT TO authenticated
  USING (type = 'company' OR public.is_channel_member(id, auth.uid()));

CREATE POLICY "channels_insert_authenticated" ON public.channels
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "channels_update_admin" ON public.channels
  FOR UPDATE TO authenticated
  USING (public.is_channel_admin(id, auth.uid()));

CREATE POLICY "channels_delete_admin" ON public.channels
  FOR DELETE TO authenticated
  USING (public.is_channel_admin(id, auth.uid()));

-- Auto-make creator the owner member
CREATE OR REPLACE FUNCTION public.handle_new_channel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.channel_members (channel_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_channels_owner
  AFTER INSERT ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_channel();
CREATE TRIGGER trg_channels_updated
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CHANNEL MEMBERS RLS ============
CREATE POLICY "members_select_if_member" ON public.channel_members
  FOR SELECT TO authenticated
  USING (
    public.is_channel_member(channel_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.type = 'company')
  );

CREATE POLICY "members_insert_admin_or_self_company" ON public.channel_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_channel_admin(channel_id, auth.uid())
    OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.type IN ('company','group')))
  );

CREATE POLICY "members_update_self_or_admin" ON public.channel_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));

CREATE POLICY "members_delete_self_or_admin" ON public.channel_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  message_type text NOT NULL DEFAULT 'normal'
    CHECK (message_type IN ('normal','update','decision','action_item','question','blocker','approval','announcement','file_share','meeting_note')),
  thread_root_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  edited_at timestamptz,
  deleted_at timestamptz,
  pinned_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX messages_channel_idx ON public.messages(channel_id, created_at DESC);
CREATE INDEX messages_thread_idx ON public.messages(thread_root_id) WHERE thread_root_id IS NOT NULL;

CREATE POLICY "messages_select_if_member" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_channel_member(channel_id, auth.uid()));

CREATE POLICY "messages_insert_if_member" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_channel_member(channel_id, auth.uid())
  );

CREATE POLICY "messages_update_author_or_admin" ON public.messages
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));

CREATE POLICY "messages_delete_author_or_admin" ON public.messages
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_channel_admin(channel_id, auth.uid()));

CREATE TRIGGER trg_messages_updated
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REACTIONS ============
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select_if_member" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_channel_member(m.channel_id, auth.uid())));

CREATE POLICY "reactions_insert_self" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_channel_member(m.channel_id, auth.uid()))
  );

CREATE POLICY "reactions_delete_self" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ READ RECEIPTS ============
CREATE TABLE public.message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_read_receipts TO authenticated;
GRANT ALL ON public.message_read_receipts TO service_role;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_owner_all" ON public.message_read_receipts
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ SAVED MESSAGES ============
CREATE TABLE public.saved_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_messages TO authenticated;
GRANT ALL ON public.saved_messages TO service_role;
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_owner_all" ON public.saved_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;

-- ============ SEED CHANNELS ============
INSERT INTO public.channels (name, slug, type, description)
VALUES
  ('General', 'general', 'company', 'Company-wide chat'),
  ('Announcements', 'announcements', 'company', 'Official announcements'),
  ('Random', 'random', 'company', 'Off-topic')
ON CONFLICT (slug) DO NOTHING;

-- One channel per existing project
INSERT INTO public.channels (name, slug, type, project_id, description)
SELECT p.name, 'proj-' || p.slug, 'project', p.id, 'Project channel for ' || p.name
FROM public.projects p
WHERE NOT EXISTS (SELECT 1 FROM public.channels c WHERE c.project_id = p.id)
ON CONFLICT (slug) DO NOTHING;
