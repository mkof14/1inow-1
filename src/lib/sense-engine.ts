import { resolveResponseLang } from "@/lib/voice-locale";

export type SenseLocale = "en" | "ru" | "uk" | "es" | "de";

export type SenseModule = {
  id: "sense-chat" | "voice-center";
  name: string;
  role: string;
};

export type SenseResponse = {
  summary: string;
  nova: string;
  vera: string;
  next: string[];
  modules: SenseModule[];
  speech: {
    nova: string;
    vera: string;
  };
};

const MODULES: SenseModule[] = [
  {
    id: "sense-chat",
    name: "Sense Chat",
    role: "Understands workspace context, answers questions, and turns uncertainty into a clear operating brief.",
  },
  {
    id: "voice-center",
    name: "Voice Center",
    role: "Listens for commands, drafts actions, asks clarifying questions, and keeps execution explicit.",
  },
];

export function buildSenseResponse(input: string, context?: unknown, lang = "en"): SenseResponse {
  const text = input.trim();
  const lower = text.toLowerCase();
  const locale = resolveSenseLocale(lang, text);
  const contextLabel = inferContextLabel(context, locale);
  const intent = inferIntent(lower, locale);

  if (locale === "uk") return buildLocalizedResponse("uk", intent, contextLabel);
  if (locale === "ru") return buildLocalizedResponse("ru", intent, contextLabel);
  if (locale === "es") return buildLocalizedResponse("es", intent, contextLabel);
  if (locale === "de") return buildLocalizedResponse("de", intent, contextLabel);
  return buildLocalizedResponse("en", intent, contextLabel);
}

function buildLocalizedResponse(
  locale: SenseLocale,
  intent: { en: string; ru: string; uk: string; es: string; de: string },
  contextLabel: { en: string; ru: string; uk: string; es: string; de: string },
): SenseResponse {
  const key = intent[locale];
  const ctx = contextLabel[locale];
  const copy = LOCALE_COPY[locale];
  return {
    summary: copy.summary(key, ctx),
    nova: copy.nova(key),
    vera: copy.vera(key),
    next: copy.next(key),
    modules: MODULES,
    speech: {
      nova: copy.nova(key),
      vera: copy.vera(key),
    },
  };
}

function resolveSenseLocale(lang: string, text: string): SenseLocale {
  const code = resolveResponseLang(lang, text).slice(0, 2);
  if (code === "ru" || code === "uk" || code === "es" || code === "de") return code;
  if (/[а-яё]/i.test(text)) return /[іїєґ]/i.test(text) ? "uk" : "ru";
  return "en";
}

export function formatSenseResponse(response: SenseResponse, lang = "en") {
  const locale = resolveSenseLocale(lang, response.summary);
  const nextLabel =
    locale === "ru" || locale === "uk"
      ? "Дальше:"
      : locale === "es"
        ? "Siguientes pasos:"
        : locale === "de"
          ? "Nächste Schritte:"
          : "Next:";
  // Single conversational voice — no Nova/Vera blocks (voice-first UX).
  const body =
    locale === "ru" || locale === "uk"
      ? `${response.summary} ${response.nova}`
      : `${response.summary} ${response.nova}`;
  return [body.trim(), "", nextLabel, ...response.next.map((item) => `- ${item}`)].join("\n");
}

/** Short line for TTS only — one natural sentence. */
export function formatSenseSpeechLine(response: SenseResponse, lang = "en"): string {
  const locale = resolveSenseLocale(lang, response.summary);
  const lead = response.summary.trim();
  const action = response.nova.trim();
  if (locale === "ru" || locale === "uk") {
    return action.length > 20 ? action : `${lead} ${action}`.trim();
  }
  return action.length > 20 ? action : `${lead} ${action}`.trim();
}

function inferIntent(lower: string, locale: SenseLocale) {
  const b = PHRASES[locale];
  if (containsAny(lower, b.create)) return INTENTS.create;
  if (containsAny(lower, b.risk)) return INTENTS.risk;
  if (containsAny(lower, b.today)) return INTENTS.today;
  if (containsAny(lower, b.voice)) return INTENTS.voice;
  if (containsAny(lower, b.project)) return INTENTS.project;
  if (containsAny(lower, b.question)) return INTENTS.question;
  return INTENTS.default;
}

function inferContextLabel(context: unknown, locale: SenseLocale) {
  if (!context || typeof context !== "object") return CONTEXT.general[locale];
  const serialized = JSON.stringify(context).toLowerCase();
  if (serialized.includes("dashboard")) return CONTEXT.dashboard[locale];
  if (serialized.includes("project")) return CONTEXT.project[locale];
  if (serialized.includes("task")) return CONTEXT.task[locale];
  if (serialized.includes("voice")) return CONTEXT.voice[locale];
  return CONTEXT.page[locale];
}

