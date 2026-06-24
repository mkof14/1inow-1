/**
 * System Brain — pure, deterministic heuristics over existing data.
 * No invented facts: every signal is derived from observable fields
 * (status, due_date, owner_id, updated_at, etc.). Anything missing
 * is surfaced as an "open loop" so the user can fix it.
 */

export type HealthLevel = "healthy" | "attention" | "risk" | "critical";

const DAY = 24 * 60 * 60 * 1000;
const now = () => Date.now();
const daysSince = (iso?: string | null) =>
  iso ? Math.floor((now() - new Date(iso).getTime()) / DAY) : Infinity;
const daysUntil = (iso?: string | null) =>
  iso ? Math.floor((new Date(iso).getTime() - now()) / DAY) : Infinity;

const isOpenTask = (t: any) => t.status !== "done" && t.status !== "canceled";
const isBlocked = (t: any) => t.status === "blocked";

/* ───────────────────────── Project health ───────────────────────── */

export interface ProjectHealth {
  project: any;
  level: HealthLevel;
  score: number; // 0..100 higher = healthier
  reasons: string[];
}

export function scoreProject(project: any, tasks: any[]): ProjectHealth {
  const own = tasks.filter((t) => t.project_id === project.id);
  const open = own.filter(isOpenTask);
  const blocked = own.filter(isBlocked);
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date).getTime() < now());
  const stale = daysSince(project.updated_at);
  const reasons: string[] = [];
  let penalty = 0;

  if (!project.owner_id) {
    penalty += 25;
    reasons.push("No owner assigned");
  }
  if (blocked.length) {
    penalty += 15 + Math.min(15, blocked.length * 5);
    reasons.push(`${blocked.length} blocked task${blocked.length > 1 ? "s" : ""}`);
  }
  if (overdue.length) {
    penalty += 10 + Math.min(25, overdue.length * 5);
    reasons.push(`${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`);
  }
  if (project.deadline) {
    const d = daysUntil(project.deadline);
    if (d < 0) {
      penalty += 30;
      reasons.push(`Deadline passed ${-d}d ago`);
    } else if (d < 7) {
      penalty += 12;
      reasons.push(`Deadline in ${d}d`);
    }
  }
  if (stale > 14) {
    penalty += Math.min(20, stale - 14);
    reasons.push(`No activity for ${stale}d`);
  }
  if (project.status === "paused") {
    penalty += 10;
    reasons.push("Project is paused");
  }
  if (open.length === 0 && project.status !== "completed") {
    penalty += 8;
    reasons.push("No open tasks");
  }

  const score = Math.max(0, 100 - penalty);
  const level: HealthLevel =
    score >= 80 ? "healthy" : score >= 60 ? "attention" : score >= 35 ? "risk" : "critical";

  if (!reasons.length) reasons.push("All signals look normal");
  return { project, level, score, reasons };
}

/* ───────────────────────── Next action ───────────────────────── */

export type NextActionKind =
  | "assign_owner"
  | "set_due_date"
  | "unblock"
  | "follow_up"
  | "review"
  | "update_roadmap"
  | "approve"
  | "reply"
  | "link_project";

export interface NextAction {
  kind: NextActionKind;
  label: string;
  reason: string;
}

export function nextActionForTask(t: any): NextAction {
  if (!t.assignee_id)
    return { kind: "assign_owner", label: "Assign owner", reason: "Task has no assignee" };
  if (t.status === "blocked")
    return { kind: "unblock", label: "Unblock task", reason: "Marked as blocked" };
  if (!t.due_date)
    return { kind: "set_due_date", label: "Set a due date", reason: "No deadline yet" };
  if (new Date(t.due_date).getTime() < now())
    return { kind: "follow_up", label: "Follow up — overdue", reason: "Past due date" };
  if (t.status === "review")
    return { kind: "review", label: "Review work", reason: "Awaiting review" };
  return { kind: "follow_up", label: "Move forward", reason: "Open and assigned" };
}

