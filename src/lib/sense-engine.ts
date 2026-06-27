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
  return [
    response.summary,
    "",
    `Nova: ${response.nova}`,
    `Vera: ${response.vera}`,
    "",
    nextLabel,
    ...response.next.map((item) => `- ${item}`),
  ].join("\n");
}

function inferIntent(lower: string, locale: SenseLocale) {
  const b = PHRASES[locale];
  if (containsAny(lower, b.create)) return INTENTS.create;
  if (containsAny(lower, b.risk)) return INTENTS.risk;
  if (containsAny(lower, b.today)) return INTENTS.today;
  if (containsAny(lower, b.voice)) return INTENTS.voice;
  if (containsAny(lower, b.project)) return INTENTS.project;
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
};

const PHRASES: Record<SenseLocale, Record<string, string[]>> = {
  en: {
    create: ["create", "add task", "new task"],
    risk: ["risk", "blocker"],
    today: ["today", "focus"],
    voice: ["voice", "listen", "speak"],
    project: ["project", "portfolio"],
  },
  ru: {
    create: ["создай", "добавь", "новая задача", "надо"],
    risk: ["риск", "блокер", "опасн"],
    today: ["сегодня", "день", "фокус"],
    voice: ["голос", "слуш", "говор"],
    project: ["проект", "портф"],
  },
  uk: {
    create: ["створи", "додай", "нова задача", "треба"],
    risk: ["ризик", "блокер"],
    today: ["сьогодні", "день", "фокус"],
    voice: ["голос", "слух", "говор"],
    project: ["проєкт", "проект"],
  },
  es: {
    create: ["crear", "nueva tarea", "añadir"],
    risk: ["riesgo", "bloqueo"],
    today: ["hoy", "enfoque"],
    voice: ["voz", "hablar"],
    project: ["proyecto"],
  },
  de: {
    create: ["erstellen", "neue aufgabe", "hinzufügen"],
    risk: ["risiko", "blocker"],
    today: ["heute", "fokus"],
    voice: ["stimme", "sprache"],
    project: ["projekt"],
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
    summary: (intent, ctx) =>
      `Sense sees Sense Chat for context and Voice Center for commands. Intent: ${intent}. Context: ${ctx}.`,
    nova: (intent) =>
      intent.includes("risk")
        ? "I'll find the blocker, owner, and next step."
        : "I'll turn this into one clear move you can confirm.",
    vera: (intent) =>
      intent.includes("risk")
        ? "I'll check evidence and whether action is really justified."
        : "I'll slow down if context, timing, or risk is missing.",
    next: () => [
      "Use Sense Chat for context.",
      "Use Voice Center for commands.",
      "Confirm before anything changes.",
    ],
  },
  ru: {
    summary: (intent, ctx) =>
      `Sense видит Sense Chat для контекста и Voice Center для команд. Запрос: ${intent}. Контекст: ${ctx}.`,
    nova: (intent) =>
      intent.includes("риск")
        ? "Сначала найду блокер, ответственного и следующий шаг."
        : "Превращу это в одно понятное действие с вашим подтверждением.",
    vera: (intent) =>
      intent.includes("риск")
        ? "Проверю доказательства и оправданность действия."
        : "Замедлюсь, если не хватает контекста, времени или ясности.",
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
