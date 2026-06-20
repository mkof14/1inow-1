import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { BrandMark as BrandRing, PortfolioCard } from "@/components/icons/compass-icons";
import { StarButton } from "@/components/star-button";
import { ProjectAdvisor } from "@/components/project-advisor";
import {
  ChevronLeft,
  Users,
  DollarSign,
  CalendarRange,
  Activity,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";

const PROJECT_ID = "ca2f9a0a-d8cc-4978-af4a-1f5afbd71c2d";
const PROJECT_SLUG = "1inow";

export const Route = createFileRoute("/_authenticated/projects/1inow")({
  component: OneInowPage,
});

function OneInowPage() {
  const project = useQuery({
    queryKey: ["project", PROJECT_SLUG],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", PROJECT_SLUG)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const team = useQuery({
    queryKey: ["project-team", PROJECT_ID],
    queryFn: async () => {
      const { data: pm } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", PROJECT_ID);
      const ids = (pm ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name,email,avatar_url,job_title")
        .in("id", ids);
      return (profs ?? []).map((p: any) => ({ user_id: p.id, profiles: p }));
    },
  });

  const tasks = useQuery({
    queryKey: ["project-tasks", PROJECT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title,status,priority,due_date,completed_at")
        .eq("project_id", PROJECT_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const activity = useQuery({
    queryKey: ["project-activity", PROJECT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id,action,entity_type,entity_id,metadata,created_at,user_id")
        .eq("project_id", PROJECT_ID)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return data ?? [];
    },
  });

  const p = project.data;
  const color = p?.color ?? "#22d3ee";

  const total = tasks.data?.length ?? 0;
  const done = tasks.data?.filter((t: any) => t.status === "done").length ?? 0;
  const progress = p?.progress ?? (total ? Math.round((done / total) * 100) : 0);

  const startDate = p?.start_date ? new Date(p.start_date) : null;
  const deadline = p?.deadline ? new Date(p.deadline) : null;
  const now = new Date();
  const totalDays =
    startDate && deadline
      ? Math.max(1, Math.round((+deadline - +startDate) / 86400000))
      : 0;
  const elapsed =
    startDate && deadline
      ? Math.max(0, Math.min(totalDays, Math.round((+now - +startDate) / 86400000)))
      : 0;
  const timePct = totalDays ? Math.round((elapsed / totalDays) * 100) : 0;
  const daysLeft = deadline ? Math.round((+deadline - +now) / 86400000) : null;

  const budget = Number(p?.budget ?? 0);
  const spentPct = Math.min(100, progress);
  const spent = Math.round((budget * spentPct) / 100);

  const fmtMoney = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n}`;

  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : "—";

  if (project.isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!p) return <div className="p-8 text-sm">Project not found.</div>;

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto">
      <Link
        to="/projects"
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
      >
        <ChevronLeft className="size-3" /> All projects
      </Link>

      <PageHeader
        icon={<BrandRing size={44} />}
        title={
          <span className="inline-flex items-center gap-3">
            {p.name}
            <span
              className="signal-pulse inline-block size-2 rounded-full"
              style={{ background: color }}
            />
          </span>
        }
        subtitle={p.description}
        actions={
          <>
            <StarButton entityType="project" entityId={p.id} label={p.name} />
            <Link
              to="/projects/$slug"
              params={{ slug: PROJECT_SLUG }}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent/50 hover:text-accent transition-colors"
            >
              Task board →
            </Link>
          </>
        }
      />

      <div className="surface-aurora shimmer-border ring-accent-soft rounded-2xl p-6 md:p-8 relative overflow-hidden fade-rise">
        <div
          className="absolute -top-24 -right-24 size-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: color }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
          <Stat
            label="Status"
            value={<span className="capitalize">{String(p.status).replace("_", " ")}</span>}
            sub={`Health · ${String(p.health ?? "on_track").replace("_", " ")}`}
            icon={<Target className="size-4" />}
          />
          <Stat
            label="Progress"
            value={`${progress}%`}
            sub={`${done}/${total} tasks done`}
            icon={<TrendingUp className="size-4" />}
          />
          <Stat
            label="Budget"
            value={fmtMoney(budget)}
            sub={`${fmtMoney(spent)} committed`}
            icon={<DollarSign className="size-4" />}
          />
          <Stat
            label="Timeline"
            value={daysLeft != null ? `${daysLeft}d left` : "—"}
            sub={`${fmtDate(startDate)} → ${fmtDate(deadline)}`}
            icon={<CalendarRange className="size-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <Widget icon={<PortfolioCard size={20} />} title="Progress" accent={color} delay={0.05}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-4xl font-display font-semibold tracking-tight">{progress}%</div>
              <p className="text-xs text-muted-foreground mt-1">overall completion</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div><span className="text-foreground font-mono">{done}</span> done</div>
              <div><span className="text-foreground font-mono">{total - done}</span> open</div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            {(["todo", "in_progress", "review", "done"] as const).map((s) => {
              const c = tasks.data?.filter((t: any) => t.status === s).length ?? 0;
              return (
                <div key={s} className="rounded-lg border border-border/60 px-2 py-2 text-center hover:border-accent/50 transition-colors">
                  <div className="font-mono text-sm text-foreground">{c}</div>
                  <div className="mt-0.5">{s.replace("_", " ")}</div>
                </div>
              );
            })}
          </div>
        </Widget>

        <Widget icon={<Users className="size-5" />} title="Team" accent={color} delay={0.1}>
          {team.data && team.data.length > 0 ? (
            <ul className="space-y-2">
              {team.data.map((m: any, i: number) => {
                const prof = m.profiles ?? {};
                const initials = (prof.full_name ?? prof.email ?? "?").split(/\s+|@/)[0].slice(0, 2).toUpperCase();
                return (
                  <li
                    key={m.user_id ?? i}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors fade-rise"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="size-9 rounded-full grid place-items-center text-xs font-semibold text-white overflow-hidden" style={{ background: color }}>
                      {prof.avatar_url ? <img src={prof.avatar_url} alt="" className="size-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{prof.full_name ?? prof.email ?? "Member"}</div>
                      <div className="text-xs text-muted-foreground truncate">{prof.job_title ?? prof.email ?? "Contributor"}</div>
                    </div>
                    {m.user_id === p.owner_id && (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/10 text-accent">Owner</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          )}
        </Widget>

        <Widget icon={<DollarSign className="size-5" />} title="Budget" accent={color} delay={0.15}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-3xl font-display font-semibold tracking-tight">{fmtMoney(budget)}</div>
              <p className="text-xs text-muted-foreground mt-1">total allocation</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">{fmtMoney(spent)}</div>
              <p className="text-xs text-muted-foreground">committed · {spentPct}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${spentPct}%`,
                background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 60%, white))`,
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <BudgetCell label="Committed" value={fmtMoney(spent)} />
            <BudgetCell label="Remaining" value={fmtMoney(Math.max(0, budget - spent))} />
            <BudgetCell label="Runway" value={daysLeft != null ? `${daysLeft}d` : "—"} />
          </div>
        </Widget>

        <Widget icon={<CalendarRange className="size-5" />} title="Timeline" accent={color} delay={0.2}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Kickoff</div>
              <div className="text-base font-medium">{fmtDate(startDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Deadline</div>
              <div className="text-base font-medium">{fmtDate(deadline)}</div>
            </div>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${timePct}%`, background: color }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span><span className="text-foreground font-mono">{elapsed}</span> / {totalDays} days</span>
            <span>{daysLeft != null && daysLeft >= 0 ? `${daysLeft} days remaining` : "Past deadline"}</span>
          </div>
          <div className="mt-4 space-y-2">
            {milestones(startDate, deadline).map((m, i) => (
              <div key={m.label} className="flex items-center gap-3 text-xs fade-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="size-2 rounded-full" style={{ background: m.passed ? color : "color-mix(in oklab, var(--muted-foreground) 40%, transparent)" }} />
                <div className="flex-1 truncate">{m.label}</div>
                <div className="text-muted-foreground font-mono">{fmtDate(m.date)}</div>
              </div>
            ))}
          </div>
        </Widget>

        <div className="lg:col-span-2">
          <Widget icon={<Activity className="size-5" />} title="Recent Activity" accent={color} accentPulse delay={0.25}>
            {activity.data && activity.data.length > 0 ? (
              <ul className="space-y-2">
                {activity.data.map((a: any, i: number) => (
                  <li key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors fade-rise" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="signal-pulse mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">
                        <span className="font-medium">{a.action}</span>
                        {a.entity_type && <span className="text-muted-foreground"> · {a.entity_type}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {seedActivity(p.created_at).map((a, i) => (
                  <li key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors fade-rise" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="signal-pulse mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{a.title}</span>
                        <span className="text-muted-foreground"> · {a.kind}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{a.when}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" /> Auto-summarized from project events
            </div>
          </Widget>
        </div>
      </div>

      <div className="mt-6">
        <ProjectAdvisor projectId={p.id} projectName={p.name} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl md:text-2xl font-display font-semibold tracking-tight truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function Widget({ icon, title, accent, accentPulse, delay = 0, children }: { icon: ReactNode; title: string; accent: string; accentPulse?: boolean; delay?: number; children: ReactNode }) {
  return (
    <section
      className="surface-aurora shimmer-border ring-accent-soft rounded-2xl p-5 md:p-6 relative overflow-hidden fade-rise transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute -top-20 -right-20 size-56 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: accent }} />
      <header className="flex items-center gap-2 mb-4 relative">
        <span className="grid place-items-center size-8 rounded-lg text-white" style={{ background: accent }}>{icon}</span>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {accentPulse && <span className="signal-pulse inline-block size-1.5 rounded-full ml-1" style={{ background: accent }} />}
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}

function BudgetCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 px-2.5 py-2 hover:border-accent/50 transition-colors">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-mono mt-0.5">{value}</div>
    </div>
  );
}

function milestones(start: Date | null, end: Date | null) {
  if (!start || !end) return [];
  const span = +end - +start;
  const at = (frac: number) => new Date(+start + span * frac);
  const now = Date.now();
  const make = (label: string, frac: number) => {
    const d = at(frac);
    return { label, date: d, passed: +d <= now };
  };
  return [
    make("Kickoff", 0),
    make("Discovery complete", 0.25),
    make("MVP milestone", 0.5),
    make("Beta release", 0.75),
    make("Launch", 1),
  ];
}

function seedActivity(createdAt: string) {
  const base = new Date(createdAt);
  const ago = (h: number) =>
    new Date(Date.now() - h * 3600_000).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return [
    { title: "Project 1inow created", kind: "project", when: base.toLocaleString() },
    { title: "Owner profile linked", kind: "membership", when: ago(2) },
    { title: "Timeline and budget set", kind: "planning", when: ago(1) },
    { title: "Linked to Digital Invest portfolio", kind: "relation", when: ago(0.5) },
  ];
}
