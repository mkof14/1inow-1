import {
  Brain,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  FolderKanban,
  Inbox,
  Layers3,
  Mic,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export const publicLearningTopics = [
  {
    slug: "voice-capture",
    title: "Capture by voice",
    eyebrow: "Voice first",
    summary:
      "Use voice to collect thoughts, tasks, questions, and project signals before they disappear.",
    icon: Mic,
    image: "/marketing/voice-capture.jpg",
    sections: [
      [
        "What it means",
        "Voice capture is the fastest entry point into the system. It should save raw thoughts without forcing you to classify everything immediately.",
      ],
      [
        "How it helps",
        "A useful command center lets you capture first, then process later into tasks, notes, reminders, project risks, or decisions.",
      ],
      [
        "1inow direction",
        "The voice layer is prepared for future speech-to-text and command routing. External AI and paid speech services remain disconnected until explicit approval.",
      ],
    ],
    takeaways: ["Capture fast", "Process later", "Keep context", "Avoid losing intent"],
  },
  {
    slug: "review-queue",
    title: "Review the queue",
    eyebrow: "Inbox discipline",
    summary: "Turn scattered inputs into a clear review flow so nothing important stays hidden.",
    icon: Inbox,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "The queue is where raw inputs become useful. It can include voice notes, messages, ideas, open questions, risks, and incomplete tasks.",
      ],
      [
        "How it helps",
        "A review queue prevents the system from becoming another pile of pages. It creates one place to decide what each input really is.",
      ],
      [
        "1inow direction",
        "The next version should support triage states: keep, convert to task, attach to project, ask later, delegate, or archive.",
      ],
    ],
    takeaways: ["Collect inputs", "Clarify meaning", "Convert to action", "Archive noise"],
  },
  {
    slug: "next-action",
    title: "Create the next action",
    eyebrow: "Execution clarity",
    summary: "Convert plans into small, visible next actions that can actually move today.",
    icon: ClipboardList,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What it means",
        "A next action is the smallest useful move that advances a project, task, relationship, or decision.",
      ],
      [
        "How it helps",
        "Clear next actions reduce friction. You do not need to rethink the whole project every time you open the system.",
      ],
      [
        "1inow direction",
        "Actions should connect to projects, priorities, owners, timing, and activity history so the system can explain why an action matters.",
      ],
    ],
    takeaways: ["Make it small", "Make it visible", "Attach context", "Move today"],
  },
  {
    slug: "risk-tracking",
    title: "Track risks",
    eyebrow: "Operational awareness",
    summary: "Track risks as living signals, not static notes hidden inside project pages.",
    icon: Radar,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "Risk tracking means seeing what can block progress, create delay, damage quality, or require a decision.",
      ],
      [
        "How it helps",
        "When risks are visible, the system can guide attention before small problems become expensive surprises.",
      ],
      [
        "1inow direction",
        "Risks should connect to projects, tasks, owners, due dates, decisions, and audit history.",
      ],
    ],
    takeaways: ["See blockers", "Assign owners", "Review often", "Act early"],
  },
  {
    slug: "intelligence-layer",
    title: "Intelligence layer",
    eyebrow: "Guided work",
    summary:
      "Prepare the system to guide work, summarize context, and suggest next steps without connecting external AI too early.",
    icon: Brain,
    image: "/marketing/voice-capture.jpg",
    sections: [
      [
        "What it means",
        "The intelligence layer is the reasoning surface of the product: context, suggestions, summaries, questions, and decision support.",
      ],
      [
        "How it helps",
        "It should reduce mental load by explaining what changed, what matters, and what should happen next.",
      ],
      [
        "1inow direction",
        "AI routes remain safe stubs now. Later production integrations can include OpenAI, Anthropic, Gemini, model routing, permissions, and AI audit logs.",
      ],
    ],
    takeaways: [
      "Summarize context",
      "Suggest next moves",
      "Respect permissions",
      "Audit AI actions",
    ],
  },
  {
    slug: "operating-picture",
    title: "Today operating picture",
    eyebrow: "Daily view",
    summary: "A single visual view of current captures, tasks, active projects, and risks.",
    icon: Target,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What it means",
        "The operating picture answers what is happening today across projects, life tasks, communication, and decisions.",
      ],
      [
        "How it helps",
        "It keeps attention on movement instead of forcing users to open many disconnected pages.",
      ],
      [
        "1inow direction",
        "The dashboard should become a useful control room: current workload, active priorities, due signals, risks, and recommended review points.",
      ],
    ],
    takeaways: ["See today", "Reduce switching", "Notice drift", "Choose focus"],
  },
  {
    slug: "obvious-system",
    title: "Built to feel obvious",
    eyebrow: "Product principle",
    summary:
      "Every screen should make the next useful step clear without forcing the user to think like a database.",
    icon: Layers3,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "A living system should explain itself through layout, labels, signals, and next-step affordances.",
      ],
      [
        "How it helps",
        "Users should know what to do next without reading instructions or filling empty pages just to make the product look populated.",
      ],
      [
        "1inow direction",
        "The interface should keep moving toward visual clarity, guided states, useful empty screens, and real information hierarchy.",
      ],
    ],
    takeaways: ["Show meaning", "Guide next step", "Avoid empty noise", "Make work visible"],
  },
  {
    slug: "faq",
    title: "FAQ",
    eyebrow: "Product questions",
    summary: "Common questions about 1inow, AI readiness, privacy, and current production scope.",
    icon: CircleHelp,
    image: "/marketing/voice-capture.jpg",
    sections: [
      [
        "Is AI connected now?",
        "No. AI chat, speech-to-text, and text-to-speech are intentionally stubbed until production integration is explicitly approved.",
      ],
      [
        "Can 1inow manage projects and personal work?",
        "Yes. The product direction combines projects, tasks, voice capture, decisions, files, communication, and future assistant workflows.",
      ],
      [
        "Are paid services connected?",
        "No new paid external services should be connected without explicit approval and a separate implementation task.",
      ],
    ],
    takeaways: [
      "AI is not connected",
      "Founder flow exists",
      "External services require approval",
      "Build must stay clean",
    ],
  },
  {
    slug: "legal",
    title: "Legal",
    eyebrow: "Terms and privacy",
    summary:
      "Public legal overview for the current pre-production base. Formal policies can be expanded before launch.",
    icon: FileText,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "Current status",
        "1inow is in active product development. Public legal pages are informational until final production policies are approved.",
      ],
      [
        "Privacy direction",
        "No production secrets should be committed. User data, AI actions, permissions, and audit logs should be treated as first-class production concerns.",
      ],
      [
        "Production requirement",
        "Before launch, finalize Terms, Privacy Policy, cookie/analytics rules, data retention, and support contact paths.",
      ],
    ],
    takeaways: [
      "No secrets in repo",
      "Finalize before launch",
      "Audit sensitive actions",
      "Keep policies visible",
    ],
  },
  {
    slug: "security",
    title: "Security",
    eyebrow: "Trust foundation",
    summary:
      "The product needs clear permissions, clean environment handling, and explicit approval for integrations.",
    icon: ShieldCheck,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What matters",
        "Security starts with buildable code, no secrets in the repository, scoped environment variables, and role-based access control.",
      ],
      [
        "Access model",
        "Founder and admin flows should be separated from regular user access, with future roles for admin, manager, member, and viewer.",
      ],
      [
        "Production direction",
        "Before launch, add monitoring, audit logs, rate limits where needed, and clear service-specific permission rules.",
      ],
    ],
    takeaways: ["No secrets", "Use RBAC", "Audit changes", "Approve integrations"],
  },
  {
    slug: "projects",
    title: "Projects",
    eyebrow: "Execution engine",
    summary:
      "Projects should connect strategy, milestones, tasks, comments, risks, owners, and activity.",
    icon: FolderKanban,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "A project is not only a page. It is an execution context with goals, owners, milestones, work, blockers, and decisions.",
      ],
      [
        "How it helps",
        "When project context is structured, users can see what is active, what is stuck, and what needs attention.",
      ],
      [
        "1inow direction",
        "Project records should support milestones, tasks, subtasks, comments, attachments, activity logs, status, priority, and ownership.",
      ],
    ],
    takeaways: ["Connect work", "Track progress", "Expose blockers", "Preserve history"],
  },
  {
    slug: "automation-readiness",
    title: "Automation readiness",
    eyebrow: "Future workflows",
    summary: "Automation should come after the workflow is clear, useful, and safe for daily use.",
    icon: Sparkles,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What it means",
        "Automation readiness means the product can safely suggest, prepare, or execute repetitive work only when permissions and audit trails are clear.",
      ],
      [
        "How it helps",
        "Good automation reduces repetitive steps. Bad automation hides risk. 1inow should avoid automating before the human workflow is reliable.",
      ],
      [
        "1inow direction",
        "Future automations can include reminders, summaries, task creation, notification routing, and AI-assisted reviews after explicit approval.",
      ],
    ],
    takeaways: ["Workflow first", "Permission before action", "Audit everything", "Automate later"],
  },
] as const;

