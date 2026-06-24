import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchProjects, fetchTasks, fetchDecisions } from "@/lib/queries";
import {
  PageContainer,
  SectionHeader,
  ResponsiveGrid,
  SafeCard,
  SectionTitle,
  CardTitle,
  Body,
  Small,
  Label,
  EmptyState,
} from "@/components/layout";
import { BrainPulse } from "@/components/icons/brain-pulse";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import {
  scoreProject,
  detectOpenLoops,
  buildToday,
  buildWaitingFor,
  buildAttention,
  buildCleanup,
  endOfDay,
  endOfWeek,
  nextActionForTask,
  nextActionForProject,
  type HealthLevel,
} from "@/lib/brain";

export const Route = createFileRoute("/_authenticated/brain")({
  component: BrainPage,
});

const HEALTH_STYLE: Record<HealthLevel, { dot: string; label: string; chip: string }> = {
  healthy: {
    dot: "bg-emerald-500",
    label: "Healthy",
    chip: "border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  },
  attention: {
    dot: "bg-amber-500",
    label: "Attention",
    chip: "border-amber-500/30 text-amber-700 dark:text-amber-400",
  },
  risk: {
    dot: "bg-orange-500",
    label: "Risk",
    chip: "border-orange-500/30 text-orange-700 dark:text-orange-400",
  },
  critical: {
    dot: "bg-rose-600",
    label: "Critical",
    chip: "border-rose-600/40 text-rose-700 dark:text-rose-400",
  },
};

function BrainPage() {
  const t = useT();
  const { user } = useAuth();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const decisions = useQuery({ queryKey: ["decisions"], queryFn: fetchDecisions });

  const P = projects.data ?? [];
  const T = tasks.data ?? [];
  const D = decisions.data ?? [];

  const today = useMemo(
    () => buildToday({ userId: user?.id, tasks: T, projects: P }),
    [user?.id, T, P],
  );
  const loops = useMemo(() => detectOpenLoops({ projects: P, tasks: T, decisions: D }), [P, T, D]);
  const waiting = useMemo(
    () => buildWaitingFor({ userId: user?.id, tasks: T, decisions: D }),
    [user?.id, T, D],
  );
  const attention = useMemo(
    () => buildAttention({ userId: user?.id, tasks: T, projects: P, decisions: D }),
    [user?.id, T, P, D],
  );
  const cleanup = useMemo(() => buildCleanup({ projects: P, tasks: T }), [P, T]);
  const health = useMemo(
    () => P.map((p) => scoreProject(p, T)).sort((a, b) => a.score - b.score),
    [P, T],
  );
  const eod = useMemo(() => endOfDay({ userId: user?.id, tasks: T }), [user?.id, T]);
  const eow = useMemo(
    () => endOfWeek({ userId: user?.id, projects: P, tasks: T, decisions: D }),
    [user?.id, P, T, D],
  );

  const loading = projects.isLoading || tasks.isLoading;
  const stats = {
    healthy: health.filter((h) => h.level === "healthy").length,
    attention: health.filter((h) => h.level === "attention").length,
    risk: health.filter((h) => h.level === "risk").length,
    critical: health.filter((h) => h.level === "critical").length,
  };

  return (
    <PageContainer size="wide">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <BrainPulse size={22} className="text-accent" />
            {t("page.brain.title")}
          </span>
        }
        description={t("page.brain.subtitle")}
      />

      {/* Today */}
      <SafeCard className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle>Build today — your shortlist (max 7)</SectionTitle>
          <Small className="text-muted-foreground">
            {today.length} item{today.length === 1 ? "" : "s"}
          </Small>
        </div>
        {today.length === 0 ? (
          <Small className="text-muted-foreground">
            {loading
              ? "Reading signals…"
              : "Nothing assigned to you with urgency. Pick something from Open Loops below."}
          </Small>
        ) : (
          <ol className="divide-y divide-border">
            {today.map((t, i) => (
              <li key={t.id} className="flex items-start gap-3 py-2.5">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Link to="/tasks" className="truncate text-sm font-medium hover:text-accent">
                      {t.title}
                    </Link>
                    {t.projectName && (
                      <Link
                        to={`/projects/${t.projectSlug}` as any}
                        className="truncate text-[11px] text-muted-foreground hover:text-accent"
                      >
                        · {t.projectName}
                      </Link>
                    )}
                  </div>
                  <Small className="text-muted-foreground">{t.reason}</Small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SafeCard>

      {/* Health summary */}
      <ResponsiveGrid className="mb-6" min={180}>
        {(["healthy", "attention", "risk", "critical"] as HealthLevel[]).map((k) => (
          <SafeCard key={k} className="p-4">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${HEALTH_STYLE[k].dot}`} />
              <Label>{HEALTH_STYLE[k].label}</Label>
            </div>
            <div className="mt-1 text-2xl font-semibold">{stats[k]}</div>
            <Small className="text-muted-foreground">projects</Small>
          </SafeCard>
        ))}
      </ResponsiveGrid>

      <ResponsiveGrid min={340} className="mb-6">
        {/* Project health */}
        <SafeCard className="p-5">
          <SectionTitle className="mb-3">Project health</SectionTitle>
          {health.length === 0 ? (
            <Small className="text-muted-foreground">No projects yet.</Small>
          ) : (
            <ul className="space-y-2.5">
              {health.slice(0, 8).map((h) => {
                const s = HEALTH_STYLE[h.level];
                const na = nextActionForProject(h.project, T);
                return (
                  <li key={h.project.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/projects/${h.project.slug}` as any}
                          className="block truncate text-sm font-medium hover:text-accent"
                        >
                          {h.project.name}
                        </Link>
                        <Small className="text-muted-foreground line-clamp-1">
                          {h.reasons.join(" · ")}
                        </Small>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${s.chip}`}>
                        <span className={`mr-1.5 size-1.5 rounded-full ${s.dot}`} />
                        {s.label} · {h.score}
                      </Badge>
                    </div>
                    <Small className="mt-1.5 text-muted-foreground">
                      <span className="text-foreground/80">Next:</span> {na.label} —{" "}
                      <span className="text-muted-foreground">{na.reason}</span>
                    </Small>
                  </li>
                );
              })}
            </ul>
          )}
        </SafeCard>

        {/* Attention */}
        <SafeCard className="p-5">
          <SectionTitle className="mb-3">Needs attention</SectionTitle>
          {attention.length === 0 ? (
            <Small className="text-muted-foreground">Nothing urgent. Quiet system.</Small>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((a) => (
                <li key={a.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={a.href as any}
                      className="truncate text-sm font-medium hover:text-accent"
                    >
                      {a.title}
                    </Link>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {a.kind} · {Math.round(a.score)}
                    </Badge>
                  </div>
                  <Small className="text-muted-foreground">{a.reason}</Small>
                </li>
              ))}
            </ul>
          )}
        </SafeCard>
      </ResponsiveGrid>

      {/* Waiting for */}
      <SafeCard className="mb-6 p-5">
        <SectionTitle className="mb-3">Waiting for</SectionTitle>
        <ResponsiveGrid min={260}>
          {waiting.map((b) => (
            <div key={b.label} className="rounded-lg border border-border p-3">
              <Label>{b.label}</Label>
              <div className="mt-1 text-lg font-semibold">{b.items.length}</div>
              {b.items.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {b.items.slice(0, 5).map((it) => (
                    <li key={it.id} className="min-w-0">
                      <Link
                        to={(it.href ?? "/tasks") as any}
                        className="block truncate text-sm hover:text-accent"
                      >
                        {it.title}
                      </Link>
                      <Small className="text-muted-foreground">{it.hint}</Small>
                    </li>
                  ))}
                  {b.items.length > 5 && (
                    <Small className="text-muted-foreground">+{b.items.length - 5} more</Small>
                  )}
                </ul>
              ) : (
                <Small className="mt-1 block text-muted-foreground">Empty</Small>
              )}
            </div>
          ))}
        </ResponsiveGrid>
      </SafeCard>

      {/* Open Loops */}
      <SafeCard className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle>Open loops</SectionTitle>
          <Small className="text-muted-foreground">{loops.length} unresolved</Small>
        </div>
        {loops.length === 0 ? (
          <EmptyState
            title="No open loops"
            description="Every task has an owner, every project has activity. Nice."
          />
        ) : (
          <ResponsiveGrid min={280}>
            {loops.slice(0, 15).map((l) => {
              const task = l.kind.startsWith("task_") ? T.find((t) => t.id === l.refId) : null;
              const na = task ? nextActionForTask(task) : null;
              return (
                <div key={`${l.kind}-${l.refId}`} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate">{l.title}</CardTitle>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {l.hint}
                    </Badge>
                  </div>
                  {na && (
                    <Small className="mt-1.5 text-muted-foreground">
                      <span className="text-foreground/80">Next:</span> {na.label}
                    </Small>
                  )}
                  {l.href && (
                    <Link
                      to={l.href as any}
                      className="mt-2 inline-block text-xs text-accent hover:underline"
                    >
                      Open →
                    </Link>
                  )}
                </div>
              );
            })}
          </ResponsiveGrid>
        )}
      </SafeCard>

      {/* Cleanup */}
      {cleanup.length > 0 && (
        <SafeCard className="mb-6 p-5">
          <SectionTitle className="mb-3">Suggested cleanup</SectionTitle>
          <ul className="divide-y divide-border">
            {cleanup.map((c) => (
              <li
                key={`${c.action}-${c.id}`}
                className="flex items-start justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <Body className="truncate font-medium">{c.action}</Body>
                  <Small className="text-muted-foreground">{c.reason}</Small>
                </div>
                {c.href && (
                  <Link to={c.href as any} className="shrink-0 text-xs text-accent hover:underline">
                    Review
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </SafeCard>
      )}

      {/* End of day / week */}
      <ResponsiveGrid min={340}>
        <SafeCard className="p-5">
          <SectionTitle className="mb-3">End of day</SectionTitle>
          {eod.map((s) => (
            <div key={s.label} className="mb-3 last:mb-0">
              <Label>{s.label}</Label>
              {s.items.length === 0 ? (
                <Small className="text-muted-foreground">—</Small>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {s.items.slice(0, 6).map((t, i) => (
                    <li key={i} className="truncate text-sm">
                      • {t}
                    </li>
                  ))}
                  {s.items.length > 6 && (
                    <Small className="text-muted-foreground">+{s.items.length - 6} more</Small>
                  )}
                </ul>
              )}
            </div>
          ))}
        </SafeCard>
        <SafeCard className="p-5">
          <SectionTitle className="mb-3">End of week</SectionTitle>
          {eow.map((s) => (
            <div key={s.label} className="mb-3 last:mb-0">
              <Label>{s.label}</Label>
              {s.items.length === 0 ? (
                <Small className="text-muted-foreground">—</Small>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {s.items.slice(0, 6).map((t, i) => (
                    <li key={i} className="truncate text-sm">
                      • {t}
                    </li>
                  ))}
                  {s.items.length > 6 && (
                    <Small className="text-muted-foreground">+{s.items.length - 6} more</Small>
                  )}
                </ul>
              )}
            </div>
          ))}
        </SafeCard>
      </ResponsiveGrid>
    </PageContainer>
  );
}
