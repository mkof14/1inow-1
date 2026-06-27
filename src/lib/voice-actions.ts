/** Structured voice actions — local parser + Sense ACTION_JSON block. */

export type VoiceIntent =
  | "open_route"
  | "create_task"
  | "create_project"
  | "show_today"
  | "show_risks"
  | "search"
  | "draft_note"
  | "draft_reminder"
  | "create_reminder"
  | "process_inbox"
  | "open_project"
  | "open_task"
  | "complete_task"
  | "update_task"
  | "delete_task"
  | "assign_task"
  | "reschedule_task"
  | "teach_memory"
  | "create_from_advice"
  | "approve_decision"
  | "reject_decision"
  | "mark_notifications_read"
  | "show_notifications"
  | "show_blocked"
  | "show_overdue"
  | "show_waiting"
  | "show_voice_inbox"
  | "open_person"
  | "convert_inbox_note"
  | "send_message"
  | "search_projects"
  | "filter_projects"
  | "show_reminders"
  | "cancel_reminder"
  | "reschedule_reminder"
  | "snooze_reminder"
  | "show_projects_risk"
  | "show_projects_table"
  | "show_projects_grid"
  | "search_files"
  | "open_team_person"
  | "filter_team_map"
  | "show_memories"
  | "show_learning_questions"
  | "dismiss_inbox"
  | "repeat_last_command"
  | "undo_last_action"
  | "unknown";

export type VoicePlan = {
  rawText?: string;
  intent: VoiceIntent;
  label: string;
  summary: string;
  route?: string;
  title?: string;
  description?: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  question?: string;
  quickReplies?: string[];
  advice?: string[];
  executable: boolean;
  senseReply?: string;
  conversational?: boolean;
  /** Stats-only reply — no navigation */
  speakOnly?: boolean;
  /** Resolved workspace entity */
  entityId?: string;
  projectId?: string;
  searchQuery?: string;
  inboxKind?: "note" | "reminder";
  /** Slot being collected (title, projectName, …) */
  pendingSlot?:
    | "title"
    | "projectName"
    | "taskTitle"
    | "assigneeName"
    | "dueDate"
    | "reminderTime"
    | "messageBody";
  /** Target task status for update_task */
  taskStatus?: string;
  /** Resolved assignee */
  assigneeId?: string;
  assigneeName?: string;
  /** ISO due date for reschedule_task / create_task */
  dueDate?: string;
  /** ISO instant for create_reminder / reschedule_reminder */
  reminderTime?: string;
  /** Team map online-status filter */
  teamMapStatus?: string;
  /** Team map timezone substring filter */
  teamMapTimezone?: string;
  /** Voice inbox processing */
  inboxAction?: "auto" | "task" | "project" | "reminder" | "dismiss";
  inboxItemId?: string;
  /** Requires explicit voice confirm — never auto-executes */
  destructive?: boolean;
  /** Memory teach payload */
  memoryType?: "user_preference" | "correction" | "pattern";
  /** Intelligence UI tab for learning loop */
  intelligenceTab?: string;
};

export type SenseActionJson = {
  intent:
    | "create_task"
    | "create_project"
    | "open_project"
    | "open_task"
    | "complete_task"
    | "update_task"
    | "delete_task"
    | "assign_task"
    | "reschedule_task"
    | "create_reminder"
    | "process_inbox"
    | "search"
    | "save_inbox"
    | "navigate"
    | "teach_memory"
    | "remember"
    | "show_memories"
    | "none";
  title?: string;
  projectName?: string;
  taskTitle?: string;
  route?: string;
  /** Intelligence tab: memory | questions | reminders */
  tab?: string;
  searchQuery?: string;
  inboxKind?: "note" | "reminder";
  confirmRequired?: boolean;
  /** Target status for update_task */
  status?: string;
  assigneeName?: string;
  dueDate?: string;
  reminderTime?: string;
  inboxAction?: "auto" | "task" | "project" | "dismiss";
};

const ACTION_JSON_RE = /ACTION_JSON:\s*(\{[\s\S]*?\})\s*$/m;

export function parseSenseActionBlock(text: string): SenseActionJson | null {
  const match = text.match(ACTION_JSON_RE);
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1]) as SenseActionJson;
    if (!parsed?.intent || parsed.intent === "none") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function stripSenseActionBlock(text: string) {
  return text.replace(ACTION_JSON_RE, "").trim();
}