export function nextActionForProject(p: any, tasks: any[]): NextAction {
  if (!p.owner_id)
    return { kind: "assign_owner", label: "Assign project owner", reason: "No owner" };
  const own = tasks.filter((t) => t.project_id === p.id && isOpenTask(t));
  if (own.some(isBlocked))
    return { kind: "unblock", label: "Unblock tasks", reason: "Blocked work" };
  if (daysSince(p.updated_at) > 14)
    return { kind: "update_roadmap", label: "Update roadmap", reason: "Stale > 14d" };
  if (p.deadline && daysUntil(p.deadline) < 7)
    return { kind: "update_roadmap", label: "Confirm deadline plan", reason: "Deadline near" };
  return { kind: "review", label: "Quick health review", reason: "Routine check" };
}

export function nextActionForDecision(d: any): NextAction {
  if (d.status === "pending")
    return { kind: "approve", label: "Decide", reason: "Pending approval" };
  if (d.status === "review") return { kind: "review", label: "Finish review", reason: "In review" };
  if (d.status === "deferred")
    return { kind: "follow_up", label: "Revisit deferred", reason: "Deferred earlier" };
  return { kind: "review", label: "Archive or log", reason: "Closed item" };
}

/* ───────────────────────── Open loops ───────────────────────── */

export type OpenLoopKind =
  | "task_no_owner"
  | "task_no_due"
  | "task_blocked"
  | "project_no_owner"
  | "project_stale"
  | "decision_pending"
  | "decision_review";

export interface OpenLoop {
  kind: OpenLoopKind;
  title: string;
  hint: string;
  href?: string;
  refId: string;
}

export function detectOpenLoops(args: {
  projects: any[];
  tasks: any[];
  decisions?: any[];
}): OpenLoop[] {
  const loops: OpenLoop[] = [];
  for (const t of args.tasks) {
    if (!isOpenTask(t)) continue;
    if (!t.assignee_id)
      loops.push({
        kind: "task_no_owner",
        title: t.title,
        hint: "Task without owner",
        refId: t.id,
        href: "/tasks",
      });
    else if (!t.due_date)
      loops.push({
        kind: "task_no_due",
        title: t.title,
        hint: "No due date",
        refId: t.id,
        href: "/tasks",
      });
    else if (isBlocked(t))
      loops.push({
        kind: "task_blocked",
        title: t.title,
        hint: "Blocked",
        refId: t.id,
        href: "/tasks",
      });
  }
  for (const p of args.projects) {
    if (p.status === "archived" || p.status === "completed" || p.status === "canceled") continue;
    if (!p.owner_id)
      loops.push({
        kind: "project_no_owner",
        title: p.name,
        hint: "Project without owner",
        refId: p.id,
        href: `/projects/${p.slug}`,
      });
    else if (daysSince(p.updated_at) > 21)
      loops.push({
        kind: "project_stale",
        title: p.name,
        hint: `Silent for ${daysSince(p.updated_at)}d`,
        refId: p.id,
        href: `/projects/${p.slug}`,
      });
  }
  for (const d of args.decisions ?? []) {
    if (d.status === "pending")
      loops.push({
        kind: "decision_pending",
        title: d.title ?? "Decision",
        hint: "Awaiting decision",
        refId: d.id,
        href: "/approvals",
      });
    else if (d.status === "review")
      loops.push({
        kind: "decision_review",
        title: d.title ?? "Decision",
        hint: "Review not finished",
        refId: d.id,
        href: "/approvals",
      });
  }
  return loops;
}

/* ───────────────────────── Today (max 7) ───────────────────────── */

export interface TodayItem {
  id: string;
  title: string;
  reason: string;
  projectName?: string;
  projectSlug?: string;
  weight: number;
  href: string;
}

const PRIORITY_W: Record<string, number> = { critical: 40, high: 25, medium: 12, low: 5 };

