import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ThinkingInput } from "@/lib/thinking";

function createUserClient(authorizationHeader: string | null) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !authorizationHeader?.startsWith("Bearer ")) return null;

  return createClient<Database>(url, key, {
    global: { headers: { Authorization: authorizationHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function fetchChatThinkingData(input: {
  userId: string;
  authorizationHeader: string | null;
  pageContext?: unknown;
}): Promise<ThinkingInput["data"]> {
  const supabase = createUserClient(input.authorizationHeader);
  if (!supabase) return {};

  const page = (input.pageContext ?? {}) as {
    ids?: { projectId?: string };
  };
  const projectFilter = page.ids?.projectId;

  const [projectsRes, tasksRes, memoriesRes, rulesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, slug, owner_id")
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(projectFilter ? 1 : 8),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, assignee_id, project_id")
      .neq("status", "done")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("ai_memories")
      .select("key, value, type, confidence")
      .eq("user_id", input.userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("ai_rules")
      .select("rule, scope")
      .eq("user_id", input.userId)
      .eq("active", true)
      .limit(10),
  ]);

  let projects = projectsRes.data ?? [];
  if (projectFilter) {
    projects = projects.filter((p) => p.id === projectFilter);
  }

  return {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status ?? undefined,
      slug: p.slug,
      owner_id: p.owner_id,
    })),
    tasks: (tasksRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status ?? undefined,
      due_date: t.due_date,
      assignee_id: t.assignee_id,
      project_id: t.project_id,
    })),
    memories: (memoriesRes.data ?? []).map((m) => ({
      key: m.key,
      value: m.value,
      type: m.type ?? undefined,
      confidence: m.type ? 0.8 : 0.7,
    })),
    rules: (rulesRes.data ?? []).map((r) => ({
      rule: r.rule,
      scope: r.scope,
    })),
  };
}

export function summarizeWorkspaceContext(data: ThinkingInput["data"]) {
  const lines: string[] = [];
  if (data.projects?.length) {
    lines.push(
      `Projects: ${data.projects
        .slice(0, 6)
        .map((p) => `${p.name} (${p.status ?? "active"})`)
        .join("; ")}`,
    );
  }
  if (data.tasks?.length) {
    lines.push(
      `Open tasks: ${data.tasks
        .slice(0, 8)
        .map((t) => t.title)
        .join("; ")}`,
    );
  }
  if (data.memories?.length) {
    lines.push(
      `Active memories: ${data.memories
        .slice(0, 6)
        .map((m) => `${m.key}: ${m.value}`)
        .join(" | ")}`,
    );
  }
  return lines.join("\n");
}
