import type { VoicePlan } from "@/lib/voice-actions";
import { formatDueDateLabel, parseDueDateFromText } from "@/lib/voice-due-date";
import { formatReminderTime, parseReminderDateTime } from "@/lib/voice-reminder-time";

/** Fill a missing slot from the user's follow-up utterance. */
export function fillVoicePlanSlot(plan: VoicePlan, answer: string, lang = "en"): VoicePlan {
  const value = answer.trim();
  if (!value || !plan.pendingSlot) return plan;

  if (plan.pendingSlot === "title") {
    if (plan.intent === "create_task") {
      return {
        ...plan,
        title: value,
        executable: true,
        confidence: "high",
        question: undefined,
        pendingSlot: undefined,
        summary: `Create task "${value}"`,
      };
    }
    if (plan.intent === "create_project") {
      return {
        ...plan,
        title: value,
        executable: true,
        confidence: "high",
        question: undefined,
        pendingSlot: undefined,
        summary: `Create project "${value}"`,
      };
    }
    if (plan.intent === "open_project") {
      return {
        ...plan,
        title: value,
        executable: false,
        confidence: "medium",
        question: undefined,
        pendingSlot: undefined,
        summary: `Open project ${value}`,
      };
    }
    if (plan.intent === "create_reminder") {
      return {
        ...plan,
        title: value,
        executable: Boolean(plan.reminderTime),
        confidence: plan.reminderTime ? "high" : "medium",
        question: plan.reminderTime ? undefined : ruQuestion(lang, "Когда напомнить?", "When should I remind you?"),
        pendingSlot: plan.reminderTime ? undefined : "reminderTime",
        summary: plan.reminderTime
          ? `Reminder: ${value} · ${formatReminderTime(plan.reminderTime, lang)}`
          : value,
      };
    }
  }

  if (plan.pendingSlot === "taskTitle") {
    const base = {
      ...plan,
      title: value,
      executable: false,
      confidence: "medium" as const,
      question: undefined,
      summary: taskSummaryForIntent(plan.intent, value),
    };
    if (plan.intent === "assign_task") {
      return {
        ...base,
        pendingSlot: "assigneeName",
        question: ruQuestion(lang, "Кому назначить?", "Assign to whom?"),
      };
    }
    return { ...base, pendingSlot: undefined };
  }

  if (plan.pendingSlot === "messageBody") {
    return {
      ...plan,
      description: value,
      executable: Boolean(plan.entityId),
      confidence: plan.entityId ? "high" : "medium",
      question: undefined,
      pendingSlot: undefined,
      summary: plan.title
        ? `Send to ${plan.title}: ${value}`
        : `Send message: ${value}`,
    };
  }

  if (plan.pendingSlot === "assigneeName") {
    return {
      ...plan,
      assigneeName: value,
      executable: false,
      confidence: "medium",
      question: undefined,
      pendingSlot: undefined,
      summary: plan.title ? `Assign ${plan.title} → ${value}` : `Assign to ${value}`,
    };
  }

  if (plan.pendingSlot === "dueDate") {
    const parsed = parseDueDateFromText(value) ?? parseDueDateFromText(`${plan.title ?? ""} ${value}`);
    if (!parsed) {
      return {
        ...plan,
        question:
          lang.startsWith("ru") || lang.startsWith("uk")
            ? "Не понял дату. Скажите «завтра», «в пятницу» или 2026-06-30."
            : "Date not understood. Try tomorrow, Friday, or 2026-06-30.",
      };
    }
    return {
      ...plan,
      dueDate: parsed,
      executable: plan.intent === "create_task" ? Boolean(plan.title) : false,
      confidence: "medium",
      question: undefined,
      pendingSlot: undefined,
      summary:
        plan.intent === "create_task" && plan.title
          ? `Create task "${plan.title}" · due ${formatDueDateLabel(parsed, lang)}`
          : plan.title
            ? `Reschedule ${plan.title} → ${formatDueDateLabel(parsed, lang)}`
            : `Due ${formatDueDateLabel(parsed, lang)}`,
    };
  }

  if (plan.pendingSlot === "reminderTime") {
    const parsed =
      parseReminderDateTime(value) ??
      parseReminderDateTime(`${plan.title ?? ""} ${value}`) ??
      parseReminderDateTime(`remind me ${value}`);
    if (!parsed) {
      return {
        ...plan,
        question: ruQuestion(
          lang,
          "Не понял время. Скажите «в 15:00», «завтра в 10».",
          "Time not understood. Try at 3pm or tomorrow at 10.",
        ),
      };
    }
    return {
      ...plan,
      reminderTime: parsed,
      executable: Boolean(plan.title),
      confidence: plan.title ? "high" : "medium",
      question: undefined,
      pendingSlot: undefined,
      summary: plan.title
        ? `Reminder: ${plan.title} · ${formatReminderTime(parsed, lang)}`
        : formatReminderTime(parsed, lang),
    };
  }

  return plan;
}

