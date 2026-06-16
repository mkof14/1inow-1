import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchTasks, PROJECT_STATUS_LABEL } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import {
  CompassMark, PortfolioCard, SignalWave, DecisionDiamond, TimelinePulse,
  ExecutionNode, PeopleOrbit, AdvisorRing, DirectionArrow,
} from "@/components/icons/compass-icons";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Command View — Digital Invest Compass" }] }),
  component: CommandView,
});

function CommandView() {
  const { user } = useAuth();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });

  const firstName = (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there")
    .split(" ")[0];

  const activeProjects = projects.data?.filter((p) => p.status === "active" || p.status === "in_progress") ?? [];
  const totalTasks = tasks.data?.length ?? 0;
  const doneTasks = tasks.data?.filter((t) => t.status === "done").length ?? 0;
  const overdueTasks = tasks.data?.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    return new Date(t.due_date).getTime() < Date.now();
  }) ?? [];
  const openTasks = totalTasks - doneTasks;
  const completion = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 fade-rise">
      {/* Eyebrow + headline */}
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <CompassMark size={12} className="text-accent" /> Command view · {today}
          </p>
          <h1 className="font-display text-5xl mt-1.5 text-foreground">
            Good morning, <span className="italic text-accent-foreground/80">{firstName}</span>.
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl">
            {openTasks} open execution items · {activeProjects.length} live projects · {overdueTasks.length} overdue. Portfolio holding direction.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            Open portfolio <DirectionArrow size={14} />
          </Link>
          <Link
            to="/ai"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-foreground gradient-compass px-3 py-1.5 rounded-md glow-ring"
          >
            <AdvisorRing size={14} /> Ask advisor
          </Link>
        </div>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Portfolio health"
          value={`${94}`}
          unit="%"
          hint="holding direction"
          icon={<CompassMark className="text-accent" />}
        />
        <Kpi
          label="Active projects"
          value={String(activeProjects.length)}
          hint="under execution"
          icon={<PortfolioCard className="text-foreground/70" />}
        />
        <Kpi
          label="Open execution"
          value={String(openTasks)}
          hint={`${overdueTasks.length} overdue`}
          tone={overdueTasks.length ? "warning" : undefined}
          icon={<ExecutionNode className="text-foreground/70" />}
        />
        <Kpi
          label="Completion"
          value={String(completion)}
          unit="%"
          hint={`${doneTasks} of ${totalTasks} closed`}
          icon={<TimelinePulse className="text-foreground/70" />}
        />
      </section>

      {/* Main 12-col grid */}
      <section className="grid grid-cols-12 gap-4">
        {/* Portfolio momentum */}
        <Panel
          className="col-span-12 lg:col-span-8 min-h-[280px]"
          eyebrow="Portfolio"
          title="Momentum"
          action={<Link to="/projects" className="text-[11px] text-accent">All projects →</Link>}
        >
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {activeProjects.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/projects/$slug"
                params={{ slug: p.slug }}
                className="group rounded-lg border border-border bg-card hover:border-accent/50 transition-all p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="size-9 rounded-md grid place-items-center text-[11px] font-semibold text-primary-foreground shrink-0"
                      style={{ background: p.color ?? undefined, backgroundImage: p.color ? undefined : "var(--gradient-compass)" }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground truncate">{p.category ?? "Project"}</div>
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-mono tabular-nums text-foreground">{p.progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
            {activeProjects.length === 0 && (
              <EmptySlot label="No live projects yet" cta="Open portfolio" to="/projects" />
            )}
          </div>
        </Panel>

        {/* Advisor summary */}
        <Panel
          className="col-span-12 lg:col-span-4 min-h-[280px] relative overflow-hidden"
          eyebrow="Advisor"
          title="Weekly direction"
          action={<span className="size-1.5 rounded-full bg-accent signal-pulse" />}
          dark
        >
          <div aria-hidden className="absolute -top-12 -right-12 text-accent/15 compass-spin">
            <AdvisorRing size={180} />
          </div>
          <ul className="relative space-y-3 text-[13px] text-primary-foreground/85 leading-relaxed mt-3">
            <li className="flex gap-2">
              <CompassMark size={14} className="mt-0.5 text-accent shrink-0" />
              Portfolio holding direction. {activeProjects.length} live, {overdueTasks.length} overdue items demand attention.
            </li>
            <li className="flex gap-2">
              <DecisionDiamond size={14} className="mt-0.5 text-accent shrink-0" />
              No outstanding executive decisions in the queue today.
            </li>
            <li className="flex gap-2">
              <SignalWave size={14} className="mt-0.5 text-accent shrink-0" />
              Signals quiet — schedule a portfolio review by Friday.
            </li>
          </ul>
          <Link
            to="/ai"
            className="relative mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent/80"
          >
            Open advisor <DirectionArrow size={14} />
          </Link>
        </Panel>

        {/* Critical execution */}
        <Panel
          className="col-span-12 lg:col-span-5 min-h-[240px]"
          eyebrow="Execution"
          title="Critical queue"
          action={<Link to="/tasks" className="text-[11px] text-accent">All execution →</Link>}
        >
          <ul className="divide-y divide-border -mx-1 mt-2">
            {tasks.data?.slice(0, 5).map((t: any) => (
              <li key={t.id} className="flex items-start gap-3 px-1 py-2.5">
                <div className={cnDot(t.status)} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{t.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    {t.projects?.name ?? "Unassigned"}
                    <span className="size-0.5 rounded-full bg-muted-foreground/40" />
                    <span className="uppercase tracking-wider">{t.priority}</span>
                  </div>
                </div>
              </li>
            ))}
            {(!tasks.data || tasks.data.length === 0) && (
              <EmptySlot label="No execution items" cta="Open execution" to="/tasks" />
            )}
          </ul>
        </Panel>

        {/* Signals + Decisions stacked */}
        <Panel
          className="col-span-12 md:col-span-6 lg:col-span-4 min-h-[240px]"
          eyebrow="Signals"
          title="Live stream"
          action={<Link to="/communication" className="text-[11px] text-accent">Open signals →</Link>}
        >
          <div className="space-y-3 mt-3 text-[13px]">
            <SignalRow tone="signal" label="Portfolio update" body="No new high-priority signals." />
            <SignalRow tone="execution" label="Execution pulse" body={`${openTasks} open · ${overdueTasks.length} overdue`} />
            <SignalRow tone="decision" label="Decision queue" body="Empty. Nothing waiting." />
          </div>
        </Panel>

        <Panel
          className="col-span-12 md:col-span-6 lg:col-span-3 min-h-[240px]"
          eyebrow="People"
          title="Capacity"
          action={<Link to="/people" className="text-[11px] text-accent">All people →</Link>}
        >
          <div className="mt-3 space-y-2.5">
            {[
              { name: "Engineering", load: 72 },
              { name: "Design", load: 48 },
              { name: "Operations", load: 85 },
              { name: "Finance", load: 31 },
            ].map((g) => (
              <div key={g.name}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">{g.name}</span>
                  <span className="tabular-nums">{g.load}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${g.load}%`, background: g.load > 80 ? "var(--blocker)" : "var(--signal)" }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Risk map */}
        <Panel
          className="col-span-12 lg:col-span-6 min-h-[200px]"
          eyebrow="Risk"
          title="Portfolio map"
        >
          <div className="grid grid-cols-5 gap-1.5 mt-3">
            {Array.from({ length: 25 }).map((_, i) => {
              const heat = (Math.sin(i * 1.3) + 1) / 2;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-sm"
                  style={{
                    background: `color-mix(in oklab, var(--accent) ${Math.round(heat * 80)}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-3">
            <span>Low risk</span><span>High risk</span>
          </div>
        </Panel>

        {/* Upcoming timeline */}
        <Panel
          className="col-span-12 lg:col-span-6 min-h-[200px]"
          eyebrow="Timeline"
          title="Upcoming"
          action={<Link to="/calendar" className="text-[11px] text-accent">Open timeline →</Link>}
        >
          <ol className="mt-3 relative pl-4 space-y-3 border-l border-border">
            {[
              { d: "Tomorrow", t: "Portfolio review", k: "Meeting" },
              { d: "Thu", t: "AGRON milestone close", k: "Milestone" },
              { d: "Fri", t: "Weekly direction sent", k: "Decision" },
            ].map((e) => (
              <li key={e.t} className="relative">
                <span className="absolute -left-[19px] top-1 size-2 rounded-full bg-accent ring-4 ring-background" />
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{e.d} · {e.k}</div>
                <div className="text-[13px] font-medium">{e.t}</div>
              </li>
            ))}
          </ol>
        </Panel>

        {/* People presence strip */}
        <Panel
          className="col-span-12 min-h-[120px]"
          eyebrow="People"
          title="On the field"
          action={<Link to="/team-map" className="text-[11px] text-accent">Team map →</Link>}
        >
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full border border-border pl-1 pr-3 py-1">
                <div className="size-6 rounded-full gradient-compass text-primary-foreground grid place-items-center text-[10px] font-semibold">
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  <PeopleOrbit size={10} className="inline mr-1 -mt-0.5 text-accent" />
                  Online
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

/* ─── pieces ────────────────────────────────────────────── */

function Panel({
  children, eyebrow, title, action, className, dark,
}: {
  children: ReactNode; eyebrow: string; title: string; action?: ReactNode;
  className?: string; dark?: boolean;
}) {
  return (
    <div
      className={
        (dark
          ? "gradient-compass text-primary-foreground border border-primary/30"
          : "panel-raised") +
        " p-5 " + (className ?? "")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={"text-[10px] font-medium uppercase tracking-[0.18em] " + (dark ? "text-primary-foreground/55" : "text-muted-foreground")}>
            {eyebrow}
          </div>
          <div className={"font-display text-xl " + (dark ? "text-primary-foreground" : "text-foreground")}>
            {title}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Kpi({
  label, value, unit, hint, icon, tone,
}: {
  label: string; value: string; unit?: string; hint: string;
  icon: ReactNode; tone?: "warning";
}) {
  return (
    <div className="panel-raised p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] uppercase tracking-[0.18em] font-medium">{label}</span>
        <span className="size-4 [&>svg]:size-4">{icon}</span>
      </div>
      <div className="font-display text-3xl mt-2 flex items-baseline gap-1">
        <span className={tone === "warning" ? "text-[color:var(--warning)]" : ""}>{value}</span>
        {unit && <span className="text-base text-muted-foreground font-sans">{unit}</span>}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    active: "var(--success)",
    in_progress: "var(--signal)",
    review: "var(--warning)",
    paused: "var(--muted-foreground)",
    planning: "var(--decision)",
    completed: "var(--success)",
    archived: "var(--muted-foreground)",
    canceled: "var(--blocker)",
    idea: "var(--decision)",
  };
  const c = tone[status] ?? "var(--muted-foreground)";
  return (
    <span
      className="text-[9px] font-medium uppercase tracking-[0.14em] px-2 py-0.5 rounded-full border"
      style={{ borderColor: `color-mix(in oklab, ${c} 35%, transparent)`, color: c, background: `color-mix(in oklab, ${c} 10%, transparent)` }}
    >
      {PROJECT_STATUS_LABEL[status as keyof typeof PROJECT_STATUS_LABEL] ?? status}
    </span>
  );
}

function SignalRow({ tone, label, body }: { tone: "signal" | "decision" | "execution" | "blocker"; label: string; body: string }) {
  const color = `var(--${tone})`;
  return (
    <div className="flex items-start gap-3 rounded-md p-2 -mx-2 hover:bg-muted/50 transition-colors">
      <span
        className="mt-1 size-2 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 18%, transparent)` }}
      />
      <div className="min-w-0">
        <div className="text-[12px] font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}

function EmptySlot({ label, cta, to }: { label: string; cta: string; to: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <Link to={to as any} className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-accent">
        {cta} <DirectionArrow size={12} />
      </Link>
    </div>
  );
}

function cnDot(status: string) {
  return "mt-1 size-3.5 rounded border " + (status === "done"
    ? "bg-accent border-accent"
    : "border-border");
}