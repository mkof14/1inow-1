import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchDecisions, fetchProjects, fetchTasks, fetchProfiles } from "@/lib/queries";
import { fetchNotifications } from "@/lib/wave1";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  CalendarDays,
  FolderKanban,
  Hourglass,
  Info,
  MessageSquare,
  ListChecks,
  Plus,
  ArrowRight,
  Target,
  TrendingUp,
  Mic,
} from "lucide-react";
import { BrandMark } from "@/components/icons/compass-mark";
import { BrandMark as BrandRing } from "@/components/icons/compass-icons";
import {
  buildAttention,
  buildToday,
  buildWaitingFor,
  detectOpenLoops,
  scoreProject,
} from "@/lib/brain";
import { firstScreenGreeting } from "@/lib/simplicity";
import { PageHeader } from "@/components/page-header";
import { useT } from "@/lib/i18n";
import { getVoiceInboxItems, subscribeVoiceInbox, type VoiceInboxItem } from "@/lib/voice-intake";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: HomePage });

function HomePage() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const people = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const notifs = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
  const decisions = useQuery({ queryKey: ["decisions"], queryFn: fetchDecisions });
  const [voiceInbox, setVoiceInbox] = useState<VoiceInboxItem[]>([]);

  const name =
    (user?.user_metadata as any)?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  // ── Simplicity first screen ─────────────────────────────────────────
  // Show only what deserves attention. Max 4 items. Three actions.
  const attention = buildAttention({
    userId: user?.id,
    tasks: tasks.data ?? [],
    projects: projects.data ?? [],
  }).slice(0, 4);
  const greet = firstScreenGreeting(name, attention.length, {
    hello: t("greet.hello"),
    calm: t("greet.calm"),
    one: t("greet.attention.one"),
    many: t("greet.attention.many"),
  });

  // Secondary signals — kept compact, available below the fold.
  const myTasks = (tasks.data ?? []).filter(
    (t: any) => t.assignee_id === user?.id && t.status !== "done" && t.status !== "canceled",
  );
  const activeProjects = (projects.data ?? []).filter(
    (p: any) => p.status === "active" || p.status === "in_progress",
  );
  const decisionData = decisions.data ?? [];

  const openTalk = () =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true }));

  useEffect(() => {
    const refresh = () => setVoiceInbox(getVoiceInboxItems());
    refresh();
    return subscribeVoiceInbox(refresh);
  }, []);

  // ── Widget data ────────────────────────────────────────────────────
  const now = Date.now();
  const inDays = (d: any, n: number) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    return t >= now && t - now <= n * 86400000;
  };
  const isToday = (d: any) => {
    if (!d) return false;
    const x = new Date(d);
    const y = new Date();
    return (
      x.getFullYear() === y.getFullYear() &&
      x.getMonth() === y.getMonth() &&
      x.getDate() === y.getDate()
    );
  };
  const openTasks = (tasks.data ?? []).filter(
    (t: any) => t.status !== "done" && t.status !== "canceled",
  );
  const todayTasks = openTasks.filter((t: any) => isToday(t.due_date));
  const upcoming = openTasks
    .filter((t: any) => inDays(t.due_date, 14))
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 6);
  const doneCount = (tasks.data ?? []).filter((t: any) => t.status === "done").length;
  const overdueTasks = openTasks.filter(
    (t: any) => t.due_date && new Date(t.due_date).getTime() < now,
  );
  const overdue = overdueTasks.length;
  const todayFocus = buildToday({
    userId: user?.id,
    tasks: tasks.data ?? [],
    projects: projects.data ?? [],
  });
  const waitingBuckets = buildWaitingFor({
    userId: user?.id,
    tasks: tasks.data ?? [],
    decisions: decisionData,
  }).map((bucket) => ({ ...bucket, items: bucket.items.slice(0, 3) }));
  const openLoops = detectOpenLoops({
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    decisions: decisionData,
  }).slice(0, 5);
  const projectRisks = (projects.data ?? [])
    .filter(
      (p: any) => p.status !== "completed" && p.status !== "archived" && p.status !== "canceled",
    )
    .map((project: any) => scoreProject(project, tasks.data ?? []))
    .filter(
      (health) =>
        health.level === "risk" || health.level === "critical" || health.level === "attention",
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);
  const pendingDecisions = decisionData
    .filter((d: any) => d.status === "pending" || d.status === "review")
    .slice(0, 4);
  const unreadNotifications = (notifs.data ?? []).filter((n: any) => !n.read_at);
  const suggestedActions = [
    overdueTasks.length
      ? {
          label: `Clear ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`,
          href: "/tasks",
          reason: "Time risk",
          confidence: "high",
          evidence: [
            `${overdueTasks.length} open task${overdueTasks.length === 1 ? "" : "s"} with due dates before today`,
            "Source: tasks.due_date + tasks.status",
          ],
        }
      : null,
    pendingDecisions.length
      ? {
          label: `Decide ${pendingDecisions.length} pending item${pendingDecisions.length === 1 ? "" : "s"}`,
          href: "/approvals",
          reason: "Decision queue",
          confidence: "high",
          evidence: [
            `${pendingDecisions.length} decision${pendingDecisions.length === 1 ? "" : "s"} with pending/review status`,
            "Source: decisions.status",
          ],
        }
      : null,
    projectRisks.length
      ? {
          label: `Review ${projectRisks.length} project risk${projectRisks.length === 1 ? "" : "s"}`,
          href: "/projects",
          reason: "Portfolio health",
          confidence: "medium",
          evidence: [
            `${projectRisks.length} project${projectRisks.length === 1 ? "" : "s"} scored below healthy`,
            "Source: project status, updated_at, owner_id, task due dates",
          ],
        }
      : null,
    unreadNotifications.length
      ? {
          label: `Read ${unreadNotifications.length} new signal${unreadNotifications.length === 1 ? "" : "s"}`,
          href: "/inbox",
          reason: "Fresh updates",
          confidence: "high",
          evidence: [
            `${unreadNotifications.length} notification${unreadNotifications.length === 1 ? "" : "s"} without read_at`,
            "Source: notifications.read_at",
          ],
        }
      : null,
    !openTasks.length
      ? {
          label: "Create the next useful action",
          href: "/projects",
          reason: "No open work",
          confidence: "medium",
          evidence: ["No open tasks detected", "Source: tasks.status"],
        }
      : null,
  ].filter(Boolean) as CommandAction[];
  const operatingSignals: string[] = [
    activeProjects.length
      ? `${activeProjects.length} active project${activeProjects.length === 1 ? "" : "s"} in motion.`
      : "No active projects — a fresh canvas is waiting.",
    todayTasks.length
      ? `${todayTasks.length} task${todayTasks.length === 1 ? "" : "s"} due today — focus here first.`
      : "Nothing due today. Use the calm to plan the week.",
    overdue
      ? `${overdue} overdue item${overdue === 1 ? "" : "s"} need attention.`
      : `${doneCount} task${doneCount === 1 ? "" : "s"} already shipped. Momentum looks healthy.`,
  ];

  return (
    <div className="p-6 md:p-10 max-w-[1100px] mx-auto">
      <PageHeader
        icon={<BrandRing size={44} />}
        title={t("dashboard.today")}
        subtitle={greet.subline}
      />

      {/* First screen — calm, single focus */}
      <div className="relative mb-10 surface-aurora shimmer-border ring-accent-soft rounded-3xl border border-border p-6 md:p-8 fade-rise overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 35%, transparent), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-9 rounded-xl gradient-compass grid place-items-center text-primary-foreground shrink-0 transition-transform duration-500 hover:scale-110 hover:rotate-3">
              <BrandMark className="size-4" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("dashboard.today")}
            </span>
            <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent signal-pulse" />
              live
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-display tracking-tight text-gradient-accent">
            {greet.headline}
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-xl">{greet.subline}</p>

          {/* Three buttons. That's it. */}
          <div className="mt-6 flex flex-wrap gap-2">
            <PrimaryAction
              icon={MessageSquare}
              label={t("dashboard.action.talk")}
              onClick={openTalk}
            />
            <SecondaryAction
              icon={ListChecks}
              label={t("dashboard.action.review")}
              onClick={() => navigate({ to: "/tasks" })}
            />
            <SecondaryAction
              icon={Plus}
              label={t("dashboard.action.create")}
              onClick={() => navigate({ to: "/projects" })}
            />
          </div>

          {/* Four attention items. No more. */}
          {attention.length > 0 && (
            <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card/80 backdrop-blur shimmer-border overflow-hidden">
              {attention.map((a, idx) => (
                <li key={a.id} style={{ animationDelay: `${idx * 40}ms` }} className="fade-rise">
                  <Link
                    to={a.href as any}
                    className="group flex items-start gap-3 p-4 hover:bg-accent/10 transition-colors"
                  >
                    <div className="mt-1 size-1.5 rounded-full bg-accent shrink-0 signal-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                        {a.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{a.reason}</div>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DailyCommandCenter
        todayFocus={todayFocus}
        projectRisks={projectRisks}
        waitingBuckets={waitingBuckets}
        openLoops={openLoops}
        pendingDecisions={pendingDecisions}
        suggestedActions={suggestedActions}
        stats={{
          open: openTasks.length,
          done: doneCount,
          overdue,
          activeProjects: activeProjects.length,
        }}
      />

      <VoiceReviewQueue items={voiceInbox.filter((item) => item.status === "new").slice(0, 5)} />

      {/* Compact operating widgets */}
      <div className="grid md:grid-cols-2 gap-5 mb-10">
        {/* Today's Tasks */}
        <Widget
          icon={<CheckCircle2 className="size-4" />}
          title="Today’s Tasks"
          accent={`${todayTasks.length} due`}
          to="/tasks"
        >
          {todayTasks.length === 0 ? (
            <EmptyLine msg="Nothing on the docket today." />
          ) : (
            <ul className="space-y-1.5">
              {todayTasks.slice(0, 5).map((t: any, i: number) => (
                <li
                  key={t.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="fade-rise flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/5 transition"
                >
                  <span className="mt-1.5 size-1.5 rounded-full bg-accent signal-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    {t.projects?.name && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {t.projects.name}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        {/* Upcoming Deadlines */}
        <Widget
          icon={<CalendarDays className="size-4" />}
          title="Upcoming Deadlines"
          accent={`${upcoming.length} next 14d`}
          to="/calendar"
        >
          {upcoming.length === 0 ? (
            <EmptyLine msg="No deadlines in the next two weeks." />
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((t: any, i: number) => (
                <li
                  key={t.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="fade-rise flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition"
                >
                  <div className="size-9 rounded-lg bg-accent/10 text-accent grid place-items-center text-[10px] font-semibold leading-none flex-col">
                    <span>
                      {new Date(t.due_date)
                        .toLocaleDateString(undefined, { month: "short" })
                        .toUpperCase()}
                    </span>
                    <span className="text-sm font-bold">{new Date(t.due_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(t.due_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        {/* My Projects */}
        <Widget
          icon={<FolderKanban className="size-4" />}
          title="My Projects"
          accent={`${activeProjects.length} active`}
          to="/projects"
        >
          {activeProjects.length === 0 ? (
            <EmptyLine msg="No active projects yet." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {activeProjects.slice(0, 4).map((p: any, i: number) => (
                <Link
                  key={p.id}
                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="fade-rise group rounded-xl border border-border bg-card/60 p-3 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--accent)_35%,transparent)] transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="size-7 rounded-md grid place-items-center text-white font-semibold text-[11px]"
                      style={{ background: p.color ?? "#0a2540" }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs font-medium truncate group-hover:text-accent transition-colors">
                      {p.name}
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent/70"
                      style={{ width: `${p.progress ?? 0}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {p.progress ?? 0}%
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Widget>

        {/* Operating Signals */}
        <Widget
          icon={<Target className="size-4" />}
          title="Operating Signals"
          accent="live"
          accentPulse
        >
          <ul className="space-y-2">
            {operatingSignals.map((line, i) => (
              <li
                key={i}
                style={{ animationDelay: `${i * 60}ms` }}
                className="fade-rise flex items-start gap-2.5 text-sm leading-snug"
              >
                <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0 signal-pulse" />
                <span className="text-foreground/90">{line}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={openTalk}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <MessageSquare className="size-3.5" /> Ask advisor about today
          </button>
        </Widget>
      </div>

      {/* Secondary — quietly available, never the main act */}
      <details className="group mb-6">
        <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
          <span>{t("dashboard.more")}</span>
          <ArrowRight className="size-3 transition group-open:rotate-90" />
        </summary>

        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {/* My projects */}
          <Section title={t("dashboard.myProjects")} to="/projects" className="md:col-span-2">
            {activeProjects.length === 0 ? (
              <Empty
                msg={t("dashboard.myProjectsEmpty")}
                cta={t("dashboard.createOne")}
                onClick={() => navigate({ to: "/projects" })}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {activeProjects.slice(0, 4).map((p: any) => (
                  <Link
                    key={p.id}
                    to="/projects/$slug"
                    params={{ slug: p.slug }}
                    className="group rounded-xl border border-border bg-card p-4 hover:border-accent/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="size-9 rounded-lg grid place-items-center text-white font-semibold text-sm"
                        style={{ background: p.color ?? "#0a2540" }}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t("dashboard.priority").replace("{p}", String(p.priority))}
                        </div>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent/70"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                      {p.progress}%
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          {/* My tasks */}
          <Section title={t("dashboard.myTasks")} to="/tasks">
            {myTasks.length === 0 ? (
              <Empty msg={t("dashboard.myTasksEmpty")} />
            ) : (
              <div className="space-y-1.5">
                {myTasks.slice(0, 6).map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded border-border accent-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-snug truncate">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" />
                        {t.due_date
                          ? new Date(t.due_date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recent activity */}
          <Section title={t("dashboard.activity")} className="md:col-span-2">
            {(notifs.data ?? []).length === 0 ? (
              <Empty msg={t("dashboard.activityEmpty")} />
            ) : (
              <div className="space-y-1">
                {(notifs.data ?? []).slice(0, 5).map((n: any) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition"
                  >
                    <div
                      className={`mt-1 size-1.5 rounded-full shrink-0 ${n.read_at ? "bg-muted-foreground/30" : "bg-accent"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{n.title}</div>
                      {n.body && (
                        <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                      )}
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
          <Section title={t("dashboard.team")} to="/people">
            {(people.data ?? []).length === 0 ? (
              <Empty
                msg={t("dashboard.teamEmpty")}
                cta={t("dashboard.invite")}
                onClick={() => navigate({ to: "/people" })}
              />
            ) : (
              <div className="space-y-2">
                {(people.data ?? []).slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="size-8 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
                        {(p.full_name || p.email || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-card ${
                          p.online_status === "online" ? "bg-emerald-500" : "bg-muted-foreground/40"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="truncate font-medium">{p.full_name ?? p.email}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {p.position ?? t("common.member")}
                      </div>
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

function DailyCommandCenter({
  todayFocus,
  projectRisks,
  waitingBuckets,
  openLoops,
  pendingDecisions,
  suggestedActions,
  stats,
}: {
  todayFocus: any[];
  projectRisks: any[];
  waitingBuckets: {
    label: string;
    items: { id: string; title: string; hint: string; href?: string }[];
  }[];
  openLoops: { refId: string; title: string; hint: string; href?: string }[];
  pendingDecisions: any[];
  suggestedActions: CommandAction[];
  stats: { open: number; done: number; overdue: number; activeProjects: number };
}) {
  const waitingTotal = waitingBuckets.reduce((sum, bucket) => sum + bucket.items.length, 0);

  return (
    <section className="mb-10 fade-rise">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent live-dot" />
            Daily Command Center
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">Today's operating picture</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live signals from your projects, tasks, decisions, and notifications.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:min-w-[360px]">
          <SignalMetric label="Open" value={stats.open} />
          <SignalMetric label="Done" value={stats.done} tone="done" />
          <SignalMetric label="Risk" value={stats.overdue} tone={stats.overdue ? "risk" : "calm"} />
          <SignalMetric label="Active" value={stats.activeProjects} />
        </div>
      </div>

      <ActionSequence actions={suggestedActions} />

      <div className="grid gap-4 lg:grid-cols-3">
        <CommandPanel
          icon={<Target className="size-4" />}
          title="Today Focus"
          accent={`${todayFocus.length} item${todayFocus.length === 1 ? "" : "s"}`}
          href="/tasks"
        >
          {todayFocus.length ? (
            <CommandList>
              {todayFocus.slice(0, 5).map((item) => (
                <CommandItem
                  key={item.id}
                  href={item.href}
                  title={item.title}
                  meta={item.projectName ? `${item.reason} · ${item.projectName}` : item.reason}
                />
              ))}
            </CommandList>
          ) : (
            <CommandEmpty text="No assigned focus items. Use the calm to plan the next useful move." />
          )}
        </CommandPanel>

        <CommandPanel
          icon={<AlertTriangle className="size-4" />}
          title="Risks"
          accent={`${projectRisks.length + stats.overdue} signal${projectRisks.length + stats.overdue === 1 ? "" : "s"}`}
          href="/projects"
        >
          {projectRisks.length ? (
            <CommandList>
              {projectRisks.map((health) => (
                <CommandItem
                  key={health.project.id}
                  href={`/projects/${health.project.slug}`}
                  title={health.project.name}
                  meta={`${health.level} · ${health.reasons[0]}`}
                  tone={health.level === "critical" || health.level === "risk" ? "risk" : "default"}
                />
              ))}
            </CommandList>
          ) : (
            <CommandEmpty
              text={
                stats.overdue
                  ? "Task risk exists. Open Tasks to clear overdue work."
                  : "No project risk signals right now."
              }
            />
          )}
        </CommandPanel>

        <CommandPanel
          icon={<Hourglass className="size-4" />}
          title="Waiting / Stuck"
          accent={`${waitingTotal + openLoops.length} loop${waitingTotal + openLoops.length === 1 ? "" : "s"}`}
          href="/tasks"
        >
          {waitingTotal || openLoops.length ? (
            <CommandList>
              {waitingBuckets
                .flatMap((bucket) =>
                  bucket.items.map((item) => (
                    <CommandItem
                      key={`${bucket.label}-${item.id}`}
                      href={item.href ?? "/tasks"}
                      title={item.title}
                      meta={`${bucket.label} · ${item.hint}`}
                    />
                  )),
                )
                .slice(0, 4)}
              {openLoops.slice(0, 2).map((item) => (
                <CommandItem
                  key={item.refId}
                  href={item.href ?? "/tasks"}
                  title={item.title}
                  meta={`Open loop · ${item.hint}`}
                  tone="risk"
                />
              ))}
            </CommandList>
          ) : (
            <CommandEmpty text="No stuck loops detected in current data." />
          )}
        </CommandPanel>

        <CommandPanel
          icon={<Bell className="size-4" />}
          title="Decisions Needed"
          accent={`${pendingDecisions.length} pending`}
          href="/approvals"
        >
          {pendingDecisions.length ? (
            <CommandList>
              {pendingDecisions.map((decision) => (
                <CommandItem
                  key={decision.id}
                  href="/approvals"
                  title={decision.title ?? "Decision"}
                  meta={`${decision.status} · ${decision.impact ?? "normal"} impact`}
                  tone={
                    decision.impact === "critical" || decision.impact === "high"
                      ? "risk"
                      : "default"
                  }
                />
              ))}
            </CommandList>
          ) : (
            <CommandEmpty text="No decision queue. Keep execution moving." />
          )}
        </CommandPanel>

        <CommandPanel
          icon={<TrendingUp className="size-4" />}
          title="Momentum"
          accent="local"
          href="/reports"
        >
          <div className="grid grid-cols-2 gap-2">
            <MomentumTile label="Open work" value={stats.open} />
            <MomentumTile label="Shipped" value={stats.done} tone="done" />
            <MomentumTile
              label="Overdue"
              value={stats.overdue}
              tone={stats.overdue ? "risk" : "calm"}
            />
            <MomentumTile label="Projects" value={stats.activeProjects} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Momentum is calculated from existing task/project status only.
          </p>
        </CommandPanel>

        <CommandPanel
          icon={<ListChecks className="size-4" />}
          title="Suggested Next Actions"
          accent={`${suggestedActions.length || 1} move${suggestedActions.length === 1 ? "" : "s"}`}
          href="/tasks"
        >
          {suggestedActions.length ? (
            <CommandList>
              {suggestedActions.slice(0, 5).map((action) => (
                <CommandItem
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  title={action.label}
                  meta={action.reason}
                />
              ))}
            </CommandList>
          ) : (
            <CommandList>
              <CommandItem
                href="/tasks"
                title="Review the board"
                meta="No urgent signals detected"
              />
              <CommandItem
                href="/projects"
                title="Plan one next outcome"
                meta="Keep the system fresh"
              />
            </CommandList>
          )}
        </CommandPanel>
      </div>
    </section>
  );
}

function VoiceReviewQueue({ items }: { items: VoiceInboxItem[] }) {
  if (!items.length) return null;

  return (
    <section className="mb-10 rounded-2xl border border-border bg-card/70 p-4 fade-rise">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <Mic className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Voice Review Queue</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recent captured thoughts waiting to become tasks, projects, or decisions.
            </p>
          </div>
        </div>
        <Link
          to="/inbox"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          Review in Inbox
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.id}
            to="/inbox"
            className="group rounded-xl border border-border bg-background/60 p-3 transition-colors hover:border-accent/35 hover:bg-accent/5"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                {item.kind}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="truncate text-sm font-medium group-hover:text-accent">{item.title}</div>
            <div className="mt-1 truncate text-[11px] text-muted-foreground">{item.summary}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

type CommandAction = {
  label: string;
  href: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
};

function ActionSequence({ actions }: { actions: CommandAction[] }) {
  const steps = actions.length
    ? actions.slice(0, 3)
    : [
        {
          label: "Review the board",
          href: "/tasks",
          reason: "No urgent signals detected",
          confidence: "medium" as const,
          evidence: [
            "No overdue, pending, or unread signal was prioritized",
            "Source: local dashboard heuristics",
          ],
        },
        {
          label: "Plan one next outcome",
          href: "/projects",
          reason: "Keep the system fresh",
          confidence: "medium" as const,
          evidence: ["Healthy systems still need a next outcome", "Source: project/task counts"],
        },
        {
          label: "Check the inbox",
          href: "/inbox",
          reason: "Confirm no fresh signals",
          confidence: "low" as const,
          evidence: ["Inbox state can change during the day", "Source: notifications query"],
        },
      ];

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card/70 p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="grid size-7 place-items-center rounded-lg bg-accent/10 text-accent">
          <ListChecks className="size-3.5" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Recommended sequence</div>
          <div className="text-[11px] text-muted-foreground">
            A simple order for the next operating pass.
          </div>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={`${step.href}-${step.label}`}
            className="rounded-xl border border-border bg-background/60 p-3 transition-colors hover:border-accent/35 hover:bg-accent/5"
          >
            <Link to={step.href as any} className="group flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium group-hover:text-accent">
                  {step.label}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {step.reason}
                </span>
              </span>
              <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground group-hover:text-accent" />
            </Link>
            <WhyThis confidence={step.confidence} evidence={step.evidence} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "done" | "risk" | "calm";
}) {
  const toneClass =
    tone === "done"
      ? "text-emerald-600"
      : tone === "risk"
        ? "text-rose-600"
        : tone === "calm"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card/70 px-3 py-2 text-center">
      <div className={`text-base font-semibold ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

function CommandPanel({
  icon,
  title,
  accent,
  href,
  children,
}: {
  icon: any;
  title: string;
  accent: string;
  href: string;
  children: any;
}) {
  return (
    <div className="surface-aurora shimmer-border ring-accent-soft rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </div>
          <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        <Link
          to={href as any}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground hover:text-accent"
        >
          {accent}
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function CommandList({ children }: { children: any }) {
  return <div className="space-y-1.5">{children}</div>;
}

function CommandItem({
  href,
  title,
  meta,
  tone = "default",
}: {
  href: string;
  title: string;
  meta: string;
  tone?: "default" | "risk";
}) {
  return (
    <Link
      to={href as any}
      className="group flex items-start gap-2.5 rounded-xl border border-transparent p-2 transition-colors hover:border-accent/25 hover:bg-accent/5"
    >
      <span
        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tone === "risk" ? "bg-rose-500 signal-pulse" : "bg-accent"}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium group-hover:text-accent">{title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{meta}</span>
      </span>
    </Link>
  );
}

function WhyThis({
  confidence,
  evidence,
}: {
  confidence: CommandAction["confidence"];
  evidence: string[];
}) {
  const confidenceClass =
    confidence === "high"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
      : confidence === "medium"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700"
        : "border-border bg-muted text-muted-foreground";

  return (
    <details className="mt-2 rounded-lg border border-border/70 bg-card/50 px-2.5 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Info className="size-3.5" />
          Why this
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${confidenceClass}`}
        >
          {confidence} confidence
        </span>
      </summary>
      <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
        {evidence.map((line) => (
          <li key={line} className="flex gap-2 text-[11px] leading-snug text-muted-foreground">
            <span className="mt-1 size-1 shrink-0 rounded-full bg-accent" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function CommandEmpty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card/40 p-3 text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function MomentumTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "done" | "risk" | "calm";
}) {
  const toneClass =
    tone === "done"
      ? "text-emerald-600"
      : tone === "risk"
        ? "text-rose-600"
        : tone === "calm"
          ? "text-muted-foreground"
          : "text-accent";
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className={`text-xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({
  title,
  to,
  children,
  className = "",
}: {
  title: string;
  to?: any;
  children: any;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft p-5 fade-rise transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_35%,transparent)] ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {to && (
          <Link
            to={to}
            className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-0.5"
          >
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

function PrimaryAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition shadow-sm"
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

function SecondaryAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:border-accent/40 hover:bg-accent/5 transition"
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

function Widget({
  icon,
  title,
  accent,
  accentPulse,
  to,
  children,
}: {
  icon: any;
  title: string;
  accent?: string;
  accentPulse?: boolean;
  to?: any;
  children: any;
}) {
  return (
    <div className="relative rounded-2xl border border-border surface-aurora shimmer-border ring-accent-soft p-5 fade-rise overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--accent)_35%,transparent)]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 30%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-accent/10 text-accent grid place-items-center shrink-0 transition-transform duration-500 hover:scale-110 hover:rotate-3">
              {icon}
            </div>
            <h2 className="text-sm font-semibold tracking-tight truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {accent && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                {accentPulse && <span className="size-1.5 rounded-full bg-accent signal-pulse" />}
                {accent}
              </span>
            )}
            {to && (
              <Link
                to={to}
                className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-0.5"
              >
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyLine({ msg }: { msg: string }) {
  return <p className="text-sm text-muted-foreground py-2">{msg}</p>;
}
