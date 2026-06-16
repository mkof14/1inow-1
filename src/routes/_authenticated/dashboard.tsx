import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { fetchProjects, fetchTasks, PROJECT_STATUS_LABEL } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { ArrowUpRight, Sparkles, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const firstName = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there")
    .split(" ")[0];
  const active = projects.data?.filter((p) => p.status === "active" || p.status === "in_progress").length ?? 0;
  const totalTasks = tasks.data?.length ?? 0;
  const doneTasks = tasks.data?.filter((t) => t.status === "done").length ?? 0;
  const openTasks = totalTasks - doneTasks;

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-8">
      {/* Header + AI summary */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Good morning, {firstName}.
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            You have <span className="text-foreground font-medium">{openTasks}</span> open tasks across
            <span className="text-foreground font-medium"> {active}</span> active projects.
          </p>
        </div>
        <div className="rounded-2xl bg-primary text-primary-foreground p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary-foreground/60 mb-2">
            <Sparkles className="size-3.5 text-accent" /> AI Daily Summary
          </div>
          <p className="text-sm leading-relaxed text-primary-foreground/90">
            Portfolio is performing within target. BioMath Core is flagged as <span className="text-accent">at risk</span> and needs your review.
          </p>
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Active Projects" value={String(active)} hint="across portfolio" icon={<TrendingUp className="size-4" />} />
        <Kpi label="Open Tasks" value={String(openTasks)} hint={`${doneTasks} completed`} icon={<Clock className="size-4" />} />
        <Kpi label="Completion Rate" value={totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}%` : "—"} hint="this period" icon={<CheckCircle2 className="size-4" />} />
        <Kpi label="Portfolio Health" value="94%" hint="optimal range" icon={<Sparkles className="size-4 text-accent" />} />
      </section>

      {/* Projects + tasks */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Portfolio</h2>
            <Link to="/projects" className="text-xs text-accent font-medium inline-flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.data?.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                to="/projects/$slug"
                params={{ slug: p.slug }}
                className="group block rounded-xl border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg grid place-items-center text-white text-sm font-semibold" style={{ background: p.color ?? "#0a2540" }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.category ?? "—"}</div>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-mono text-foreground">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Today's Queue</h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {tasks.data?.slice(0, 6).map((t: any) => (
              <div key={t.id} className="p-4 flex items-start gap-3">
                <div className={`mt-1 size-4 rounded border ${t.status === "done" ? "bg-accent border-accent" : "border-border"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t.projects?.name ?? "Unassigned"} · {t.priority}
                  </div>
                </div>
              </div>
            ))}
            {(!tasks.data || tasks.data.length === 0) && (
              <div className="p-6 text-center text-sm text-muted-foreground">No tasks yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] uppercase tracking-widest font-semibold">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold tracking-tight mt-2">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
    review: "bg-amber-50 text-amber-700 ring-amber-200",
    paused: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    planning: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    archived: "bg-zinc-100 text-zinc-500 ring-zinc-200",
    canceled: "bg-rose-50 text-rose-700 ring-rose-200",
    idea: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ${colors[status] ?? "bg-muted text-muted-foreground ring-border"}`}>
      {PROJECT_STATUS_LABEL[status as keyof typeof PROJECT_STATUS_LABEL] ?? status}
    </span>
  );
}