import { supabase } from "@/integrations/supabase/client";
import { FOUNDER_ADMIN_ACCESS, isFounderModeEnabled } from "@/lib/founder-mode";

export type UserRoleFlags = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export async function resolveUserRoleFlags(userId: string): Promise<UserRoleFlags> {
  const [adminResult, superResult] = await Promise.all([
    supabase.rpc("is_admin", { _user_id: userId }),
    supabase.rpc("is_super_admin", { _user_id: userId }),
  ]);

  if (adminResult.error) {
    console.warn("[auth] is_admin rpc failed", adminResult.error);
  }
  if (superResult.error) {
    console.warn("[auth] is_super_admin rpc failed", superResult.error);
  }

  return {
    isAdmin: Boolean(adminResult.data),
    isSuperAdmin: Boolean(superResult.data),
  };
}

function founderAdminAreaAccess() {
  return {
    canAccessAdmin: FOUNDER_ADMIN_ACCESS.canAccessAdmin,
    permissions: Object.fromEntries(
      ADMIN_AREA_PERMISSIONS.map((key) => [key, true]),
    ) as Record<AdminAreaPermission, boolean>,
  };
}

export async function requireAdminSession() {
  if (isFounderModeEnabled()) {
    return {
      allowed: true as const,
      roles: {
        isAdmin: FOUNDER_ADMIN_ACCESS.isAdmin,
        isSuperAdmin: FOUNDER_ADMIN_ACCESS.isSuperAdmin,
      },
    };
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) {
    return { allowed: false as const, reason: "no_session" as const };
  }

  const roles = await resolveUserRoleFlags(session.user.id);
  if (!roles.isAdmin) {
    return { allowed: false as const, reason: "not_admin" as const, session };
  }

  return { allowed: true as const, session, roles };
}

export async function resolveUserPermission(userId: string, permissionKey: string) {
  const { data, error } = await supabase.rpc("has_permission", {
    _user_id: userId,
    _permission_key: permissionKey,
  });

  if (error) {
    console.warn("[auth] has_permission rpc failed", permissionKey, error);
    return false;
  }

  return Boolean(data);
}

export async function requirePermissionSession(permissionKey: string) {
  if (isFounderModeEnabled()) {
    return { allowed: true as const };
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) {
    return { allowed: false as const, reason: "no_session" as const };
  }

  const granted = await resolveUserPermission(session.user.id, permissionKey);
  if (!granted) {
    return { allowed: false as const, reason: "forbidden" as const, session };
  }

  return { allowed: true as const, session };
}

export const ADMIN_AREA_PERMISSIONS = [
  "view_users",
  "manage_permissions",
  "invite_users",
  "view_email_templates",
  "view_email_logs",
  "view_audit_logs",
  "manage_settings",
] as const;

export type AdminAreaPermission = (typeof ADMIN_AREA_PERMISSIONS)[number];

export const ADMIN_ROUTE_PERMISSIONS: Record<string, AdminAreaPermission | null> = {
  "/administration": null,
  "/administration/users": "view_users",
  "/administration/roles": "manage_permissions",
  "/administration/invitations": "invite_users",
  "/administration/emails": "view_email_templates",
  "/administration/email-logs": "view_email_logs",
  "/administration/voice": "manage_settings",
  "/administration/audit": "view_audit_logs",
  "/administration/settings": "manage_settings",
  "/administration/downloads": null,
  "/administration/role-switcher": null,
};

export async function resolveAdminAreaAccess(userId: string) {
  const roles = await resolveUserRoleFlags(userId);
  if (roles.isAdmin || roles.isSuperAdmin) {
    return founderAdminAreaAccess();
  }

  const checks = await Promise.all(
    ADMIN_AREA_PERMISSIONS.map(
      async (key) => [key, await resolveUserPermission(userId, key)] as const,
    ),
  );
  const permissions = Object.fromEntries(checks) as Record<AdminAreaPermission, boolean>;

  return {
    canAccessAdmin: checks.some(([, granted]) => granted),
    permissions,
  };
}

export async function requireAdminAreaSession() {
  if (isFounderModeEnabled()) {
    return { allowed: true as const, access: founderAdminAreaAccess() };
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) {
    return { allowed: false as const, reason: "no_session" as const };
  }

  const access = await resolveAdminAreaAccess(session.user.id);
  if (!access.canAccessAdmin) {
    return { allowed: false as const, reason: "forbidden" as const, session };
  }

  return { allowed: true as const, session, access };
}
