
-- profiles extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_permissions_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  granted boolean NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions_overrides TO authenticated;
GRANT ALL ON public.user_permissions_overrides TO service_role;
ALTER TABLE public.user_permissions_overrides ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role public.app_role NOT NULL DEFAULT 'employee',
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  project_ids uuid[] DEFAULT ARRAY[]::uuid[],
  custom_message text,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'draft',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  severity text NOT NULL DEFAULT 'info',
  module text,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general',
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- updated_at triggers
DO $$ BEGIN CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_teams_updated BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_invitations_updated BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_system_settings_updated BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') $$;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH override AS (
    SELECT granted FROM public.user_permissions_overrides
    WHERE user_id = _user_id AND permission_key = _permission_key LIMIT 1
  )
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM override) THEN (SELECT granted FROM override)
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role = ur.role
        WHERE ur.user_id = _user_id AND rp.permission_key = _permission_key
      )
    END;
$$;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.log_audit(
  _action text, _entity_type text DEFAULT NULL, _entity_id text DEFAULT NULL,
  _severity text DEFAULT 'info', _module text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _id uuid;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, severity, module, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _severity, _module, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, text, text, text, jsonb) TO authenticated, service_role;

-- RLS POLICIES
DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "orgs_insert_super" ON public.organizations;
CREATE POLICY "orgs_insert_super" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
CREATE POLICY "orgs_update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (public.is_admin(auth.uid()) AND id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "orgs_delete_super" ON public.organizations;
CREATE POLICY "orgs_delete_super" ON public.organizations FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "departments_select" ON public.departments;
CREATE POLICY "departments_select" ON public.departments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "departments_insert" ON public.departments;
CREATE POLICY "departments_insert" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "departments_update" ON public.departments;
CREATE POLICY "departments_update" ON public.departments FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "departments_delete" ON public.departments;
CREATE POLICY "departments_delete" ON public.departments FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "teams_select" ON public.teams;
CREATE POLICY "teams_select" ON public.teams FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
CREATE POLICY "teams_insert" ON public.teams FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "teams_update" ON public.teams;
CREATE POLICY "teams_update" ON public.teams FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "teams_delete" ON public.teams;
CREATE POLICY "teams_delete" ON public.teams FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "tm_select" ON public.team_members;
CREATE POLICY "tm_select" ON public.team_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tm_insert" ON public.team_members;
CREATE POLICY "tm_insert" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "tm_update" ON public.team_members;
CREATE POLICY "tm_update" ON public.team_members FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "tm_delete" ON public.team_members;
CREATE POLICY "tm_delete" ON public.team_members FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "perms_select" ON public.permissions;
CREATE POLICY "perms_select" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rp_select" ON public.role_permissions;
CREATE POLICY "rp_select" ON public.role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "rp_insert" ON public.role_permissions;
CREATE POLICY "rp_insert" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'manage_permissions'));
DROP POLICY IF EXISTS "rp_delete" ON public.role_permissions;
CREATE POLICY "rp_delete" ON public.role_permissions FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'manage_permissions'));

DROP POLICY IF EXISTS "upo_select" ON public.user_permissions_overrides;
CREATE POLICY "upo_select" ON public.user_permissions_overrides FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "upo_insert" ON public.user_permissions_overrides;
CREATE POLICY "upo_insert" ON public.user_permissions_overrides FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'manage_permissions'));
DROP POLICY IF EXISTS "upo_update" ON public.user_permissions_overrides;
CREATE POLICY "upo_update" ON public.user_permissions_overrides FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'manage_permissions')) WITH CHECK (public.has_permission(auth.uid(), 'manage_permissions'));
DROP POLICY IF EXISTS "upo_delete" ON public.user_permissions_overrides;
CREATE POLICY "upo_delete" ON public.user_permissions_overrides FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'manage_permissions'));

DROP POLICY IF EXISTS "inv_select" ON public.invitations;
CREATE POLICY "inv_select" ON public.invitations FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'invite_users') OR invited_by = auth.uid());
DROP POLICY IF EXISTS "inv_insert" ON public.invitations;
CREATE POLICY "inv_insert" ON public.invitations FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'invite_users'));
DROP POLICY IF EXISTS "inv_update" ON public.invitations;
CREATE POLICY "inv_update" ON public.invitations FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'invite_users')) WITH CHECK (public.has_permission(auth.uid(), 'invite_users'));
DROP POLICY IF EXISTS "inv_delete" ON public.invitations;
CREATE POLICY "inv_delete" ON public.invitations FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'invite_users'));

