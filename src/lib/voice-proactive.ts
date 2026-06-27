import { fetchProjects, fetchTasks } from "@/lib/queries";
import { fetchNewVoiceInboxCount } from "@/lib/voice-inbox-actions";
import { fetchWaitingStats } from "@/lib/voice-workspace-stats";

export type AmbientInsight = {
  id: string;
  message: string;
  actionLabel: string;
  /** Voice utterance to run when user taps the chip */
  utterance: string;
  priority: number;
};

function loc(lang: string) {
  const ru = lang.startsWith("ru");
  const uk = lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  return { ru, uk, es, de, lang };
}

/** Highest-priority workspace signal for proactive Sense. */
export async function fetchAmbientVoiceInsight(
  lang = "en",
  options?: { scope?: string; userId?: string },
): Promise<AmbientInsight | null> {
  try {
    const { ru, uk, es, de } = loc(lang);
    const [tasks, inboxNew, waiting] = await Promise.all([
      fetchTasks(),
      fetchNewVoiceInboxCount(),
      fetchWaitingStats(options?.userId),
    ]);
    const now = Date.now();
    const open = tasks.filter((t) => t.status !== "done" && t.status !== "canceled");
    const overdue = open.filter((t) => t.due_date && new Date(t.due_date).getTime() < now);
    const blocked = open.filter((t) => t.status === "blocked");
    const onDashboard = options?.scope === "dashboard";
    const onProjects = options?.scope === "projects";
    const waitingTotal = waiting.forMe + waiting.approvals;

    if (onProjects) {
      const projects = await fetchProjects();
      const risk = projects.filter((p) => p.priority === "critical" || p.priority === "high");
      if (risk.length >= 2) {
        return {
          id: "projects-risk",
          priority: 82,
          message: uk
            ? `${risk.length} проєктів з високим ризиком — переглянути?`
            : ru
              ? `${risk.length} проектов с высоким риском — посмотреть?`
              : es
                ? `${risk.length} proyectos de alto riesgo — ¿revisar?`
                : de
                  ? `${risk.length} Projekte mit hohem Risiko — prüfen?`
                  : `${risk.length} high-risk projects — review?`,
          actionLabel: uk ? "Ризик" : ru ? "Риски" : es ? "Riesgo" : de ? "Risiko" : "Risk",
          utterance: uk
            ? "ризикові проєкти"
            : ru
              ? "рисковые проекты"
              : es
                ? "proyectos de riesgo"
                : de
                  ? "risikoprojekte"
                  : "show risk projects",
        };
      }
    }

    if (onDashboard && waitingTotal >= 2) {
      return {
        id: "waiting-dashboard",
        priority: 88,
        message: uk
          ? `${waitingTotal} пунктів чекають на вас — переглянути?`
          : ru
            ? `${waitingTotal} пункта ждут вас — разобрать?`
            : es
              ? `${waitingTotal} elementos te esperan — ¿revisar?`
              : de
                ? `${waitingTotal} Punkte warten auf dich — prüfen?`
                : `${waitingTotal} items waiting on you — review?`,
        actionLabel: uk ? "Хто чекає" : ru ? "Кто ждёт" : es ? "Quién espera" : de ? "Wer wartet" : "Who waits",
        utterance: uk ? "хто чекає на мене" : ru ? "кто ждёт меня" : es ? "quién espera" : de ? "wer wartet" : "who is waiting on me",
      };
    }

    if (overdue.length >= 3) {
      return {
        id: "overdue-many",
        priority: 90,
        message: uk
          ? `${overdue.length} прострочених задач — розібрати?`
          : ru
            ? `У тебя ${overdue.length} просроченных задач — разобрать?`
            : es
              ? `${overdue.length} tareas vencidas — ¿revisar?`
              : de
                ? `${overdue.length} überfällige Aufgaben — prüfen?`
                : `You have ${overdue.length} overdue tasks — review them?`,
        actionLabel: uk ? "Прострочені" : ru ? "Разобрать" : es ? "Vencidas" : de ? "Überfällig" : "Review",
        utterance: uk ? "покажи прострочені" : ru ? "покажи просроченные" : es ? "tareas vencidas" : de ? "überfällige aufgaben" : "show overdue tasks",
      };
    }

    if (overdue.length >= 1) {
      const title = overdue[0]?.title ?? "";
      return {
        id: "overdue-one",
        priority: 80,
        message: uk
          ? `Прострочено «${title}»${overdue.length > 1 ? ` і ще ${overdue.length - 1}` : ""}`
          : ru
            ? `Просрочена «${title}»${overdue.length > 1 ? ` и ещё ${overdue.length - 1}` : ""}`
            : es
              ? `Vencida: ${title}${overdue.length > 1 ? ` +${overdue.length - 1}` : ""}`
              : de
                ? `Überfällig: ${title}${overdue.length > 1 ? ` +${overdue.length - 1}` : ""}`
                : `Overdue: ${title}${overdue.length > 1 ? ` +${overdue.length - 1} more` : ""}`,
        actionLabel: uk ? "Задачі" : ru ? "Открыть задачи" : es ? "Tareas" : de ? "Aufgaben" : "Open tasks",
        utterance: uk ? `відкрий задачу ${title}` : ru ? `открой задачу ${title}` : es ? `abrir tarea ${title}` : de ? `aufgabe öffnen ${title}` : `open task ${title}`,
      };
    }

    if (waitingTotal >= 1 && onDashboard) {
      return {
        id: "waiting-one",
        priority: 75,
        message: uk
          ? "Хтось чекає на вашу перевірку"
          : ru
            ? "Кто-то ждёт вашей проверки"
            : es
              ? "Alguien espera tu revisión"
              : de
                ? "Jemand wartet auf deine Prüfung"
                : "Someone awaits your review",
        actionLabel: uk ? "Переглянути" : ru ? "Показать" : es ? "Ver" : de ? "Anzeigen" : "Show",
        utterance: uk ? "хто чекає на мене" : ru ? "кто ждёт меня" : es ? "quién espera" : de ? "wer wartet" : "who is waiting on me",
      };
    }

    if (inboxNew >= 3) {
      return {
        id: "inbox-many",
        priority: 70,
        message: uk
          ? `${inboxNew} пунктів у Voice Inbox — обробити?`
          : ru
            ? `${inboxNew} пункта в Voice Inbox — обработать?`
            : es
              ? `${inboxNew} elementos en Voice Inbox — ¿procesar?`
              : de
                ? `${inboxNew} Voice-Inbox-Einträge — verarbeiten?`
                : `${inboxNew} Voice Inbox items — process?`,
        actionLabel: uk ? "Inbox" : ru ? "Обработать" : es ? "Procesar" : de ? "Verarbeiten" : "Process",
        utterance: uk ? "оброби перший inbox" : ru ? "обработай первый пункт inbox" : es ? "procesar primer inbox" : de ? "ersten inbox verarbeiten" : "process first inbox item",
      };
    }

    if (blocked.length >= 2) {
      return {
        id: "blocked-many",
        priority: 65,
        message: uk
          ? `${blocked.length} задач заблоковано — переглянути?`
          : ru
            ? `${blocked.length} задач заблокировано — посмотреть риски?`
            : es
              ? `${blocked.length} tareas bloqueadas — ¿revisar?`
              : de
                ? `${blocked.length} blockierte Aufgaben — prüfen?`
                : `${blocked.length} blocked tasks — check risks?`,
        actionLabel: uk ? "Заблоковані" : ru ? "Риски" : es ? "Bloqueadas" : de ? "Blockiert" : "Blocked",
        utterance: uk ? "покажи заблоковані" : ru ? "покажи заблокированные" : es ? "tareas bloqueadas" : de ? "blockierte aufgaben" : "show blocked tasks",
      };
    }

    if (inboxNew >= 1) {
      return {
        id: "inbox-one",
        priority: 50,
        message: uk
          ? "Новий пункт у Voice Inbox"
          : ru
            ? "Есть новый пункт в Voice Inbox"
            : es
              ? "Nuevo elemento en Voice Inbox"
              : de
                ? "Neuer Voice-Inbox-Eintrag"
                : "New Voice Inbox item waiting",
        actionLabel: "Inbox",
        utterance: uk ? "оброби перший inbox" : ru ? "обработай первый пункт inbox" : es ? "procesar inbox" : de ? "inbox verarbeiten" : "process first inbox item",
      };
    }

    return null;
  } catch {
    return null;
  }
}

const SPOKE_KEY = "1inow:voice:ambient-spoke";

export function markAmbientSpoke(insightId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SPOKE_KEY, insightId);
  } catch {}
}

export function shouldSpeakAmbient(insightId: string) {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SPOKE_KEY) !== insightId;
  } catch {
    return true;
  }
}
