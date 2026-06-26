import { resolveUserPermission, resolveUserRoleFlags } from "@/lib/auth-roles";
import { logWorkspaceActivity } from "@/lib/activity-log";
import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { requireWorkspaceActor } from "@/lib/project-task-engine";
import { supabase } from "@/integrations/supabase/client";

async function requireEditUsers(userId: string) {
  const allowed = await resolveUserPermission(userId, "edit_users");
  if (!allowed) throw new Error("Missing permission: edit_users");
}

async function requireOrgAdmin(userId: string) {
  const roles = await resolveUserRoleFlags(userId);
  if (!roles.isAdmin && !roles.isSuperAdmin) {
    throw new Error("Admin access required");
  }
}

export async function createTeamRecord(input: { name: string; description?: string | null }) {
  const user = await requireWorkspaceActor();
  await requireEditUsers(user.id);

  const name = input.name.trim();
  if (!name) throw new Error("Team name is required");

  const organizationId = await resolveActiveOrganizationId(user.id);
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      description: input.description?.trim() || null,
      created_by: user.id,
      organization_id: organizationId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "team.created",
    entityType: "team",
    entityId: data.id,
    metadata: { name },
  });

  return data;
}

export async function archiveTeamRecord(teamId: string) {
  const user = await requireWorkspaceActor();
  await requireEditUsers(user.id);
  await requireOrgAdmin(user.id);

  const { data: team, error: fetchError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!team) throw new Error("Team not found");

  const { error } = await supabase
    .from("teams")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", teamId);
  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "team.archived",
    entityType: "team",
    entityId: teamId,
    metadata: { name: team.name },
  });
}

export async function createDepartmentRecord(input: { name: string; description?: string | null }) {
  const user = await requireWorkspaceActor();
  await requireEditUsers(user.id);

  const name = input.name.trim();
  if (!name) throw new Error("Department name is required");

  const organizationId = await resolveActiveOrganizationId(user.id);
  const { data, error } = await supabase
    .from("departments")
    .insert({
      name,
      description: input.description?.trim() || null,
      created_by: user.id,
      organization_id: organizationId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "department.created",
    entityType: "department",
    entityId: data.id,
    metadata: { name },
  });

  return data;
}

export async function archiveDepartmentRecord(departmentId: string) {
  const user = await requireWorkspaceActor();
  await requireEditUsers(user.id);
  await requireOrgAdmin(user.id);

  const { data: department, error: fetchError } = await supabase
    .from("departments")
    .select("id, name")
    .eq("id", departmentId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!department) throw new Error("Department not found");

  const { error } = await supabase
    .from("departments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", departmentId);
  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "department.archived",
    entityType: "department",
    entityId: departmentId,
    metadata: { name: department.name },
  });
}

export async function canManageTeams(userId: string) {
  return resolveUserPermission(userId, "edit_users");
}