const INTENTS = {
  create: {
    en: "create action",
    ru: "создать действие",
    uk: "створити дію",
    es: "crear acción",
    de: "Aktion erstellen",
  },
  risk: {
    en: "risk review",
    ru: "проверка риска",
    uk: "перевірка ризику",
    es: "revisión de riesgos",
    de: "Risikoprüfung",
  },
  today: {
    en: "daily focus",
    ru: "фокус дня",
    uk: "фокус дня",
    es: "enfoque del día",
    de: "Tagesfokus",
  },
  voice: {
    en: "voice workflow",
    ru: "голосовой сценарий",
    uk: "голосовий сценарій",
    es: "flujo de voz",
    de: "Sprachworkflow",
  },
  project: {
    en: "project context",
    ru: "контекст проекта",
    uk: "контекст проєкту",
    es: "contexto del proyecto",
    de: "Projektkontext",
  },
  default: {
    en: "workspace reasoning",
    ru: "разбор рабочего контекста",
    uk: "розбір робочого контексту",
    es: "análisis del espacio de trabajo",
    de: "Arbeitskontext-Analyse",
  },
  question: {
    en: "open question",
    ru: "открытый вопрос",
    uk: "відкрите питання",
    es: "pregunta abierta",
    de: "offene Frage",
  },
};

const PHRASES: Record<SenseLocale, Record<string, string[]>> = {
  en: {
    create: ["create", "add task", "new task"],
    risk: ["risk", "blocker"],
    today: ["today", "focus"],
    voice: ["voice", "listen", "speak"],
    project: ["project", "portfolio"],
    question: [
      "what",
      "why",
      "how",
      "when",
      "who",
      "where",
      "explain",
      "tell me",
      "help me",
      "?",
    ],
  },
  ru: {
    create: ["создай", "добавь", "новая задача", "надо"],
    risk: ["риск", "блокер", "опасн"],
    today: ["сегодня", "день", "фокус"],
    voice: ["голос", "слуш", "говор"],
    project: ["проект", "портф"],
    question: ["что", "как", "почему", "зачем", "когда", "где", "кто", "объясни", "расскажи", "помоги", "?"],
  },
  uk: {
    create: ["створи", "додай", "нова задача", "треба"],
    risk: ["ризик", "блокер"],
    today: ["сьогодні", "день", "фокус"],
    voice: ["голос", "слух", "говор"],
    project: ["проєкт", "проект"],
    question: ["що", "як", "чому", "навіщо", "коли", "де", "хто", "поясни", "?"],
  },
  es: {
    create: ["crear", "nueva tarea", "añadir"],
    risk: ["riesgo", "bloqueo"],
    today: ["hoy", "enfoque"],
    voice: ["voz", "hablar"],
    project: ["proyecto"],
    question: ["qué", "cómo", "por qué", "cuándo", "dónde", "quién", "explica", "?"],
  },
  de: {
    create: ["erstellen", "neue aufgabe", "hinzufügen"],
    risk: ["risiko", "blocker"],
    today: ["heute", "fokus"],
    voice: ["stimme", "sprache"],
    project: ["projekt"],
    question: ["was", "wie", "warum", "wann", "wo", "wer", "erkläre", "?"],
  },
};

const CONTEXT = {
  general: {
    en: "general workspace",
    ru: "общее рабочее пространство",
    uk: "загальний робочий простір",
    es: "espacio de trabajo general",
    de: "allgemeiner Arbeitsbereich",
  },
  dashboard: {
    en: "Home dashboard",
    ru: "главная Home",
    uk: "головна Home",
    es: "panel principal",
    de: "Home-Dashboard",
  },
  project: {
    en: "project surface",
    ru: "проектная поверхность",
    uk: "проєктна поверхня",
    es: "superficie de proyectos",
    de: "Projektbereich",
  },
  task: {
    en: "task surface",
    ru: "поверхность задач",
    uk: "поверхня задач",
    es: "superficie de tareas",
    de: "Aufgabenbereich",
  },
  voice: {
    en: "voice surface",
    ru: "голосовая поверхность",
    uk: "голосова поверхня",
    es: "superficie de voz",
    de: "Sprachbereich",
  },
  page: {
    en: "current page context",
    ru: "контекст текущей страницы",
    uk: "контекст поточної сторінки",
    es: "contexto de la página actual",
    de: "aktueller Seitenkontext",
  },
};

const LOCALE_COPY: Record<
  SenseLocale,
  {
    summary: (intent: string, ctx: string) => string;
    nova: (intent: string) => string;
    vera: (intent: string) => string;
    next: (intent: string) => string[];
  }
