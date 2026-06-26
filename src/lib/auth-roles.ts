import { supabase } from "@/integrations/supabase/client";

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

export async function requireAdminSession() {
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
