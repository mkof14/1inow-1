
-- 1. profiles extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS secondary_language text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'yyyy-MM-dd',
  ADD COLUMN IF NOT EXISTS time_format text NOT NULL DEFAULT 'HH:mm',
  ADD COLUMN IF NOT EXISTS number_format text NOT NULL DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS online_status text NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS office_status text NOT NULL DEFAULT 'working',
  ADD COLUMN IF NOT EXISTS auto_translate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 2. languages
CREATE TABLE IF NOT EXISTS public.languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  flag text,
  rtl boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.languages TO anon, authenticated;
GRANT ALL ON public.languages TO service_role;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "languages readable by all" ON public.languages FOR SELECT USING (true);
CREATE POLICY "languages manage by admin" ON public.languages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.languages (code, name, native_name, flag, sort_order) VALUES
  ('en','English','English','🇬🇧',1),
  ('uk','Ukrainian','Українська','🇺🇦',2),
  ('ru','Russian','Русский','🇷🇺',3)
ON CONFLICT (code) DO NOTHING;

-- 3. translations (UI dictionary overrides at runtime)
CREATE TABLE IF NOT EXISTS public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace text NOT NULL DEFAULT 'app',
  key text NOT NULL,
  language text NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (namespace, key, language)
);
GRANT SELECT ON public.translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.translations TO authenticated;
GRANT ALL ON public.translations TO service_role;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translations readable" ON public.translations FOR SELECT USING (true);
CREATE POLICY "translations admin manage" ON public.translations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER translations_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. translation_memory (reuse AI translations)
CREATE TABLE IF NOT EXISTS public.translation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash text NOT NULL,
  source_language text NOT NULL,
  target_language text NOT NULL,
  source_text text NOT NULL,
  target_text text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  use_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_hash, source_language, target_language)
);
GRANT SELECT, INSERT, UPDATE ON public.translation_memory TO authenticated;
GRANT ALL ON public.translation_memory TO service_role;
ALTER TABLE public.translation_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm read auth" ON public.translation_memory FOR SELECT TO authenticated USING (true);
CREATE POLICY "tm insert auth" ON public.translation_memory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tm update admin" ON public.translation_memory FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 5. message_translations
CREATE TABLE IF NOT EXISTS public.message_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  language text NOT NULL,
  content text NOT NULL,
  translated_by text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, language)
);
GRANT SELECT, INSERT ON public.message_translations TO authenticated;
GRANT ALL ON public.message_translations TO service_role;
ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg trans read by channel members" ON public.message_translations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_channel_member(m.channel_id, auth.uid())));
CREATE POLICY "msg trans insert by channel members" ON public.message_translations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_channel_member(m.channel_id, auth.uid())));

-- 6. messages: add language tracking
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS original_language text;

-- 7. document_translations (forward-looking; documents table may not exist yet — guard)
CREATE TABLE IF NOT EXISTS public.document_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  language text NOT NULL,
  title text,
  content text NOT NULL,
  translated_by text NOT NULL DEFAULT 'ai',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_translations TO authenticated;
GRANT ALL ON public.document_translations TO service_role;
ALTER TABLE public.document_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc trans read auth" ON public.document_translations FOR SELECT TO authenticated USING (true);
CREATE POLICY "doc trans write auth" ON public.document_translations FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "doc trans update own or admin" ON public.document_translations FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));
CREATE POLICY "doc trans delete own or admin" ON public.document_translations FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));
CREATE TRIGGER document_translations_updated_at BEFORE UPDATE ON public.document_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