function ruQuestion(lang: string, ru: string, en: string) {
  return lang.startsWith("ru") || lang.startsWith("uk") ? ru : en;
}

function taskSummaryForIntent(intent: VoicePlan["intent"], value: string) {
  if (intent === "complete_task") return `Complete task ${value}`;
  if (intent === "delete_task") return `Delete task ${value}`;
  if (intent === "update_task") return `Update task ${value}`;
  if (intent === "assign_task") return `Assign task ${value}`;
  if (intent === "reschedule_task") return `Reschedule task ${value}`;
  return `Open task ${value}`;
}

/** After enrich — ask for the next missing slot in multi-step flows. */
export function finalizeVoicePlanSlots(plan: VoicePlan, lang = "en"): VoicePlan {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");
  const next = { ...plan };

  if (next.intent === "assign_task") {
    if (!next.title) {
      return {
        ...next,
        pendingSlot: "taskTitle",
        question: ru ? "Какую задачу назначить?" : "Which task?",
        executable: false,
      };
    }
    if (next.entityId && !next.assigneeId && !next.assigneeName) {
      return {
        ...next,
        pendingSlot: "assigneeName",
        question: ru ? "Кому назначить?" : "Assign to whom?",
        executable: false,
      };
    }
  }

  if (next.intent === "reschedule_task") {
    if (!next.title) {
      return {
        ...next,
        pendingSlot: "taskTitle",
        question: ru ? "Какую задачу перенести?" : "Which task?",
        executable: false,
      };
    }
    if (next.entityId && !next.dueDate) {
      return {
        ...next,
        pendingSlot: "dueDate",
        question: ru ? "На какую дату?" : "Move to which date?",
        executable: false,
      };
    }
  }

  if (next.intent === "create_task" && next.title && !next.dueDate && /\b(deadline|due|дедлайн|срок|до)\b/i.test(next.rawText ?? "")) {
    return {
      ...next,
      pendingSlot: "dueDate",
      question: ru ? "Какой дедлайн?" : "What is the due date?",
      executable: false,
      confidence: "medium",
    };
  }

  if (next.intent === "create_reminder") {
    if (!next.title) {
      return {
        ...next,
        pendingSlot: "title",
        question: ru ? "О чём напомнить?" : "What should I remind you about?",
        executable: false,
      };
    }
    if (!next.reminderTime) {
      return {
        ...next,
        pendingSlot: "reminderTime",
        question: ru ? "Когда напомнить?" : "When should I remind you?",
        executable: false,
      };
    }
    return {
      ...next,
      executable: true,
      confidence: "high",
      pendingSlot: undefined,
      question: undefined,
    };
  }

  if (next.intent === "reschedule_reminder") {
    if (!next.reminderTime) {
      return {
        ...next,
        pendingSlot: "reminderTime",
        question: ru ? "На когда перенести?" : "Reschedule to when?",
        executable: false,
      };
    }
  }

  if (next.intent === "snooze_reminder") {
    if (!next.reminderTime) {
      return {
        ...next,
        pendingSlot: "reminderTime",
        question: ru
          ? "На сколько отложить?"
          : lang.startsWith("uk")
            ? "На скільки відкласти?"
            : lang.startsWith("es")
              ? "¿Por cuánto posponer?"
              : lang.startsWith("de")
                ? "Wie lange verschieben?"
                : "Snooze for how long?",
        executable: false,
      };
    }
  }

  if (next.intent === "send_message" && next.entityId && !next.description) {
    return {
      ...next,
      pendingSlot: "messageBody",
      question: ru ? "Что отправить?" : "What should I send?",
      executable: false,
    };
  }

  return next;
}

export function planAwaitingSlot(plan: VoicePlan | null | undefined) {
  return Boolean(plan?.pendingSlot);
}
