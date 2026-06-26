import type { User } from "@supabase/supabase-js";
import { logWorkspaceActivity } from "@/lib/activity-log";
import { resolveUserPermission } from "@/lib/auth-roles";
import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { deliverInAppNotification } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DecisionStatus = Database["public"]["Enums"]["decision_status"];
type DecisionImpact = Database["public"]["Enums"]["decision_impact"];

export type CreateDecisionInput = {
  title: string;
  context?: string | null;
  recommendation?: string | null;
  impact?: DecisionImpact;
  projectId?: string | null;
};

async function requireWorkspaceActor(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user;
}

async function requirePermission(userId: string, permissionKey: string) {
  const allowed = await resolveUserPermission(userId, permissionKey);
  if (!allowed) throw new Error(`Missing permission: ${permissionKey}`);
}

async function notifyProjectStakeholders(input: {
  projectId: string;
  actorId: string;
  title: string;
  body: string;
  entityId: string;
  url: string;
}) {
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id, created_by, slug")
    .eq("id", input.projectId)
    .maybeSingle();
  if (!project) return;

  const recipients = new Set<string>();
  if (project.owner_id) recipients.add(project.owner_id);
  if (project.created_by) recipients.add(project.created_by);
  recipients.delete(input.actorId);

  const url = project.slug ? `/projects/${project.slug}` : input.url;
  await Promise.all(
    Array.from(recipients).map((userId) =>
      deliverInAppNotification({
        userId,
        type: "approval",
        title: input.title,
        body: input.body,
        actorId: input.actorId,
        entityType: "decision",
        entityId: input.entityId,
        url,
      }).catch(() => undefined),
    ),
  );
}

export async function createDecisionRecord(input: CreateDecisionInput) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "edit_projects");

  const title = input.title.trim();
  if (!title) throw new Error("Decision title is required");

  const organizationId = await resolveActiveOrganizationId(user.id);
  const { data, error } = await supabase
    .from("decisions")
    .insert({
      title,
      context: input.context ?? null,
      recommendation: input.recommendation ?? null,
      impact: input.impact ?? "medium",
      requested_by: user.id,
      organization_id: organizationId,
      project_id: input.projectId ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.projectId) {
    await notifyProjectStakeholders({
      projectId: input.projectId,
      actorId: user.id,
      title: "Decision pending review",
      body: title,
      entityId: data.id,
      url: "/approvals",
    });
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "decision.created",
    entityType: "decision",
    entityId: data.id,
    projectId: input.projectId ?? null,
    metadata: { title, impact: input.impact ?? "medium" },
  });

  return data;
}

export async function updateDecisionStatus(decisionId: string, status: DecisionStatus) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "approve_documents");

  const { data: decision, error: fetchError } = await supabase
    .from("decisions")
    .select("id, title, status, requested_by, project_id, projects(slug)")
    .eq("id", decisionId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!decision) throw new Error("Decision not found");

  const { error } = await supabase
    .from("decisions")
    .update({
      status,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", decisionId);
  if (error) throw error;

  if (decision.requested_by && decision.requested_by !== user.id && decision.status !== status) {
    const projectSlug = (decision.projects as { slug?: string } | null)?.slug;
    await deliverInAppNotification({
      userId: decision.requested_by,
      type: "approval",
      title: `Decision ${status.replace("_", " ")}`,
      body: decision.title,
      actorId: user.id,
      entityType: "decision",
      entityId: decisionId,
      url: projectSlug ? `/projects/${projectSlug}` : "/approvals",
    }).catch(() => undefined);
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "decision.status_updated",
    entityType: "decision",
    entityId: decisionId,
    projectId: decision.project_id,
    metadata: { from: decision.status, to: status, title: decision.title },
  });

  return { id: decisionId, status };
}
