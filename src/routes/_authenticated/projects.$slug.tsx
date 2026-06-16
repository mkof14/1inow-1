import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchProjectBySlug, fetchTasks, TASK_STATUSES, TASK_STATUS_LABEL, PROJECT_STATUS_LABEL } from "@/lib/queries";
import { trackRecent } from "@/lib/wave1";
import { StarButton } from "@/components/star-button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RelatedItems } from "@/components/related-items";
import { createRelation } from "@/lib/relations";
import { useSetPageContext } from "@/lib/ai-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$slug")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const project = useQuery({ queryKey: ["project", slug], queryFn: () => fetchProjectBySlug(slug) });
  useSetPageContext(
    {
      route: `/projects/${slug}`,
      scope: "project",
      title: project.data?.name,
      ids: { projectId: project.data?.id, slug },
    },
    [project.data?.id, slug],
  );
  useEffect(() => {
    if (project.data?.id) {
      trackRecent("project", project.data.id, project.data.name).catch(() => {});
    }
  }, [project.data?.id, project.data?.name]);
  const tasks = useQuery({
    queryKey: ["tasks", project.data?.id],
    queryFn: () => fetchTasks(project.data!.id),
    enabled: !!project.data?.id,
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("todo");

  const createTask = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("tasks").insert({
        project_id: project.data!.id, title, status: status as any, created_by: user!.id, priority: "medium",
      }).select("id").single();
      if (error) throw error;
      // Auto-link the new task to this project
      if (data?.id && user?.id) {
        await createRelation({
          sourceType: "project",
          sourceId: project.data!.id,
          targetType: "task",
          targetId: data.id,
          createdBy: user.id,
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["relations"] });
      setOpen(false); setTitle("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({
        status: status as any,
        completed_at: status === "done" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["tasks"] }); },
  });

  if (project.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!project.data) return <div className="p-8 text-sm">Project not found.</div>;

  const p = project.data;
  const columns = ["todo", "in_progress", "review", "done"] as const;

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ChevronLeft className="size-3" /> All projects
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-xl grid place-items-center text-white text-lg font-semibold" style={{ background: p.color ?? "#0a2540" }}>
            {p.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{p.description}</p>
          </div>
          <StarButton entityType="project" entityId={p.id} label={p.name} className="ml-1" />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium uppercase tracking-wider">
            {PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL]}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium uppercase tracking-wider">
            {p.priority}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span className="font-mono text-foreground">{p.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Task Board</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="size-4" /> New task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!title || createTask.isPending} onClick={() => createTask.mutate()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map((col) => {
          const colTasks = tasks.data?.filter((t: any) => t.status === col) ?? [];
          return (
            <div key={col} className="rounded-xl bg-muted/40 p-3 min-h-[300px]">
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {TASK_STATUS_LABEL[col]}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((t: any) => (
                  <div key={t.id} className="group rounded-lg bg-card border border-border p-3 hover:border-accent/50 transition-colors">
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <Select value={t.status} onValueChange={(v) => updateTaskStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="h-7 text-xs w-auto"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button onClick={() => deleteTask.mutate(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
          })}
        </div>
        <aside className="space-y-4">
          <RelatedItems sourceType="project" sourceId={p.id} title="Related Items" />
        </aside>
      </div>
    </div>
  );
}