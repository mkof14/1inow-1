import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchTasks, fetchProfiles } from "@/lib/queries";
import { fetchNotifications } from "@/lib/wave1";
import { useAuth } from "@/hooks/use-auth";
import { Play, ListChecks, Mic, Sparkles, ArrowRight, Clock, AlertCircle, MessageSquare, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: HomePage });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const people = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const notifs = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  const name = (user?.user_metadata as any)?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const myTasks = (tasks.data ?? []).filter((t: any) =>
    t.assignee_id === user?.id && t.status !== "done" && t.status !== "canceled"
  );
  const activeProjects = (projects.data ?? []).filter((p: any) => p.status === "active" || p.status === "in_progress");
  const blockedProjects = (projects.data ?? []).filter((p: any) => p.status === "on_hold" || p.status === "blocked");
  const needsAttention = (projects.data ?? []).filter((p: any) => p.priority === "critical" || p.priority === "high").length;
  const unread = (notifs.data ?? []).filter((n: any) => !n.read_at).length;
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const overdueTasks = myTasks.filter((t: any) => t.due_date && new Date(t.due_date) < today);
  const todaysTasks = myTasks.filter((t: any) => t.due_date && new Date(t.due_date) >= today && new Date(t.due_date) < tomorrow);

  // Estimate focused work — heuristic (30m per open task, capped 8h)
  const focusMin = Math.min(8 * 60, myTasks.length * 30);
  const fh = Math.floor(focusMin / 60), fm = focusMin % 60;

  return (
    <div className="p-6 md:p-10 max-w-[1100px] mx-auto">
      {/* AI Briefing */}
      <div className="mb-8 rounded-3xl border border-border bg-gradient-to-br from-accent/8 via-card to-card p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 rounded-2xl gradient-compass grid place-items-center text-primary-foreground shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Compass briefing</div>
            <h1 className="text-2xl md:text-3xl font-display tracking-tight mt-1">
              {greeting()}, <span className="text-accent">{name}</span>.
            </h1>
          </div>
        </div>
        <div className="text-[15px] leading-relaxed text-foreground/90 space-y-1.5 pl-13 md:pl-[52px]">
          <p>Today you have:</p>
          <ul className="list-none space-y-1">
            <Briefing n={todaysTasks.length} unit="task" tail="due today" />
            <Briefing n={overdueTasks.length} unit="task" tail="overdue" tone="warn" />
            <Briefing n={blockedProjects.length} unit="project" tail="blocked" tone={blockedProjects.length ? "warn" : undefined} />
            <Briefing n={unread} unit="unread message" tail="waiting" />
            <Briefing n={needsAttention} unit="high-priority project" tail="needs attention" />
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Estimated focused work: <span className="font-mono text-foreground">{fh}h {fm}m</span>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 pl-13 md:pl-[52px]">
          <PrimaryAction icon={Play} label="Start Work" onClick={() => navigate({ to: "/tasks" })} />
          <SecondaryAction icon={ListChecks} label="Review Today" onClick={() => navigate({ to: "/calendar" })} />
          <SecondaryAction icon={MessageSquare} label="Talk" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true }))} />
          <SecondaryAction icon={AlertCircle} label="Show Priorities" onClick={() => navigate({ to: "/projects" })} />
          <SecondaryAction icon={Mic} label="Voice" onClick={() => alert("Voice mode coming soon.")} />
        </div>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="active tasks" value={myTasks.length} to="/tasks" />
        <SummaryCard label="meetings today" value={0} to="/calendar" />
        <SummaryCard label="unread messages" value={unread} to="/communication" />
        <SummaryCard label="needs attention" value={needsAttention} to="/projects" tone={needsAttention > 0 ? "warn" : undefined} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* My projects */}
        <Section title="My projects" to="/projects" className="md:col-span-2">
          {activeProjects.length === 0 ? (
            <Empty msg="No active projects yet." cta="Create one" onClick={() => navigate({ to: "/projects" })} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {activeProjects.slice(0, 4).map((p: any) => (
                <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }}
                  className="group rounded-xl border border-border bg-card p-4 hover:border-accent/40 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-9 rounded-lg grid place-items-center text-white font-semibold text-sm" style={{ background: p.color ?? "#0a2540" }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.priority} priority</div>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-accent/70" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">{p.progress}%</div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* My tasks */}
        <Section title="My tasks" to="/tasks">
          {todaysTasks.length === 0 ? (
            <Empty msg="Nothing on your plate today." />
          ) : (
            <div className="space-y-1.5">
              {todaysTasks.slice(0, 6).map((t: any) => (
                <div key={t.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition">
                  <input type="checkbox" className="mt-0.5 size-4 rounded border-border accent-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-snug truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "no date"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Recent activity */}
        <Section title="Recent activity" className="md:col-span-2">
          {(notifs.data ?? []).length === 0 ? (
            <Empty msg="No recent activity." />
          ) : (
            <div className="space-y-1">
              {(notifs.data ?? []).slice(0, 5).map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition">
                  <div className={`mt-1 size-1.5 rounded-full shrink-0 ${n.read_at ? "bg-muted-foreground/30" : "bg-accent"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground truncate">{n.body}</div>}
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Team */}
        <Section title="Team updates" to="/people">
          {(people.data ?? []).length === 0 ? (
            <Empty msg="No teammates yet." cta="Invite people" onClick={() => navigate({ to: "/people" })} />
          ) : (
            <div className="space-y-2">
              {(people.data ?? []).slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="size-8 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
                      {(p.full_name || p.email || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-card ${
                      p.online_status === "online" ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="truncate font-medium">{p.full_name ?? p.email}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.position ?? "Member"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, to, tone }: { label: string; value: number; to: any; tone?: "warn" }) {
  return (
    <Link to={to} className="rounded-xl border border-border bg-card p-4 hover:border-accent/40 hover:shadow-sm transition-all">
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-display ${tone === "warn" && value > 0 ? "text-amber-600" : ""}`}>{value}</span>
        {tone === "warn" && value > 0 && <AlertCircle className="size-4 text-amber-500" />}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Link>
  );
}

function Section({ title, to, children, className = "" }: { title: string; to?: any; children: any; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card/40 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {to && (
          <Link to={to} className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-0.5">
            See all <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg, cta, onClick }: { msg: string; cta?: string; onClick?: () => void }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-muted-foreground">{msg}</p>
      {cta && (
        <button onClick={onClick} className="mt-3 text-xs font-medium text-accent hover:underline">
          {cta} →
        </button>
      )}
    </div>
  );
}

function Briefing({ n, unit, tail, tone }: { n: number; unit: string; tail: string; tone?: "warn" }) {
  if (n === 0) return null;
  return (
    <li className="flex items-baseline gap-2">
      <span className={`inline-block min-w-[28px] font-display text-xl ${tone === "warn" ? "text-amber-600" : "text-accent"}`}>{n}</span>
      <span>{unit}{n === 1 ? "" : "s"} {tail}</span>
    </li>
  );
}

function PrimaryAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition shadow-sm">
      <Icon className="size-4" /> {label}
    </button>
  );
}

function SecondaryAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-accent/40 hover:bg-accent/5 transition">
      <Icon className="size-4" /> {label}
    </button>
  );
}