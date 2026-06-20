import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProjects, fetchTasks, fetchProfiles } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { IntelligenceBars } from "@/components/icons/compass-icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, CheckCircle2, AlertTriangle, Users, Target, Zap } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });

const STATUS_COLORS: Record<string, string> = {
  active: "#22d3ee", in_progress: "#22d3ee", planning: "#a78bfa",
  on_hold: "#f59e0b", completed: "#34d399", archived: "#6b7280", cancelled: "#ef4444",
};
const TASK_COLORS: Record<string, string> = {
  backlog: "#6b7280", todo: "#a78bfa", in_progress: "#22d3ee", review: "#f59e0b", done: "#34d399", canceled: "#ef4444",
};

function Kpi({ icon: Icon, label, value, hint, tone = "accent" }: any) {
  const toneCls = tone === "danger" ? "text-rose-400" : tone === "success" ? "text-emerald-400" : "text-accent";
  return (
    <div className="surface-aurora shimmer-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`size-9 rounded-xl bg-card/70 border border-border grid place-items-center ${toneCls}`}><Icon className="size-4" /></div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
      <div className="font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function ReportsPage() {
  const t = useT();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const people = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const stats = useMemo(() => {
    const P = projects.data ?? [];
    const T = tasks.data ?? [];
    const active = P.filter((p: any) => p.status === "active" || p.status === "in_progress").length;
    const atRisk = P.filter((p: any) => p.health === "at_risk" || p.health === "off_track").length;
    const done = T.filter((t: any) => t.status === "done").length;
    const overdue = T.filter((t: any) => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()).length;
    const completion = T.length ? Math.round((done / T.length) * 100) : 0;
    const avgProgress = P.length ? Math.round(P.reduce((a: number, p: any) => a + (p.progress ?? 0), 0) / P.length) : 0;

    const byStatus = Object.entries(
      P.reduce((a: Record<string, number>, p: any) => { a[p.status] = (a[p.status] ?? 0) + 1; return a; }, {})
    ).map(([name, value]) => ({ name, value }));

    const tasksByStatus = Object.entries(
      T.reduce((a: Record<string, number>, x: any) => { a[x.status] = (a[x.status] ?? 0) + 1; return a; }, {})
    ).map(([name, value]) => ({ name, value }));

    // Tasks completed last 14 days
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const trend = days.map((d) => {
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const n = T.filter((x: any) => x.completed_at && new Date(x.completed_at) >= d && new Date(x.completed_at) < next).length;
      return { day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), done: n };
    });

    // Top contributors
    const contributorMap: Record<string, number> = {};
    T.forEach((x: any) => { if (x.status === "done" && x.assignee_id) contributorMap[x.assignee_id] = (contributorMap[x.assignee_id] ?? 0) + 1; });
    const profById: Record<string, any> = {};
    (people.data ?? []).forEach((p: any) => { profById[p.id] = p; });
    const contributors = Object.entries(contributorMap)
      .map(([id, n]) => ({ name: profById[id]?.full_name?.split(" ")[0] ?? profById[id]?.email?.split("@")[0] ?? "—", done: n }))
      .sort((a, b) => b.done - a.done).slice(0, 6);

    return { active, atRisk, done, overdue, completion, avgProgress, byStatus, tasksByStatus, trend, contributors, totalProjects: P.length, totalTasks: T.length, totalPeople: (people.data ?? []).length };
  }, [projects.data, tasks.data, people.data]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1500px] mx-auto fade-rise">
      <PageHeader
        icon={<IntelligenceBars size={44} />}
        title={t("page.reports.title")}
        subtitle={t("page.reports.desc")}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi icon={Target}        label={t("reports.kpi.active")}    value={stats.active}     hint={`${stats.totalProjects} ${t("reports.kpi.total")}`} />
        <Kpi icon={AlertTriangle} label={t("reports.kpi.atRisk")}    value={stats.atRisk}     hint={t("reports.kpi.healthHint")} tone={stats.atRisk > 0 ? "danger" : "success"} />
        <Kpi icon={CheckCircle2}  label={t("reports.kpi.completion")}value={`${stats.completion}%`} hint={`${stats.done} / ${stats.totalTasks}`} tone="success" />
        <Kpi icon={Zap}           label={t("reports.kpi.overdue")}   value={stats.overdue}    hint={t("reports.kpi.overdueHint")} tone={stats.overdue > 0 ? "danger" : "success"} />
        <Kpi icon={TrendingUp}    label={t("reports.kpi.progress")}  value={`${stats.avgProgress}%`} hint={t("reports.kpi.progressHint")} />
        <Kpi icon={Users}         label={t("reports.kpi.people")}    value={stats.totalPeople} hint={t("reports.kpi.peopleHint")} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="surface-aurora shimmer-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 font-display">{t("reports.chart.projects")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {stats.byStatus.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name as string] ?? "#64748b"} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
            {stats.byStatus.map((e) => (
              <div key={e.name as string} className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: STATUS_COLORS[e.name as string] ?? "#64748b" }} />
                <span className="capitalize text-muted-foreground">{(e.name as string).replace("_", " ")}</span>
                <span className="ml-auto font-mono">{e.value as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-aurora shimmer-border rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4 font-display">{t("reports.chart.velocity")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="done" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-aurora shimmer-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 font-display">{t("reports.chart.tasks")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.tasksByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {stats.tasksByStatus.map((e, i) => <Cell key={i} fill={TASK_COLORS[e.name as string] ?? "#64748b"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-aurora shimmer-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4 font-display">{t("reports.chart.contributors")}</h3>
          {stats.contributors.length === 0 ? (
            <div className="h-[220px] grid place-items-center text-xs text-muted-foreground">{t("reports.chart.noData")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.contributors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={70} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="done" fill="#22d3ee" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}