DROP POLICY IF EXISTS "audit_select" ON public.audit_logs;
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_permission(auth.uid(), 'view_audit_logs'));
DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

DROP POLICY IF EXISTS "ss_select" ON public.system_settings;
CREATE POLICY "ss_select" ON public.system_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ss_insert" ON public.system_settings;
CREATE POLICY "ss_insert" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'manage_settings'));
DROP POLICY IF EXISTS "ss_update" ON public.system_settings;
CREATE POLICY "ss_update" ON public.system_settings FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'manage_settings')) WITH CHECK (public.has_permission(auth.uid(), 'manage_settings'));
DROP POLICY IF EXISTS "ss_delete" ON public.system_settings;
CREATE POLICY "ss_delete" ON public.system_settings FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'manage_settings'));

-- SEED permissions catalog
INSERT INTO public.permissions (key, category, description) VALUES
  ('view_users','User Management','View users list'),
  ('invite_users','User Management','Invite new users'),
  ('edit_users','User Management','Edit user profiles'),
  ('delete_users','User Management','Delete users'),
  ('deactivate_users','User Management','Deactivate users'),
  ('assign_roles','User Management','Assign roles to users'),
  ('view_projects','Project Management','View projects'),
  ('create_projects','Project Management','Create projects'),
  ('edit_projects','Project Management','Edit projects'),
  ('delete_projects','Project Management','Delete projects'),
  ('archive_projects','Project Management','Archive projects'),
  ('assign_project_members','Project Management','Assign project members'),
  ('view_tasks','Task Management','View tasks'),
  ('create_tasks','Task Management','Create tasks'),
  ('edit_tasks','Task Management','Edit tasks'),
  ('delete_tasks','Task Management','Delete tasks'),
  ('assign_tasks','Task Management','Assign tasks'),
  ('complete_tasks','Task Management','Mark tasks complete'),
  ('view_messages','Communication','View messages'),
  ('send_messages','Communication','Send messages'),
  ('edit_messages','Communication','Edit own messages'),
  ('delete_messages','Communication','Delete messages'),
  ('create_channels','Communication','Create channels'),
  ('manage_channels','Communication','Manage channels'),
  ('view_files','Files','View files'),
  ('upload_files','Files','Upload files'),
  ('edit_files','Files','Edit files'),
  ('delete_files','Files','Delete files'),
  ('share_files','Files','Share files'),
  ('view_documents','Documents','View documents'),
  ('create_documents','Documents','Create documents'),
  ('edit_documents','Documents','Edit documents'),
  ('delete_documents','Documents','Delete documents'),
  ('approve_documents','Documents','Approve documents'),
  ('view_reports','Reports','View reports'),
  ('create_reports','Reports','Create reports'),
  ('export_reports','Reports','Export reports'),
  ('access_admin','Admin','Access admin area'),
  ('manage_roles','Admin','Manage roles'),
  ('manage_permissions','Admin','Manage permissions'),
  ('manage_settings','Admin','Manage system settings'),
  ('view_audit_logs','Admin','View audit logs'),
  ('use_assistant','AI','Use AI assistant'),
  ('manage_ai_settings','AI','Manage AI settings'),
  ('approve_ai_actions','AI','Approve AI actions'),
  ('view_ai_memory','AI','View AI memory'),
  ('use_voice','Voice','Use voice features'),
  ('manage_voice_settings','Voice','Manage voice settings'),
  ('view_email_templates','Email','View email templates'),
  ('create_email_templates','Email','Create email templates'),
  ('edit_email_templates','Email','Edit email templates'),
  ('delete_email_templates','Email','Delete email templates'),
  ('send_email_templates','Email','Send email templates'),
  ('view_email_logs','Email','View email logs')
ON CONFLICT (key) DO NOTHING;

-- Admin: every permission
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::public.app_role, key FROM public.permissions
ON CONFLICT DO NOTHING;

