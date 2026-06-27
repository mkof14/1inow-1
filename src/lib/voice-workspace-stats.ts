import { buildWaitingFor } from "@/lib/brain";
import { fetchDecisions, fetchTasks } from "@/lib/queries";

export type WorkspaceTaskStats = {
  open: number;
  overdue: number;
  blocked: number;
  overdueTitles: string[];
  blockedTitles: string[];
};

export async function fetchWorkspaceTaskStats(): Promise<WorkspaceTaskStats> {
  const tasks = await fetchTasks();
  const now = Date.now();
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "canceled");
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date).getTime() < now);
  const blocked = open.filter((t) => t.status === "blocked");
  return {
    open: open.length,
    overdue: overdue.length,
    blocked: blocked.length,
    overdueTitles: overdue.slice(0, 3).map((t) => t.title),
    blockedTitles: blocked.slice(0, 3).map((t) => t.title),
  };
}

export function workspaceStatMessage(
  kind: "overdue" | "blocked" | "open",
  stats: WorkspaceTaskStats,
  lang = "en",
) {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (kind === "overdue") {
    if (stats.overdue === 0) {
      return ru ? "Просроченных задач нет." : es ? "No hay tareas vencidas." : de ? "Keine überfälligen Aufgaben." : "No overdue tasks.";
    }
    const sample = stats.overdueTitles[0];
    return ru
      ? `Просрочено задач: ${stats.overdue}${sample ? `. Например: «${sample}»` : ""}.`
      : es
        ? `${stats.overdue} tarea${stats.overdue === 1 ? "" : "s"} vencida${stats.overdue === 1 ? "" : "s"}${sample ? `. Por ejemplo: «${sample}»` : ""}.`
        : de
          ? `${stats.overdue} überfällige Aufgabe${stats.overdue === 1 ? "" : "n"}${sample ? `. Z. B.: «${sample}»` : ""}.`
          : `${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"}${sample ? `. For example: ${sample}` : ""}.`;
  }
  if (kind === "blocked") {
    if (stats.blocked === 0) {
      return ru ? "Заблокированных задач нет." : es ? "No hay tareas bloqueadas." : de ? "Keine blockierten Aufgaben." : "No blocked tasks.";
    }
    const sample = stats.blockedTitles[0];
    return ru
      ? `Заблокировано: ${stats.blocked}${sample ? `. «${sample}»` : ""}.`
      : es
        ? `${stats.blocked} tarea${stats.blocked === 1 ? "" : "s"} bloqueada${stats.blocked === 1 ? "" : "s"}${sample ? `. «${sample}»` : ""}.`
        : de
          ? `${stats.blocked} blockierte Aufgabe${stats.blocked === 1 ? "" : "n"}${sample ? `. «${sample}»` : ""}.`
          : `${stats.blocked} blocked task${stats.blocked === 1 ? "" : "s"}${sample ? `. ${sample}` : ""}.`;
  }
  return ru
    ? `Открытых задач: ${stats.open}.`
    : es
      ? `${stats.open} tareas abiertas.`
      : de
        ? `${stats.open} offene Aufgaben.`
        : `${stats.open} open tasks.`;
}

export function isOverdueTasksPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|list|view|покажи|открой|список)\s+(?:the\s+)?(?:overdue|просроч)/.test(lower) ||
    /^(?:what(?:'s| is) overdue|what overdue|просроченные задачи|просрочки)$/.test(lower) ||
    /^(?:overdue tasks|tareas vencidas|überfällige aufgaben)$/.test(lower)
  );
}

export function isBlockedTasksPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|list|view|покажи|открой)\s+(?:the\s+)?(?:blocked|заблок)/.test(lower) ||
    /^(?:what(?:'s| is) blocked|что заблокировано|заблокированные задачи)$/.test(lower) ||
    /^(?:blocked tasks|tareas bloqueadas|blockierte aufgaben)$/.test(lower)
  );
}

export function isWorkspaceCountQuestion(raw: string): "overdue" | "blocked" | "open" | null {
  const lower = raw.toLowerCase().trim();
  if (/^(?:how many overdue|сколько просроч|скільки простроч|cuántas.*vencid|wie viele überfällig)/.test(lower)) {
    return "overdue";
  }
  if (/^(?:how many blocked|сколько заблок|скільки заблок|cuántas.*bloque|wie viele blockiert)/.test(lower)) {
    return "blocked";
  }
  if (/^(?:how many tasks|сколько задач|скільки задач|cuántas tareas|wie viele aufgaben)/.test(lower)) {
    return "open";
  }
  return null;
}

export function isOpenPersonPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return /^(?:open|show|find|go to|открой|покажи|найди|відкрий)\s+(?:the\s+)?(?:person|people|user|contact|контакт|человек|коллег[ау]|люд(?:и|ину)|persona|kontakt|mitarbeiter)\s+(.+)/.test(
    lower,
  );
}

