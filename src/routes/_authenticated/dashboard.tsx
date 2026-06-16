import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchTasks, fetchProfiles } from "@/lib/queries";
import { fetchNotifications } from "@/lib/wave1";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, ListChecks, Plus, ArrowRight, AlertCircle, Clock } from "lucide-react";
import { CompassMark } from "@/components/icons/compass-mark";
import { buildAttention } from "@/lib/brain";
import { firstScreenGreeting } from "@/lib/simplicity";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: HomePage });

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const people = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const notifs = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  const name = (user?.user_metadata as any)?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  // ── Simplicity first screen ─────────────────────────────────────────
  // Show only what deserves attention. Max 4 items. Three actions.
  const attention = buildAttention({
    userId: user?.id,
    tasks: tasks.data ?? [],
    projects: projects.data ?? [],
  }).slice(0, 4);
  const greet = firstScreenGreeting(name, attention.length);

  // Secondary signals — kept compact, available below the fold.
  const myTasks = (tasks.data ?? []).filter((t: any) =>
    t.assignee_id === user?.id && t.status !== "done" && t.status !== "canceled"
  );
  const activeProjects = (projects.data ?? []).filter((p: any) => p.status === "active" || p.status === "in_progress");
  const unread = (notifs.data ?? []).filter((n: any) => !n.read_at).length;

  const openTalk = () =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true }));

  return (
    <div className="p-6 md:p-10 max-w-[920px] mx-auto">
      {/* First screen — calm, single focus */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-9 rounded-xl gradient-compass grid place-items-center text-primary-foreground shrink-0">
            <CompassMark className="size-4" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Today</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-display tracking-tight">
          {greet.headline}
        </h1>
        <p className="mt-2 text-base text-muted-foreground max-w-xl">
          {greet.subline}
        </p>

        {/* Three buttons. That's it. */}
        <div className="mt-6 flex flex-wrap gap-2">
          <PrimaryAction icon={MessageSquare} label="Talk" onClick={openTalk} />
          <SecondaryAction icon={ListChecks} label="Review" onClick={() => navigate({ to: "/tasks" })} />
          <SecondaryAction icon={Plus} label="Create" onClick={() => navigate({ to: "/projects" })} />
        </div>

        {/* Four attention items. No more. */}
        {attention.length > 0 && (
          <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
            {attention.map((a) => (
              <li key={a.id}>
                <Link
                  to={a.href as any}
                  className="flex items-start gap-3 p-4 hover:bg-muted/40 transition"
                >
                  <div className="mt-1 size-1.5 rounded-full bg-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.reason}</div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Secondary — quietly available, never the main act */}
      <details className="group mb-6">
        <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <span>More from your workspace</span>
          <ArrowRight className="size-3 transition group-open:rotate-90" />
        </summary>

        <div className="mt-6 grid md:grid-cols-3 gap-6">
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
          {myTasks.length === 0 ? (
            <Empty msg="Nothing on your plate today." />
          ) : (
            <div className="space-y-1.5">
              {myTasks.slice(0, 6).map((t: any) => (
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
      </details>
    </div>
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