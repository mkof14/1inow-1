import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { fetchTasks, TASK_STATUS_LABEL, TASK_STATUSES, type TaskStatus } from "@/lib/queries";
import { createTaskRecord, updateTaskStatus } from "@/lib/project-task-engine";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Plus,
} from "lucide-react";
import { ExecutionNode } from "@/components/icons/compass-icons";
import { useSetPageContext } from "@/lib/ai-context";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tasks")({ component: ExecutionPage });

const BOARD_COLS: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];
const PRIORITY_BAR: Record<string, string> = {
  critical: "bg-rose-500",
  high: "bg-amber-500",
  medium: "bg-accent",
  low: "bg-muted-foreground/40",
};

function ExecutionPage() {
  const t = useT();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  useSetPageContext({ route: "/tasks", scope: "tasks", title: "Tasks" }, []);
  const qc = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateTaskStatus(id, status as TaskStatus);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Moved");
    },
  });

  const createTask = useMutation({
    mutationFn: async () => {
      await createTaskRecord({ title: newTaskTitle });
    },
    onSuccess: () => {
      setNewTaskTitle("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const filtered = useMemo(() => {
    return (tasks.data ?? []).filter(
      (t: any) => !q || t.title?.toLowerCase().includes(q.toLowerCase()),
    );
  }, [tasks.data, q]);

  const grouped: Record<string, any[]> = BOARD_COLS.reduce(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as any,
  );
  filtered.forEach((t: any) => {
    if (grouped[t.status]) grouped[t.status].push(t);
  });
  const now = Date.now();
  const openTasks = (tasks.data ?? []).filter(
    (task: any) => task.status !== "done" && task.status !== "canceled",
  );
  const overdue = openTasks.filter(
    (task: any) => task.due_date && new Date(task.due_date).getTime() < now,
  );
  const today = openTasks.filter((task: any) => {
    if (!task.due_date) return false;
    const date = new Date(task.due_date);
    const current = new Date();
    return (
      date.getFullYear() === current.getFullYear() &&
      date.getMonth() === current.getMonth() &&
      date.getDate() === current.getDate()
    );
  });
  const inProgress = openTasks.filter((task: any) => task.status === "in_progress");
  const inReview = openTasks.filter((task: any) => task.status === "review");
  const nextTask = overdue[0] ?? today[0] ?? inProgress[0] ?? openTasks[0];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1500px] mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-start sm:justify-between mb-6 gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="text-accent shrink-0">
            <ExecutionNode size={44} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl sm:text-2xl font-semibold tracking-tight font-display">
              {t("page.tasks.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {t("page.tasks.subtitle")}
            </p>
          </div>
        </div>
        <div className="inline-flex self-start rounded-lg border border-border bg-card p-0.5 shrink-0">
          {[
            { id: "board", icon: LayoutGrid, label: "Board" },
            { id: "list", icon: List, label: "List" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id as any)}
              className={`px-2.5 h-7 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition shrink-0 ${
                view === v.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <v.icon className="size-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1.25fr_repeat(4,minmax(0,0.48fr))]">
        <div className="surface-aurora shimmer-border ring-accent-soft rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <Clock className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Next execution move
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {nextTask ? nextTask.title : "No open tasks"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {nextTask
                  ? `${TASK_STATUS_LABEL[nextTask.status as TaskStatus] ?? nextTask.status} · ${nextTask.priority ?? "normal"} priority${nextTask.due_date ? ` · due ${new Date(nextTask.due_date).toLocaleDateString()}` : ""}`
                  : "Create or pull the next small action into the board."}
              </p>
            </div>
          </div>
        </div>
        <TaskSignal
          icon={AlertTriangle}
          label="Overdue"
          value={overdue.length}
          tone={overdue.length ? "risk" : "calm"}
        />
        <TaskSignal icon={Calendar} label="Today" value={today.length} />
        <TaskSignal icon={Clock} label="In progress" value={inProgress.length} />
        <TaskSignal icon={CheckCircle2} label="Review" value={inReview.length} tone="review" />
      </div>

      <div className="mb-5 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("page.tasks.searchPh")}
            className="h-9 pl-9"
          />
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newTaskTitle.trim()) {
              toast.message("Add a task title first.");
              return;
            }
            createTask.mutate();
          }}
        >
          <Input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Create the next useful action..."
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={createTask.isPending}>
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </div>

      {view === "board" && (
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 snap-x">
          {BOARD_COLS.map((col) => (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggingId) {
                  update.mutate({ id: draggingId, status: col });
                  setDraggingId(null);
                }
              }}
              className="snap-start shrink-0 w-[260px] rounded-xl border border-border bg-card/50 p-3 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground m-0">
                  {TASK_STATUS_LABEL[col]}
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {grouped[col].length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[col].map((t: any) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDraggingId(t.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="group rounded-lg border border-border bg-card p-3 hover:border-accent/50 cursor-grab active:cursor-grabbing transition"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 size-1.5 rounded-full shrink-0 ${PRIORITY_BAR[t.priority] ?? "bg-muted"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-snug">{t.title}</div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {t.projects && (
                            <Link
                              to="/projects/$slug"
                              params={{ slug: t.projects.slug }}
                              className="text-[10px] text-muted-foreground hover:text-accent inline-flex items-center gap-1"
                            >
                              <span
                                className="size-1.5 rounded-sm"
                                style={{ background: t.projects.color ?? "#0a2540" }}
                              />
                              {t.projects.name}
                            </Link>
                          )}
                          {t.due_date && (
                            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                              <Calendar className="size-2.5" />{" "}
                              {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {grouped[col].length === 0 && (
                  <div className="rounded-lg border border-dashed border-border bg-background/60 px-3 py-4 text-center text-[11px] text-muted-foreground">
                    {col === "todo"
                      ? "Add the next action above, then move it through the board."
                      : t("page.tasks.dropHere")}
                  </div>
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
                {[t("tbl.task"), t("tbl.project"), t("tbl.priority"), t("tbl.status")].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3">
                    {t.projects && (
                      <Link
                        to="/projects/$slug"
                        params={{ slug: t.projects.slug }}
                        className="text-xs inline-flex items-center gap-1.5 hover:text-accent"
                      >
                        <span
                          className="size-2 rounded-sm"
                          style={{ background: t.projects.color }}
                        />
                        {t.projects.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.priority}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={t.status}
                      onValueChange={(v) => update.mutate({ id: t.id, status: v })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {TASK_STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
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

function TaskSignal({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  tone?: "default" | "risk" | "calm" | "review";
}) {
  const toneClass =
    tone === "risk"
      ? "text-rose-600 bg-rose-500/10 border-rose-500/25"
      : tone === "review"
        ? "text-sky-600 bg-sky-500/10 border-sky-500/25"
        : tone === "calm"
          ? "text-muted-foreground bg-card border-border"
          : "text-accent bg-accent/10 border-accent/25";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`mb-3 inline-grid size-8 place-items-center rounded-lg border ${toneClass}`}>
        <Icon className="size-4" />
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {value > 0 && <ArrowRight className="size-3" />}
      </div>
    </div>
  );
}