export function buildToday(args: {
  userId: string | undefined;
  tasks: any[];
  projects: any[];
}): TodayItem[] {
  const mine = args.tasks.filter((t) => isOpenTask(t) && t.assignee_id === args.userId);
  const scored = mine.map((t) => {
    let w = PRIORITY_W[t.priority] ?? 8;
    let reason = "Assigned to you";
    if (t.status === "blocked") {
      w += 15;
      reason = "Blocked — needs your move";
    }
    if (t.due_date) {
      const d = daysUntil(t.due_date);
      if (d < 0) {
        w += 50;
        reason = `Overdue by ${-d}d`;
      } else if (d === 0) {
        w += 35;
        reason = "Due today";
      } else if (d === 1) {
        w += 20;
        reason = "Due tomorrow";
      } else if (d <= 3) {
        w += 10;
        reason = `Due in ${d}d`;
      }
    }
    const proj = args.projects.find((p) => p.id === t.project_id);
    return {
      id: t.id,
      title: t.title,
      reason,
      weight: w,
      projectName: proj?.name,
      projectSlug: proj?.slug,
      href: "/tasks",
    };
  });
  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, 7);
}

/* ───────────────────────── Waiting For ───────────────────────── */

export interface WaitingBucket {
  label: string;
  items: { id: string; title: string; hint: string; href?: string }[];
}

export function buildWaitingFor(args: {
  userId: string | undefined;
  tasks: any[];
  decisions?: any[];
}): WaitingBucket[] {
  const me = args.userId;
  const waitingForMe = args.tasks.filter(
    (t) => isOpenTask(t) && t.assignee_id === me && t.status === "review",
  );
  const waitingForOthers = args.tasks.filter(
    (t) => isOpenTask(t) && t.assignee_id && t.assignee_id !== me,
  );
  const waitingApproval = (args.decisions ?? []).filter(
    (d) => d.status === "pending" || d.status === "review",
  );

  return [
    {
      label: "Waiting for me",
      items: waitingForMe.map((t) => ({
        id: t.id,
        title: t.title,
        hint: "Your review",
        href: "/tasks",
      })),
    },
    {
      label: "Waiting for others",
      items: waitingForOthers.map((t) => ({
        id: t.id,
        title: t.title,
        hint: t.status === "blocked" ? "Blocked" : "In their court",
        href: "/tasks",
      })),
    },
    {
      label: "Waiting for approval",
      items: waitingApproval.map((d) => ({
        id: d.id,
        title: d.title ?? "Decision",
        hint: d.status,
        href: "/approvals",
      })),
    },
  ];
}

/* ───────────────────────── Attention score ───────────────────────── */

export interface AttentionItem {
  id: string;
  title: string;
  score: number;
  reason: string;
  href: string;
  kind: "task" | "project" | "decision";
}

export function buildAttention(args: {
  userId: string | undefined;
  tasks: any[];
  projects: any[];
  decisions?: any[];
}): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const t of args.tasks) {
    if (!isOpenTask(t)) continue;
    const ignored = daysSince(t.updated_at);
    let s = (PRIORITY_W[t.priority] ?? 8) + Math.min(40, ignored);
    if (t.status === "blocked") s += 30;
    if (t.due_date && new Date(t.due_date).getTime() < now()) s += 40;
    if (s < 35) continue;
    items.push({
      id: t.id,
      kind: "task",
      title: t.title,
      score: s,
      reason: `Untouched ${ignored}d • ${t.status}`,
      href: "/tasks",
    });
  }
  for (const p of args.projects) {
    if (p.status === "archived" || p.status === "completed") continue;
    const h = scoreProject(p, args.tasks);
    if (h.level === "risk" || h.level === "critical") {
      items.push({
        id: p.id,
        kind: "project",
        title: p.name,
        score: 100 - h.score,
        reason: h.reasons[0] ?? "At risk",
        href: `/projects/${p.slug}`,
      });
    }
  }
  items.sort((a, b) => b.score - a.score);
  return items.slice(0, 10);
}

/* ───────────────────────── Cleanup suggestions ───────────────────────── */

export interface CleanupSuggestion {
  id: string;
  action: string;
  reason: string;
  href?: string;
}

