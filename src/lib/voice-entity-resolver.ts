import { fetchProjects, fetchTasks } from "@/lib/queries";
import { fetchWorkspaceProfiles } from "@/lib/organization-model";
import { supabase } from "@/integrations/supabase/client";
import type { VoicePlan } from "@/lib/voice-actions";
import { formatDueDateLabel, parseDueDateFromText } from "@/lib/voice-due-date";
import { fetchFirstNewVoiceInboxItem } from "@/lib/voice-inbox-actions";
import { enrichSendMessagePlan } from "@/lib/voice-comm-actions";
import { fetchFirstUpcomingReminder } from "@/lib/voice-reminder-actions";
import { formatReminderTime } from "@/lib/voice-reminder-time";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:«»"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(query: string, candidate: string) {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (c === q) return 100;
  if (c.includes(q) || q.includes(c)) return 80;
  const qWords = q.split(" ").filter(Boolean);
  const hits = qWords.filter((w) => c.includes(w)).length;
  return (hits / Math.max(qWords.length, 1)) * 60;
}

export async function findProjectByName(name: string) {
  const projects = await fetchProjects();
  let best: (typeof projects)[number] | null = null;
  let bestScore = 0;
  for (const p of projects) {
    const s = Math.max(scoreMatch(name, p.name), scoreMatch(name, p.slug ?? ""));
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 40 ? best : null;
}

export async function findTaskByTitle(title: string, projectId?: string | null) {
  let q = supabase.from("tasks").select("id,title,project_id,projects(slug,name)").ilike("title", `%${title.trim()}%`).limit(12);
  if (projectId) q = q.eq("project_id", projectId);
  const { data } = await q;
  if (!data?.length) return null;

  let best = data[0]!;
  let bestScore = 0;
  for (const task of data) {
    const s = scoreMatch(title, task.title);
    if (s > bestScore) {
      bestScore = s;
      best = task;
    }
  }
  return bestScore >= 35 ? best : null;
}

/** Extract project name from "task X for project Y" patterns. */
export function extractProjectNameFromUtterance(text: string): string | null {
  const patterns = [
    /\b(?:for|in|inside|within|проект[еа]?|в проекте|для проекта|у проекті|для проєкту)\s+[«"']?([^«"'.!?]+)[»"']?\s*$/i,
    /\bproject\s+[«"']?([^«"'.!?]+)[»"']?\s*$/i,
    /\bпроект\s+[«"']?([^«"'.!?]+)[»"']?\s*$/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

export function extractSearchQuery(text: string, searchPhrases: string[]) {
  const lower = normalize(text);
  for (const phrase of searchPhrases.sort((a, b) => b.length - a.length)) {
    const p = normalize(phrase);
    if (lower.startsWith(p + " ")) return text.slice(text.toLowerCase().indexOf(phrase.toLowerCase()) + phrase.length).trim();
    if (lower === p) return "";
  }
  return text.replace(/^(find|search|look for|найди|найти|ищи|поиск|buscar|suchen)\s+/i, "").trim();
}

export async function findProfileByName(name: string) {
  const profiles = await fetchWorkspaceProfiles("id,full_name,email");
  let best: (typeof profiles)[number] | null = null;
  let bestScore = 0;
  for (const p of profiles) {
    const label = p.full_name || p.email || "";
    const s = Math.max(scoreMatch(name, label), scoreMatch(name, p.email ?? ""));
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 40 ? best : null;
}

export async function resolveFirstOpenTask() {
  const tasks = await fetchTasks();
  return (
    tasks.find((t) => t.status !== "done" && t.status !== "canceled" && t.status !== "archived") ??
    null
  );
}

export async function resolveFirstProject() {
  const projects = await fetchProjects();
  const open = projects.filter((p) => p.status !== "archived" && p.status !== "canceled");
  return open[0] ?? projects[0] ?? null;
}

export async function enrichVoicePlan(plan: VoicePlan, rawText: string, lang = "en"): Promise<VoicePlan> {
  const next = { ...plan };

  if (next.evidence?.includes("complete_first_task")) {
    const task = await resolveFirstOpenTask();
    if (task) {
      next.entityId = task.id;
      next.title = task.title;
      next.taskStatus = "done";
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Завершить «${task.title}»`
          : lang.startsWith("es")
            ? `Completar «${task.title}»`
            : lang.startsWith("de")
              ? `Aufgabe «${task.title}» erledigen`
              : `Complete task ${task.title}`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? "Нет открытых задач."
          : "No open tasks found.";
    }
  }

  if (next.evidence?.includes("open_first_project")) {
    const project = await resolveFirstProject();
    if (project?.slug) {
      next.entityId = project.id;
      next.title = project.name;
      next.route = `/projects/${project.slug}`;
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Открыть проект «${project.name}»`
          : lang.startsWith("es")
            ? `Abrir proyecto «${project.name}»`
            : lang.startsWith("de")
              ? `Projekt «${project.name}» öffnen`
              : `Open project ${project.name}`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk") ? "Нет проектов." : "No projects found.";
    }
  }

  if (next.evidence?.includes("assign_to_focused_person") && next.title) {
    const task = await findTaskByTitle(next.title, next.projectId);
    if (task) {
      next.entityId = task.id;
      next.title = task.title;
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Назначить «${task.title}»`
          : `Assign task ${task.title}`;
      next.confidence = "medium";
      next.executable = false;
    }
  }

  if (next.intent === "create_task" && next.title && !next.projectId) {
    const projectName = extractProjectNameFromUtterance(rawText);
    if (projectName) {
      const project = await findProjectByName(projectName);
      if (project) {
        next.projectId = project.id;
        next.evidence = [...next.evidence, `Project: ${project.name}`];
      }
    }
  }

  if (next.intent === "open_project" && next.title && !next.evidence?.includes("open_first_project")) {
    const project = await findProjectByName(next.title);
    if (project?.slug) {
      next.entityId = project.id;
      next.route = `/projects/${project.slug}`;
      next.summary = `Open project ${project.name}`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question = `Project "${next.title}" not found. Try search?`;
    }
  }

  if (next.intent === "open_person" && next.title) {
    const profile = await findProfileByName(next.title);
    if (profile) {
      const label = profile.full_name || profile.email || next.title;
      next.entityId = profile.id;
      next.title = label;
      next.route = "/people";
      next.summary = `Open ${label} in People`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question = `Person "${next.title}" not found.`;
    }
  }

  if (next.intent === "open_team_person" && next.title) {
    const profile = await findProfileByName(next.title);
    if (profile) {
      const label = profile.full_name || profile.email || next.title;
      next.entityId = profile.id;
      next.title = label;
      next.route = "/team-map";
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Найти «${label}» на карте команды`
          : lang.startsWith("es")
            ? `Buscar «${label}» en el mapa del equipo`
            : lang.startsWith("de")
              ? `«${label}» auf Teamkarte finden`
              : `Find ${label} on team map`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Человек «${next.title}» не найден.`
          : `Person "${next.title}" not found.`;
    }
  }

  if ((next.intent === "open_task" || next.intent === "complete_task" || next.intent === "update_task" || next.intent === "delete_task" || next.intent === "assign_task" || next.intent === "reschedule_task") && next.title) {
    const task = await findTaskByTitle(next.title, next.projectId);
    if (task) {
      next.entityId = task.id;
      const slug = (task.projects as { slug?: string } | null)?.slug;
      if (next.intent === "open_task") {
        next.route = slug ? `/projects/${slug}` : "/tasks";
        next.summary = `Open task ${task.title}`;
      } else if (next.intent === "complete_task") {
        next.summary = `Complete task ${task.title}`;
        next.taskStatus = "done";
      } else if (next.intent === "update_task") {
        next.summary = `Update task ${task.title} → ${next.taskStatus ?? "in_progress"}`;
      } else if (next.intent === "assign_task") {
        next.summary = next.assigneeName
          ? `Assign ${task.title} → ${next.assigneeName}`
          : `Assign task ${task.title}`;
      } else if (next.intent === "reschedule_task") {
        next.summary = next.dueDate
          ? `Reschedule ${task.title} → ${formatDueDateLabel(next.dueDate, lang)}`
          : `Reschedule task ${task.title}`;
      } else {
        next.summary = `Delete task ${task.title}`;
        next.destructive = true;
        next.question = next.question ?? `Say yes to delete "${task.title}"`;
      }
      next.confidence = "high";
      if (next.intent === "assign_task" || next.intent === "reschedule_task") {
        next.executable = false;
      } else {
        next.executable = true;
        next.pendingSlot = undefined;
        if (next.intent !== "delete_task") next.question = undefined;
      }
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question = `Task "${next.title}" not found.`;
    }
  }

  if (next.intent === "assign_task" && next.assigneeName && next.entityId) {
    const profile = await findProfileByName(next.assigneeName);
    if (profile) {
      next.assigneeId = profile.id;
      next.summary = `Assign ${next.title} → ${profile.full_name || profile.email}`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question = `Person "${next.assigneeName}" not found in workspace.`;
    }
  }

  if (next.intent === "reschedule_task" && next.entityId) {
    if (!next.dueDate) {
      const parsed = parseDueDateFromText(rawText);
      if (parsed) {
        next.dueDate = parsed;
        next.summary = `Reschedule ${next.title} → ${formatDueDateLabel(parsed, lang)}`;
        next.executable = true;
        next.confidence = "high";
        next.question = undefined;
        next.pendingSlot = undefined;
      } else {
        next.executable = false;
        next.pendingSlot = "dueDate";
        next.question = lang.startsWith("ru") || lang.startsWith("uk") ? "На какую дату?" : "Move to which date?";
      }
    } else {
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    }
  }

  if (next.intent === "assign_task" && next.entityId && !next.assigneeName) {
    next.executable = false;
    next.pendingSlot = "assigneeName";
    next.question = lang.startsWith("ru") || lang.startsWith("uk") ? "Кому назначить?" : "Assign to whom?";
  }

  if (
    (next.intent === "approve_decision" || next.intent === "reject_decision") &&
    (next.title || !next.entityId)
  ) {
    const { resolvePendingDecision } = await import("@/lib/voice-decision-actions");
    const decision = await resolvePendingDecision(next.title);
    if (!decision) {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? "Нет решений на согласовании."
          : "No pending decisions.";
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk") ? "Approvals пуст" : "Approvals empty";
    } else {
      next.entityId = decision.id;
      next.title = decision.title;
      next.summary =
        next.intent === "approve_decision"
          ? lang.startsWith("ru") || lang.startsWith("uk")
            ? `Одобрить: «${decision.title}»`
            : `Approve: ${decision.title}`
          : lang.startsWith("ru") || lang.startsWith("uk")
            ? `Отклонить: «${decision.title}»`
            : `Reject: ${decision.title}`;
      next.executable = true;
      next.confidence = "high";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? "Скажите «да» для подтверждения."
          : "Say yes to confirm.";
    }
  }

  if (next.intent === "process_inbox") {
    const item = await fetchFirstNewVoiceInboxItem();
    if (!item) {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? "Voice Inbox пуст."
          : "Voice Inbox is empty.";
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk") ? "Нет новых пунктов" : "No new inbox items";
    } else {
      next.inboxItemId = item.id;
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Обработать: «${item.title}» (${item.kind})`
          : `Process: ${item.title} (${item.kind})`;
      next.evidence = [...next.evidence, `Inbox: ${item.kind}`];
      next.executable = true;
      next.confidence = "high";
    }
  }

  if (next.intent === "dismiss_inbox") {
    const item = await fetchFirstNewVoiceInboxItem();
    if (!item) {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk") ? "Voice Inbox пуст." : "Voice Inbox is empty.";
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk") ? "Нет новых пунктов" : "No new inbox items";
    } else {
      next.inboxItemId = item.id;
      next.title = item.title;
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Пропустить: «${item.title}»`
          : `Dismiss: ${item.title}`;
      next.executable = true;
      next.confidence = "high";
    }
  }

  if (next.intent === "show_notifications") {
    const { fetchUnreadNotificationCount } = await import("@/lib/voice-notification-actions");
    const count = await fetchUnreadNotificationCount();
    next.summary =
      lang.startsWith("ru") || lang.startsWith("uk")
        ? count === 0
          ? "Нет непрочитанных уведомлений"
          : `${count} непрочитанных уведомлений`
        : count === 0
          ? "No unread notifications"
          : `${count} unread notification${count === 1 ? "" : "s"}`;
    next.evidence = [...next.evidence, `Unread: ${count}`];
    next.executable = true;
    next.confidence = "high";
  }

  if (next.intent === "send_message") {
    return enrichSendMessagePlan(next, rawText);
  }

  if (next.intent === "reschedule_reminder" && next.reminderTime) {
    const hit = await fetchFirstUpcomingReminder(next.title);
    if (hit) {
      next.entityId = hit.id;
      next.title = hit.title;
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `«${hit.title}» → ${formatReminderTime(next.reminderTime, lang)}`
          : lang.startsWith("es")
            ? `«${hit.title}» → ${formatReminderTime(next.reminderTime, lang)}`
            : lang.startsWith("de")
              ? `«${hit.title}» → ${formatReminderTime(next.reminderTime, lang)}`
              : `Reminder ${hit.title} → ${formatReminderTime(next.reminderTime, lang)}`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? "Нет напоминания для переноса."
          : lang.startsWith("es")
            ? "No hay recordatorio para reprogramar."
            : lang.startsWith("de")
              ? "Keine Erinnerung zum Verschieben."
              : "No reminder to reschedule.";
    }
  }

  if (next.intent === "snooze_reminder" && next.reminderTime) {
    const hit = await fetchFirstUpcomingReminder(next.title);
    if (hit) {
      next.entityId = hit.id;
      next.title = hit.title;
      next.summary =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? `Отложить «${hit.title}» → ${formatReminderTime(next.reminderTime, lang)}`
          : lang.startsWith("es")
            ? `Posponer «${hit.title}» → ${formatReminderTime(next.reminderTime, lang)}`
            : lang.startsWith("de")
              ? `«${hit.title}» verschieben → ${formatReminderTime(next.reminderTime, lang)}`
              : `Snooze ${hit.title} → ${formatReminderTime(next.reminderTime, lang)}`;
      next.executable = true;
      next.confidence = "high";
      next.question = undefined;
      next.pendingSlot = undefined;
    } else {
      next.executable = false;
      next.confidence = "low";
      next.question =
        lang.startsWith("ru") || lang.startsWith("uk")
          ? "Нет напоминания для отложения."
          : lang.startsWith("es")
            ? "No hay recordatorio para posponer."
            : lang.startsWith("de")
              ? "Keine Erinnerung zum Verschieben."
              : "No reminder to snooze.";
    }
  }

  return next;
}
