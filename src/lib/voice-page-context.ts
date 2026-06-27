import type { PageContext } from "@/lib/ai-context";
import type { VoicePlan } from "@/lib/voice-actions";
import {
  extractFocusTeamMemberName,
  isFocusTeamMemberPhrase,
} from "@/lib/voice-team-actions";

/** Bind create/open actions to the current page (project, dashboard, etc.). */
export function applyPageContextToPlan(plan: VoicePlan, ctx: PageContext, lang = "en"): VoicePlan {
  const next = { ...plan };
  const projectId = ctx.ids?.projectId;
  const ru = lang.startsWith("ru") || lang.startsWith("uk");

  if (projectId && next.intent === "create_task" && !next.projectId) {
    next.projectId = projectId;
    const label = ctx.title ?? "project";
    next.evidence = [...(next.evidence ?? []), `Page context: ${label}`];
    if (ctx.scope === "project") {
      next.summary = ru
        ? `${next.summary.replace(/\.$/, "")} · проект «${label}».`
        : `${next.summary.replace(/\.$/, "")} · project ${label}.`;
      if (next.confidence === "high" || next.title) {
        next.confidence = "high";
      }
    }
  }

  if (ctx.scope === "project" && next.intent === "open_project" && ctx.ids?.slug) {
    next.route = `/projects/${ctx.ids.slug}`;
    next.entityId = projectId;
    next.executable = true;
    next.confidence = "high";
    next.summary = ru ? `Открыть текущий проект «${ctx.title ?? ""}»` : `Open current project ${ctx.title ?? ""}`;
  }

  if (ctx.scope === "dashboard") {
    next.evidence = [...(next.evidence ?? []), "Page context: dashboard"];
    if (next.intent === "show_today" || (next.intent === "open_route" && next.route === "/dashboard")) {
      next.route = "/dashboard";
      next.executable = true;
      next.confidence = "high";
      next.summary = ru
        ? "Фокус дня на главной — внимание, задачи и следующие шаги."
        : lang.startsWith("es")
          ? "Enfoque del día en el panel — atención, tareas y siguientes pasos."
          : lang.startsWith("de")
            ? "Tagesfokus auf dem Dashboard — Aufmerksamkeit, Aufgaben und nächste Schritte."
            : "Today focus on dashboard — attention, tasks, and next steps.";
    }
    if (next.intent === "search" && !next.searchQuery) {
      next.summary = ru
        ? "Поиск по рабочему пространству с главной."
        : "Search workspace from dashboard.";
    }
  }

  if (ctx.scope === "tasks") {
    next.evidence = [...(next.evidence ?? []), "Page context: tasks"];
    if (next.intent === "create_task" && next.title) {
      next.confidence = "high";
      next.summary = ru
        ? `${next.summary.replace(/\.$/, "")} · доска задач.`
        : `${next.summary.replace(/\.$/, "")} · tasks board.`;
    }
    if (next.intent === "open_route" && next.route === "/tasks") {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru ? "Уже на доске задач." : "Already on tasks board.";
    }
  }

  if (ctx.scope === "approvals") {
    next.evidence = [...(next.evidence ?? []), "Page context: approvals"];
    if (next.intent === "approve_decision" || next.intent === "reject_decision") {
      if (next.confidence !== "low") {
        next.confidence = "high";
        next.summary = ru
          ? `${next.summary.replace(/\.$/, "")} · согласования.`
          : `${next.summary.replace(/\.$/, "")} · approvals.`;
      }
    }
    if (next.intent === "open_route" && next.route === "/approvals") {
      next.executable = true;
      next.confidence = "high";
    }
  }

  if (ctx.scope === "people") {
    next.evidence = [...(next.evidence ?? []), "Page context: people"];
    const personId = ctx.ids?.personId;
    const personLabel = ctx.title && ctx.title !== "People" ? ctx.title : undefined;
    if (next.intent === "open_person" && next.title) {
      next.confidence = "high";
    }
    if (next.intent === "open_route" && next.route === "/people") {
      next.executable = true;
      next.confidence = "high";
    }
    if (next.intent === "assign_task") {
      if (personId && !next.assigneeId) {
        next.assigneeId = personId;
        if (!next.assigneeName && personLabel) next.assigneeName = personLabel;
      }
      if (next.assigneeName || personLabel) {
        next.summary = ru
          ? `Назначить задачу → ${next.assigneeName ?? personLabel ?? ""} (люди)`
          : `Assign task → ${next.assigneeName ?? personLabel ?? "person"} (people)`;
        if (next.entityId && next.assigneeId) {
          next.executable = true;
          next.confidence = "high";
        }
      }
    }
  }

  if (ctx.scope === "projects") {
    next.evidence = [...(next.evidence ?? []), "Page context: projects"];
    if (next.intent === "create_project" && next.title) {
      next.confidence = "high";
      next.summary = ru
        ? `${next.summary.replace(/\.$/, "")} · список проектов.`
        : lang.startsWith("uk")
          ? `${next.summary.replace(/\.$/, "")} · список проєктів.`
          : `${next.summary.replace(/\.$/, "")} · projects list.`;
    }
    if (next.intent === "search_projects" && next.searchQuery) {
      next.confidence = "high";
      next.executable = true;
      next.route = "/projects";
      next.summary = ru
        ? `Найти проект «${next.searchQuery}»`
        : lang.startsWith("uk")
          ? `Знайти проєкт «${next.searchQuery}»`
          : `Find project ${next.searchQuery}`;
    }
    if (next.intent === "filter_projects" && next.searchQuery) {
      next.confidence = "high";
      next.executable = true;
      next.route = "/projects";
      next.summary = ru
        ? `Проекты: ${next.searchQuery}`
        : lang.startsWith("uk")
          ? `Проєкти: ${next.searchQuery}`
          : `Projects: ${next.searchQuery}`;
    }
    if (next.intent === "show_projects_risk") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/projects";
      next.summary = ru
        ? "Рисковые проекты"
        : lang.startsWith("uk")
          ? "Ризикові проєкти"
          : "Risk projects view";
    }
    if (next.intent === "show_projects_table") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/projects";
      next.summary = ru
        ? "Таблица проектов"
        : lang.startsWith("uk")
          ? "Таблиця проєктів"
          : lang.startsWith("es")
            ? "Tabla de proyectos"
            : lang.startsWith("de")
              ? "Projekttabelle"
              : "Projects table view";
    }
    if (next.intent === "show_projects_grid") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/projects";
      next.summary = ru
        ? "Сетка проектов"
        : lang.startsWith("uk")
          ? "Сітка проєктів"
          : lang.startsWith("es")
            ? "Cuadrícula de proyectos"
            : lang.startsWith("de")
              ? "Projektraster"
              : "Projects grid view";
    }
    if (next.intent === "open_project" && next.evidence?.includes("open_first_project")) {
      next.confidence = "medium";
    }
    if (next.intent === "open_route" && next.route === "/projects") {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru ? "Уже в списке проектов." : lang.startsWith("uk") ? "Вже у списку проєктів." : "Already on projects list.";
    }
  }

  if (ctx.scope === "files") {
    next.evidence = [...(next.evidence ?? []), "Page context: files"];
    if (next.intent === "open_route" && next.route === "/files") {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru ? "Уже в Vault / Files." : lang.startsWith("uk") ? "Вже у Vault / Files." : "Already in Vault / Files.";
    }
    if (next.intent === "search" && !next.searchQuery) {
      next.summary = ru ? "Поиск файлов скоро." : "File search coming soon.";
    }
    if (next.intent === "search_files") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/files";
      next.summary = ru
        ? next.searchQuery
          ? `Поиск файла «${next.searchQuery}» (скоро)`
          : "Поиск в Vault (скоро)"
        : lang.startsWith("uk")
          ? next.searchQuery
            ? `Пошук файлу «${next.searchQuery}» (скоро)`
            : "Пошук у Vault (скоро)"
          : next.searchQuery
            ? `Search file "${next.searchQuery}" (coming soon)`
            : "Vault search (coming soon)";
    }
  }

  if (ctx.scope === "inbox") {
    next.evidence = [...(next.evidence ?? []), "Page context: inbox"];
    if (
      next.intent === "process_inbox" ||
      next.intent === "dismiss_inbox" ||
      next.intent === "convert_inbox_note" ||
      next.intent === "show_voice_inbox"
    ) {
      next.confidence = "high";
      next.executable = true;
      next.summary = ru
        ? `${next.summary.replace(/\.$/, "")} · Voice Inbox.`
        : `${next.summary.replace(/\.$/, "")} · Voice Inbox.`;
    }
    if (next.intent === "open_route" && next.route === "/inbox") {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru ? "Уже во входящих." : "Already in Inbox.";
    }
  }

  if (ctx.scope === "channel" && ctx.route) {
    next.evidence = [...(next.evidence ?? []), `Page context: ${ctx.title ?? "channel"}`];
    if (next.intent === "open_route" && next.route === ctx.route) {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru
        ? `Уже в канале «${ctx.title ?? ""}».`
        : `Already in channel ${ctx.title ?? ""}.`;
    }
    if (next.intent === "send_message" && ctx.ids?.channelId) {
      next.entityId = ctx.ids.channelId;
      if (next.description) {
        next.executable = true;
        next.confidence = "high";
        next.summary = ru
          ? `Отправить в «${ctx.title ?? "канал"}»: ${next.description}`
          : `Send to ${ctx.title ?? "channel"}: ${next.description}`;
      }
    }
  }

  if (ctx.scope === "intelligence") {
    next.evidence = [...(next.evidence ?? []), "Page context: intelligence"];
    if (next.intent === "teach_memory") {
      next.confidence = "high";
      next.executable = true;
      next.intelligenceTab = "memory";
      next.summary = ru
        ? `${next.summary.replace(/\.$/, "")} · Intelligence.`
        : `${next.summary.replace(/\.$/, "")} · Intelligence.`;
    }
    if (next.intent === "show_memories" || next.intent === "show_learning_questions") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/intelligence";
    }
    if (next.intent === "show_reminders") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/intelligence";
    }
    if (next.intent === "open_route" && next.route === "/intelligence") {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru ? "Уже в Intelligence." : "Already in Intelligence.";
    }
  }

  if (ctx.scope === "team-map") {
    next.evidence = [...(next.evidence ?? []), "Page context: team-map"];
    if (next.intent === "open_person" && next.title) {
      next.intent = "open_team_person";
      next.route = "/team-map";
      next.confidence = "medium";
      next.summary = ru
        ? `Найти «${next.title}» на карте`
        : lang.startsWith("uk")
          ? `Знайти «${next.title}» на карті`
          : `Find ${next.title} on team map`;
    }
    if (next.intent === "search" && next.searchQuery) {
      next.intent = "open_team_person";
      next.title = next.searchQuery;
      next.route = "/team-map";
      next.label = ru ? "Найти на карте" : lang.startsWith("uk") ? "Знайти на карті" : "Find on map";
      next.summary = ru
        ? `Найти «${next.searchQuery}» на карте`
        : lang.startsWith("uk")
          ? `Знайти «${next.searchQuery}» на карті`
          : `Find ${next.searchQuery} on team map`;
      next.confidence = "medium";
      next.executable = false;
      next.evidence = [...(next.evidence ?? []), "team_map_search"];
      delete next.searchQuery;
    }
    if (
      next.intent === "unknown" &&
      (next.rawText || next.summary) &&
      /^(?:find|show|focus|locate|where\s+is|найди|покажи|відкрий|знайди|де)\s+/i.test(
        (next.rawText ?? next.summary).trim(),
      )
    ) {
      const raw = next.rawText ?? next.summary;
      if (isFocusTeamMemberPhrase(raw)) {
        const name = extractFocusTeamMemberName(raw);
        if (name) {
          next.intent = "open_team_person";
          next.title = name;
          next.route = "/team-map";
          next.label = ru ? "Найти на карте" : lang.startsWith("uk") ? "Знайти на карті" : "Find on map";
          next.summary = ru ? `Найти «${name}»` : lang.startsWith("uk") ? `Знайти «${name}»` : `Find ${name}`;
          next.confidence = "medium";
          next.executable = false;
          next.evidence = [...(next.evidence ?? []), "team_map_focus"];
        }
      }
    }
    if (next.intent === "open_team_person" && next.title) {
      next.confidence = "high";
      next.route = "/team-map";
    }
    if (next.intent === "filter_team_map") {
      next.confidence = "high";
      next.executable = true;
      next.route = "/team-map";
    }
    if (next.intent === "open_route" && next.route === "/team-map") {
      next.executable = true;
      next.confidence = "high";
      next.summary = ru
        ? "Уже на карте команды."
        : lang.startsWith("uk")
          ? "Вже на карті команди."
          : "Already on team map.";
    }
  }

  return next;
}