> = {
  en: {
    summary: (intent, ctx) => {
      if (intent.includes("question"))
        return ctx.includes("dashboard")
          ? "For today: open Home for priorities, risks, and unowned tasks."
          : "I'm here to help with your day, projects, or tasks — tell me what you need.";
      if (intent.includes("risk")) return "Checking risks: blockers, overdue items, and missing owners.";
      if (intent.includes("daily")) return "Today's focus: three priorities, one blocker, one waiting-on.";
      return `Got it — ${intent}. Context: ${ctx}.`;
    },
    nova: (intent) =>
      intent.includes("question")
        ? "Say open Home, show risks, or create a task — I'll guide the next step."
        : intent.includes("risk")
          ? "Open the risks view or say show risks — we'll walk through it."
          : "Tell me more and I'll suggest one clear move you can confirm.",
    vera: () => "",
    next: () => [
      "Use Sense Chat for context.",
      "Use Voice Center for commands.",
      "Confirm before anything changes.",
    ],
  },
  ru: {
    summary: (intent, ctx) => {
      if (intent.includes("question") || intent.includes("вопрос") || intent.includes("питан")) {
        if (ctx.includes("главн") || ctx.includes("Home") || ctx.includes("dashboard"))
          return "Смотрю на ваш день: откройте Home — там приоритеты, риски и задачи без владельца.";
        if (ctx.includes("проект"))
          return "По проектам: проверьте статус, дедлайны и кто ждёт решения от вас.";
        if (ctx.includes("задач"))
          return "По задачам: начните с просроченных и тех, где вы блокируете других.";
        return "Я здесь, чтобы помочь разобрать день, проекты или задачи — скажите, что именно вас волнует.";
      }
      if (intent.includes("риск") || intent.includes("risk"))
        return "Проверяю риски: ищу блокеры, просрочки и задачи без ответственного.";
      if (intent.includes("фокус") || intent.includes("today") || intent.includes("день"))
        return "На сегодня: три приоритета, один блокер и одно ожидание от других — начните с Home.";
      return `Понял запрос про ${intent}. Контекст: ${ctx}.`;
    },
    nova: (intent) =>
      intent.includes("question") || intent.includes("вопрос") || intent.includes("питан")
        ? "Могу открыть Home, показать риски или помочь создать задачу — скажите, что нужно."
        : intent.includes("риск")
          ? "Откройте раздел рисков или скажите «покажи риски» — разберём по пунктам."
          : "Скажите конкретнее, и я предложу один шаг, который можно выполнить сейчас.",
    vera: (intent) =>
      intent.includes("question") || intent.includes("вопрос") || intent.includes("питан")
        ? ""
        : intent.includes("риск")
          ? "Сначала подтвердим, что риск реальный, а не просто шум."
          : "",
    next: () => [
      "Sense Chat — для контекста.",
      "Voice Center — для команд.",
      "Подтверждайте перед изменениями.",
    ],
  },
  uk: {
    summary: (intent, ctx) =>
      `Sense бачить Sense Chat для контексту та Voice Center для команд. Запит: ${intent}. Контекст: ${ctx}.`,
    nova: (intent) =>
      intent.includes("риз")
        ? "Спочатку знайду блокер, відповідального та наступний крок."
        : "Перетворю це на одну зрозумілу дію з вашим підтвердженням.",
    vera: (intent) =>
      intent.includes("риз")
        ? "Перевірю докази та чи дія справді потрібна."
        : "Сповільнюсь, якщо бракує контексту або ясності.",
    next: () => [
      "Sense Chat — для контексту.",
      "Voice Center — для команд.",
      "Підтверджуйте перед змінами.",
    ],
  },
  es: {
    summary: (intent, ctx) =>
      `Sense usa Sense Chat para contexto y Voice Center para comandos. Intención: ${intent}. Contexto: ${ctx}.`,
    nova: () => "Convierto esto en un siguiente paso claro que puedes confirmar.",
    vera: () => "Reviso contexto, riesgo y si falta algo antes de actuar.",
    next: () => [
      "Sense Chat para contexto.",
      "Voice Center para comandos.",
      "Confirma antes de cambiar datos.",
    ],
  },
  de: {
    summary: (intent, ctx) =>
      `Sense nutzt Sense Chat für Kontext und Voice Center für Befehle. Absicht: ${intent}. Kontext: ${ctx}.`,
    nova: () => "Ich mache daraus einen klaren nächsten Schritt zur Bestätigung.",
    vera: () => "Ich prüfe Kontext, Risiko und fehlende Informationen.",
    next: () => [
      "Sense Chat für Kontext.",
      "Voice Center für Befehle.",
      "Vor Änderungen bestätigen.",
    ],
  },
};

export type SensePersona = "nova" | "vera";

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}