export type PublicLearningTopic = (typeof publicLearningTopics)[number];

type PublicLearningLang = "en" | "ru" | "uk" | "es" | "de";
type LearningCopy = {
  title: string;
  eyebrow: string;
  summary: string;
  sections: ReadonlyArray<readonly [string, string]>;
  takeaways: ReadonlyArray<string>;
};

const supportedLearningLangs = new Set(["en", "ru", "uk", "es", "de"]);

const publicLearningTranslations: Record<
  Exclude<PublicLearningLang, "en">,
  Record<string, LearningCopy>
> = {
  ru: {
    "voice-capture": {
      title: "Захват голосом",
      eyebrow: "Сначала голос",
      summary:
        "Используйте голос, чтобы быстро сохранять мысли, задачи, вопросы и сигналы проектов, пока они не исчезли.",
      sections: [
        [
          "Что это значит",
          "Голосовой ввод должен быть самым быстрым входом в систему. Он сохраняет сырые мысли без требования сразу все классифицировать.",
        ],
        [
          "Как это помогает",
          "Полезный командный центр сначала принимает информацию, а затем помогает превратить ее в задачи, заметки, напоминания, риски или решения.",
        ],
        [
          "Направление 1inow",
          "Голосовой слой подготовлен для будущего распознавания речи и маршрутизации команд. Внешний AI и платные голосовые сервисы пока не подключены.",
        ],
      ],
      takeaways: [
        "Быстро фиксировать",
        "Обрабатывать позже",
        "Сохранять контекст",
        "Не терять намерение",
      ],
    },
    "review-queue": {
      title: "Разбор очереди",
      eyebrow: "Дисциплина входящих",
      summary: "Превращайте разрозненные входящие сигналы в понятный поток проверки.",
      sections: [
        [
          "Что это значит",
          "Очередь - место, где голосовые заметки, идеи, вопросы, риски и незавершенные задачи становятся полезными.",
        ],
        [
          "Как это помогает",
          "Единая очередь не дает системе превратиться в набор пустых страниц и помогает решить, чем является каждый входящий сигнал.",
        ],
        [
          "Направление 1inow",
          "Следующая логика должна поддерживать состояния: оставить, превратить в задачу, привязать к проекту, спросить позже, делегировать или архивировать.",
        ],
      ],
      takeaways: ["Собирать входящие", "Прояснять смысл", "Превращать в действие", "Убирать шум"],
    },
    "next-action": {
      title: "Следующее действие",
      eyebrow: "Ясность исполнения",
      summary: "Превращайте планы в маленькие видимые действия, которые реально двигают день.",
      sections: [
        [
          "Что это значит",
          "Следующее действие - самый маленький полезный шаг, который продвигает проект, задачу, разговор или решение.",
        ],
        [
          "Как это помогает",
          "Понятные действия снижают трение. Не нужно каждый раз заново думать обо всем проекте.",
        ],
        [
          "Направление 1inow",
          "Действия должны быть связаны с проектами, приоритетами, владельцами, сроками и историей активности.",
        ],
      ],
      takeaways: ["Сделать маленьким", "Сделать видимым", "Добавить контекст", "Двигать сегодня"],
    },
    "risk-tracking": {
      title: "Контроль рисков",
      eyebrow: "Операционная осознанность",
      summary: "Отслеживайте риски как живые сигналы, а не как скрытые заметки внутри проектов.",
      sections: [
        [
          "Что это значит",
          "Контроль рисков показывает, что может заблокировать прогресс, создать задержку, ухудшить качество или потребовать решения.",
        ],
        [
          "Как это помогает",
          "Когда риски видимы, система направляет внимание до того, как маленькие проблемы становятся дорогими сюрпризами.",
        ],
        [
          "Направление 1inow",
          "Риски должны связываться с проектами, задачами, владельцами, сроками, решениями и историей изменений.",
        ],
      ],
      takeaways: [
        "Видеть блокеры",
        "Назначать владельцев",
        "Проверять регулярно",
        "Действовать раньше",
      ],
    },
    "intelligence-layer": {
      title: "Интеллектуальный слой",
      eyebrow: "Управляемая работа",
      summary:
        "Готовьте систему к подсказкам, сводкам и следующим шагам без преждевременного подключения внешнего AI.",
      sections: [
        [
          "Что это значит",
          "Интеллектуальный слой - поверхность рассуждения продукта: контекст, советы, сводки, вопросы и поддержка решений.",
        ],
        [
          "Как это помогает",
          "Он снижает нагрузку, объясняя что изменилось, что важно и что лучше сделать дальше.",
        ],
        [
          "Направление 1inow",
          "AI-маршруты пока остаются безопасными заглушками. Позже можно подключить OpenAI, Anthropic, Gemini, роутер моделей, права и аудит AI-действий.",
        ],
      ],
      takeaways: ["Сводить контекст", "Предлагать шаги", "Уважать права", "Аудировать AI"],
    },
    "operating-picture": {
      title: "Операционная картина дня",
      eyebrow: "Ежедневный обзор",
      summary: "Один визуальный обзор текущих записей, задач, активных проектов и рисков.",
      sections: [
        [
          "Что это значит",
          "Операционная картина отвечает, что происходит сегодня в проектах, личных делах, коммуникации и решениях.",
        ],
        [
          "Как это помогает",
          "Она удерживает внимание на движении, а не заставляет открывать много разрозненных страниц.",
        ],
        [
          "Направление 1inow",
          "Dashboard должен стать полезной панелью управления: нагрузка, приоритеты, сроки, риски и точки ревью.",
        ],
      ],
      takeaways: [
        "Видеть сегодня",
        "Меньше переключаться",
        "Замечать отклонения",
        "Выбирать фокус",
      ],
    },
    "obvious-system": {
      title: "Система, понятная сразу",
      eyebrow: "Принцип продукта",
      summary:
        "Каждый экран должен показывать следующий полезный шаг без мышления в стиле базы данных.",
      sections: [
        [
          "Что это значит",
          "Живая система объясняет себя через структуру, подписи, сигналы и доступные следующие действия.",
        ],
        [
          "Как это помогает",
          "Пользователь понимает, что делать дальше, без инструкций и без заполнения пустых страниц ради вида.",
        ],
        [
          "Направление 1inow",
          "Интерфейс должен двигаться к визуальной ясности, управляемым состояниям, полезным пустым экранам и реальной иерархии информации.",
        ],
      ],
      takeaways: [
        "Показывать смысл",
        "Вести к шагу",
        "Убирать пустой шум",
        "Делать работу видимой",
      ],
    },
    faq: {
      title: "FAQ",
      eyebrow: "Вопросы о продукте",
      summary:
        "Ключевые вопросы о 1inow, готовности AI, приватности и текущем производственном объеме.",
      sections: [
        [
          "AI уже подключен?",
          "Нет. AI-чат, speech-to-text и text-to-speech намеренно заглушены до отдельного утверждения производственной интеграции.",
        ],
        [
          "Можно управлять проектами и личными делами?",
          "Да. Направление продукта объединяет проекты, задачи, голосовой ввод, решения, файлы, коммуникацию и будущего помощника.",
        ],
        [
          "Платные сервисы подключены?",
          "Нет. Новые платные внешние сервисы подключаются только после явного утверждения и отдельной задачи.",
        ],
      ],
      takeaways: [
        "AI не подключен",
        "Founder flow есть",
        "Сервисы требуют approval",
        "Build должен быть чистым",
      ],
    },
    legal: {
      title: "Legal",
      eyebrow: "Условия и приватность",
      summary:
        "Публичный правовой обзор текущей pre-production базы. Формальные политики расширяются перед запуском.",
      sections: [
        [
          "Текущий статус",
          "1inow находится в активной разработке. Публичные legal-страницы носят информационный характер до утверждения финальных политик.",
        ],
        [
          "Приватность",
          "Секреты нельзя хранить в репозитории. Данные пользователей, AI-действия, права и аудит должны быть базовой частью продукта.",
        ],
        [
          "Перед запуском",
          "Нужно финализировать Terms, Privacy Policy, cookie/analytics rules, retention и каналы поддержки.",
        ],
      ],
      takeaways: [
        "Без секретов в repo",
        "Финализировать до launch",
        "Аудировать чувствительные действия",
        "Держать политики видимыми",
      ],
    },
    security: {
      title: "Безопасность",
      eyebrow: "Основа доверия",
      summary:
        "Продукту нужны понятные права, чистая работа с окружением и явное утверждение интеграций.",
      sections: [
        [
          "Что важно",
          "Безопасность начинается с buildable-кода, отсутствия секретов в репозитории, ограниченных env-переменных и RBAC.",
        ],
        [
          "Модель доступа",
          "Founder/admin потоки должны быть отделены от обычных пользователей, с ролями admin, manager, member и viewer.",
        ],
        [
          "Производственное направление",
          "Перед launch нужны monitoring, audit logs, rate limits и правила прав для каждого сервиса.",
        ],
      ],
      takeaways: [
        "Без секретов",
        "Использовать RBAC",
        "Аудировать изменения",
        "Утверждать интеграции",
      ],
    },
    projects: {
      title: "Проекты",
      eyebrow: "Двигатель исполнения",
      summary:
        "Проекты должны связывать стратегию, milestones, задачи, комментарии, риски, владельцев и активность.",
      sections: [
        [
          "Что это значит",
          "Проект - не просто страница. Это контекст исполнения с целями, владельцами, этапами, работой, блокерами и решениями.",
        ],
        [
          "Как это помогает",
          "Когда контекст структурирован, видно что активно, что застряло и что требует внимания.",
        ],
        [
          "Направление 1inow",
          "Проекты должны поддерживать milestones, tasks, subtasks, comments, attachments, activity logs, status, priority и ownership.",
        ],
      ],
      takeaways: ["Связывать работу", "Видеть прогресс", "Показывать блокеры", "Сохранять историю"],
    },
    "automation-readiness": {
      title: "Готовность к автоматизации",
      eyebrow: "Будущие процессы",
      summary:
        "Автоматизация должна появляться после того, как workflow стал понятным, полезным и безопасным.",
      sections: [
        [
          "Что это значит",
          "Готовность к автоматизации означает, что продукт может безопасно предлагать, готовить или выполнять повторяемую работу только при ясных правах и аудите.",
        ],
        [
          "Как это помогает",
          "Хорошая автоматизация снижает рутину. Плохая скрывает риск. 1inow должен сначала сделать человеческий workflow надежным.",
        ],
        [
          "Направление 1inow",
          "Будущие автоматизации: reminders, summaries, task creation, notification routing и AI-assisted reviews после отдельного approval.",
        ],
      ],
      takeaways: [
        "Сначала workflow",
        "Права до действий",
        "Аудировать все",
        "Автоматизировать позже",
      ],
    },
  },
  uk: {
    "voice-capture": {
      title: "Захоплення голосом",
      eyebrow: "Спочатку голос",
      summary:
        "Використовуйте голос, щоб швидко зберігати думки, задачі, питання і сигнали проєктів.",
      sections: [
        [
          "Що це означає",
          "Голосовий ввід має бути найшвидшим входом у систему без вимоги одразу все класифікувати.",
        ],
        [
          "Як це допомагає",
          "Командний центр спершу приймає інформацію, а потім допомагає перетворити її на задачі, нотатки, нагадування, ризики або рішення.",
        ],
        [
          "Напрям 1inow",
          "Голосовий шар підготовлений для майбутнього speech-to-text і маршрутизації команд. Зовнішній AI і платні голосові сервіси поки не підключені.",
        ],
      ],
      takeaways: [
        "Фіксувати швидко",
        "Обробляти пізніше",
        "Зберігати контекст",
        "Не втрачати намір",
      ],
    },
    "review-queue": {
      title: "Перегляд черги",
      eyebrow: "Дисципліна вхідних",
      summary: "Перетворюйте розрізнені сигнали на зрозумілий потік перевірки.",
      sections: [
        [
          "Що це означає",
          "Черга - місце, де голосові нотатки, ідеї, питання, ризики і незавершені задачі стають корисними.",
        ],
        [
          "Як це допомагає",
          "Єдина черга не дає системі стати набором порожніх сторінок і допомагає вирішити, чим є кожен сигнал.",
        ],
        [
          "Напрям 1inow",
          "Наступна логіка має підтримувати стани: залишити, перетворити на задачу, прив'язати до проєкту, запитати пізніше, делегувати або архівувати.",
        ],
      ],
      takeaways: ["Збирати вхідні", "Уточнювати сенс", "Перетворювати на дію", "Прибирати шум"],
    },
    "next-action": {
      title: "Наступна дія",
      eyebrow: "Ясність виконання",
      summary: "Перетворюйте плани на маленькі видимі дії, які реально рухають день.",
      sections: [
        [
          "Що це означає",
          "Наступна дія - найменший корисний крок, який просуває проєкт, задачу, розмову або рішення.",
        ],
        [
          "Як це допомагає",
          "Чіткі дії зменшують тертя. Не треба щоразу заново осмислювати весь проєкт.",
        ],
        [
          "Напрям 1inow",
          "Дії мають бути пов'язані з проєктами, пріоритетами, власниками, строками та історією активності.",
        ],
      ],
      takeaways: ["Зробити малим", "Зробити видимим", "Додати контекст", "Рухати сьогодні"],
    },
    "risk-tracking": {
      title: "Контроль ризиків",
      eyebrow: "Операційна обізнаність",
      summary: "Відстежуйте ризики як живі сигнали, а не як приховані нотатки в проєктах.",
      sections: [
        [
          "Що це означає",
          "Контроль ризиків показує, що може заблокувати прогрес, створити затримку, погіршити якість або потребувати рішення.",
        ],
        [
          "Як це допомагає",
          "Коли ризики видимі, система спрямовує увагу до того, як малі проблеми стають дорогими сюрпризами.",
        ],
        [
          "Напрям 1inow",
          "Ризики мають зв'язуватися з проєктами, задачами, власниками, строками, рішеннями та історією змін.",
        ],
      ],
      takeaways: ["Бачити блокери", "Призначати власників", "Переглядати часто", "Діяти раніше"],
    },
    "intelligence-layer": {
      title: "Інтелектуальний шар",
      eyebrow: "Керована робота",
      summary:
        "Готуйте систему до підказок, підсумків і наступних кроків без раннього підключення зовнішнього AI.",
      sections: [
        [
          "Що це означає",
          "Інтелектуальний шар - поверхня мислення продукту: контекст, поради, підсумки, питання і підтримка рішень.",
        ],
        [
          "Як це допомагає",
          "Він зменшує навантаження, пояснюючи що змінилося, що важливо і що краще зробити далі.",
        ],
        [
          "Напрям 1inow",
          "AI-маршрути поки залишаються безпечними заглушками. Пізніше можливі OpenAI, Anthropic, Gemini, router моделей, права і аудит AI-дій.",
        ],
      ],
      takeaways: ["Підсумовувати контекст", "Пропонувати кроки", "Поважати права", "Аудит AI"],
    },
    "operating-picture": {
      title: "Операційна картина дня",
      eyebrow: "Щоденний огляд",
      summary: "Один візуальний огляд поточних записів, задач, активних проєктів і ризиків.",
      sections: [
        [
          "Що це означає",
          "Операційна картина відповідає, що сьогодні відбувається в проєктах, особистих справах, комунікації та рішеннях.",
        ],
        [
          "Як це допомагає",
          "Вона тримає увагу на русі, а не змушує відкривати багато роз'єднаних сторінок.",
        ],
        [
          "Напрям 1inow",
          "Dashboard має стати панеллю управління: навантаження, пріоритети, строки, ризики і точки перегляду.",
        ],
      ],
      takeaways: ["Бачити сьогодні", "Менше перемикань", "Помічати відхилення", "Обирати фокус"],
    },
    "obvious-system": {
      title: "Система, зрозуміла одразу",
      eyebrow: "Принцип продукту",
      summary:
        "Кожен екран має показувати наступний корисний крок без мислення у стилі бази даних.",
      sections: [
        [
          "Що це означає",
          "Жива система пояснює себе через структуру, підписи, сигнали і доступні наступні дії.",
        ],
        [
          "Як це допомагає",
          "Користувач розуміє, що робити далі, без інструкцій і без заповнення порожніх сторінок для вигляду.",
        ],
        [
          "Напрям 1inow",
          "Інтерфейс має рухатися до візуальної ясності, керованих станів, корисних порожніх екранів і реальної ієрархії інформації.",
        ],
      ],
      takeaways: ["Показувати сенс", "Вести до кроку", "Прибирати шум", "Робити роботу видимою"],
    },
    faq: {
      title: "FAQ",
      eyebrow: "Питання про продукт",
      summary: "Ключові питання про 1inow, готовність AI, приватність і поточний production scope.",
      sections: [
        [
          "AI вже підключений?",
          "Ні. AI chat, speech-to-text і text-to-speech навмисно заглушені до окремого затвердження production integration.",
        ],
        [
          "Можна керувати проєктами й особистими справами?",
          "Так. Напрям продукту поєднує проєкти, задачі, голос, рішення, файли, комунікацію і майбутнього помічника.",
        ],
        [
          "Платні сервіси підключені?",
          "Ні. Нові платні зовнішні сервіси підключаються тільки після явного approval і окремої задачі.",
        ],
      ],
      takeaways: [
        "AI не підключений",
        "Founder flow існує",
        "Сервіси потребують approval",
        "Build має бути чистим",
      ],
    },
    legal: {
      title: "Legal",
      eyebrow: "Умови і приватність",
      summary:
        "Публічний правовий огляд поточної pre-production бази. Формальні політики розширюються перед запуском.",
      sections: [
        [
          "Поточний статус",
          "1inow перебуває в активній розробці. Legal-сторінки є інформаційними до затвердження фінальних політик.",
        ],
        [
          "Приватність",
          "Секрети не можна зберігати в репозиторії. Дані користувачів, AI-дії, права і аудит мають бути базовою частиною продукту.",
        ],
        [
          "Перед запуском",
          "Потрібно фіналізувати Terms, Privacy Policy, cookie/analytics rules, retention і канали підтримки.",
        ],
      ],
      takeaways: [
        "Без секретів у repo",
        "Фіналізувати до launch",
        "Аудит чутливих дій",
        "Політики мають бути видимими",
      ],
    },
    security: {
      title: "Безпека",
      eyebrow: "Основа довіри",
      summary:
        "Продукту потрібні зрозумілі права, чисте середовище і явне затвердження інтеграцій.",
      sections: [
        [
          "Що важливо",
          "Безпека починається з buildable-коду, відсутності секретів у repo, обмежених env-змінних і RBAC.",
        ],
        [
          "Модель доступу",
          "Founder/admin потоки мають бути відокремлені від звичайних користувачів, з ролями admin, manager, member і viewer.",
        ],
        [
          "Production напрям",
          "Перед launch потрібні monitoring, audit logs, rate limits і правила прав для кожного сервісу.",
        ],
      ],
      takeaways: ["Без секретів", "RBAC", "Аудит змін", "Затверджувати інтеграції"],
    },
    projects: {
      title: "Проєкти",
      eyebrow: "Двигун виконання",
      summary:
        "Проєкти мають зв'язувати стратегію, milestones, задачі, коментарі, ризики, власників і активність.",
      sections: [
        [
          "Що це означає",
          "Проєкт - не просто сторінка. Це контекст виконання з цілями, власниками, етапами, роботою, блокерами і рішеннями.",
        ],
        [
          "Як це допомагає",
          "Коли контекст структурований, видно що активне, що застрягло і що потребує уваги.",
        ],
        [
          "Напрям 1inow",
          "Проєкти мають підтримувати milestones, tasks, subtasks, comments, attachments, activity logs, status, priority і ownership.",
        ],
      ],
      takeaways: [
        "Зв'язувати роботу",
        "Відстежувати прогрес",
        "Показувати блокери",
        "Зберігати історію",
      ],
    },
    "automation-readiness": {
      title: "Готовність до автоматизації",
      eyebrow: "Майбутні процеси",
      summary:
        "Автоматизація має з'являтися після того, як workflow став зрозумілим, корисним і безпечним.",
      sections: [
        [
          "Що це означає",
          "Готовність до автоматизації означає, що продукт може безпечно пропонувати, готувати або виконувати повторювану роботу лише за ясних прав і аудиту.",
        ],
        [
          "Як це допомагає",
          "Хороша автоматизація зменшує рутину. Погана приховує ризик. 1inow має спершу зробити людський workflow надійним.",
        ],
        [
          "Напрям 1inow",
          "Майбутні автоматизації: reminders, summaries, task creation, notification routing і AI-assisted reviews після окремого approval.",
        ],
      ],
      takeaways: ["Спочатку workflow", "Права до дій", "Аудит усього", "Автоматизувати пізніше"],
    },
  },
  es: {
    "voice-capture": {
      title: "Captura por voz",
      eyebrow: "Voz primero",
      summary:
        "Use la voz para guardar ideas, tareas, preguntas y señales de proyectos antes de que se pierdan.",
      sections: [
        [
          "Qué significa",
          "La voz debe ser la entrada más rápida al sistema, sin obligar a clasificar todo de inmediato.",
        ],
        [
          "Cómo ayuda",
          "Un buen centro de mando captura primero y después convierte la información en tareas, notas, recordatorios, riesgos o decisiones.",
        ],
        [
          "Dirección de 1inow",
          "La capa de voz está preparada para speech-to-text y enrutamiento de comandos. AI externa y servicios pagos siguen desconectados.",
        ],
      ],
      takeaways: [
        "Capturar rápido",
        "Procesar después",
        "Mantener contexto",
        "No perder intención",
      ],
    },
    "review-queue": {
      title: "Revisar la cola",
      eyebrow: "Disciplina de entrada",
      summary: "Convierta entradas dispersas en un flujo claro de revisión.",
      sections: [
        [
          "Qué significa",
          "La cola es donde notas de voz, ideas, preguntas, riesgos y tareas incompletas se vuelven útiles.",
        ],
        [
          "Cómo ayuda",
          "Una cola única evita otra pila de páginas y ayuda a decidir qué es cada entrada.",
        ],
        [
          "Dirección de 1inow",
          "La siguiente versión debe soportar estados: conservar, convertir en tarea, unir a proyecto, preguntar luego, delegar o archivar.",
        ],
      ],
      takeaways: [
        "Recolectar entradas",
        "Aclarar sentido",
        "Convertir en acción",
        "Archivar ruido",
      ],
    },
    "next-action": {
      title: "Crear la siguiente acción",
      eyebrow: "Claridad de ejecución",
      summary: "Convierta planes en acciones pequeñas y visibles que puedan mover el día.",
      sections: [
        [
          "Qué significa",
          "Una siguiente acción es el paso útil más pequeño que avanza un proyecto, tarea, relación o decisión.",
        ],
        [
          "Cómo ayuda",
          "Las acciones claras reducen fricción. No hay que repensar todo el proyecto cada vez.",
        ],
        [
          "Dirección de 1inow",
          "Las acciones deben conectarse con proyectos, prioridades, responsables, fechas e historial de actividad.",
        ],
      ],
      takeaways: ["Hacerlo pequeño", "Hacerlo visible", "Adjuntar contexto", "Mover hoy"],
    },
    "risk-tracking": {
      title: "Seguimiento de riesgos",
      eyebrow: "Conciencia operativa",
      summary: "Siga los riesgos como señales vivas, no como notas escondidas.",
      sections: [
        [
          "Qué significa",
          "El seguimiento muestra qué puede bloquear progreso, crear retrasos, dañar calidad o requerir una decisión.",
        ],
        [
          "Cómo ayuda",
          "Cuando los riesgos son visibles, el sistema guía la atención antes de que pequeños problemas se vuelvan costosos.",
        ],
        [
          "Dirección de 1inow",
          "Los riesgos deben conectarse con proyectos, tareas, responsables, fechas, decisiones e historial.",
        ],
      ],
      takeaways: ["Ver bloqueos", "Asignar dueños", "Revisar seguido", "Actuar temprano"],
    },
    "intelligence-layer": {
      title: "Capa de inteligencia",
      eyebrow: "Trabajo guiado",
      summary:
        "Prepare el sistema para guiar, resumir y sugerir pasos sin conectar AI externa demasiado pronto.",
      sections: [
        [
          "Qué significa",
          "La capa de inteligencia es la superficie de razonamiento: contexto, sugerencias, resúmenes, preguntas y soporte de decisiones.",
        ],
        [
          "Cómo ayuda",
          "Reduce carga mental explicando qué cambió, qué importa y qué debe pasar después.",
        ],
        [
          "Dirección de 1inow",
          "Las rutas de AI siguen como stubs seguros. Más tarde pueden incluir OpenAI, Anthropic, Gemini, router de modelos, permisos y auditoría.",
        ],
      ],
      takeaways: ["Resumir contexto", "Sugerir movimientos", "Respetar permisos", "Auditar AI"],
    },
    "operating-picture": {
      title: "Imagen operativa de hoy",
      eyebrow: "Vista diaria",
      summary: "Una sola vista visual de capturas, tareas, proyectos activos y riesgos.",
      sections: [
        [
          "Qué significa",
          "La imagen operativa responde qué pasa hoy en proyectos, vida personal, comunicación y decisiones.",
        ],
        [
          "Cómo ayuda",
          "Mantiene la atención en movimiento sin abrir muchas páginas desconectadas.",
        ],
        [
          "Dirección de 1inow",
          "El dashboard debe ser una sala de control: carga, prioridades, fechas, riesgos y puntos de revisión.",
        ],
      ],
      takeaways: ["Ver hoy", "Reducir cambios", "Detectar desvíos", "Elegir foco"],
    },
    "obvious-system": {
      title: "Diseñado para sentirse obvio",
      eyebrow: "Principio de producto",
      summary:
        "Cada pantalla debe aclarar el siguiente paso útil sin hacer pensar como una base de datos.",
      sections: [
        [
          "Qué significa",
          "Un sistema vivo se explica con estructura, etiquetas, señales y acciones claras.",
        ],
        [
          "Cómo ayuda",
          "El usuario sabe qué hacer después sin instrucciones ni páginas vacías de relleno.",
        ],
        [
          "Dirección de 1inow",
          "La interfaz debe avanzar hacia claridad visual, estados guiados, vacíos útiles y jerarquía real.",
        ],
      ],
      takeaways: ["Mostrar sentido", "Guiar el paso", "Evitar ruido", "Hacer visible el trabajo"],
    },
    faq: {
      title: "FAQ",
      eyebrow: "Preguntas del producto",
      summary: "Preguntas sobre 1inow, preparación de AI, privacidad y alcance actual.",
      sections: [
        [
          "¿AI está conectada?",
          "No. AI chat, speech-to-text y text-to-speech están intencionalmente en stub hasta aprobación de producción.",
        ],
        [
          "¿Puede gestionar proyectos y trabajo personal?",
          "Sí. El producto combina proyectos, tareas, voz, decisiones, archivos, comunicación y futuros flujos de asistente.",
        ],
        [
          "¿Hay servicios pagos conectados?",
          "No. Ningún servicio externo pago se conecta sin aprobación explícita y una tarea separada.",
        ],
      ],
      takeaways: [
        "AI no conectada",
        "Founder flow existe",
        "Servicios requieren aprobación",
        "Build limpio",
      ],
    },
    legal: {
      title: "Legal",
      eyebrow: "Términos y privacidad",
      summary:
        "Resumen legal público de la base pre-producción. Las políticas formales se ampliarán antes del lanzamiento.",
      sections: [
        [
          "Estado actual",
          "1inow está en desarrollo activo. Las páginas legales son informativas hasta aprobar políticas finales.",
        ],
        [
          "Privacidad",
          "No se deben commitear secretos. Datos, acciones de AI, permisos y auditoría son preocupaciones de producción.",
        ],
        [
          "Antes del lanzamiento",
          "Finalizar Terms, Privacy Policy, reglas de cookies/analytics, retención de datos y soporte.",
        ],
      ],
      takeaways: [
        "Sin secretos",
        "Finalizar antes de launch",
        "Auditar acciones sensibles",
        "Políticas visibles",
      ],
    },
    security: {
      title: "Seguridad",
      eyebrow: "Base de confianza",
      summary:
        "El producto necesita permisos claros, entorno limpio y aprobación explícita para integraciones.",
      sections: [
        [
          "Qué importa",
          "La seguridad empieza con código buildable, sin secretos en el repo, variables limitadas y RBAC.",
        ],
        [
          "Modelo de acceso",
          "Founder/admin deben separarse de usuarios normales, con roles admin, manager, member y viewer.",
        ],
        [
          "Dirección de producción",
          "Antes del launch, agregar monitoring, audit logs, rate limits y reglas por servicio.",
        ],
      ],
      takeaways: ["Sin secretos", "Usar RBAC", "Auditar cambios", "Aprobar integraciones"],
    },
    projects: {
      title: "Proyectos",
      eyebrow: "Motor de ejecución",
      summary:
        "Los proyectos deben conectar estrategia, hitos, tareas, comentarios, riesgos, responsables y actividad.",
      sections: [
        [
          "Qué significa",
          "Un proyecto no es solo una página. Es un contexto de ejecución con metas, dueños, hitos, trabajo, bloqueos y decisiones.",
        ],
        [
          "Cómo ayuda",
          "Cuando el contexto está estructurado, se ve qué está activo, qué está detenido y qué necesita atención.",
        ],
        [
          "Dirección de 1inow",
          "Los registros deben soportar milestones, tasks, subtasks, comments, attachments, activity logs, status, priority y ownership.",
        ],
      ],
      takeaways: ["Conectar trabajo", "Ver progreso", "Exponer bloqueos", "Preservar historia"],
    },
    "automation-readiness": {
      title: "Preparación para automatización",
      eyebrow: "Flujos futuros",
      summary: "La automatización debe llegar después de que el workflow sea claro, útil y seguro.",
      sections: [
        [
          "Qué significa",
          "El producto puede sugerir, preparar o ejecutar trabajo repetitivo solo con permisos y auditoría claros.",
        ],
        [
          "Cómo ayuda",
          "Buena automatización reduce rutina. Mala automatización oculta riesgo. 1inow debe validar primero el flujo humano.",
        ],
        [
          "Dirección de 1inow",
          "Automatizaciones futuras: reminders, summaries, task creation, notification routing y AI-assisted reviews tras aprobación.",
        ],
      ],
      takeaways: ["Workflow primero", "Permisos antes", "Auditar todo", "Automatizar después"],
    },
  },
  de: {
    "voice-capture": {
      title: "Per Stimme erfassen",
      eyebrow: "Voice first",
      summary:
        "Nutzen Sie Sprache, um Gedanken, Aufgaben, Fragen und Projektsignale sofort festzuhalten.",
      sections: [
        [
          "Was es bedeutet",
          "Sprache soll der schnellste Einstieg sein, ohne sofort alles klassifizieren zu müssen.",
        ],
        [
          "Wie es hilft",
          "Ein gutes Command Center erfasst zuerst und verarbeitet später zu Aufgaben, Notizen, Erinnerungen, Risiken oder Entscheidungen.",
        ],
        [
          "1inow Richtung",
          "Die Voice-Ebene ist für künftiges Speech-to-Text und Command Routing vorbereitet. Externe AI und bezahlte Voice-Services bleiben aus.",
        ],
      ],
      takeaways: [
        "Schnell erfassen",
        "Später verarbeiten",
        "Kontext halten",
        "Absicht nicht verlieren",
      ],
    },
    "review-queue": {
      title: "Queue prüfen",
      eyebrow: "Inbox Disziplin",
      summary: "Verwandeln Sie verstreute Eingaben in einen klaren Review-Flow.",
      sections: [
        [
          "Was es bedeutet",
          "Die Queue macht aus Voice Notes, Ideen, Fragen, Risiken und offenen Aufgaben verwertbare Arbeit.",
        ],
        [
          "Wie es hilft",
          "Eine zentrale Queue verhindert neue Seitenhaufen und klärt, was jede Eingabe wirklich ist.",
        ],
        [
          "1inow Richtung",
          "Die nächste Version sollte Zustände unterstützen: behalten, Aufgabe erstellen, Projekt zuordnen, später fragen, delegieren oder archivieren.",
        ],
      ],
      takeaways: [
        "Eingaben sammeln",
        "Bedeutung klären",
        "In Aktion wandeln",
        "Rauschen archivieren",
      ],
    },
    "next-action": {
      title: "Nächste Aktion erstellen",
      eyebrow: "Ausführungsklarheit",
      summary: "Machen Sie aus Plänen kleine sichtbare Aktionen, die heute wirklich bewegen.",
      sections: [
        [
          "Was es bedeutet",
          "Eine nächste Aktion ist der kleinste nützliche Schritt für ein Projekt, eine Aufgabe, Beziehung oder Entscheidung.",
        ],
        [
          "Wie es hilft",
          "Klare Aktionen reduzieren Reibung. Man muss nicht jedes Mal das ganze Projekt neu denken.",
        ],
        [
          "1inow Richtung",
          "Aktionen sollen mit Projekten, Prioritäten, Ownern, Zeitpunkten und Aktivitätshistorie verbunden sein.",
        ],
      ],
      takeaways: ["Klein machen", "Sichtbar machen", "Kontext anhängen", "Heute bewegen"],
    },
    "risk-tracking": {
      title: "Risiken verfolgen",
      eyebrow: "Operative Klarheit",
      summary: "Verfolgen Sie Risiken als lebendige Signale, nicht als versteckte Projektnotizen.",
      sections: [
        [
          "Was es bedeutet",
          "Risk Tracking zeigt, was Fortschritt blockieren, verzögern, Qualität beschädigen oder Entscheidungen erfordern kann.",
        ],
        [
          "Wie es hilft",
          "Sichtbare Risiken lenken Aufmerksamkeit, bevor kleine Probleme teuer werden.",
        ],
        [
          "1inow Richtung",
          "Risiken sollten mit Projekten, Aufgaben, Ownern, Fristen, Entscheidungen und Audit-Historie verbunden sein.",
        ],
      ],
      takeaways: ["Blocker sehen", "Owner setzen", "Regelmäßig prüfen", "Früh handeln"],
    },
    "intelligence-layer": {
      title: "Intelligenzschicht",
      eyebrow: "Geführte Arbeit",
      summary:
        "Bereiten Sie das System auf Führung, Zusammenfassungen und nächste Schritte vor, ohne externe AI zu früh anzuschließen.",
      sections: [
        [
          "Was es bedeutet",
          "Die Intelligenzschicht ist die Denkfläche des Produkts: Kontext, Vorschläge, Zusammenfassungen, Fragen und Entscheidungshilfe.",
        ],
        [
          "Wie es hilft",
          "Sie reduziert mentale Last, indem sie erklärt, was sich geändert hat, was zählt und was als Nächstes passieren sollte.",
        ],
        [
          "1inow Richtung",
          "AI-Routen bleiben sichere Stubs. Später möglich: OpenAI, Anthropic, Gemini, Model Router, Permissions und AI Audit Logs.",
        ],
      ],
      takeaways: [
        "Kontext bündeln",
        "Nächste Schritte vorschlagen",
        "Rechte respektieren",
        "AI auditieren",
      ],
    },
    "operating-picture": {
      title: "Operatives Tagesbild",
      eyebrow: "Tagesansicht",
      summary: "Eine visuelle Ansicht aktueller Captures, Aufgaben, aktiver Projekte und Risiken.",
      sections: [
        [
          "Was es bedeutet",
          "Das operative Bild beantwortet, was heute in Projekten, Alltag, Kommunikation und Entscheidungen passiert.",
        ],
        [
          "Wie es hilft",
          "Es hält Aufmerksamkeit auf Bewegung, statt viele getrennte Seiten öffnen zu müssen.",
        ],
        [
          "1inow Richtung",
          "Das Dashboard soll ein Control Room werden: Workload, Prioritäten, Fristen, Risiken und Review-Punkte.",
        ],
      ],
      takeaways: ["Heute sehen", "Wechsel reduzieren", "Abweichungen merken", "Fokus wählen"],
    },
    "obvious-system": {
      title: "Offensichtlich nutzbar",
      eyebrow: "Produktprinzip",
      summary:
        "Jeder Screen soll den nächsten sinnvollen Schritt zeigen, ohne Datenbankdenken zu erzwingen.",
      sections: [
        [
          "Was es bedeutet",
          "Ein lebendiges System erklärt sich durch Layout, Labels, Signale und klare nächste Aktionen.",
        ],
        [
          "Wie es hilft",
          "Nutzer wissen, was als Nächstes zu tun ist, ohne Anleitungen oder künstlich gefüllte leere Seiten.",
        ],
        [
          "1inow Richtung",
          "Die Oberfläche soll mehr visuelle Klarheit, geführte Zustände, nützliche Empty States und echte Informationshierarchie bekommen.",
        ],
      ],
      takeaways: [
        "Bedeutung zeigen",
        "Nächsten Schritt führen",
        "Leeren Lärm vermeiden",
        "Arbeit sichtbar machen",
      ],
    },
    faq: {
      title: "FAQ",
      eyebrow: "Produktfragen",
      summary:
        "Häufige Fragen zu 1inow, AI-Bereitschaft, Datenschutz und aktuellem Produktionsumfang.",
      sections: [
        [
          "Ist AI verbunden?",
          "Nein. AI Chat, Speech-to-Text und Text-to-Speech sind bewusst Stubs bis zur expliziten Produktionsfreigabe.",
        ],
        [
          "Kann 1inow Projekte und persönliche Arbeit verwalten?",
          "Ja. Die Richtung verbindet Projekte, Aufgaben, Voice Capture, Entscheidungen, Dateien, Kommunikation und künftige Assistant-Flows.",
        ],
        [
          "Sind bezahlte Services verbunden?",
          "Nein. Neue bezahlte externe Services erfordern explizite Freigabe und eine separate Aufgabe.",
        ],
      ],
      takeaways: [
        "AI nicht verbunden",
        "Founder Flow vorhanden",
        "Services brauchen Freigabe",
        "Build sauber halten",
      ],
    },
    legal: {
      title: "Legal",
      eyebrow: "Bedingungen und Datenschutz",
      summary:
        "Öffentlicher Legal-Überblick für die aktuelle Pre-Production-Basis. Formale Policies folgen vor Launch.",
      sections: [
        [
          "Aktueller Status",
          "1inow ist in aktiver Produktentwicklung. Legal-Seiten sind informativ, bis finale Policies freigegeben sind.",
        ],
        [
          "Datenschutzrichtung",
          "Keine Secrets im Repository. Nutzerdaten, AI-Aktionen, Rechte und Audit Logs sind zentrale Produktionsfragen.",
        ],
        [
          "Vor dem Launch",
          "Terms, Privacy Policy, Cookie/Analytics-Regeln, Data Retention und Support-Kontakte finalisieren.",
        ],
      ],
      takeaways: [
        "Keine Secrets",
        "Vor Launch finalisieren",
        "Sensible Aktionen auditieren",
        "Policies sichtbar halten",
      ],
    },
    security: {
      title: "Sicherheit",
      eyebrow: "Vertrauensbasis",
      summary:
        "Das Produkt braucht klare Rechte, saubere Umgebungen und explizite Freigabe für Integrationen.",
      sections: [
        [
          "Was zählt",
          "Sicherheit beginnt mit buildbarem Code, keinen Secrets im Repo, begrenzten Environment Variables und RBAC.",
        ],
        [
          "Access Model",
          "Founder- und Admin-Flows sollten von normalen Nutzern getrennt sein, mit Rollen admin, manager, member und viewer.",
        ],
        [
          "Produktionsrichtung",
          "Vor Launch: Monitoring, Audit Logs, Rate Limits und service-spezifische Permission-Regeln.",
        ],
      ],
      takeaways: [
        "Keine Secrets",
        "RBAC nutzen",
        "Änderungen auditieren",
        "Integrationen freigeben",
      ],
    },
    projects: {
      title: "Projekte",
      eyebrow: "Execution Engine",
      summary:
        "Projekte sollten Strategie, Meilensteine, Aufgaben, Kommentare, Risiken, Owner und Aktivität verbinden.",
      sections: [
        [
          "Was es bedeutet",
          "Ein Projekt ist nicht nur eine Seite. Es ist ein Ausführungskontext mit Zielen, Ownern, Meilensteinen, Arbeit, Blockern und Entscheidungen.",
        ],
        [
          "Wie es hilft",
          "Strukturierter Kontext zeigt, was aktiv ist, was steckt und was Aufmerksamkeit braucht.",
        ],
        [
          "1inow Richtung",
          "Projekt-Records sollten milestones, tasks, subtasks, comments, attachments, activity logs, status, priority und ownership unterstützen.",
        ],
      ],
      takeaways: ["Arbeit verbinden", "Fortschritt sehen", "Blocker zeigen", "Historie erhalten"],
    },
    "automation-readiness": {
      title: "Bereit für Automatisierung",
      eyebrow: "Künftige Workflows",
      summary:
        "Automatisierung sollte erst kommen, wenn der Workflow klar, nützlich und sicher ist.",
      sections: [
        [
          "Was es bedeutet",
          "Das Produkt darf repetitive Arbeit nur mit klaren Rechten und Audit Trails vorschlagen, vorbereiten oder ausführen.",
        ],
        [
          "Wie es hilft",
          "Gute Automatisierung reduziert Routine. Schlechte Automatisierung versteckt Risiko. 1inow sollte zuerst den menschlichen Workflow stabilisieren.",
        ],
        [
          "1inow Richtung",
          "Künftige Automationen: reminders, summaries, task creation, notification routing und AI-assisted reviews nach Freigabe.",
        ],
      ],
      takeaways: [
        "Workflow zuerst",
        "Rechte vor Aktion",
        "Alles auditieren",
        "Später automatisieren",
      ],
    },
  },
};

function normalizeLearningLang(lang?: string): PublicLearningLang {
  return supportedLearningLangs.has(lang ?? "") ? (lang as PublicLearningLang) : "en";
}

export function getPublicLearningTopic(slug: string, lang?: string) {
  const topic = publicLearningTopics.find((item) => item.slug === slug);
  if (!topic) return undefined;

  const normalizedLang = normalizeLearningLang(lang);
  if (normalizedLang === "en") return topic;

  const copy = publicLearningTranslations[normalizedLang]?.[slug];
  return copy ? { ...topic, ...copy } : topic;
}

export function getPublicLearningTopics(lang?: string) {
  return publicLearningTopics.map((topic) => getPublicLearningTopic(topic.slug, lang) ?? topic);
}
