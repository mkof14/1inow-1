export type PublicInfoKind = "how-it-works" | "security-trust" | "roadmap";

export type PublicInfoPage = {
  title: string;
  eyebrow: string;
  subtitle: string;
  notice: string;
  stages: Array<{
    title: string;
    text: string;
    marker: string;
  }>;
  cards: Array<{
    title: string;
    text: string;
  }>;
  cta: {
    title: string;
    text: string;
  };
};

type PublicInfoLang = "en" | "ru" | "uk" | "es" | "de";

const publicInfoPages: Record<PublicInfoKind, Record<PublicInfoLang, PublicInfoPage>> = {
  "how-it-works": {
    en: {
      title: "How 1inow works",
      eyebrow: "Operating flow",
      subtitle:
        "A simple daily loop: capture signals, understand context, organize work, execute next actions, and review what changed.",
      notice:
        "The product is designed to feel useful before AI is connected. Intelligence starts with structure, visibility, and clear decisions.",
      stages: [
        {
          marker: "01",
          title: "Capture",
          text: "Voice, notes, tasks, ideas, project signals, and risks enter one queue.",
        },
        {
          marker: "02",
          title: "Import conversations",
          text: "Meeting recordings, phone calls, recorder files, and transcripts can enter the same review flow.",
        },
        {
          marker: "03",
          title: "Understand",
          text: "The system keeps context visible: project, owner, urgency, priority, and open question.",
        },
        {
          marker: "04",
          title: "Organize",
          text: "Inputs become projects, tasks, decisions, reminders, comments, or archived noise.",
        },
        {
          marker: "05",
          title: "Execute",
          text: "The next useful action is made visible so work can move without rethinking everything.",
        },
        {
          marker: "06",
          title: "Review",
          text: "Daily and weekly review keeps priorities, risks, and decisions aligned.",
        },
      ],
      cards: [
        {
          title: "No empty-task feeling",
          text: "The interface should guide what to do next instead of becoming another static task list.",
        },
        {
          title: "Voice-ready",
          text: "Voice workflows are prepared, while speech services remain disconnected until approval.",
        },
        {
          title: "Conversation-ready",
          text: "Uploads from meetings, calls, and recorders can become summaries, decisions, risks, and tasks after approved processing.",
        },
        {
          title: "AI-ready, not AI-dependent",
          text: "Future intelligence can summarize and suggest, but the current base stays usable without external AI.",
        },
      ],
      cta: {
        title: "Start from the next real signal.",
        text: "Capture one thought, attach it to context, and turn it into the next visible move.",
      },
    },
    ru: {
      title: "Как работает 1inow",
      eyebrow: "Операционный поток",
      subtitle:
        "Простой ежедневный цикл: зафиксировать сигналы, понять контекст, организовать работу, выполнить следующие действия и проверить изменения.",
      notice:
        "Продукт должен быть полезным до подключения AI. Интеллект начинается со структуры, видимости и ясных решений.",
      stages: [
        {
          marker: "01",
          title: "Фиксация",
          text: "Голос, заметки, задачи, идеи, сигналы проектов и риски попадают в одну очередь.",
        },
        {
          marker: "02",
          title: "Импорт разговоров",
          text: "Записи встреч, телефонные разговоры, диктофонные файлы и транскрипты попадают в тот же поток разбора.",
        },
        {
          marker: "03",
          title: "Понимание",
          text: "Система держит контекст видимым: проект, владелец, срочность, приоритет и открытый вопрос.",
        },
        {
          marker: "04",
          title: "Организация",
          text: "Входящие превращаются в проекты, задачи, решения, напоминания, комментарии или архивный шум.",
        },
        {
          marker: "05",
          title: "Исполнение",
          text: "Следующее полезное действие видно сразу, чтобы двигаться без повторного обдумывания всего проекта.",
        },
        {
          marker: "06",
          title: "Ревью",
          text: "Ежедневный и недельный обзор удерживает приоритеты, риски и решения в одной логике.",
        },
      ],
      cards: [
        {
          title: "Без ощущения пустого таск-листа",
          text: "Интерфейс должен вести к действию, а не становиться очередным статичным списком задач.",
        },
        {
          title: "Готово к голосу",
          text: "Голосовые сценарии подготовлены, но speech-сервисы не подключены до отдельного approval.",
        },
        {
          title: "Готово к разговорам",
          text: "Uploads встреч, звонков и диктофонов смогут превращаться в саммари, решения, риски и задачи после утвержденной обработки.",
        },
        {
          title: "Готово к AI, но не зависит от AI",
          text: "Будущий интеллект сможет резюмировать и подсказывать, но текущая база полезна без внешнего AI.",
        },
      ],
      cta: {
        title: "Начинайте с реального сигнала.",
        text: "Запишите мысль, прикрепите контекст и превратите ее в следующий видимый шаг.",
      },
    },
    uk: {
      title: "Як працює 1inow",
      eyebrow: "Операційний потік",
      subtitle:
        "Простий щоденний цикл: зафіксувати сигнали, зрозуміти контекст, організувати роботу, виконати наступні дії і переглянути зміни.",
      notice:
        "Продукт має бути корисним до підключення AI. Інтелект починається зі структури, видимості та чітких рішень.",
      stages: [
        {
          marker: "01",
          title: "Фіксація",
          text: "Голос, нотатки, задачі, ідеї, сигнали проєктів і ризики потрапляють в одну чергу.",
        },
        {
          marker: "02",
          title: "Імпорт розмов",
          text: "Записи зустрічей, телефонні дзвінки, диктофонні файли і транскрипти потрапляють у той самий потік огляду.",
        },
        {
          marker: "03",
          title: "Розуміння",
          text: "Система тримає контекст видимим: проєкт, власник, терміновість, пріоритет і відкрите питання.",
        },
        {
          marker: "04",
          title: "Організація",
          text: "Вхідні стають проєктами, задачами, рішеннями, нагадуваннями, коментарями або архівним шумом.",
        },
        {
          marker: "05",
          title: "Виконання",
          text: "Наступна корисна дія видима одразу, щоб рухатися без повторного осмислення всього проєкту.",
        },
        {
          marker: "06",
          title: "Огляд",
          text: "Щоденний і тижневий огляд тримає пріоритети, ризики і рішення в одній логіці.",
        },
      ],
      cards: [
        {
          title: "Без порожнього task-list",
          text: "Інтерфейс має вести до дії, а не ставати черговим статичним списком задач.",
        },
        {
          title: "Готово до голосу",
          text: "Голосові сценарії підготовлені, але speech-сервіси не підключені до approval.",
        },
        {
          title: "Готово до розмов",
          text: "Uploads зустрічей, дзвінків і диктофонів зможуть ставати summary, рішеннями, ризиками і задачами після затвердженої обробки.",
        },
        {
          title: "Готово до AI, але не залежить від AI",
          text: "Майбутній інтелект зможе підсумовувати і радити, але база корисна без зовнішнього AI.",
        },
      ],
      cta: {
        title: "Починайте з реального сигналу.",
        text: "Запишіть думку, додайте контекст і перетворіть її на наступний видимий крок.",
      },
    },
    es: {
      title: "Cómo funciona 1inow",
      eyebrow: "Flujo operativo",
      subtitle:
        "Un ciclo diario simple: capturar señales, entender contexto, organizar trabajo, ejecutar acciones y revisar cambios.",
      notice:
        "El producto debe ser útil antes de conectar AI. La inteligencia empieza con estructura, visibilidad y decisiones claras.",
      stages: [
        {
          marker: "01",
          title: "Capturar",
          text: "Voz, notas, tareas, ideas, señales de proyecto y riesgos entran en una cola.",
        },
        {
          marker: "02",
          title: "Importar conversaciones",
          text: "Grabaciones de reuniones, llamadas, archivos de grabadoras y transcripciones entran al mismo flujo de revisión.",
        },
        {
          marker: "03",
          title: "Entender",
          text: "El sistema mantiene visible el contexto: proyecto, responsable, urgencia, prioridad y pregunta abierta.",
        },
        {
          marker: "04",
          title: "Organizar",
          text: "Las entradas se convierten en proyectos, tareas, decisiones, recordatorios, comentarios o ruido archivado.",
        },
        {
          marker: "05",
          title: "Ejecutar",
          text: "La siguiente acción útil se muestra para avanzar sin repensar todo.",
        },
        {
          marker: "06",
          title: "Revisar",
          text: "La revisión diaria y semanal mantiene prioridades, riesgos y decisiones alineados.",
        },
      ],
      cards: [
        {
          title: "Sin sensación de lista vacía",
          text: "La interfaz debe guiar la acción, no convertirse en otra lista estática de tareas.",
        },
        {
          title: "Preparado para voz",
          text: "Los flujos de voz están preparados, pero los servicios speech siguen desconectados hasta aprobación.",
        },
        {
          title: "Preparado para conversaciones",
          text: "Uploads de reuniones, llamadas y grabadoras podrán convertirse en resúmenes, decisiones, riesgos y tareas tras aprobación.",
        },
        {
          title: "Preparado para AI, no dependiente",
          text: "La inteligencia futura podrá resumir y sugerir, pero la base actual funciona sin AI externa.",
        },
      ],
      cta: {
        title: "Empieza con una señal real.",
        text: "Captura una idea, añade contexto y conviértela en el siguiente movimiento visible.",
      },
    },
    de: {
      title: "Wie 1inow funktioniert",
      eyebrow: "Operativer Flow",
      subtitle:
        "Ein einfacher Tageszyklus: Signale erfassen, Kontext verstehen, Arbeit organisieren, nächste Aktionen ausführen und Änderungen prüfen.",
      notice:
        "Das Produkt soll vor AI-Anbindung nützlich sein. Intelligenz beginnt mit Struktur, Sichtbarkeit und klaren Entscheidungen.",
      stages: [
        {
          marker: "01",
          title: "Erfassen",
          text: "Voice, Notizen, Aufgaben, Ideen, Projektsignale und Risiken landen in einer Queue.",
        },
        {
          marker: "02",
          title: "Gespräche importieren",
          text: "Meeting-Aufnahmen, Telefonate, Recorder-Dateien und Transkripte kommen in denselben Review-Flow.",
        },
        {
          marker: "03",
          title: "Verstehen",
          text: "Das System hält Kontext sichtbar: Projekt, Owner, Dringlichkeit, Priorität und offene Frage.",
        },
        {
          marker: "04",
          title: "Organisieren",
          text: "Eingaben werden zu Projekten, Aufgaben, Entscheidungen, Erinnerungen, Kommentaren oder Archivrauschen.",
        },
        {
          marker: "05",
          title: "Ausführen",
          text: "Die nächste nützliche Aktion wird sichtbar, damit Arbeit ohne Neudenken weitergeht.",
        },
        {
          marker: "06",
          title: "Review",
          text: "Täglicher und wöchentlicher Review hält Prioritäten, Risiken und Entscheidungen ausgerichtet.",
        },
      ],
      cards: [
        {
          title: "Kein leeres Task-List Gefühl",
          text: "Die Oberfläche soll zur Aktion führen, nicht eine weitere statische Aufgabenliste sein.",
        },
        {
          title: "Voice-ready",
          text: "Voice-Flows sind vorbereitet, Speech-Services bleiben bis zur Freigabe getrennt.",
        },
        {
          title: "Conversation-ready",
          text: "Uploads aus Meetings, Calls und Recordern können nach Freigabe zu Zusammenfassungen, Entscheidungen, Risiken und Aufgaben werden.",
        },
        {
          title: "AI-ready, nicht AI-abhängig",
          text: "Künftige Intelligenz kann zusammenfassen und vorschlagen, aber die Basis funktioniert ohne externe AI.",
        },
      ],
      cta: {
        title: "Beginne mit einem echten Signal.",
        text: "Erfasse einen Gedanken, füge Kontext hinzu und mache daraus den nächsten sichtbaren Schritt.",
      },
    },
  },
  "security-trust": {
    en: {
      title: "Security & Trust",
      eyebrow: "Trust foundation",
      subtitle:
        "1inow should grow as a controlled system: clear permissions, clean environment handling, safe AI boundaries, and explicit integration approvals.",
      notice:
        "This page describes the intended production discipline. It is not a claim that every future control is already implemented.",
      stages: [
        {
          marker: "01",
          title: "No secrets in code",
          text: "Production credentials must stay outside the repository and inside controlled environments.",
        },
        {
          marker: "02",
          title: "Role-based access",
          text: "Founder, admin, manager, member, and viewer permissions should be explicit and auditable.",
        },
        {
          marker: "03",
          title: "AI boundaries",
          text: "AI routes remain stubbed until provider, permissions, audit, and cost rules are approved.",
        },
        {
          marker: "04",
          title: "Audit trail",
          text: "Important user, admin, AI, and integration actions should be recorded for review.",
        },
        {
          marker: "05",
          title: "Integration approval",
          text: "External services require a scoped task, build validation, and production decision.",
        },
      ],
      cards: [
        {
          title: "Current state",
          text: "OpenAI, Gemini, Anthropic, Resend, Stripe, analytics, and monitoring are intentionally not connected yet.",
        },
        {
          title: "Data ownership",
          text: "User-created content should remain owned by the user or organization that created it.",
        },
        {
          title: "Production rule",
          text: "Every major phase must build successfully and be committed separately before moving forward.",
        },
      ],
      cta: {
        title: "Trust is an operating habit.",
        text: "The system should stay useful, visible, and controlled as more capability is added.",
      },
    },
    ru: {
      title: "Безопасность и доверие",
      eyebrow: "Основа доверия",
      subtitle:
        "1inow должен развиваться как контролируемая система: ясные права, чистое окружение, безопасные границы AI и явное approval интеграций.",
      notice:
        "Эта страница описывает production-дисциплину. Это не утверждение, что каждый будущий контроль уже реализован.",
      stages: [
        {
          marker: "01",
          title: "Без секретов в коде",
          text: "Production credentials должны храниться вне репозитория и только в контролируемом окружении.",
        },
        {
          marker: "02",
          title: "Роли и доступ",
          text: "Founder, admin, manager, member и viewer права должны быть явными и аудируемыми.",
        },
        {
          marker: "03",
          title: "Границы AI",
          text: "AI routes остаются заглушками, пока не утверждены provider, permissions, audit и cost rules.",
        },
        {
          marker: "04",
          title: "Audit trail",
          text: "Важные user, admin, AI и integration действия должны записываться для проверки.",
        },
        {
          marker: "05",
          title: "Approval интеграций",
          text: "Внешние сервисы требуют отдельной задачи, build validation и production-решения.",
        },
      ],
      cards: [
        {
          title: "Текущее состояние",
          text: "OpenAI, Gemini, Anthropic, Resend, Stripe, analytics и monitoring намеренно пока не подключены.",
        },
        {
          title: "Владение данными",
          text: "Созданный пользователем контент должен принадлежать пользователю или организации, которая его создала.",
        },
        {
          title: "Production rule",
          text: "Каждая крупная фаза должна успешно собираться и коммититься отдельно.",
        },
      ],
      cta: {
        title: "Доверие - это рабочая привычка.",
        text: "Система должна оставаться полезной, видимой и контролируемой по мере роста возможностей.",
      },
    },
    uk: {
      title: "Безпека і довіра",
      eyebrow: "Основа довіри",
      subtitle:
        "1inow має розвиватися як контрольована система: чіткі права, чисте середовище, безпечні межі AI і явне approval інтеграцій.",
      notice:
        "Ця сторінка описує production-дисципліну. Це не твердження, що кожен майбутній контроль уже реалізований.",
      stages: [
        {
          marker: "01",
          title: "Без секретів у коді",
          text: "Production credentials мають бути поза репозиторієм і лише в контрольованому середовищі.",
        },
        {
          marker: "02",
          title: "Ролі і доступ",
          text: "Founder, admin, manager, member і viewer права мають бути явними й аудованими.",
        },
        {
          marker: "03",
          title: "Межі AI",
          text: "AI routes лишаються заглушками, доки не затверджені provider, permissions, audit і cost rules.",
        },
        {
          marker: "04",
          title: "Audit trail",
          text: "Важливі user, admin, AI та integration дії мають записуватися для перегляду.",
        },
        {
          marker: "05",
          title: "Approval інтеграцій",
          text: "Зовнішні сервіси потребують окремої задачі, build validation і production-рішення.",
        },
      ],
      cards: [
        {
          title: "Поточний стан",
          text: "OpenAI, Gemini, Anthropic, Resend, Stripe, analytics і monitoring навмисно поки не підключені.",
        },
        {
          title: "Володіння даними",
          text: "Створений користувачем контент має належати користувачу або організації, що його створила.",
        },
        {
          title: "Production rule",
          text: "Кожна велика фаза має успішно збиратися і комітитися окремо.",
        },
      ],
      cta: {
        title: "Довіра - це робоча звичка.",
        text: "Система має залишатися корисною, видимою і контрольованою зі зростанням можливостей.",
      },
    },
    es: {
      title: "Seguridad y confianza",
      eyebrow: "Base de confianza",
      subtitle:
        "1inow debe crecer como sistema controlado: permisos claros, entorno limpio, límites seguros de AI y aprobación explícita de integraciones.",
      notice:
        "Esta página describe la disciplina de producción prevista. No afirma que cada control futuro ya esté implementado.",
      stages: [
        {
          marker: "01",
          title: "Sin secretos en código",
          text: "Credenciales de producción deben estar fuera del repositorio y en entornos controlados.",
        },
        {
          marker: "02",
          title: "Acceso por roles",
          text: "Founder, admin, manager, member y viewer deben tener permisos explícitos y auditables.",
        },
        {
          marker: "03",
          title: "Límites AI",
          text: "Las rutas AI siguen como stubs hasta aprobar provider, permisos, auditoría y costes.",
        },
        {
          marker: "04",
          title: "Audit trail",
          text: "Acciones importantes de usuario, admin, AI e integraciones deben registrarse.",
        },
        {
          marker: "05",
          title: "Aprobación de integraciones",
          text: "Servicios externos requieren tarea acotada, validación de build y decisión de producción.",
        },
      ],
      cards: [
        {
          title: "Estado actual",
          text: "OpenAI, Gemini, Anthropic, Resend, Stripe, analytics y monitoring no están conectados intencionalmente.",
        },
        {
          title: "Propiedad de datos",
          text: "El contenido creado debe pertenecer al usuario u organización que lo creó.",
        },
        {
          title: "Regla de producción",
          text: "Cada fase importante debe compilar correctamente y commitearse por separado.",
        },
      ],
      cta: {
        title: "La confianza es un hábito operativo.",
        text: "El sistema debe seguir útil, visible y controlado al añadir más capacidad.",
      },
    },
    de: {
      title: "Security & Trust",
      eyebrow: "Vertrauensbasis",
      subtitle:
        "1inow soll als kontrolliertes System wachsen: klare Rechte, saubere Umgebungen, sichere AI-Grenzen und explizite Integrationsfreigaben.",
      notice:
        "Diese Seite beschreibt die vorgesehene Production-Disziplin. Sie behauptet nicht, dass jede künftige Kontrolle bereits implementiert ist.",
      stages: [
        {
          marker: "01",
          title: "Keine Secrets im Code",
          text: "Production Credentials gehören aus dem Repository heraus in kontrollierte Umgebungen.",
        },
        {
          marker: "02",
          title: "Rollenbasierter Zugriff",
          text: "Founder, admin, manager, member und viewer Rechte sollen explizit und auditierbar sein.",
        },
        {
          marker: "03",
          title: "AI-Grenzen",
          text: "AI-Routen bleiben Stubs, bis Provider, Rechte, Audit und Kostenregeln freigegeben sind.",
        },
        {
          marker: "04",
          title: "Audit Trail",
          text: "Wichtige Nutzer-, Admin-, AI- und Integrationsaktionen sollen protokolliert werden.",
        },
        {
          marker: "05",
          title: "Integrationsfreigabe",
          text: "Externe Services brauchen abgegrenzte Aufgabe, Build-Validierung und Production-Entscheidung.",
        },
      ],
      cards: [
        {
          title: "Aktueller Stand",
          text: "OpenAI, Gemini, Anthropic, Resend, Stripe, Analytics und Monitoring sind bewusst noch nicht verbunden.",
        },
        {
          title: "Dateneigentum",
          text: "Erstellte Inhalte sollten dem Nutzer oder der Organisation gehören, die sie erstellt hat.",
        },
        {
          title: "Production-Regel",
          text: "Jede größere Phase muss erfolgreich bauen und separat committet werden.",
        },
      ],
      cta: {
        title: "Vertrauen ist operative Disziplin.",
        text: "Das System soll nützlich, sichtbar und kontrolliert bleiben, während Fähigkeiten wachsen.",
      },
    },
  },
  roadmap: {
    en: {
      title: "Roadmap",
      eyebrow: "Production path",
      subtitle:
        "A practical development path for turning 1inow into a useful personal command system without adding unnecessary services too early.",
      notice:
        "Roadmap items are planned direction, not a production promise. Each phase should be scoped, built, validated, committed, and reviewed separately.",
      stages: [
        {
          marker: "Now",
          title: "Public foundation",
          text: "Public pages, legal baseline, learning content, project presentation, safe AI stubs.",
        },
        {
          marker: "Next",
          title: "Data model review",
          text: "Supabase usage, auth/profile logic, organizations, roles, permissions, and core tables.",
        },
        {
          marker: "Core",
          title: "Project/task engine",
          text: "Projects, milestones, tasks, subtasks, comments, attachments, activity, and risk signals.",
        },
        {
          marker: "Ops",
          title: "Notifications and admin",
          text: "In-app notifications, admin controls, settings, audit logs, and operational visibility.",
        },
        {
          marker: "Later",
          title: "Approved intelligence",
          text: "AI gateway, model router, voice command execution, permissions, audit, analytics, and monitoring.",
        },
      ],
      cards: [
        {
          title: "Do not over-connect",
          text: "No OpenAI, Gemini, Anthropic, Resend, Stripe, analytics, or monitoring before explicit approval.",
        },
        {
          title: "Buildable main",
          text: "Every phase must leave the main branch buildable and the product usable.",
        },
        {
          title: "Functional before visual expansion",
          text: "Design improvements should support clarity and execution, not distract from core workflows.",
        },
      ],
      cta: {
        title: "Move in useful phases.",
        text: "Each phase should make the product more real without turning it into a heavy service bundle.",
      },
    },
    ru: {
      title: "Roadmap",
      eyebrow: "Путь к production",
      subtitle:
        "Практичный путь развития 1inow в полезную персональную командную систему без раннего подключения лишних сервисов.",
      notice:
        "Roadmap показывает направление, а не production-обещание. Каждая фаза должна быть scoped, built, validated, committed и reviewed отдельно.",
      stages: [
        {
          marker: "Now",
          title: "Публичная база",
          text: "Public pages, legal baseline, learning content, presentation проектов и безопасные AI stubs.",
        },
        {
          marker: "Next",
          title: "Review data model",
          text: "Supabase usage, auth/profile logic, organizations, roles, permissions и core tables.",
        },
        {
          marker: "Core",
          title: "Project/task engine",
          text: "Projects, milestones, tasks, subtasks, comments, attachments, activity и risk signals.",
        },
        {
          marker: "Ops",
          title: "Notifications и admin",
          text: "In-app notifications, admin controls, settings, audit logs и operational visibility.",
        },
        {
          marker: "Later",
          title: "Approved intelligence",
          text: "AI gateway, model router, voice command execution, permissions, audit, analytics и monitoring.",
        },
      ],
      cards: [
        {
          title: "Не подключать лишнее",
          text: "Без OpenAI, Gemini, Anthropic, Resend, Stripe, analytics или monitoring до явного approval.",
        },
        {
          title: "Main должен собираться",
          text: "Каждая фаза должна оставлять main buildable и продукт usable.",
        },
        {
          title: "Функция до расширения визуала",
          text: "Дизайн должен усиливать ясность и исполнение, а не отвлекать от основных workflows.",
        },
      ],
      cta: {
        title: "Двигаться полезными фазами.",
        text: "Каждая фаза должна делать продукт реальнее без превращения в тяжелый набор сервисов.",
      },
    },
    uk: {
      title: "Roadmap",
      eyebrow: "Шлях до production",
      subtitle:
        "Практичний шлях розвитку 1inow у корисну персональну командну систему без раннього підключення зайвих сервісів.",
      notice:
        "Roadmap показує напрям, а не production-обіцянку. Кожна фаза має бути scoped, built, validated, committed і reviewed окремо.",
      stages: [
        {
          marker: "Now",
          title: "Публічна база",
          text: "Public pages, legal baseline, learning content, presentation проєктів і безпечні AI stubs.",
        },
        {
          marker: "Next",
          title: "Review data model",
          text: "Supabase usage, auth/profile logic, organizations, roles, permissions і core tables.",
        },
        {
          marker: "Core",
          title: "Project/task engine",
          text: "Projects, milestones, tasks, subtasks, comments, attachments, activity і risk signals.",
        },
        {
          marker: "Ops",
          title: "Notifications і admin",
          text: "In-app notifications, admin controls, settings, audit logs і operational visibility.",
        },
        {
          marker: "Later",
          title: "Approved intelligence",
          text: "AI gateway, model router, voice command execution, permissions, audit, analytics і monitoring.",
        },
      ],
      cards: [
        {
          title: "Не підключати зайве",
          text: "Без OpenAI, Gemini, Anthropic, Resend, Stripe, analytics або monitoring до явного approval.",
        },
        {
          title: "Main має збиратися",
          text: "Кожна фаза має залишати main buildable і продукт usable.",
        },
        {
          title: "Функція до розширення візуалу",
          text: "Дизайн має підсилювати ясність і виконання, а не відволікати від core workflows.",
        },
      ],
      cta: {
        title: "Рухатися корисними фазами.",
        text: "Кожна фаза має робити продукт реальнішим без перетворення на важкий набір сервісів.",
      },
    },
    es: {
      title: "Roadmap",
      eyebrow: "Camino a producción",
      subtitle:
        "Un camino práctico para convertir 1inow en un sistema personal útil sin conectar servicios innecesarios demasiado pronto.",
      notice:
        "El roadmap muestra dirección, no promesa de producción. Cada fase debe acotarse, construirse, validarse, commitearse y revisarse por separado.",
      stages: [
        {
          marker: "Now",
          title: "Base pública",
          text: "Public pages, legal baseline, learning content, presentación de proyectos y AI stubs seguros.",
        },
        {
          marker: "Next",
          title: "Review data model",
          text: "Supabase usage, auth/profile logic, organizations, roles, permissions y core tables.",
        },
        {
          marker: "Core",
          title: "Project/task engine",
          text: "Projects, milestones, tasks, subtasks, comments, attachments, activity y risk signals.",
        },
        {
          marker: "Ops",
          title: "Notifications y admin",
          text: "In-app notifications, admin controls, settings, audit logs y operational visibility.",
        },
        {
          marker: "Later",
          title: "Approved intelligence",
          text: "AI gateway, model router, voice command execution, permissions, audit, analytics y monitoring.",
        },
      ],
      cards: [
        {
          title: "No conectar de más",
          text: "Sin OpenAI, Gemini, Anthropic, Resend, Stripe, analytics o monitoring antes de aprobación explícita.",
        },
        {
          title: "Main debe compilar",
          text: "Cada fase debe dejar main buildable y el producto usable.",
        },
        {
          title: "Función antes de expansión visual",
          text: "El diseño debe reforzar claridad y ejecución, no distraer de core workflows.",
        },
      ],
      cta: {
        title: "Avanzar por fases útiles.",
        text: "Cada fase debe hacer el producto más real sin convertirlo en un paquete pesado de servicios.",
      },
    },
    de: {
      title: "Roadmap",
      eyebrow: "Weg zur Production",
      subtitle:
        "Ein praktischer Entwicklungsweg, um 1inow zu einem nützlichen persönlichen Command System zu machen, ohne Services zu früh anzubinden.",
      notice:
        "Die Roadmap zeigt Richtung, kein Production-Versprechen. Jede Phase soll separat scoped, gebaut, validiert, committet und reviewed werden.",
      stages: [
        {
          marker: "Now",
          title: "Public Foundation",
          text: "Public pages, legal baseline, learning content, Projektpräsentation und sichere AI stubs.",
        },
        {
          marker: "Next",
          title: "Data model review",
          text: "Supabase usage, auth/profile logic, organizations, roles, permissions und core tables.",
        },
        {
          marker: "Core",
          title: "Project/task engine",
          text: "Projects, milestones, tasks, subtasks, comments, attachments, activity und risk signals.",
        },
        {
          marker: "Ops",
          title: "Notifications und admin",
          text: "In-app notifications, admin controls, settings, audit logs und operational visibility.",
        },
        {
          marker: "Later",
          title: "Approved intelligence",
          text: "AI gateway, model router, voice command execution, permissions, audit, analytics und monitoring.",
        },
      ],
      cards: [
        {
          title: "Nicht überverbinden",
          text: "Kein OpenAI, Gemini, Anthropic, Resend, Stripe, Analytics oder Monitoring vor expliziter Freigabe.",
        },
        {
          title: "Main muss buildbar bleiben",
          text: "Jede Phase muss main buildable und das Produkt nutzbar lassen.",
        },
        {
          title: "Funktion vor visueller Expansion",
          text: "Design soll Klarheit und Ausführung stärken, nicht von Core Workflows ablenken.",
        },
      ],
      cta: {
        title: "In nützlichen Phasen bewegen.",
        text: "Jede Phase soll das Produkt realer machen, ohne es in ein schweres Service-Bundle zu verwandeln.",
      },
    },
  },
};

export function getPublicInfoPage(kind: PublicInfoKind, lang?: string) {
  const normalized = lang === "ru" || lang === "uk" || lang === "es" || lang === "de" ? lang : "en";
  return publicInfoPages[kind][normalized];
}
