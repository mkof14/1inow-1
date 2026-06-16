
-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('project','task','document','channel','report','note')),
  entity_id uuid NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_owner_all" ON public.favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX favorites_user_idx ON public.favorites(user_id, entity_type);

-- ============ RECENT ITEMS ============
CREATE TABLE public.recent_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('project','task','document','file','channel','meeting','note')),
  entity_id uuid NOT NULL,
  label text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recent_items TO authenticated;
GRANT ALL ON public.recent_items TO service_role;
ALTER TABLE public.recent_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recent_owner_all" ON public.recent_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX recent_user_idx ON public.recent_items(user_id, opened_at DESC);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention','task_update','comment','approval','message','deadline','assignment','system')),
  title text NOT NULL,
  body text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  url text,
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_owner_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_owner_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_owner_delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_authenticated_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX notif_user_idx ON public.notifications(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ USER SETTINGS ============
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'UTC',
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  notifications jsonb NOT NULL DEFAULT '{"email":true,"inapp":true,"mentions":true,"deadlines":true}'::jsonb,
  working_hours jsonb NOT NULL DEFAULT '{"start":"09:00","end":"18:00","days":[1,2,3,4,5]}'::jsonb,
  default_project_view text NOT NULL DEFAULT 'board' CHECK (default_project_view IN ('board','list','calendar','timeline')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_owner_all" ON public.user_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
