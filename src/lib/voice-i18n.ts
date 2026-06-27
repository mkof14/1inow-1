import { resolveResponseLang } from "@/lib/voice-locale";

export type VoiceLocale = "en" | "ru" | "uk" | "es" | "de";

export function toVoiceLocale(lang: string, text?: string): VoiceLocale {
  const code = resolveResponseLang(lang, text).slice(0, 2) as VoiceLocale;
  if (code === "ru" || code === "uk" || code === "es" || code === "de") return code;
  return "en";
}

type Bundle = {
  createTask: string[];
  createProject: string[];
  today: string[];
  risks: string[];
  search: string[];
  note: string[];
  reminder: string[];
  openPrefix: string[];
  taskTitleQuestion: string;
  projectTitleQuestion: string;
  reminderTimeQuestion: string;
  unknownSummary: string;
  unknownQuestion: string;
  labels: Record<string, string>;
  quick: Record<string, string[]>;
  advice: Record<string, string[]>;
  evidence: Record<string, string[]>;
  toasts: Record<string, string>;
};

const BUNDLES: Record<VoiceLocale, Bundle> = {
  en: {
    createTask: ["create task", "new task", "add task", "i need to", "i have to"],
    createProject: ["create project", "new project", "add project"],
    today: [
      "what should i do",
      "what do i do",
      "next step",
      "what next",
      "help me",
      "what is important today",
      "today important",
      "what today",
    ],
    risks: ["show risks", "risks", "risk review"],
    search: ["search", "find"],
    note: ["note", "idea", "remember", "write down"],
    reminder: ["remind", "reminder"],
    openPrefix: ["open", "go to", "go"],
    taskTitleQuestion: "What exactly should the task be?",
    projectTitleQuestion: "What should this project be called?",
    reminderTimeQuestion: "When should I remind you?",
    unknownSummary: "I can draft this, but I need a clearer command before executing.",
    unknownQuestion: "What should I do with this?",
    labels: {
      create_task: "Create task",
      create_project: "Create project",
      show_today: "Review today's priorities",
      show_risks: "Show risks",
      search: "Open search",
      draft_note: "Draft note",
      draft_reminder: "Draft reminder",
      open_route: "Navigate",
      unknown: "Unknown command",
    },
    quick: {
      task: ["Call someone", "Prepare documents", "Buy something", "Review project"],
      project: [
        "New business project",
        "Home project",
        "DigitalInvest project",
        "Personal project",
      ],
      note: ["Keep as note", "Turn into task", "Attach to project", "Ask me later"],
      reminder: ["Today", "Tomorrow", "This week", "Ask me later"],
      unknown: ["Save as note", "Turn into task", "Create project", "Show today"],
    },
    advice: {
      taskDeadline: "If this has a deadline, include today, tomorrow, or a date in the command.",
      taskProject: "If it belongs to a project, mention the project name.",
      projectOutcome: "A useful project needs a clear outcome, owner, and next action.",
      projectTask: "After creation, add the first task so the project does not stay empty.",
      todayFocus: "Use today view to choose one concrete next move.",
      todayInbox: "If something feels unclear, ask Sense to save it as a voice inbox item.",
      risksFirst: "Review risks before creating more work.",
      riskOwner: "A risk should be attached to a project and have an owner or next action.",
      noteTypes: "Good notes preserve context. Good tasks include a verb and a next action.",
      noteProject: "If this affects an active project, mention the project name next time.",
      reminderDraft:
        "Reminder execution is not connected yet, so I can safely save this as a draft.",
      reminderTime: "Use a specific time later when reminders are connected.",
      unknownSave: "When unsure, I will save the thought instead of inventing an action.",
      unknownVerbs: "For execution, say a clear verb: create, open, show, find, remind, or save.",
    },
    evidence: {
      createMatched: "Matched create phrase",
      confirmRequired: "Execution requires explicit confirmation",
      source: "Source: local voice intent parser",
      helpToday: "Matched help/today planning phrase",
      dashboardBrain: "Dashboard derives today focus from existing data",
      riskPhrase: "Matched risk phrase",
      riskSurface: "Best risk surface is Projects + Daily Command Center",
      searchPhrase: "Matched search phrase",
      searchShell: "Global search is available in the app shell",
      notePhrase: "Matched note phrase",
      noteNotConnected: "Notes write flow is not connected in voice center yet",
      reminderPhrase: "Matched reminder phrase",
      reminderNotConnected: "No production reminder execution is connected yet",
      routeKeywords: "Matched route keywords",
      routeMap: "Source: local route map",
      noIntent: "No supported local intent matched",
      tryPhrases: "Try create task, create project, open page, show today, or show risks",
    },
    toasts: {
      taskCreated: "Task created from voice command",
      projectCreated: "Project created from voice command",
      notExecutable: "This voice action is drafted but not executable yet.",
      failed: "Voice command failed",
      savedInbox: "Saved to Voice Inbox",
    },
  },
  ru: {
    createTask: [
      "создай задачу",
      "добавь задачу",
      "новая задача",
      "мне нужно",
      "надо",
      "нужно",
      "создать задачу",
    ],
    createProject: ["создай проект", "добавь проект", "новый проект", "создать проект"],
    today: [
      "помоги",
      "что мне делать",
      "что дальше",
      "следующий шаг",
      "разбери день",
      "разбери мой день",
      "план на день",
      "что сегодня",
      "что важно",
      "сегодня важно",
    ],
    risks: ["риск", "риски", "покажи риски", "опасност"],
    search: ["найди", "поиск", "ищи"],
    note: ["заметка", "идея", "запиши", "мысль", "запомни мысль"],
    reminder: ["напомни", "напоминание", "напомнить"],
    openPrefix: ["открой", "перейди", "покажи"],
    taskTitleQuestion: "Как именно должна называться задача?",
    projectTitleQuestion: "Как назвать проект?",
    reminderTimeQuestion: "Когда напомнить?",
    unknownSummary: "Могу сохранить черновик, но для действия нужна более чёткая команда.",
    unknownQuestion: "Что сделать с этим?",
    labels: {
      create_task: "Создать задачу",
      create_project: "Создать проект",
      show_today: "Фокус дня",
      show_risks: "Показать риски",
      search: "Поиск",
      draft_note: "Черновик заметки",
      draft_reminder: "Черновик напоминания",
      open_route: "Перейти",
      unknown: "Неизвестная команда",
    },
    quick: {
      task: ["Позвонить", "Подготовить документы", "Купить", "Проверить проект"],
      project: ["Новый бизнес-проект", "Дом", "DigitalInvest", "Личный проект"],
      note: ["Оставить заметкой", "Сделать задачей", "Привязать к проекту", "Спросить позже"],
      reminder: ["Сегодня", "Завтра", "На этой неделе", "Спросить позже"],
      unknown: ["Сохранить заметкой", "Сделать задачей", "Создать проект", "Показать день"],
    },
    advice: {
      taskDeadline: "Если есть срок — скажите сегодня, завтра или дату.",
      taskProject: "Если это часть проекта — назовите проект.",
      projectOutcome: "Полезный проект имеет результат, владельца и первый шаг.",
      projectTask: "После создания добавьте первую задачу, иначе проект не сдвинется.",
      todayFocus: "Выберите одно конкретное действие на сегодня.",
      todayInbox: "Если неясно — сохраните мысль в Voice Inbox.",
      risksFirst: "Сначала разберите риски, потом создавайте новую работу.",
      riskOwner: "Риск должен быть у проекта и иметь владельца или следующий шаг.",
      noteTypes: "Заметка хранит контекст. Задача — глагол и действие.",
      noteProject: "Если это про активный проект — назовите проект в следующий раз.",
      reminderDraft: "Напоминания пока не подключены — безопасно сохранить черновик.",
      reminderTime: "Позже укажите точное время, когда напоминания будут готовы.",
      unknownSave: "Если не уверены — сохраню мысль, а не придумаю действие.",
      unknownVerbs: "Для действия используйте глагол: создай, открой, покажи, найди, напомни.",
    },
    evidence: {
      createMatched: "Распознана фраза создания",
      confirmRequired: "Исполнение только после подтверждения",
      source: "Источник: локальный голосовой парсер",
      helpToday: "Распознан запрос помощи / фокуса дня",
      dashboardBrain: "Dashboard собирает фокус из ваших данных",
      riskPhrase: "Распознана фраза про риски",
      riskSurface: "Лучшая поверхность рисков — Projects и Daily Command Center",
      searchPhrase: "Распознан поиск",
      searchShell: "Глобальный поиск доступен в верхней панели",
      notePhrase: "Распознана заметка",
      noteNotConnected: "Запись заметок из Voice Center пока не подключена",
      reminderPhrase: "Распознано напоминание",
      reminderNotConnected: "Исполнение напоминаний пока не подключено",
      routeKeywords: "Распознаны ключевые слова маршрута",
      routeMap: "Источник: локальная карта маршрутов",
      noIntent: "Подходящая команда не распознана",
      tryPhrases: "Попробуйте: создай задачу, создай проект, открой раздел, покажи риски",
    },
    toasts: {
      taskCreated: "Задача создана голосовой командой",
      projectCreated: "Проект создан голосовой командой",
      notExecutable: "Это действие пока только черновик.",
      failed: "Голосовая команда не выполнена",
      savedInbox: "Сохранено в Voice Inbox",
    },
  },
  uk: {
    createTask: [
      "створи задачу",
      "додай задачу",
      "нова задача",
      "мені потрібно",
      "треба",
      "потрібно",
    ],
    createProject: ["створи проєкт", "додай проєкт", "новий проєкт", "создай проект"],
    today: [
      "допоможи",
      "що мені робити",
      "що далі",
      "наступний крок",
      "розбери день",
      "план на день",
      "що сьогодні",
      "що важливо",
    ],
    risks: ["ризик", "ризики", "покажи ризики"],
    search: ["знайди", "пошук", "шукай"],
    note: ["нотатка", "ідея", "запиши", "думка"],
    reminder: ["нагадай", "нагадування", "напомни"],
    openPrefix: ["відкрий", "перейди", "покажи"],
    taskTitleQuestion: "Як саме назвати задачу?",
    projectTitleQuestion: "Як назвати проєкт?",
    reminderTimeQuestion: "Коли нагадати?",
    unknownSummary: "Можу зберегти чернетку, але для дії потрібна чіткіша команда.",
    unknownQuestion: "Що з цим зробити?",
    labels: {
      create_task: "Створити задачу",
      create_project: "Створити проєкт",
      show_today: "Фокус дня",
      show_risks: "Показати ризики",
      search: "Пошук",
      draft_note: "Чернетка нотатки",
      draft_reminder: "Чернетка нагадування",
      open_route: "Перейти",
      unknown: "Невідома команда",
    },
    quick: {
      task: ["Подзвонити", "Підготувати документи", "Купити", "Перевірити проєкт"],
      project: ["Новий бізнес-проєкт", "Дім", "DigitalInvest", "Особистий проєкт"],
      note: ["Залишити нотаткою", "Зробити задачею", "Прив'язати до проєкту", "Питати пізніше"],
      reminder: ["Сьогодні", "Завтра", "Цього тижня", "Питати пізніше"],
      unknown: ["Зберегти нотаткою", "Зробити задачею", "Створити проєкт", "Показати день"],
    },
    advice: {
      taskDeadline: "Якщо є термін — скажіть сьогодні, завтра або дату.",
      taskProject: "Якщо це частина проєкту — назвіть проєкт.",
      projectOutcome: "Корисний проєкт має результат, власника і перший крок.",
      projectTask: "Після створення додайте першу задачу.",
      todayFocus: "Оберіть одну конкретну дію на сьогодні.",
      todayInbox: "Якщо неясно — збережіть думку в Voice Inbox.",
      risksFirst: "Спочатку розберіть ризики.",
      riskOwner: "Ризик має мати власника або наступний крок.",
      noteTypes: "Нотатка зберігає контекст. Задача — дію.",
      noteProject: "Якщо це про активний проєкт — назвіть його наступного разу.",
      reminderDraft: "Нагадування ще не підключені — можна зберегти чернетку.",
      reminderTime: "Пізніше вкажіть точний час.",
      unknownSave: "Якщо не впевнені — збережу думку.",
      unknownVerbs: "Для дії: створи, відкрий, покажи, знайди, нагадай.",
    },
    evidence: {
      createMatched: "Розпізнано фразу створення",
      confirmRequired: "Виконання лише після підтвердження",
      source: "Джерело: локальний голосовий парсер",
      helpToday: "Розпізнано запит фокусу дня",
      dashboardBrain: "Dashboard збирає фокус із ваших даних",
      riskPhrase: "Розпізнано ризики",
      riskSurface: "Projects + Daily Command Center",
      searchPhrase: "Розпізнано пошук",
      searchShell: "Глобальний пошук у верхній панелі",
      notePhrase: "Розпізнано нотатку",
      noteNotConnected: "Запис нотаток ще не підключений",
      reminderPhrase: "Розпізнано нагадування",
      reminderNotConnected: "Виконання нагадувань ще не підключене",
      routeKeywords: "Розпізнано маршрут",
      routeMap: "Локальна карта маршрутів",
      noIntent: "Команду не розпізнано",
      tryPhrases: "Спробуйте: створи задачу, відкрий розділ, покажи ризики",
    },
    toasts: {
      taskCreated: "Задачу створено голосовою командою",
      projectCreated: "Проєкт створено голосовою командою",
      notExecutable: "Це поки лише чернетка.",
      failed: "Голосова команда не виконана",
      savedInbox: "Збережено в Voice Inbox",
    },
  },
  es: {
    createTask: ["crear tarea", "nueva tarea", "añadir tarea", "agregar tarea", "necesito"],
    createProject: ["crear proyecto", "nuevo proyecto", "añadir proyecto"],
    today: [
      "qué debo hacer",
      "qué hago",
      "siguiente paso",
      "ayúdame",
      "qué es importante hoy",
      "enfoque de hoy",
    ],
    risks: ["riesgos", "mostrar riesgos", "riesgo"],
    search: ["buscar", "encuentra", "búsqueda"],
    note: ["nota", "idea", "apunta", "recuerda"],
    reminder: ["recuérdame", "recordatorio", "recordar"],
    openPrefix: ["abre", "ir a", "ve a", "mostrar"],
    taskTitleQuestion: "¿Cómo debe llamarse la tarea?",
    projectTitleQuestion: "¿Cómo se llama el proyecto?",
    reminderTimeQuestion: "¿Cuándo debo recordártelo?",
    unknownSummary: "Puedo guardar un borrador, pero necesito un comando más claro.",
    unknownQuestion: "¿Qué debo hacer con esto?",
    labels: {
      create_task: "Crear tarea",
      create_project: "Crear proyecto",
      show_today: "Prioridades de hoy",
      show_risks: "Mostrar riesgos",
      search: "Buscar",
      draft_note: "Borrador de nota",
      draft_reminder: "Borrador de recordatorio",
      open_route: "Ir a",
      unknown: "Comando desconocido",
    },
    quick: {
      task: ["Llamar", "Preparar documentos", "Comprar", "Revisar proyecto"],
      project: ["Proyecto de negocio", "Hogar", "DigitalInvest", "Personal"],
      note: ["Guardar como nota", "Convertir en tarea", "Adjuntar a proyecto", "Preguntar luego"],
      reminder: ["Hoy", "Mañana", "Esta semana", "Preguntar luego"],
      unknown: ["Guardar nota", "Convertir en tarea", "Crear proyecto", "Ver hoy"],
    },
    advice: {
      taskDeadline: "Si hay plazo, incluye hoy, mañana o una fecha.",
      taskProject: "Si pertenece a un proyecto, menciónalo.",
      projectOutcome: "Un proyecto útil tiene resultado, responsable y primer paso.",
      projectTask: "Después de crearlo, añade la primera tarea.",
      todayFocus: "Elige una acción concreta para hoy.",
      todayInbox: "Si no está claro, guarda la idea en Voice Inbox.",
      risksFirst: "Revisa riesgos antes de crear más trabajo.",
      riskOwner: "Un riesgo debe tener responsable o siguiente paso.",
      noteTypes: "La nota guarda contexto. La tarea incluye un verbo.",
      noteProject: "Si afecta a un proyecto activo, nómbralo la próxima vez.",
      reminderDraft: "Los recordatorios aún no están conectados — guarda borrador.",
      reminderTime: "Indica hora específica cuando esté listo.",
      unknownSave: "Si hay duda, guardo la idea en lugar de inventar.",
      unknownVerbs: "Usa verbos claros: crear, abrir, mostrar, buscar, recordar.",
    },
    evidence: {
      createMatched: "Frase de creación reconocida",
      confirmRequired: "Requiere confirmación explícita",
      source: "Fuente: analizador local de voz",
      helpToday: "Frase de ayuda / enfoque del día",
      dashboardBrain: "Dashboard deriva el foco de tus datos",
      riskPhrase: "Frase de riesgo reconocida",
      riskSurface: "Projects + Daily Command Center",
      searchPhrase: "Búsqueda reconocida",
      searchShell: "Búsqueda global en la barra superior",
      notePhrase: "Nota reconocida",
      noteNotConnected: "Escritura de notas aún no conectada",
      reminderPhrase: "Recordatorio reconocido",
      reminderNotConnected: "Ejecución de recordatorios no conectada",
      routeKeywords: "Ruta reconocida",
      routeMap: "Mapa local de rutas",
      noIntent: "Comando no reconocido",
      tryPhrases: "Prueba: crear tarea, crear proyecto, abrir, mostrar riesgos",
    },
    toasts: {
      taskCreated: "Tarea creada por voz",
      projectCreated: "Proyecto creado por voz",
      notExecutable: "Esta acción aún es solo borrador.",
      failed: "Comando de voz fallido",
      savedInbox: "Guardado en Voice Inbox",
    },
  },
  de: {
    createTask: [
      "aufgabe erstellen",
      "neue aufgabe",
      "aufgabe hinzufügen",
      "ich muss",
      "ich brauche",
    ],
    createProject: ["projekt erstellen", "neues projekt", "projekt hinzufügen"],
    today: [
      "was soll ich tun",
      "was mache ich",
      "nächster schritt",
      "hilf mir",
      "was ist heute wichtig",
      "fokus heute",
    ],
    risks: ["risiken", "risiko zeigen", "risiko"],
    search: ["suchen", "finde", "suche"],
    note: ["notiz", "idee", "notiere", "merken"],
    reminder: ["erinnere mich", "erinnerung", "reminder"],
    openPrefix: ["öffne", "gehe zu", "zeige"],
    taskTitleQuestion: "Wie soll die Aufgabe heißen?",
    projectTitleQuestion: "Wie soll das Projekt heißen?",
    reminderTimeQuestion: "Wann soll ich erinnern?",
    unknownSummary: "Ich kann einen Entwurf speichern, brauche aber einen klareren Befehl.",
    unknownQuestion: "Was soll ich damit machen?",
    labels: {
      create_task: "Aufgabe erstellen",
      create_project: "Projekt erstellen",
      show_today: "Prioritäten heute",
      show_risks: "Risiken zeigen",
      search: "Suche",
      draft_note: "Notiz-Entwurf",
      draft_reminder: "Erinnerungs-Entwurf",
      open_route: "Navigieren",
      unknown: "Unbekannter Befehl",
    },
    quick: {
      task: ["Anrufen", "Dokumente vorbereiten", "Kaufen", "Projekt prüfen"],
      project: ["Geschäftsprojekt", "Zuhause", "DigitalInvest", "Persönlich"],
      note: ["Als Notiz", "Als Aufgabe", "An Projekt", "Später fragen"],
      reminder: ["Heute", "Morgen", "Diese Woche", "Später fragen"],
      unknown: ["Als Notiz", "Als Aufgabe", "Projekt erstellen", "Heute zeigen"],
    },
    advice: {
      taskDeadline: "Bei Frist: heute, morgen oder Datum nennen.",
      taskProject: "Bei Projektbezug den Projektnamen nennen.",
      projectOutcome: "Ein gutes Projekt hat Ergebnis, Owner und ersten Schritt.",
      projectTask: "Nach Erstellung erste Aufgabe hinzufügen.",
      todayFocus: "Eine konkrete Aktion für heute wählen.",
      todayInbox: "Bei Unklarheit in Voice Inbox speichern.",
      risksFirst: "Zuerst Risiken prüfen.",
      riskOwner: "Risiko braucht Owner oder nächsten Schritt.",
      noteTypes: "Notiz = Kontext. Aufgabe = Verb + Aktion.",
      noteProject: "Bei aktivem Projekt beim nächsten Mal nennen.",
      reminderDraft: "Erinnerungen noch nicht verbunden — Entwurf speichern.",
      reminderTime: "Später konkrete Zeit angeben.",
      unknownSave: "Bei Unsicherheit speichere ich die Idee.",
      unknownVerbs: "Klare Verben: erstellen, öffnen, zeigen, suchen, erinnern.",
    },
    evidence: {
      createMatched: "Erstellungsphrase erkannt",
      confirmRequired: "Ausführung nur nach Bestätigung",
      source: "Quelle: lokaler Sprachparser",
      helpToday: "Hilfe-/Tagesfokus erkannt",
      dashboardBrain: "Dashboard leitet Fokus aus Daten ab",
      riskPhrase: "Risikophrase erkannt",
      riskSurface: "Projects + Daily Command Center",
      searchPhrase: "Suche erkannt",
      searchShell: "Globale Suche in der oberen Leiste",
      notePhrase: "Notiz erkannt",
      noteNotConnected: "Notizschreiben noch nicht verbunden",
      reminderPhrase: "Erinnerung erkannt",
      reminderNotConnected: "Erinnerungsausführung nicht verbunden",
      routeKeywords: "Route erkannt",
      routeMap: "Lokale Routenkarte",
      noIntent: "Befehl nicht erkannt",
      tryPhrases: "Versuche: Aufgabe erstellen, Projekt, öffnen, Risiken zeigen",
    },
    toasts: {
      taskCreated: "Aufgabe per Sprache erstellt",
      projectCreated: "Projekt per Sprache erstellt",
      notExecutable: "Diese Aktion ist noch nur Entwurf.",
      failed: "Sprachbefehl fehlgeschlagen",
      savedInbox: "In Voice Inbox gespeichert",
    },
  },
};