export function buildCleanup(args: { projects: any[]; tasks: any[] }): CleanupSuggestion[] {
  const out: CleanupSuggestion[] = [];
  for (const p of args.projects) {
    const own = args.tasks.filter((t) => t.project_id === p.id);
    if (own.length === 0 && daysSince(p.created_at) > 30 && p.status !== "completed") {
      out.push({
        id: p.id,
        action: `Archive empty project "${p.name}"`,
        reason: "No tasks ever added",
        href: `/projects/${p.slug}`,
      });
    }
  }
  for (const t of args.tasks) {
    if (t.status === "done" && daysSince(t.completed_at ?? t.updated_at) > 60) {
      out.push({
        id: t.id,
        action: `Archive completed task "${t.title}"`,
        reason: "Done > 60d ago",
        href: "/tasks",
      });
    }
  }
  // duplicates by title
  const seen = new Map<string, string>();
  for (const t of args.tasks) {
    const key = `${t.project_id ?? ""}::${(t.title ?? "").trim().toLowerCase()}`;
    if (!key.endsWith("::")) {
      if (seen.has(key))
        out.push({
          id: t.id,
          action: `Possible duplicate task "${t.title}"`,
          reason: "Same title in same project",
          href: "/tasks",
        });
      else seen.set(key, t.id);
    }
  }
  return out.slice(0, 12);
}

/* ───────────────────────── End of Day / Week ───────────────────────── */

export interface DigestSection {
  label: string;
  items: string[];
}

export function endOfDay(args: { userId?: string; tasks: any[] }): DigestSection[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = args.tasks.filter(
    (t) => t.completed_at && new Date(t.completed_at) >= today && t.assignee_id === args.userId,
  );
  const movedToday = args.tasks.filter(
    (t) => t.assignee_id === args.userId && isOpenTask(t) && new Date(t.updated_at) >= today,
  );
  const waiting = args.tasks.filter((t) => t.assignee_id === args.userId && t.status === "review");
  const tomorrow = new Date(today.getTime() + DAY);
  const dayAfter = new Date(tomorrow.getTime() + DAY);
  const tomorrowItems = args.tasks.filter(
    (t) =>
      t.assignee_id === args.userId &&
      t.due_date &&
      new Date(t.due_date) >= tomorrow &&
      new Date(t.due_date) < dayAfter,
  );
  const risks = args.tasks.filter(
    (t) =>
      t.assignee_id === args.userId &&
      isOpenTask(t) &&
      (t.status === "blocked" || (t.due_date && new Date(t.due_date) < today)),
  );

  return [
    { label: "Completed today", items: completedToday.map((t) => t.title) },
    { label: "Moved forward", items: movedToday.map((t) => t.title) },
    { label: "Waiting on others / review", items: waiting.map((t) => t.title) },
    { label: "Tomorrow", items: tomorrowItems.map((t) => t.title) },
    {
      label: "Risks",
      items: risks.map((t) => `${t.title} — ${t.status === "blocked" ? "blocked" : "overdue"}`),
    },
  ];
}

export function endOfWeek(args: {
  userId?: string;
  projects: any[];
  tasks: any[];
  decisions?: any[];
}): DigestSection[] {
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const wins = args.tasks.filter((t) => t.completed_at && new Date(t.completed_at) >= start);
  const risks = args.projects
    .map((p) => scoreProject(p, args.tasks))
    .filter((h) => h.level === "risk" || h.level === "critical")
    .map((h) => `${h.project.name} — ${h.reasons[0]}`);
  const upcoming = args.tasks
    .filter(
      (t) =>
        isOpenTask(t) && t.due_date && daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= 7,
    )
    .map((t) => `${t.title} — due in ${daysUntil(t.due_date)}d`);
  const waiting = (args.decisions ?? [])
    .filter((d) => d.status === "pending")
    .map((d) => d.title ?? "Decision");
  const health = args.projects.map((p) => {
    const h = scoreProject(p, args.tasks);
    return `${p.name}: ${h.level} (${h.score})`;
  });

  return [
    { label: "Project health", items: health },
    { label: "Big wins", items: wins.map((t) => t.title) },
    { label: "People waiting (approvals)", items: waiting },
    { label: "Deadlines this week", items: upcoming },
    { label: "Big risks", items: risks },
  ];
}
