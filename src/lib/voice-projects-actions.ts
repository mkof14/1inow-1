export function isSearchProjectsPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:search|find|filter|look for|найди|ищи|шукай|buscar|finde|suche)\s+(?:project|projects|проект|проєкт|проекты|proyecto|projekt)/.test(
      lower,
    ) ||
    /^(?:show|list|покажи|показать|mostrar|zeige)\s+(?:project|projects|проект|проекты|proyectos|projekte)/.test(
      lower,
    )
  );
}

export function extractSearchProjectsQuery(raw: string) {
  const patterns = [
    /^(?:search|find|filter|look for|найди|ищи|шукай|buscar|finde|suche)\s+(?:project|projects|проект|проєкт|проекты|proyecto|projekte?)\s+(.+)$/i,
    /^(?:show|list|покажи|показать|mostrar|zeige)\s+(?:project|projects|проект|проекты|proyectos|projekte)\s+(.+)$/i,
    /^(?:projects|проекты|проєкти|proyectos|projekte)\s+(?:named|called|named|с названием|з назвою)\s+(.+)$/i,
  ];
  for (const re of patterns) {
    const m = raw.trim().match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

const STATUS_ALIASES: Record<string, string> = {
  active: "active",
  активные: "active",
  активных: "active",
  "in progress": "in_progress",
  "in_progress": "in_progress",
  "в работе": "in_progress",
  planning: "planning",
  планирование: "planning",
  планировании: "planning",
  paused: "paused",
  pause: "paused",
  паузе: "paused",
  активні: "active",
  completed: "completed",
  завершённые: "completed",
  завершенные: "completed",
  archived: "archived",
  архив: "archived",
  idea: "idea",
  идеи: "idea",
  review: "review",
  ревью: "review",
};

export function isFilterProjectsByStatusPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|list|filter|покажи|показать|список|фильтр|покажи|mostrar|filtrar|zeige|filter)\s+(?:the\s+)?(?:active|planning|paused|completed|archived|in progress|актив|планир|пауз|заверш|archiv|proyectos activos|aktive projekte)/.test(
      lower,
    ) ||
    /^(?:active projects|активные проекты|активні проєкти|proyectos activos|aktive projekte)$/.test(
      lower,
    )
  );
}

export function extractProjectStatusFilter(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  for (const [phrase, status] of Object.entries(STATUS_ALIASES)) {
    if (lower.includes(phrase)) return status;
  }
  const m = lower.match(
    /(?:show|list|filter|покажи|показать|mostrar|zeige)\s+(?:projects|проекты|проєкти|proyectos|projekte)?\s*(?:with\s+status|со статусом|зі статусом)?\s*(.+)$/,
  );
  if (m?.[1]) {
    const key = m[1].trim();
    return STATUS_ALIASES[key] ?? (PROJECT_STATUS_VALUES.includes(key as any) ? key : null);
  }
  return null;
}

const PROJECT_STATUS_VALUES = [
  "idea",
  "planning",
  "active",
  "in_progress",
  "review",
  "paused",
  "completed",
  "archived",
  "canceled",
];

export function isShowProjectsRiskPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|list|view|покажи|открой|показать|mostrar|zeige)\s+(?:the\s+)?(?:risk|risky|high.?risk|риск|рисков|ризик)/.test(
      lower,
    ) ||
    /^(?:risk projects|рисковые проекты|ризикові проєкти|proyectos de riesgo|risikoprojekte)$/.test(
      lower,
    ) ||
    /^(?:show|покажи)\s+(?:projects|проекты|проєкти|proyectos|projekte)\s+(?:risk|риск|ризик)/.test(
      lower,
    )
  );
}

export function isShowProjectsGridPhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|view|покажи|открой|сетк|grid|mostrar|zeige)\s+(?:the\s+)?(?:project\s+)?grid/.test(
      lower,
    ) ||
    /^(?:projects|проекты|проєкти|proyectos|projekte)\s+(?:grid|сетк)/.test(lower) ||
    /^(?:grid\s+view|вид\s+сетк(?:ой|а)|сітк(?:ою|а))\s+(?:projects|проекты|проєкти)?/.test(
      lower,
    ) ||
    /^(?:show|покажи|mostrar|zeige)\s+(?:projects|проекты|проєкти|proyectos|projekte)\s+(?:as\s+)?grid/.test(
      lower,
    )
  );
}

export function isShowProjectsTablePhrase(raw: string) {
  const lower = raw.toLowerCase().trim();
  return (
    /^(?:show|open|list|view|покажи|открой|таблиц|table|mostrar|zeige)\s+(?:the\s+)?(?:project\s+)?table/.test(
      lower,
    ) ||
    /^(?:projects|проекты|проєкти|proyectos|projekte)\s+(?:table|таблиц)/.test(lower) ||
    /^(?:table\s+view|табличный\s+вид|табличний\s+вигляд)\s+(?:projects|проекты|проєкти)?/.test(
      lower,
    ) ||
    /^(?:show|покажи)\s+(?:projects|проекты|проєкти|proyectos|projekte)\s+(?:as\s+)?table/.test(
      lower,
    )
  );
}
