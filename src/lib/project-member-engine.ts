import { resolveUserPermission } from "@/lib/auth-roles";
import { logWorkspaceActivity } from "@/lib/activity-log";
import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { requireWorkspaceActor } from "@/lib/project-task-engine";
import { supabase } from "@/integrations/supabase/client";

async function requireAssignMembers(userId: string) {
  const allowed = await resolveUserPermission(userId, "assign_project_members");
  if (!allowed) throw new Error("Missing permission: assign_project_members");
}

export async function assignProjectMember(input: {
  projectId: string;
  userId: string;
  role?: string;
}) {
  const user = await requireWorkspaceActor();
  await requireAssignMembers(user.id);

  const organizationId = await resolveActiveOrganizationId(user.id);
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, organization_id, owner_id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Project not found");
  if (project.organization_id && project.organization_id !== organizationId) {
    throw new Error("Project is outside your workspace");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, full_name, email")
    .eq("id", input.userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error("User not found");
  if (
    project.organization_id &&
    profile.organization_id &&
    profile.organization_id !== project.organization_id
  ) {
    throw new Error("User is outside the project workspace");
  }

  const { data, error } = await supabase
    .from("project_members")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      role: input.role ?? "member",
    })
    .select("id")
    .single();
  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "project.member_assigned",
    entityType: "project_member",
    entityId: data.id,
    projectId: input.projectId,
    metadata: {
      memberId: input.userId,
      memberLabel: profile.full_name || profile.email,
      role: input.role ?? "member",
    },
  });

  return data;
}

export async function removeProjectMember(projectId: string, memberUserId: string) {
  const user = await requireWorkspaceActor();
  await requireAssignMembers(user.id);

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", memberUserId);
  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "project.member_removed",
    entityType: "project",
    entityId: projectId,
    projectId,
    metadata: { memberId: memberUserId },
  });
}
