import type { User } from "@supabase/supabase-js";
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
};

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
};

export async function requireWorkspaceActor(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required");
  return data.user;
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
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: input.description ?? null,
      project_id: input.projectId ?? null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      created_by: user.id,
      assignee_id: input.assigneeId ?? user.id,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function createProjectRecord(input: CreateProjectInput) {
  const user = await requireWorkspaceActor();
  const name = input.name.trim();
  if (!name) throw new Error("Project name is required");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      slug: makeProjectSlug(name),
      description: input.description ?? null,
      status: input.status ?? "planning",
      priority: input.priority ?? "medium",
      created_by: user.id,
      owner_id: user.id,
    })
    .select("id, slug")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (error) throw error;
}
