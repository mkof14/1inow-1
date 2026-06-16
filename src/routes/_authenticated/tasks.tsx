import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { fetchTasks, TASK_STATUS_LABEL, TASK_STATUSES, type TaskStatus } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List, Calendar } from "lucide-react";
import { ExecutionNode } from "@/components/icons/compass-icons";
import { useSetPageContext } from "@/lib/ai-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({ component: ExecutionPage });

const BOARD_COLS: TaskStatus[] = ["backlog","todo","in_progress","review","done"];
const PRIORITY_BAR: Record<string, string> = {
  critical: "bg-rose-500", high: "bg-amber-500", medium: "bg-accent", low: "bg-muted-foreground/40",
};

function ExecutionPage() {
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  useSetPageContext({ route: "/tasks", scope: "tasks", title: "Tasks" }, []);
  const qc = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({
        status: status as any,
        completed_at: status === "done" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Moved"); },
  });

  const filtered = useMemo(() => {
    return (tasks.data ?? []).filter((t: any) => !q || t.title?.toLowerCase().includes(q.toLowerCase()));
  }, [tasks.data, q]);

  const grouped: Record<string, any[]> = BOARD_COLS.reduce((acc, s) => ({ ...acc, [s]: [] }), {} as any);
  filtered.forEach((t: any) => { if (grouped[t.status]) grouped[t.status].push(t); });

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="text-accent"><ExecutionNode size={44} /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-display">Execution</h1>
            <p className="text-sm text-muted-foreground mt-1">Every task moving across every initiative.</p>
          </div>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-card">
          {[
            { id: "board", icon: LayoutGrid, label: "Board" },
            { id: "list", icon: List, label: "List" },
          ].map((v) => (
            <button key={v.id} onClick={() => setView(v.id as any)}
              className={`px-2.5 h-7 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition ${
                view === v.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}><v.icon className="size-3.5" />{v.label}</button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search execution…" className="pl-9 h-9" />
      </div>

      {view === "board" && (
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 snap-x">
          {BOARD_COLS.map((col) => (
            <div key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (draggingId) { update.mutate({ id: draggingId, status: col }); setDraggingId(null); } }}
              className="snap-start shrink-0 w-[260px] rounded-xl border border-border bg-card/50 p-3 min-h-[400px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{TASK_STATUS_LABEL[col]}</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{grouped[col].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[col].map((t: any) => (
                  <div key={t.id} draggable
                    onDragStart={() => setDraggingId(t.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="group rounded-lg border border-border bg-card p-3 hover:border-accent/50 cursor-grab active:cursor-grabbing transition">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 size-1.5 rounded-full shrink-0 ${PRIORITY_BAR[t.priority] ?? "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-snug">{t.title}</div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {t.projects && (
                            <Link to="/projects/$slug" params={{ slug: t.projects.slug }}
                              className="text-[10px] text-muted-foreground hover:text-accent inline-flex items-center gap-1">
                              <span className="size-1.5 rounded-sm" style={{ background: t.projects.color ?? "#0a2540" }} />
                              {t.projects.name}
                            </Link>
                          )}
                          {t.due_date && (
                            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                              <Calendar className="size-2.5" /> {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {grouped[col].length === 0 && (
                  <div className="text-[11px] text-muted-foreground/60 italic px-1 py-4 text-center">Drop here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left">
                {["Task","Project","Priority","Status"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">
                    {t.projects && (
                      <Link to="/projects/$slug" params={{ slug: t.projects.slug }} className="text-xs inline-flex items-center gap-1.5 hover:text-accent">
                        <span className="size-2 rounded-sm" style={{ background: t.projects.color }} />
                        {t.projects.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.priority}</td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={(v) => update.mutate({ id: t.id, status: v })}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}