import type { User } from "@supabase/supabase-js";
import { resolveUserPermission } from "@/lib/auth-roles";
import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { deliverInAppNotification } from "@/lib/notifications";
import { logWorkspaceActivity } from "@/lib/activity-log";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type ProjectPriority = Database["public"]["Enums"]["project_priority"];

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  projectId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
};

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  color?: string | null;
};

export async function requireWorkspaceActor(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user;
}

async function requirePermission(userId: string, permissionKey: string) {
  const allowed = await resolveUserPermission(userId, permissionKey);
  if (!allowed) {
    throw new Error(`Missing permission: ${permissionKey}`);
  }
}

export function makeProjectSlug(name: string) {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "project";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createTaskRecord(input: CreateTaskInput) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "create_tasks");
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required");

  const assigneeId = input.assigneeId ?? user.id;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: input.description ?? null,
      project_id: input.projectId ?? null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      created_by: user.id,
      assignee_id: assigneeId,
      due_date: input.dueDate ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (assigneeId !== user.id) {
    let url = "/tasks";
    if (input.projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("slug")
        .eq("id", input.projectId)
        .maybeSingle();
      if (project?.slug) url = `/projects/${project.slug}`;
    }

    await deliverInAppNotification({
      userId: assigneeId,
      type: "assignment",
      title: "Task assigned to you",
      body: title,
      actorId: user.id,
      entityType: "task",
      entityId: data.id,
      url,
    }).catch(() => undefined);
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "task.created",
    entityType: "task",
    entityId: data.id,
    projectId: input.projectId ?? null,
    metadata: { title, assigneeId },
  });

  return data;
}

export async function createProjectRecord(input: CreateProjectInput) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "create_projects");
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");

  const organizationId = await resolveActiveOrganizationId(user.id);
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      slug: makeProjectSlug(name),
      description: input.description ?? null,
      status: input.status ?? "planning",
      priority: input.priority ?? "medium",
      color: input.color ?? null,
      created_by: user.id,
      owner_id: user.id,
      organization_id: organizationId,
    })
    .select("id, slug")
    .single();

  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "project.created",
    entityType: "project",
    entityId: data.id,
    projectId: data.id,
    metadata: { name, slug: data.slug },
  });

  return data;
}

export async function deleteProjectRecord(projectId: string) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "edit_projects");

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!project) throw new Error("Project not found");

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "project.deleted",
    entityType: "project",
    entityId: projectId,
    projectId,
    metadata: { name: project.name },
  });
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "edit_tasks");

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, status, assignee_id, project_id, projects(slug)")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!task) throw new Error("Task not found");

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw error;

  const assigneeId = task.assignee_id;
  if (assigneeId && assigneeId !== user.id && task.status !== status) {
    const projectSlug = (task.projects as { slug?: string } | null)?.slug;
    const url = projectSlug ? `/projects/${projectSlug}` : "/tasks";
    const statusLabel = status.replace(/_/g, " ");

    await deliverInAppNotification({
      userId: assigneeId,
      type: "task_update",
      title: `Task moved to ${statusLabel}`,
      body: task.title,
      actorId: user.id,
      entityType: "task",
      entityId: taskId,
      url,
    }).catch(() => undefined);
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "task.status_updated",
    entityType: "task",
    entityId: taskId,
    projectId: task.project_id,
    metadata: { from: task.status, to: status },
  });
}

export async function deleteTaskRecord(taskId: string) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "delete_tasks");

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, project_id")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!task) throw new Error("Task not found");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;

  await logWorkspaceActivity({
    userId: user.id,
    action: "task.deleted",
    entityType: "task",
    entityId: taskId,
    projectId: task.project_id,
    metadata: { title: task.title },
  });
}

export async function updateTaskDueDate(taskId: string, dueDate: string | null) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "edit_tasks");

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, assignee_id, project_id, projects(slug)")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!task) throw new Error("Task not found");

  const { error } = await supabase.from("tasks").update({ due_date: dueDate }).eq("id", taskId);
  if (error) throw error;

  const assigneeId = task.assignee_id;
  if (assigneeId && assigneeId !== user.id) {
    const projectSlug = (task.projects as { slug?: string } | null)?.slug;
    await deliverInAppNotification({
      userId: assigneeId,
      type: "task_update",
      title: dueDate ? "Task due date updated" : "Task due date cleared",
      body: task.title,
      actorId: user.id,
      entityType: "task",
      entityId: taskId,
      url: projectSlug ? `/projects/${projectSlug}` : "/tasks",
    }).catch(() => undefined);
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "task.due_date_updated",
    entityType: "task",
    entityId: taskId,
    projectId: task.project_id,
    metadata: { dueDate },
  });
}

export async function updateTaskAssignee(taskId: string, assigneeId: string | null) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "edit_tasks");

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title, project_id, projects(slug)")
    .eq("id", taskId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!task) throw new Error("Task not found");

  const { error } = await supabase.from("tasks").update({ assignee_id: assigneeId }).eq("id", taskId);
  if (error) throw error;

  if (assigneeId && assigneeId !== user.id) {
    const projectSlug = (task.projects as { slug?: string } | null)?.slug;
    await deliverInAppNotification({
      userId: assigneeId,
      type: "task_assigned",
      title: "Task assigned to you",
      body: task.title,
      actorId: user.id,
      entityType: "task",
      entityId: taskId,
      url: projectSlug ? `/projects/${projectSlug}` : "/tasks",
    }).catch(() => undefined);
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "task.assignee_updated",
    entityType: "task",
    entityId: taskId,
    projectId: task.project_id,
    metadata: { assigneeId },
  });
}

export async function archiveProjectRecord(projectId: string) {
  const user = await requireWorkspaceActor();
  await requirePermission(user.id, "archive_projects");

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, name, slug, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!project) throw new Error("Project not found");

  const { error } = await supabase
    .from("projects")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw error;

  if (project.owner_id && project.owner_id !== user.id) {
    await deliverInAppNotification({
      userId: project.owner_id,
      type: "system",
      title: "Project archived",
      body: project.name,
      actorId: user.id,
      entityType: "project",
      entityId: projectId,
      url: project.slug ? `/projects/${project.slug}` : "/projects",
    }).catch(() => undefined);
  }

  await logWorkspaceActivity({
    userId: user.id,
    action: "project.archived",
    entityType: "project",
    entityId: projectId,
    projectId,
    metadata: { name: project.name },
  });
}