export function voicePlanFromSenseAction(
  action: SenseActionJson,
  raw: string,
  lang: string,
): VoicePlan {
  const ru = lang.startsWith("ru") || lang.startsWith("uk");

  if (action.intent === "navigate" && action.route) {
    const tab = action.tab;
    if (action.route.includes("intelligence") && tab) {
      return {
        rawText: raw,
        intent: tab === "questions" ? "show_learning_questions" : "show_memories",
        label: ru ? "Intelligence" : "Intelligence",
        summary: ru ? `Intelligence · ${tab}` : `Intelligence · ${tab}`,
        route: "/intelligence",
        intelligenceTab: tab,
        confidence: "high",
        evidence: ["Sense ACTION_JSON"],
        executable: true,
      };
    }
    return {
      rawText: raw,
      intent: "open_route",
      label: action.route,
      summary: ru ? `Перейти: ${action.route}` : `Navigate to ${action.route}`,
      route: action.route,
      confidence: "high",
      evidence: ["Sense ACTION_JSON"],
      executable: true,
    };
  }

  if (action.intent === "teach_memory" || action.intent === "remember") {
    const value = action.title ?? raw;
    return {
      rawText: raw,
      intent: "teach_memory",
      label: ru ? "Запомнить" : "Remember",
      summary: ru ? `Запомню: ${value.slice(0, 100)}` : `Remember: ${value.slice(0, 100)}`,
      title: value.slice(0, 48),
      description: value,
      memoryType: "user_preference",
      confidence: "high",
      evidence: ["Sense ACTION_JSON", "teach_memory"],
      executable: true,
    };
  }

  if (action.intent === "show_memories") {
    return {
      rawText: raw,
      intent: "show_memories",
      label: ru ? "Память" : "Memory",
      summary: ru ? "Показать память Sense" : "Show Sense memory",
      route: "/intelligence",
      intelligenceTab: action.tab ?? "memory",
      confidence: "high",
      evidence: ["Sense ACTION_JSON"],
      executable: true,
      speakOnly: false,
    };
  }

  if (action.intent === "search") {
    return {
      rawText: raw,
      intent: "search",
      label: ru ? "Поиск" : "Search",
      summary: action.searchQuery
        ? ru
          ? `Найти «${action.searchQuery}»`
          : `Search for "${action.searchQuery}"`
        : ru
          ? "Открыть поиск"
          : "Open search",
      searchQuery: action.searchQuery,
      confidence: action.searchQuery ? "high" : "medium",
      evidence: ["Sense ACTION_JSON"],
      executable: true,
    };
  }

  if (action.intent === "save_inbox") {
    const kind = action.inboxKind === "reminder" ? "draft_reminder" : "draft_note";
    return {
      rawText: raw,
      intent: kind,
      label: kind === "draft_reminder" ? "Reminder" : "Note",
      summary: ru ? "Сохранить в Voice Inbox" : "Save to Voice Inbox",
      title: action.title ?? raw,
      inboxKind: action.inboxKind ?? "note",
      confidence: "high",
      evidence: ["Sense ACTION_JSON"],
      executable: true,
    };
  }

  if (action.intent === "create_task") {
    const title = action.title ?? action.taskTitle;
    return {
      rawText: raw,
      intent: "create_task",
      label: ru ? "Создать задачу" : "Create task",
      summary: title
        ? ru
          ? `Создать задачу «${title}»`
          : `Create task "${title}"`
        : ru
          ? "Создать задачу"
          : "Create task",
      title,
      description: action.projectName ? `Project: ${action.projectName}` : undefined,
      pendingSlot: title ? undefined : "title",
      question: title ? undefined : ru ? "Как назвать задачу?" : "What should the task be called?",
      confidence: title ? "high" : "low",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(title) && !action.confirmRequired,
    };
  }

  if (action.intent === "create_project") {
    const title = action.title;
    return {
      rawText: raw,
      intent: "create_project",
      label: ru ? "Создать проект" : "Create project",
      summary: title
        ? ru
          ? `Создать проект «${title}»`
          : `Create project "${title}"`
        : ru
          ? "Создать проект"
          : "Create project",
      title,
      pendingSlot: title ? undefined : "title",
      question: title ? undefined : ru ? "Как назвать проект?" : "Project name?",
      confidence: title ? "high" : "low",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(title) && !action.confirmRequired,
    };
  }

  if (action.intent === "open_project") {
    return {
      rawText: raw,
      intent: "open_project",
      label: ru ? "Открыть проект" : "Open project",
      summary: action.projectName ?? action.title ?? raw,
      title: action.projectName ?? action.title,
      confidence: action.projectName || action.title ? "high" : "low",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(action.projectName || action.title),
      question:
        action.projectName || action.title
          ? undefined
          : ru
            ? "Какой проект открыть?"
            : "Which project?",
      pendingSlot: action.projectName || action.title ? undefined : "title",
    };
  }

  if (action.intent === "open_task" || action.intent === "complete_task") {
    const taskTitle = action.taskTitle ?? action.title;
    const intent = action.intent === "complete_task" ? "complete_task" : "open_task";
    return {
      rawText: raw,
      intent,
      label: intent === "complete_task" ? (ru ? "Завершить задачу" : "Complete task") : ru ? "Открыть задачу" : "Open task",
      summary: taskTitle ?? raw,
      title: taskTitle,
      taskStatus: intent === "complete_task" ? "done" : undefined,
      confidence: taskTitle ? "high" : "low",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(taskTitle),
      pendingSlot: taskTitle ? undefined : "taskTitle",
      question: taskTitle ? undefined : ru ? "Какую задачу?" : "Which task?",
    };
  }

  if (action.intent === "update_task") {
    const taskTitle = action.taskTitle ?? action.title;
    return {
      rawText: raw,
      intent: "update_task",
      label: ru ? "Обновить задачу" : "Update task",
      summary: taskTitle ?? raw,
      title: taskTitle,
      taskStatus: action.status ?? "in_progress",
      confidence: taskTitle ? "high" : "low",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(taskTitle),
      pendingSlot: taskTitle ? undefined : "taskTitle",
    };
  }

  if (action.intent === "delete_task") {
    const taskTitle = action.taskTitle ?? action.title;
    return {
      rawText: raw,
      intent: "delete_task",
      label: ru ? "Удалить задачу" : "Delete task",
      summary: taskTitle ? (ru ? `Удалить «${taskTitle}»` : `Delete "${taskTitle}"`) : raw,
      title: taskTitle,
      confidence: taskTitle ? "high" : "low",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(taskTitle),
      destructive: true,
      pendingSlot: taskTitle ? undefined : "taskTitle",
      question: taskTitle ? (ru ? "Скажите «да» для подтверждения" : "Say yes to confirm") : undefined,
    };
  }

  if (action.intent === "assign_task") {
    const taskTitle = action.taskTitle ?? action.title;
    const assigneeName = action.assigneeName;
    return {
      rawText: raw,
      intent: "assign_task",
      label: ru ? "Назначить задачу" : "Assign task",
      summary: taskTitle && assigneeName ? `${taskTitle} → ${assigneeName}` : taskTitle ?? raw,
      title: taskTitle,
      assigneeName,
      confidence: taskTitle && assigneeName ? "high" : "medium",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(taskTitle && assigneeName),
      pendingSlot: !taskTitle ? "taskTitle" : !assigneeName ? "assigneeName" : undefined,
      question: !taskTitle
        ? ru
          ? "Какую задачу?"
          : "Which task?"
        : !assigneeName
          ? ru
            ? "Кому назначить?"
            : "Assign to whom?"
          : undefined,
    };
  }

  if (action.intent === "reschedule_task") {
    const taskTitle = action.taskTitle ?? action.title;
    const dueDate = action.dueDate;
    return {
      rawText: raw,
      intent: "reschedule_task",
      label: ru ? "Перенести дедлайн" : "Reschedule task",
      summary: taskTitle ?? raw,
      title: taskTitle,
      dueDate,
      confidence: taskTitle && dueDate ? "high" : "medium",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(taskTitle && dueDate),
      pendingSlot: !taskTitle ? "taskTitle" : !dueDate ? "dueDate" : undefined,
      question: !taskTitle
        ? ru
          ? "Какую задачу?"
          : "Which task?"
        : !dueDate
          ? ru
            ? "На какую дату?"
            : "Move to which date?"
          : undefined,
    };
  }

  if (action.intent === "create_reminder") {
    const title = action.title ?? raw;
    const reminderTime = action.reminderTime;
    return {
      rawText: raw,
      intent: "create_reminder",
      label: ru ? "Напоминание" : "Reminder",
      summary: title,
      title,
      reminderTime,
      confidence: title && reminderTime ? "high" : "medium",
      evidence: ["Sense ACTION_JSON"],
      executable: Boolean(title && reminderTime),
      pendingSlot: !title ? "title" : !reminderTime ? "reminderTime" : undefined,
      question: !reminderTime ? (ru ? "Когда напомнить?" : "When should I remind you?") : undefined,
    };
  }

  if (action.intent === "process_inbox") {
    return {
      rawText: raw,
      intent: "process_inbox",
      label: ru ? "Обработать Inbox" : "Process inbox",
      summary: ru ? "Обработать первый пункт Voice Inbox" : "Process first Voice Inbox item",
      inboxAction: action.inboxAction ?? "auto",
      confidence: "high",
      evidence: ["Sense ACTION_JSON"],
      executable: true,
    };
  }

  return {
    rawText: raw,
    intent: "unknown",
    label: "Sense",
    summary: raw,
    confidence: "low",
    evidence: ["Sense ACTION_JSON unrecognized"],
    executable: false,
  };
}
