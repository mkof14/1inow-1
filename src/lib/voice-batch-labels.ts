import type { VoicePlan } from "@/lib/voice-actions";

/** Short human label for one batch step (undo + toast). */
export function batchStepUndoLabel(plan: VoicePlan, lang = "en"): string {
  const ru = lang.startsWith("ru");
  const uk = lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");

  const title = plan.title?.slice(0, 40);
  switch (plan.intent) {
    case "create_reminder":
      return title
        ? ru
          ? `Напоминание «${title}»`
          : uk
            ? `Нагадування «${title}»`
            : es
              ? `Recordatorio «${title}»`
              : de
                ? `Erinnerung «${title}»`
                : `Reminder «${title}»`
        : ru
          ? "Напоминание"
          : uk
            ? "Нагадування"
            : es
              ? "Recordatorio"
              : de
                ? "Erinnerung"
                : "Reminder";
    case "snooze_reminder":
    case "reschedule_reminder":
      return ru ? "Перенос напоминания" : uk ? "Перенесення нагадування" : es ? "Reprogramar recordatorio" : de ? "Erinnerung verschieben" : "Reschedule reminder";
    case "open_route":
    case "open_project":
    case "open_task":
    case "open_person":
    case "open_team_person":
      return plan.route ?? plan.summary.slice(0, 48);
    case "show_projects_risk":
      return ru ? "Рисковые проекты" : uk ? "Ризикові проєкти" : es ? "Proyectos de riesgo" : de ? "Risikoprojekte" : "Risk projects";
    case "show_projects_table":
      return ru ? "Таблица проектов" : uk ? "Таблиця проєктів" : es ? "Tabla de proyectos" : de ? "Projekttabelle" : "Projects table";
    case "show_projects_grid":
      return ru ? "Сетка проектов" : uk ? "Сітка проєктів" : es ? "Cuadrícula de proyectos" : de ? "Projektraster" : "Projects grid";
    case "filter_team_map":
      return plan.summary.slice(0, 48);
    case "create_task":
      return title
        ? ru
          ? `Задача «${title}»`
          : uk
            ? `Задача «${title}»`
            : es
              ? `Tarea «${title}»`
              : de
                ? `Aufgabe «${title}»`
                : `Task «${title}»`
        : plan.summary.slice(0, 48);
    default:
      return plan.label || plan.summary.slice(0, 48);
  }
}

export function buildBatchUndoLabel(steps: string[], lang = "en"): string {
  const ru = lang.startsWith("ru");
  const uk = lang.startsWith("uk");
  const es = lang.startsWith("es");
  const de = lang.startsWith("de");
  const unique = steps.filter(Boolean);
  if (unique.length === 0) {
    return ru || uk ? "Пакет команд" : es ? "Lote de comandos" : de ? "Befehlsstapel" : "Command batch";
  }
  if (unique.length === 1) return unique[0]!;
  const joined = unique.slice(0, 3).join(" · ");
  const suffix = unique.length > 3 ? " …" : "";
  return ru || uk ? `Пакет: ${joined}${suffix}` : es ? `Lote: ${joined}${suffix}` : de ? `Stapel: ${joined}${suffix}` : `Batch: ${joined}${suffix}`;
}