export function isCreateTaskHerePhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:create|add|new)\s+task\s+here\b/.test(lower) ||
    /^(?:создай|добавь|новая)\s+задач(?:у|а)\s+(?:здесь|тут)\b/.test(lower) ||
    /^(?:створи|додай)\s+задач(?:у|у)\s+(?:тут|тут)\b/.test(lower) ||
    /^(?:crear|añadir)\s+tarea\s+aqu[ií]\b/.test(lower) ||
    /^(?:aufgabe|task)\s+hier\s+(?:erstellen|anlegen)?\b/.test(lower)
  );
}

export function extractCreateTaskHereTitle(raw: string) {
  const patterns = [
    /^(?:create|add|new)\s+task\s+here\s+(.+)$/i,
    /^(?:создай|добавь)\s+задач(?:у|а)\s+(?:здесь|тут)\s+(.+)$/i,
    /^(?:crear|añadir)\s+tarea\s+aqu[ií]\s+(.+)$/i,
    /^(?:aufgabe\s+hier|task\s+here)\s+(.+)$/i,
    /^(?:создай|добавь)\s+задач(?:у|а)\s+на\s+доске\s+(.+)$/i,
    /^(?:create|add)\s+task\s+on\s+board\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

export function isCreateTaskOnBoardPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:create|add|new)\s+task\s+on\s+(?:the\s+)?board\b/.test(lower) ||
    /^(?:создай|добавь)\s+задач(?:у|а)\s+на\s+доске\b/.test(lower) ||
    /^(?:crear|añadir)\s+tarea\s+en\s+(?:el\s+)?tablero\b/.test(lower) ||
    /^(?:aufgabe|task)\s+auf\s+(?:dem\s+)?board\b/.test(lower)
  );
}

