
-- =========================
-- EMAIL TEMPLATES
-- =========================
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  category text NOT NULL DEFAULT 'system',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, language)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active templates"
  ON public.email_templates FOR SELECT TO authenticated
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert templates"
  ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update templates"
  ON public.email_templates FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete templates"
  ON public.email_templates FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);

-- =========================
-- EMAIL LOGS
-- =========================
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug text,
  language text DEFAULT 'en',
  recipient_email text NOT NULL,
  recipient_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text,
  body_html text,
  status text NOT NULL DEFAULT 'queued', -- queued | sent | failed | suppressed
  error_message text,
  variables jsonb DEFAULT '{}'::jsonb,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  module text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
  ON public.email_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated can insert email logs"
  ON public.email_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update email logs"
  ON public.email_logs FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete email logs"
  ON public.email_logs FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_template ON public.email_logs(template_slug);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- =========================
-- SEED TEMPLATES (EN + RU)
-- =========================
INSERT INTO public.email_templates (slug, language, name, subject, body_html, category, variables, description) VALUES
('invitation','en','User Invitation','You''re invited to join {{organization_name}}',
 '<h1>Hello {{recipient_name}},</h1><p>{{inviter_name}} invited you to join <strong>{{organization_name}}</strong> as <strong>{{role}}</strong>.</p><p><a href="{{accept_url}}">Accept invitation</a></p><p>This invitation expires on {{expires_at}}.</p>',
 'auth','["recipient_name","inviter_name","organization_name","role","accept_url","expires_at"]'::jsonb,
 'Sent to new users when an admin invites them.'),
('invitation','ru','Приглашение пользователя','Вас приглашают присоединиться к {{organization_name}}',
 '<h1>Здравствуйте, {{recipient_name}}!</h1><p>{{inviter_name}} приглашает вас в <strong>{{organization_name}}</strong> в роли <strong>{{role}}</strong>.</p><p><a href="{{accept_url}}">Принять приглашение</a></p><p>Срок действия приглашения истекает {{expires_at}}.</p>',
 'auth','["recipient_name","inviter_name","organization_name","role","accept_url","expires_at"]'::jsonb,
 'Отправляется при приглашении нового пользователя администратором.'),
('password_reset','en','Password Reset','Reset your password',
 '<h1>Hi {{recipient_name}},</h1><p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="{{reset_url}}">Reset password</a></p>',
 'auth','["recipient_name","reset_url"]'::jsonb,'Password reset link email.'),
('password_reset','ru','Сброс пароля','Сброс пароля',
 '<h1>Здравствуйте, {{recipient_name}}!</h1><p>Нажмите, чтобы сбросить пароль. Ссылка действует 1 час.</p><p><a href="{{reset_url}}">Сбросить пароль</a></p>',
 'auth','["recipient_name","reset_url"]'::jsonb,'Письмо со ссылкой для сброса пароля.'),
('welcome','en','Welcome','Welcome to {{organization_name}}',
 '<h1>Welcome, {{recipient_name}}!</h1><p>Your account is ready. Sign in at <a href="{{app_url}}">{{app_url}}</a>.</p>',
 'system','["recipient_name","organization_name","app_url"]'::jsonb,'Sent after successful onboarding.'),
('welcome','ru','Добро пожаловать','Добро пожаловать в {{organization_name}}',
 '<h1>Добро пожаловать, {{recipient_name}}!</h1><p>Ваш аккаунт готов. Войдите по адресу <a href="{{app_url}}">{{app_url}}</a>.</p>',
 'system','["recipient_name","organization_name","app_url"]'::jsonb,'Отправляется после регистрации.'),
('role_changed','en','Role Changed','Your role has changed',
 '<p>Hi {{recipient_name}},</p><p>Your role was changed from <strong>{{old_role}}</strong> to <strong>{{new_role}}</strong> by {{actor_name}}.</p>',
 'notifications','["recipient_name","old_role","new_role","actor_name"]'::jsonb,'Notifies a user when their role changes.'),
('role_changed','ru','Изменение роли','Ваша роль изменена',
 '<p>Здравствуйте, {{recipient_name}}!</p><p>Ваша роль изменена с <strong>{{old_role}}</strong> на <strong>{{new_role}}</strong> пользователем {{actor_name}}.</p>',
 'notifications','["recipient_name","old_role","new_role","actor_name"]'::jsonb,'Уведомление об изменении роли.'),
('weekly_report','en','Weekly Report','Your weekly summary',
 '<h1>Weekly summary</h1><p>Hi {{recipient_name}}, here is your activity for the week: {{summary}}.</p>',
 'reports','["recipient_name","summary"]'::jsonb,'Weekly activity digest.'),
('weekly_report','ru','Еженедельный отчет','Ваша сводка за неделю',
 '<h1>Сводка за неделю</h1><p>Здравствуйте, {{recipient_name}}! Ваша активность: {{summary}}.</p>',
 'reports','["recipient_name","summary"]'::jsonb,'Еженедельная сводка активности.');