export function voiceBundle(locale: string, text?: string) {
  return BUNDLES[toVoiceLocale(locale, text)];
}

export const VOICE_ROUTES = [
  {
    route: "/dashboard",
    labels: { en: "Dashboard", ru: "Главная", uk: "Головна", es: "Panel", de: "Dashboard" },
    words: {
      en: ["dashboard", "home", "today"],
      ru: ["главная", "домой", "сегодня", "дашборд"],
      uk: ["головна", "дім", "сьогодні", "дашборд"],
      es: ["panel", "inicio", "hoy"],
      de: ["dashboard", "start", "heute", "zuhause"],
    },
  },
  {
    route: "/projects",
    labels: { en: "Projects", ru: "Проекты", uk: "Проєкти", es: "Proyectos", de: "Projekte" },
    words: {
      en: ["projects", "project"],
      ru: ["проекты", "проект"],
      uk: ["проєкти", "проект", "проекти"],
      es: ["proyectos", "proyecto"],
      de: ["projekte", "projekt"],
    },
  },
  {
    route: "/tasks",
    labels: { en: "Tasks", ru: "Задачи", uk: "Задачі", es: "Tareas", de: "Aufgaben" },
    words: {
      en: ["tasks", "task"],
      ru: ["задачи", "задача", "дела"],
      uk: ["задачі", "задача", "справи"],
      es: ["tareas", "tarea"],
      de: ["aufgaben", "aufgabe"],
    },
  },
  {
    route: "/inbox",
    labels: { en: "Inbox", ru: "Входящие", uk: "Вхідні", es: "Bandeja", de: "Posteingang" },
    words: {
      en: ["inbox", "notifications"],
      ru: ["инбокс", "входящие", "уведомления"],
      uk: ["інбокс", "вхідні", "сповіщення"],
      es: ["bandeja", "notificaciones"],
      de: ["posteingang", "benachrichtigungen"],
    },
  },
  {
    route: "/ai",
    labels: { en: "Sense", ru: "Sense", uk: "Sense", es: "Sense", de: "Sense" },
    words: {
      en: ["sense", "advisor", "assistant"],
      ru: ["sense", "помощник", "ассистент"],
      uk: ["sense", "помічник", "асистент"],
      es: ["sense", "asistente", "asesor"],
      de: ["sense", "assistent", "berater"],
    },
  },
  {
    route: "/settings",
    labels: {
      en: "Settings",
      ru: "Настройки",
      uk: "Налаштування",
      es: "Ajustes",
      de: "Einstellungen",
    },
    words: {
      en: ["settings"],
      ru: ["настройки"],
      uk: ["налаштування"],
      es: ["ajustes", "configuración"],
      de: ["einstellungen"],
    },
  },
] as const;