export function extractOpenPersonName(raw: string) {
  const m = raw
    .trim()
    .match(
      /^(?:open|show|find|go to|открой|покажи|найди|відкрий)\s+(?:the\s+)?(?:person|people|user|contact|контакт|человек|коллег[ау]|люд(?:и|ину)|persona|kontakt|mitarbeiter)\s+(.+)$/i,
    );
  return m?.[1]?.trim() ?? "";
}

export type WaitingStats = {
  forMe: number;
  forOthers: number;
  approvals: number;
  forMeTitles: string[];
  approvalTitles: string[];
};

export async function fetchWaitingStats(userId?: string): Promise<WaitingStats> {
  const [tasks, decisions] = await Promise.all([fetchTasks(), fetchDecisions()]);
  const buckets = buildWaitingFor({ userId, tasks, decisions });
  const forMe = buckets[0]?.items ?? [];
  const forOthers = buckets[1]?.items ?? [];
  const approvals = buckets[2]?.items ?? [];
  return {
    forMe: forMe.length,
    forOthers: forOthers.length,
    approvals: approvals.length,
    forMeTitles: forMe.slice(0, 3).map((i) => i.title),
    approvalTitles: approvals.slice(0, 3).map((i) => i.title),
  };
}

export function waitingStatMessage(stats: WaitingStats, lang = "en", focus: "me" | "all" = "me") {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  if (focus === "me") {
    const total = stats.forMe + stats.approvals;
    if (total === 0) {
      return ru
        ? "Никто не ждёт вас — всё чисто."
        : es
          ? "Nadie te espera."
          : de
            ? "Niemand wartet auf dich."
            : "Nothing waiting on you.";
    }
    const parts: string[] = [];
    if (stats.forMe > 0) {
      const sample = stats.forMeTitles[0];
      parts.push(
        ru
          ? `${stats.forMe} на вашей проверке${sample ? ` («${sample}»)` : ""}`
          : es
            ? `${stats.forMe} en tu revisión${sample ? ` («${sample}»)` : ""}`
            : de
              ? `${stats.forMe} warten auf deine Prüfung${sample ? ` («${sample}»)` : ""}`
              : `${stats.forMe} awaiting your review${sample ? ` (${sample})` : ""}`,
      );
    }
    if (stats.approvals > 0) {
      const sample = stats.approvalTitles[0];
      parts.push(
        ru
          ? `${stats.approvals} согласовани${stats.approvals === 1 ? "е" : "й"}${sample ? ` («${sample}»)` : ""}`
          : es
            ? `${stats.approvals} aprobación${stats.approvals === 1 ? "" : "es"}${sample ? ` («${sample}»)` : ""}`
            : de
              ? `${stats.approvals} Freigabe${stats.approvals === 1 ? "" : "n"}${sample ? ` («${sample}»)` : ""}`
              : `${stats.approvals} approval${stats.approvals === 1 ? "" : "s"}${sample ? ` (${sample})` : ""}`,
      );
    }
    return ru
      ? `Ждут вас: ${parts.join("; ")}.`
      : es
        ? `Te esperan: ${parts.join("; ")}.`
        : de
          ? `Wartet auf dich: ${parts.join("; ")}.`
          : `Waiting on you: ${parts.join("; ")}.`;
  }
  const total = stats.forMe + stats.forOthers + stats.approvals;
  if (total === 0) {
    return ru ? "Ожиданий нет." : es ? "Sin esperas." : de ? "Keine Wartezeiten." : "No waiting items.";
  }
  return ru
    ? `Ожидания: ${stats.forMe} у вас, ${stats.forOthers} у других, ${stats.approvals} согласований.`
    : es
      ? `Esperas: ${stats.forMe} para ti, ${stats.forOthers} de otros, ${stats.approvals} aprobaciones.`
      : de
        ? `Warten: ${stats.forMe} auf dich, ${stats.forOthers} auf andere, ${stats.approvals} Freigaben.`
        : `Waiting: ${stats.forMe} for you, ${stats.forOthers} for others, ${stats.approvals} approvals.`;
}

export function isWaitingPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:who(?:'s| is) waiting|what(?:'s| is) waiting|show waiting|waiting on me|кто жд[ёе]т|что жд[ёе]т|покажи ожидан|хто чека)/.test(
      lower,
    ) ||
    /^(?:waiting for me|ждут меня|чекають на мене|quién espera|quien espera|wer wartet)/.test(lower)
  );
}

export function isWaitingCountQuestion(raw: string) {
  const lower = raw.toLowerCase().trim();
  return /^(?:how many waiting|сколько жд[ёе]т|скільки чека|cuántos esperan|wie viele warten)/.test(
    lower,
  );
}
