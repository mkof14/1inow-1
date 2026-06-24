import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock, UserX, Link2Off, FileQuestion } from "lucide-react";

type Suggestion = {
  id: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
};

/**
 * Source-based suggestions for a project. No invention —
 * every item is derived from real rows in the database.
 */
export function ProjectSuggestions({ projectId }: { projectId: string }) {
  const tasks = useQuery({
    queryKey: ["project-suggestions-tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,status,assignee_id,due_date,updated_at")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const project = useQuery({
    queryKey: ["project-suggestions-project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,owner_id,deadline,status")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    const p = project.data;
    const ts = tasks.data ?? [];
    const now = Date.now();
    const STALE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

    if (p && !p.owner_id) {
      out.push({
        id: "no-owner",
        icon: <UserX className="size-3.5" />,
        label: "Missing owner",
        hint: "This project has no owner assigned.",
      });
    }
    if (p && !(p as any).deadline) {
      out.push({
        id: "no-deadline",
        icon: <Clock className="size-3.5" />,
        label: "Missing deadline",
        hint: "No end date set for this project.",
      });
    }

    const overdue = ts.filter(
      (t: any) => t.due_date && t.status !== "done" && new Date(t.due_date).getTime() < now,
    );
    if (overdue.length) {
      out.push({
        id: "overdue",
        icon: <AlertCircle className="size-3.5" />,
        label: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
        hint: "Tasks past their due date.",
      });
    }

    const stale = ts.filter(
      (t: any) =>
        t.status !== "done" && t.updated_at && now - new Date(t.updated_at).getTime() > STALE_MS,
    );
    if (stale.length) {
      out.push({
        id: "stale",
        icon: <Clock className="size-3.5" />,
        label: `${stale.length} stale task${stale.length > 1 ? "s" : ""}`,
        hint: "No updates in 14+ days.",
      });
    }

    const unassigned = ts.filter((t: any) => !t.assignee_id && t.status !== "done");
    if (unassigned.length) {
      out.push({
        id: "unassigned",
        icon: <UserX className="size-3.5" />,
        label: `${unassigned.length} unassigned`,
        hint: "Open tasks with no assignee.",
      });
    }

    return out;
  }, [project.data, tasks.data]);

  if (project.isLoading || tasks.isLoading) return null;
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Assistant
        </div>
        <p className="text-xs text-muted-foreground">
          Nothing to flag right now. This is based only on available data.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Assistant suggestions
      </div>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-accent">{s.icon}</span>
            <div className="min-w-0">
              <div className="font-medium leading-tight">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.hint}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-muted-foreground italic">Based only on available data.</p>
    </div>
  );
}

// Re-exports for per-scope panels
export const _icons = { AlertCircle, Clock, UserX, Link2Off, FileQuestion };
