import { supabase } from "@/integrations/supabase/client";

export const PROJECTS_KEY = ["projects"] as const;

export async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProjectBySlug(slug: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchTasks(projectId?: string) {
  let q = supabase.from("tasks").select("*, projects(name,color,slug)").order("position");
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) throw error;
  return data ?? [];
}

export const PROJECT_STATUSES = [
  "idea","planning","active","in_progress","review","paused","completed","archived","canceled",
] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export const TASK_STATUSES = [
  "backlog","todo","in_progress","review","testing","done","blocked","canceled",
] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog", todo: "To Do", in_progress: "In Progress", review: "Review",
  testing: "Testing", done: "Done", blocked: "Blocked", canceled: "Canceled",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: "Idea", planning: "Planning", active: "Active", in_progress: "In Progress",
  review: "Review", paused: "Paused", completed: "Completed",
  archived: "Archived", canceled: "Canceled",
};

export const PRIORITY_LABEL: Record<string, string> = {
  critical: "Critical", high: "High", medium: "Medium", low: "Low",
};

// ---------- Decisions ----------
export type DecisionStatus = "pending" | "approved" | "rejected" | "deferred" | "review";
export type DecisionImpact = "low" | "medium" | "high" | "critical";

export const DECISION_STATUS_LABEL: Record<DecisionStatus, string> = {
  pending: "Pending", approved: "Approved", rejected: "Rejected",
  deferred: "Deferred", review: "In Review",
};

export async function fetchDecisions() {
  const { data, error } = await (supabase as any)
    .from("decisions")
    .select("*, projects(name,slug,color)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}