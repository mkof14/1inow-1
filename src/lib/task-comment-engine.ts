import type { User } from "@supabase/supabase-js";
import { logWorkspaceActivity } from "@/lib/activity-log";
import { resolveUserPermission } from "@/lib/auth-roles";
import { notifyMessageMentions } from "@/lib/mentions";
import { deliverInAppNotification } from "@/lib/notifications";
import { resolveActiveOrganizationId } from "@/lib/organization-model";
import { supabase } from "@/integrations/supabase/client";

async function requireWorkspaceActor(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user;
}

async function requireCommentPermission(userId: string) {
  const [canSend, canEdit] = await Promise.all([
    resolveUserPermission(userId, "send_messages"),
    resolveUserPermission(userId, "edit_tasks"),
  ]);
  if (!canSend && !canEdit) {
    throw new Error("Missing permission: send_messages or edit_tasks");
  }
}

export async function fetchTaskComments(taskId: string) {
  const { data, error } = await supabase
    .from("task_comments")
    .select("id, body, author_id, created_at, profiles:author_id(full_name, email)")
    .eq("task_id", taskId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTaskComment(input: { taskId: string; body: string }) {
  const user = await requireWorkspaceActor();
  await requireCommentPermission(user.id);

  const body = input.body.trim();
  if (!body) throw new Error("Comment cannot be empty");

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, assignee_id, project_id, projects(slug)")
    .eq("id", input.taskId)
    .maybeSingle();
  if (taskError) throw taskError;
  if (!task) throw new Error("Task not found");

  const organizationId = await resolveActiveOrganizationId(user.id);
  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: input.taskId,
      body,
      author_id: user.id,
      organization_id: organizationId,
    })
    .select("id")
    .single();
  if (error) throw error;

  const projectSlug = (task.projects as { slug?: string } | null)?.slug;
  const url = projectSlug ? `/projects/${projectSlug}` : "/tasks";

  if (task.assignee_id && task.assignee_id !== user.id) {
    await deliverInAppNotification({
      userId: task.assignee_id,
      type: "comment",
      title: "New comment on your task",
      body: `${task.title}: ${body.slice(0, 120)}`,
      actorId: user.id,
      entityType: "task",
      entityId: task.id,
      url,
    }).catch(() => undefined);
  }

  await notifyMessageMentions({
    body,
    authorId: user.id,
    messageId: data.id,
    channelId: task.id,
    url,
  }).catch(() => undefined);

  await logWorkspaceActivity({
    userId: user.id,
    action: "task.comment_created",
    entityType: "task_comment",
    entityId: data.id,
    projectId: task.project_id,
    metadata: { taskId: task.id, taskTitle: task.title },
  });

  return data;
}

export async function deleteTaskComment(commentId: string) {
  const user = await requireWorkspaceActor();

  const { data: comment, error: fetchError } = await supabase
    .from("task_comments")
    .select("id, author_id, task_id")
    .eq("id", commentId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!comment) throw new Error("Comment not found");
  if (comment.author_id !== user.id) {
    const isAdmin = await resolveUserPermission(user.id, "access_admin");
    if (!isAdmin) throw new Error("Not allowed to delete this comment");
  }

  const { error } = await supabase
    .from("task_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
}
