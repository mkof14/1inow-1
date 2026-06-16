import { supabase } from "@/integrations/supabase/client";

export type Permission = { id: string; key: string; category: string; description: string | null };
export type RolePermission = { role: string; permission_key: string };
export type AppProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  language: string | null;
  timezone: string | null;
  phone: string | null;
  country: string | null;
  created_at: string;
};
export type UserRoleRow = { id: string; user_id: string; role: string };
export type Invitation = {
  id: string; email: string; full_name: string | null; role: string;
  status: string; expires_at: string; created_at: string; custom_message: string | null;
  token: string;
};
export type AuditLog = {
  id: string; action: string; entity_type: string | null; entity_id: string | null;
  severity: string; module: string | null; actor_id: string | null;
  metadata: Record<string, unknown>; created_at: string;
};
export type SystemSetting = {
  id: string; key: string; value: unknown; category: string;
  description: string | null; updated_at: string;
};

export type EmailTemplate = {
  id: string; slug: string; language: string; name: string; subject: string;
  body_html: string; body_text: string | null; category: string;
  variables: string[]; is_active: boolean; description: string | null;
  created_at: string; updated_at: string;
};
export type EmailLog = {
  id: string; template_slug: string | null; language: string | null;
  recipient_email: string; subject: string | null; status: string;
  error_message: string | null; module: string | null;
  variables: Record<string, unknown>; created_at: string; sent_at: string | null;
};

export const ROLES = [
  "super_admin","admin","ceo","project_manager","team_lead",
  "employee","contractor","client","investor","guest",
] as const;
export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin", admin: "Admin", ceo: "CEO",
  project_manager: "Project Manager", team_lead: "Team Lead",
  employee: "Employee", contractor: "Contractor", client: "Client",
  investor: "Investor", guest: "Guest",
};

export async function fetchPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.from("permissions").select("*").order("category").order("key");
  if (error) throw error;
  return (data ?? []) as Permission[];
}

export async function fetchRolePermissions(): Promise<RolePermission[]> {
  const { data, error } = await supabase.from("role_permissions").select("role,permission_key");
  if (error) throw error;
  return (data ?? []) as RolePermission[];
}

export async function toggleRolePermission(role: AppRole, permission_key: string, granted: boolean) {
  if (granted) {
    const { error } = await supabase.from("role_permissions").insert({ role, permission_key } as any);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("role_permissions").delete()
      .eq("role", role).eq("permission_key", permission_key);
    if (error) throw error;
  }
}

export async function fetchProfiles(): Promise<AppProfile[]> {
  const { data, error } = await supabase.from("profiles")
    .select("id,email,full_name,avatar_url,status,language,timezone,phone,country,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppProfile[];
}

export async function fetchUserRoles(): Promise<UserRoleRow[]> {
  const { data, error } = await supabase.from("user_roles").select("id,user_id,role");
  if (error) throw error;
  return (data ?? []) as UserRoleRow[];
}

export async function setUserRole(user_id: string, role: AppRole) {
  // remove existing then insert (single primary role per user for admin UI)
  await supabase.from("user_roles").delete().eq("user_id", user_id);
  const { error } = await supabase.from("user_roles").insert({ user_id, role } as any);
  if (error) throw error;
}

export async function updateProfileStatus(id: string, status: "active" | "inactive") {
  const { error } = await supabase.from("profiles").update({ status } as any).eq("id", id);
  if (error) throw error;
}

export async function fetchInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase.from("invitations")
    .select("id,email,full_name,role,status,expires_at,created_at,custom_message,token")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Invitation[];
}

export async function createInvitation(input: {
  email: string; full_name?: string; role: AppRole;
  custom_message?: string; language?: string;
}) {
  const { data, error } = await supabase.from("invitations")
    .insert({ ...input, status: "sent" } as any).select().single();
  if (error) throw error;
  return data;
}

export async function cancelInvitation(id: string) {
  const { error } = await supabase.from("invitations").update({ status: "canceled" } as any).eq("id", id);
  if (error) throw error;
}

export async function resendInvitation(id: string) {
  const { error } = await supabase.from("invitations")
    .update({ status: "sent", expires_at: new Date(Date.now() + 14 * 86400_000).toISOString() } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchAuditLogs(limit = 200): Promise<AuditLog[]> {
  const { data, error } = await supabase.from("audit_logs")
    .select("id,action,entity_type,entity_id,severity,module,actor_id,metadata,created_at")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function fetchSystemSettings(): Promise<SystemSetting[]> {
  const { data, error } = await supabase.from("system_settings")
    .select("id,key,value,category,description,updated_at").order("category").order("key");
  if (error) throw error;
  return (data ?? []) as SystemSetting[];
}

export async function updateSystemSetting(key: string, value: unknown) {
  const { error } = await supabase.from("system_settings").update({ value } as any).eq("key", key);
  if (error) throw error;
}

// ---------- Email templates ----------
export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase.from("email_templates" as any)
    .select("*").order("category").order("slug").order("language");
  if (error) throw error;
  return (data ?? []) as unknown as EmailTemplate[];
}

export async function upsertEmailTemplate(t: Partial<EmailTemplate> & { slug: string; language: string; name: string; subject: string; body_html: string }) {
  const { error } = await supabase.from("email_templates" as any)
    .upsert(t as any, { onConflict: "slug,language" });
  if (error) throw error;
}

export async function deleteEmailTemplate(id: string) {
  const { error } = await supabase.from("email_templates" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function fetchEmailLogs(limit = 200): Promise<EmailLog[]> {
  const { data, error } = await supabase.from("email_logs" as any)
    .select("id,template_slug,language,recipient_email,subject,status,error_message,module,variables,created_at,sent_at")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as EmailLog[];
}

/** Render {{var}} placeholders. */
export function renderTemplate(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : `{{${k}}}`);
}

/** Log a fake email send (no real delivery yet — UI/logs only). */
export async function logEmail(input: {
  template_slug: string; language?: string; recipient_email: string;
  variables: Record<string, unknown>; module?: string;
}) {
  const { data: tpls } = await supabase.from("email_templates" as any)
    .select("subject,body_html").eq("slug", input.template_slug)
    .eq("language", input.language ?? "en").limit(1);
  const tpl = (tpls?.[0] ?? {}) as { subject?: string; body_html?: string };
  const subject = tpl.subject ? renderTemplate(tpl.subject, input.variables) : null;
  const body_html = tpl.body_html ? renderTemplate(tpl.body_html, input.variables) : null;
  const { error } = await supabase.from("email_logs" as any).insert({
    template_slug: input.template_slug,
    language: input.language ?? "en",
    recipient_email: input.recipient_email,
    subject, body_html,
    status: "queued",
    module: input.module ?? null,
    variables: input.variables,
    error_message: "Email delivery is disabled in development mode",
  } as any);
  if (error) throw error;
}

export async function fetchAdminStats() {
  const [profiles, invites, audit] = await Promise.all([
    supabase.from("profiles").select("id,status", { count: "exact", head: false }),
    supabase.from("invitations").select("id,status"),
    supabase.from("audit_logs").select("id,severity").limit(500),
  ]);
  const totalUsers = profiles.data?.length ?? 0;
  const activeUsers = (profiles.data ?? []).filter((p: any) => p.status === "active").length;
  const pendingInvites = (invites.data ?? []).filter((i: any) => i.status === "sent" || i.status === "draft").length;
  const recentAuditCount = audit.data?.length ?? 0;
  const alerts = (audit.data ?? []).filter((a: any) => a.severity === "critical" || a.severity === "warning").length;
  return { totalUsers, activeUsers, pendingInvites, recentAuditCount, alerts };
}