export function isCompleteFirstTaskPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:complete|finish|done with|mark)\s+(?:the\s+)?first\s+task\b/.test(lower) ||
    /^(?:заверш|выполн|отмет).*(?:перв(?:ую|ая)|1-?ю)\s+задач/.test(lower) ||
    /^(?:заверши|выполни)\s+первую\s+задач/.test(lower) ||
    /^(?:completar|terminar)\s+(?:la\s+)?primera\s+tarea\b/.test(lower) ||
    /^(?:erste|first)\s+aufgabe\s+(?:erledigen|abschließen|complete)\b/.test(lower) ||
    /^(?:complete|finish)\s+task\s+here\b/.test(lower) ||
    /^(?:заверш|выполн)\s+задач(?:у|а)\s+(?:здесь|тут)\b/.test(lower)
  );
}

export function isOpenFirstProjectPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:open|show|go to|открой|покажи|abrir|öffne)\s+(?:the\s+)?first\s+project\b/.test(lower) ||
    /^(?:open|открой|покажи)\s+перв(?:ый|ой)\s+проект\b/.test(lower) ||
    /^(?:abrir|mostrar)\s+(?:el\s+)?primer\s+proyecto\b/.test(lower) ||
    /^(?:erstes|ersten)\s+projekt\s+(?:öffnen|anzeigen)?\b/.test(lower)
  );
}

export function isAssignToThisPersonPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:assign|назнач(?:ь|ить)|признач(?:и|ити)|asignar|zuweis(?:en)?)\s+(?:to\s+)?(?:this person|him|her|them|этому человеку|этому|ей|ему|цій людині|esta persona|dieser person)/.test(
      lower,
    ) ||
    /^(?:назначь|assign)\s+(?:ему|ей|им)\s+/.test(lower)
  );
}

export function extractAssignToThisPersonTask(raw: string) {
  const patterns = [
    /^(?:assign|назнач(?:ь|ить)|признач(?:и|ити)|asignar|zuweis(?:en)?)\s+(?:to\s+)?(?:this person|him|her|them|этому человеку|этому|ей|ему|цій людині|esta persona|dieser person)\s+(?:the\s+)?(?:task|задач[уа]|tarea|aufgabe)?\s*(.+)$/i,
    /^(?:назначь|assign)\s+(?:ему|ей|им)\s+(?:задач[уа]|task|tarea|aufgabe)?\s*(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}