export function buildPerspectiveSpeech(
  locale: VoiceLocale,
  plan: {
    question?: string;
    executable?: boolean;
    summary: string;
    confidence: string;
    intent: string;
  },
  sense: { nova: string; vera: string },
) {
  const ru = locale === "ru" || locale === "uk";
  if (ru) {
    const operator = plan.question
      ? `${sense.nova} Нужно уточнение: ${plan.question}`
      : plan.executable
        ? `${sense.nova} Готово после подтверждения: ${plan.summary}`
        : `${sense.nova} Пока черновик: ${plan.summary}`;
    const auditor =
      plan.confidence === "low"
        ? `${sense.vera} Низкая уверенность. Уточните или сохраните, прежде чем действовать.`
        : plan.intent === "create_task"
          ? `${sense.vera} Проверьте срок, проект и ответственного.`
          : plan.intent === "show_risks"
            ? `${sense.vera} Сначала разберите риски и блокеры.`
            : `${sense.vera} Без вашего подтверждения данные не меняются.`;
    return { operator, auditor };
  }
  if (locale === "es") {
    return {
      operator: plan.question
        ? `${sense.nova} Necesito aclarar: ${plan.question}`
        : `${sense.nova} ${plan.summary}`,
      auditor: `${sense.vera} Revisa contexto y riesgo antes de confirmar.`,
    };
  }
  if (locale === "de") {
    return {
      operator: plan.question
        ? `${sense.nova} Klärung nötig: ${plan.question}`
        : `${sense.nova} ${plan.summary}`,
      auditor: `${sense.vera} Prüfe Kontext und Risiko vor der Bestätigung.`,
    };
  }
  const operator = plan.question
    ? `${sense.nova} Clarification needed: ${plan.question}`
    : plan.executable
      ? `${sense.nova} Ready after confirmation: ${plan.summary}`
      : `${sense.nova} Draft for now: ${plan.summary}`;
  const auditor =
    plan.confidence === "low"
      ? `${sense.vera} Low confidence. Clarify or save before acting.`
      : plan.intent === "create_task"
        ? `${sense.vera} Check deadline, project, and owner.`
        : plan.intent === "show_risks"
          ? `${sense.vera} Review risks and blockers first.`
          : `${sense.vera} Data won't change until you confirm.`;
  return { operator, auditor };
}
