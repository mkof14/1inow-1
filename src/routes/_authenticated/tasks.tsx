import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, TASK_STATUS_LABEL, TASK_STATUSES } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({ component: TasksPage });

function TasksPage() {
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({
        status: status as any,
        completed_at: status === "done" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Updated"); },
  });

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">All Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Every task across every project.</p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr className="text-left">
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Task</th>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Project</th>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Priority</th>
              <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.data?.map((t: any) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{t.title}</td>
                <td className="px-4 py-3">
                  {t.projects ? (
                    <Link to="/projects/$slug" params={{ slug: t.projects.slug }} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <span className="size-2 rounded-full" style={{ background: t.projects.color }} />
                      {t.projects.name}
                    </Link>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{t.priority}</td>
                <td className="px-4 py-3">
                  <Select value={t.status} onValueChange={(v) => update.mutate({ id: t.id, status: v })}>
                    <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}