-- CEO
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'ceo'::public.app_role, key FROM public.permissions
WHERE key NOT IN ('delete_users','manage_permissions','manage_roles','manage_settings')
ON CONFLICT DO NOTHING;

-- Project Manager
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('project_manager','view_users'),
  ('project_manager','view_projects'),('project_manager','create_projects'),('project_manager','edit_projects'),('project_manager','archive_projects'),('project_manager','assign_project_members'),
  ('project_manager','view_tasks'),('project_manager','create_tasks'),('project_manager','edit_tasks'),('project_manager','delete_tasks'),('project_manager','assign_tasks'),('project_manager','complete_tasks'),
  ('project_manager','view_messages'),('project_manager','send_messages'),('project_manager','edit_messages'),('project_manager','create_channels'),('project_manager','manage_channels'),
  ('project_manager','view_files'),('project_manager','upload_files'),('project_manager','edit_files'),('project_manager','share_files'),
  ('project_manager','view_documents'),('project_manager','create_documents'),('project_manager','edit_documents'),('project_manager','approve_documents'),
  ('project_manager','view_reports'),('project_manager','create_reports'),('project_manager','export_reports'),
  ('project_manager','use_assistant'),('project_manager','use_voice'),
  ('project_manager','view_email_templates'),('project_manager','send_email_templates')
ON CONFLICT DO NOTHING;

-- Team Lead
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('team_lead','view_users'),
  ('team_lead','view_projects'),('team_lead','edit_projects'),
  ('team_lead','view_tasks'),('team_lead','create_tasks'),('team_lead','edit_tasks'),('team_lead','assign_tasks'),('team_lead','complete_tasks'),
  ('team_lead','view_messages'),('team_lead','send_messages'),('team_lead','edit_messages'),('team_lead','create_channels'),
  ('team_lead','view_files'),('team_lead','upload_files'),('team_lead','share_files'),
  ('team_lead','view_documents'),('team_lead','create_documents'),('team_lead','edit_documents'),
  ('team_lead','view_reports'),('team_lead','create_reports'),
  ('team_lead','use_assistant'),('team_lead','use_voice')
ON CONFLICT DO NOTHING;

-- Employee
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('employee','view_projects'),
  ('employee','view_tasks'),('employee','edit_tasks'),('employee','complete_tasks'),
  ('employee','view_messages'),('employee','send_messages'),('employee','edit_messages'),
  ('employee','view_files'),('employee','upload_files'),
  ('employee','view_documents'),
  ('employee','use_assistant'),('employee','use_voice')
ON CONFLICT DO NOTHING;

-- Contractor
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('contractor','view_projects'),
  ('contractor','view_tasks'),('contractor','complete_tasks'),
  ('contractor','view_messages'),('contractor','send_messages'),
  ('contractor','view_files'),('contractor','upload_files'),
  ('contractor','view_documents'),
  ('contractor','use_assistant')
ON CONFLICT DO NOTHING;

-- Client
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('client','view_projects'),
  ('client','view_messages'),('client','send_messages'),
  ('client','view_files'),
  ('client','view_documents'),
  ('client','view_reports')
ON CONFLICT DO NOTHING;

-- Investor
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('investor','view_projects'),
  ('investor','view_documents'),
  ('investor','view_reports'),
  ('investor','view_messages')
ON CONFLICT DO NOTHING;

-- Default system settings
INSERT INTO public.system_settings (key, value, category, description) VALUES
  ('voice.enabled_globally', 'true'::jsonb, 'voice', 'Enable voice features globally'),
  ('assistant.enabled', 'true'::jsonb, 'assistant', 'Enable AI assistant'),
  ('assistant.require_approval', 'true'::jsonb, 'assistant', 'Require approval for AI actions'),
  ('assistant.max_autonomous_actions_per_day', '20'::jsonb, 'assistant', 'Max autonomous actions per day'),
  ('email.enabled', 'false'::jsonb, 'email', 'Enable real email sending'),
  ('languages.default', '"en"'::jsonb, 'i18n', 'Default language'),
  ('languages.enabled', '["en","uk","ru","es","he"]'::jsonb, 'i18n', 'Enabled languages')
ON CONFLICT (key) DO NOTHING;
