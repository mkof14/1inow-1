export type SensePersona = "nova" | "vera";

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
  const contextLabel = inferContextLabel(context);
  const intent = inferIntent(lower);

  if (locale === "ru" || locale === "uk") {
    return {
      summary: `Sense видит два рабочих модуля: Sense Chat для понимания контекста и Voice Center для команд голосом. Сейчас запрос распознан как: ${intent.ru}. Контекст: ${contextLabel.ru}.`,
      nova: buildNovaRu(intent.ru),
      vera: buildVeraRu(intent.ru),
      next: buildNextRu(intent.ru),
      modules: MODULES,
      speech: {
        nova: `Nova. ${buildNovaRu(intent.ru)}`,
        vera: `Vera. ${buildVeraRu(intent.ru)}`,
      },
    };
  }

  return {
    summary: `Sense sees two working modules: Sense Chat for context and Voice Center for voice commands. Current intent: ${intent.en}. Context: ${contextLabel.en}.`,
    nova: buildNovaEn(intent.en),
    vera: buildVeraEn(intent.en),
    next: buildNextEn(intent.en),
    modules: MODULES,
    speech: {
      nova: `Nova. ${buildNovaEn(intent.en)}`,
      vera: `Vera. ${buildVeraEn(intent.en)}`,
    },
  };
}

function resolveSenseLocale(lang: string, text: string) {
  const code = lang.slice(0, 2).toLowerCase();
  if (code === "uk") return "uk";
  if (code === "ru" || /[а-яё]/i.test(text)) return "ru";
  return "en";
}

export function formatSenseResponse(response: SenseResponse, lang = "en") {
  const ru = lang.startsWith("ru") || lang.startsWith("uk") || /[а-яё]/i.test(response.summary);
  if (ru) {
    return [
      response.summary,
      "",
      `Nova: ${response.nova}`,
      `Vera: ${response.vera}`,
      "",
      "Дальше:",
      ...response.next.map((item) => `- ${item}`),
    ].join("\n");
  }

  return [
    response.summary,
    "",
    `Nova: ${response.nova}`,
    `Vera: ${response.vera}`,
    "",
    "Next:",
    ...response.next.map((item) => `- ${item}`),
  ].join("\n");
}

function inferIntent(lower: string) {
  if (containsAny(lower, ["создай", "create", "add task", "new task", "новая задача"])) {
    return { en: "create action", ru: "создать действие" };
  }
  if (containsAny(lower, ["risk", "blocker", "риск", "блокер", "опасн"])) {
    return { en: "risk review", ru: "проверка риска" };
  }
  if (containsAny(lower, ["today", "сегодня", "день", "focus", "фокус"])) {
    return { en: "daily focus", ru: "фокус дня" };
  }
  if (containsAny(lower, ["voice", "голос", "listen", "слуш", "speak", "говор"])) {
    return { en: "voice workflow", ru: "голосовой сценарий" };
  }
  if (containsAny(lower, ["project", "проект", "portfolio", "портф"])) {
    return { en: "project context", ru: "контекст проекта" };
  }
  return { en: "workspace reasoning", ru: "разбор рабочего контекста" };
}

function inferContextLabel(context: unknown) {
  if (!context || typeof context !== "object") {
    return { en: "general workspace", ru: "общее рабочее пространство" };
  }
  const serialized = JSON.stringify(context).toLowerCase();
  if (serialized.includes("dashboard")) return { en: "Home dashboard", ru: "главная Home" };
  if (serialized.includes("project")) return { en: "project surface", ru: "проектная поверхность" };
  if (serialized.includes("task")) return { en: "task surface", ru: "поверхность задач" };
  if (serialized.includes("voice")) return { en: "voice surface", ru: "голосовая поверхность" };
  return { en: "current page context", ru: "контекст текущей страницы" };
}

function buildNovaEn(intent: string) {
  if (intent === "risk review")
    return "I move first to the concrete blocker: identify the risky item, owner, and next action.";
  if (intent === "daily focus")
    return "I compress the day into one useful move and push it toward a visible task or route.";
  if (intent === "voice workflow")
    return "I listen for command verbs and convert speech into a draft action, route, reminder, or inbox item.";
  if (intent === "create action")
    return "I turn the request into an executable draft, then wait for confirmation before changing data.";
  return "I turn the request into motion: open the right place, draft the next step, or reduce the work to one action.";
}

function buildVeraEn(intent: string) {
  if (intent === "risk review")
    return "I slow the action down: check evidence, ambiguity, hidden dependency, and whether the risk needs a decision.";
  if (intent === "daily focus")
    return "I protect the day from noise: check priority, timing, and whether the suggested move is actually meaningful.";
  if (intent === "voice workflow")
    return "I verify the command before execution: meaning, risk, missing context, and whether Sense should ask again.";
  if (intent === "create action")
    return "I check title, deadline, owner, project context, and whether this should be a task, note, or decision.";
  return "I check meaning before movement: confidence, missing context, risk, and whether action is justified.";
}

function buildNovaRu(intent: string) {
  if (intent === "проверка риска")
    return "Я сразу ищу конкретный блокер: рискованный объект, владельца и следующий шаг.";
  if (intent === "фокус дня")
    return "Я сжимаю день до одного полезного движения и веду его к задаче или нужному разделу.";
  if (intent === "голосовой сценарий")
    return "Я слушаю глаголы команды и превращаю речь в черновик действия, маршрут, напоминание или inbox item.";
  if (intent === "создать действие")
    return "Я превращаю запрос в исполнимый черновик и жду подтверждения перед изменением данных.";
  return "Я превращаю запрос в движение: открыть нужное место, собрать следующий шаг или свести работу к одному действию.";
}

function buildVeraRu(intent: string) {
  if (intent === "проверка риска")
    return "Я замедляю действие: проверяю доказательства, неясность, скрытую зависимость и нужна ли отдельная decision.";
  if (intent === "фокус дня")
    return "Я защищаю день от шума: проверяю приоритет, время и реальную полезность следующего шага.";
  if (intent === "голосовой сценарий")
    return "Я проверяю команду до исполнения: смысл, риск, недостающий контекст и нужно ли Sense уточнить.";
  if (intent === "создать действие")
    return "Я проверяю название, срок, владельца, проектный контекст и тип: задача, заметка или решение.";
  return "Я проверяю смысл до движения: уверенность, недостающий контекст, риск и оправданность действия.";
}

function buildNextEn(intent: string) {
  if (intent === "voice workflow") {
    return [
      "Use Voice Center for raw capture.",
      "Let Nova draft the action.",
      "Let Vera block unclear execution.",
    ];
  }
  return [
    "Use Sense Chat for context.",
    "Use Voice Center when the request is a command.",
    "Confirm before Sense changes data.",
  ];
}

function buildNextRu(intent: string) {
  if (intent === "голосовой сценарий") {
    return [
      "Использовать Voice Center для сырого ввода.",
      "Дать Nova собрать действие.",
      "Дать Vera остановить неясное исполнение.",
    ];
  }
  return [
    "Использовать Sense Chat для контекста.",
    "Использовать Voice Center, когда это команда.",
    "Подтверждать перед изменением данных.",
  ];
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}
