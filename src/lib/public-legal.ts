type LegalSection = { h: string; p: string };
export type LegalPack = {
  title: string;
  subtitle: string;
  eyebrow: string;
  updated: string;
  notice: string;
  sections: LegalSection[];
};

type LegalLang = "en" | "ru" | "uk" | "es" | "de";
type LegalKind = "privacy" | "terms";

const publicLegalContent: Record<LegalKind, Record<LegalLang, LegalPack>> = {
  privacy: {
    en: {
      title: "Privacy Policy",
      subtitle: "How 1inow handles data during the current product development phase.",
      eyebrow: "Privacy",
      updated: "Last updated: June 2026",
      notice:
        "1inow is in active development. External AI, payment, analytics, and email production services are not connected yet unless explicitly approved later.",
      sections: [
        {
          h: "1. Data we expect to process",
          p: "The product is designed to work with account profile data, projects, tasks, notes, files, comments, communication metadata, settings, audit logs, and user preferences.",
        },
        {
          h: "2. Current AI status",
          p: "AI chat, speech-to-text, text-to-speech, and automated AI actions are currently stubbed. No production AI provider is connected from these public pages.",
        },
        {
          h: "3. How data should be used",
          p: "Data should be used to operate the workspace, preserve context, improve daily execution, secure access, and support approved assistant workflows only after explicit approval.",
        },
        {
          h: "4. Secrets and credentials",
          p: "Production secrets must never be committed to the repository. Environment variables must stay scoped to the services actually used by the application.",
        },
        {
          h: "5. External integrations",
          p: "OpenAI, Anthropic, Gemini, Resend, Stripe, analytics, monitoring, and other services require separate approval, implementation, and privacy review before activation.",
        },
        {
          h: "6. User rights",
          p: "The production system should support access, correction, export, deletion, and clear support contact paths for user data.",
        },
        {
          h: "7. Contact",
          p: "For privacy questions during the current development phase, contact dnainform@gmail.com.",
        },
      ],
    },
    ru: {
      title: "Политика конфиденциальности",
      subtitle: "Как 1inow должен работать с данными на текущей фазе разработки продукта.",
      eyebrow: "Приватность",
      updated: "Обновлено: июнь 2026",
      notice:
        "1inow находится в активной разработке. Внешний AI, платежи, аналитика и production email-сервисы пока не подключены без отдельного утверждения.",
      sections: [
        {
          h: "1. Какие данные ожидаются",
          p: "Система проектируется для профиля пользователя, проектов, задач, заметок, файлов, комментариев, коммуникационной метаинформации, настроек, audit logs и предпочтений.",
        },
        {
          h: "2. Текущий статус AI",
          p: "AI-чат, speech-to-text, text-to-speech и автоматические AI-действия сейчас являются безопасными заглушками. Production AI-провайдеры не подключены.",
        },
        {
          h: "3. Как должны использоваться данные",
          p: "Данные нужны для работы workspace, сохранения контекста, улучшения ежедневного исполнения, защиты доступа и будущих сценариев помощника после отдельного approval.",
        },
        {
          h: "4. Секреты и доступы",
          p: "Production secrets нельзя хранить в репозитории. Environment variables должны относиться только к реально используемым сервисам.",
        },
        {
          h: "5. Будущие интеграции",
          p: "OpenAI, Anthropic, Gemini, Resend, Stripe, analytics, monitoring и другие сервисы требуют отдельного утверждения, реализации и privacy review.",
        },
        {
          h: "6. Права пользователя",
          p: "Production-система должна поддерживать доступ, исправление, экспорт, удаление и понятные каналы поддержки по данным пользователя.",
        },
        {
          h: "7. Контакт",
          p: "По вопросам приватности на текущей фазе разработки: dnainform@gmail.com.",
        },
      ],
    },
    uk: {
      title: "Політика конфіденційності",
      subtitle: "Як 1inow має працювати з даними на поточній фазі розробки.",
      eyebrow: "Приватність",
      updated: "Оновлено: червень 2026",
      notice:
        "1inow перебуває в активній розробці. Зовнішній AI, платежі, аналітика та production email-сервіси поки не підключені без окремого approval.",
      sections: [
        {
          h: "1. Які дані очікуються",
          p: "Система проєктується для профілю користувача, проєктів, задач, нотаток, файлів, коментарів, метаданих комунікацій, налаштувань, audit logs і вподобань.",
        },
        {
          h: "2. Поточний статус AI",
          p: "AI-чат, speech-to-text, text-to-speech і автоматичні AI-дії зараз є безпечними заглушками. Production AI-провайдери не підключені.",
        },
        {
          h: "3. Як мають використовуватися дані",
          p: "Дані потрібні для роботи workspace, збереження контексту, покращення щоденного виконання, захисту доступу і майбутніх сценаріїв помічника після approval.",
        },
        {
          h: "4. Секрети і доступи",
          p: "Production secrets не можна зберігати в репозиторії. Environment variables мають стосуватися лише реально використаних сервісів.",
        },
        {
          h: "5. Майбутні інтеграції",
          p: "OpenAI, Anthropic, Gemini, Resend, Stripe, analytics, monitoring та інші сервіси потребують окремого approval, реалізації і privacy review.",
        },
        {
          h: "6. Права користувача",
          p: "Production-система має підтримувати доступ, виправлення, експорт, видалення і зрозумілі канали підтримки щодо даних.",
        },
        {
          h: "7. Контакт",
          p: "Питання приватності на поточній фазі розробки: dnainform@gmail.com.",
        },
      ],
    },
    es: {
      title: "Política de privacidad",
      subtitle: "Cómo 1inow debe manejar los datos durante la fase actual de desarrollo.",
      eyebrow: "Privacidad",
      updated: "Actualizado: junio de 2026",
      notice:
        "1inow está en desarrollo activo. AI externa, pagos, analítica y servicios de email de producción aún no están conectados sin aprobación explícita.",
      sections: [
        {
          h: "1. Datos previstos",
          p: "El producto está diseñado para perfiles, proyectos, tareas, notas, archivos, comentarios, metadatos de comunicación, configuración, audit logs y preferencias.",
        },
        {
          h: "2. Estado actual de AI",
          p: "AI chat, speech-to-text, text-to-speech y acciones automáticas de AI son stubs seguros. No hay proveedor AI de producción conectado.",
        },
        {
          h: "3. Uso de datos",
          p: "Los datos deben operar el workspace, preservar contexto, mejorar la ejecución diaria, proteger acceso y habilitar futuros flujos de asistente tras aprobación.",
        },
        {
          h: "4. Secretos y credenciales",
          p: "Los secretos de producción nunca deben estar en el repositorio. Las variables de entorno deben limitarse a servicios realmente usados.",
        },
        {
          h: "5. Integraciones futuras",
          p: "OpenAI, Anthropic, Gemini, Resend, Stripe, analytics, monitoring y otros servicios requieren aprobación, implementación y revisión de privacidad separadas.",
        },
        {
          h: "6. Derechos del usuario",
          p: "El sistema de producción debe soportar acceso, corrección, exportación, eliminación y canales claros de soporte.",
        },
        {
          h: "7. Contacto",
          p: "Para preguntas de privacidad durante esta fase: dnainform@gmail.com.",
        },
      ],
    },
    de: {
      title: "Datenschutzerklärung",
      subtitle: "Wie 1inow Daten in der aktuellen Produktentwicklungsphase behandeln soll.",
      eyebrow: "Datenschutz",
      updated: "Stand: Juni 2026",
      notice:
        "1inow befindet sich in aktiver Entwicklung. Externe AI, Payments, Analytics und Production-E-Mail-Services sind ohne explizite Freigabe nicht verbunden.",
      sections: [
        {
          h: "1. Erwartete Daten",
          p: "Das Produkt ist für Profile, Projekte, Aufgaben, Notizen, Dateien, Kommentare, Kommunikationsmetadaten, Einstellungen, Audit Logs und Präferenzen ausgelegt.",
        },
        {
          h: "2. Aktueller AI-Status",
          p: "AI Chat, Speech-to-Text, Text-to-Speech und automatische AI-Aktionen sind sichere Stubs. Kein Production-AI-Anbieter ist verbunden.",
        },
        {
          h: "3. Datennutzung",
          p: "Daten sollen den Workspace betreiben, Kontext erhalten, tägliche Ausführung verbessern, Zugriff sichern und künftige Assistant-Flows nach Freigabe ermöglichen.",
        },
        {
          h: "4. Secrets und Zugangsdaten",
          p: "Production Secrets dürfen niemals ins Repository. Environment Variables müssen auf tatsächlich genutzte Services begrenzt bleiben.",
        },
        {
          h: "5. Künftige Integrationen",
          p: "OpenAI, Anthropic, Gemini, Resend, Stripe, Analytics, Monitoring und andere Services benötigen separate Freigabe, Umsetzung und Privacy Review.",
        },
        {
          h: "6. Nutzerrechte",
          p: "Das Production-System sollte Zugriff, Korrektur, Export, Löschung und klare Support-Kontakte unterstützen.",
        },
        {
          h: "7. Kontakt",
          p: "Datenschutzfragen in dieser Entwicklungsphase: dnainform@gmail.com.",
        },
      ],
    },
  },
  terms: {
    en: {
      title: "Terms of Use",
      subtitle: "The public operating terms for the current 1inow development base.",
      eyebrow: "Terms",
      updated: "Effective: June 2026",
      notice:
        "These terms are a practical public baseline for development and pre-production use. Final launch terms should be reviewed before commercial release.",
      sections: [
        {
          h: "1. Acceptance",
          p: "By using 1inow, you agree to use the product lawfully, protect your account, and respect the system boundaries defined for the current development phase.",
        },
        {
          h: "2. Product status",
          p: "1inow is a developing personal command system for projects, tasks, voice capture, decisions, and controlled assistant workflows.",
        },
        {
          h: "3. Accounts and access",
          p: "The production model should separate founder, admin, manager, member, and viewer access. Account credentials and access rights must be handled responsibly.",
        },
        {
          h: "4. User content",
          p: "Users retain rights to the content they create. The system may store and process content only to provide workspace functionality.",
        },
        {
          h: "5. AI outputs",
          p: "AI features are not production-connected yet. Future AI output must be reviewed by users before relying on it for important decisions.",
        },
        {
          h: "6. External services",
          p: "No paid external service should be added without explicit approval, a scoped implementation task, and successful production build validation.",
        },
        {
          h: "7. Availability",
          p: "During development, the product may change. Production availability, support, and SLA terms should be finalized before launch.",
        },
        {
          h: "8. Contact",
          p: "For product or legal questions during the current phase, contact dnainform@gmail.com.",
        },
      ],
    },
    ru: {
      title: "Условия использования",
      subtitle: "Публичные рабочие условия для текущей development-базы 1inow.",
      eyebrow: "Условия",
      updated: "Действуют с: июнь 2026",
      notice:
        "Это практическая публичная база для разработки и pre-production использования. Финальные launch terms должны быть отдельно проверены перед коммерческим запуском.",
      sections: [
        {
          h: "1. Принятие",
          p: "Используя 1inow, вы соглашаетесь действовать законно, защищать аккаунт и уважать границы системы текущей фазы разработки.",
        },
        {
          h: "2. Статус продукта",
          p: "1inow развивается как персональная командная система для проектов, задач, голосового ввода, решений и будущей AI-помощи.",
        },
        {
          h: "3. Аккаунты и доступ",
          p: "Production-модель должна разделять founder, admin, manager, member и viewer доступ. Учетные данные и права нужно обрабатывать ответственно.",
        },
        {
          h: "4. Контент пользователя",
          p: "Пользователь сохраняет права на созданный контент. Система может хранить и обрабатывать его только для функций workspace.",
        },
        {
          h: "5. AI-результаты",
          p: "AI-функции пока не подключены к production. Будущие AI-ответы должны проверяться пользователем перед важными решениями.",
        },
        {
          h: "6. Внешние сервисы",
          p: "Платные внешние сервисы нельзя добавлять без явного approval, отдельной задачи и успешной production build validation.",
        },
        {
          h: "7. Доступность",
          p: "Во время разработки продукт может меняться. Production availability, support и SLA должны быть финализированы до запуска.",
        },
        {
          h: "8. Контакт",
          p: "По продуктовым или legal-вопросам на текущей фазе: dnainform@gmail.com.",
        },
      ],
    },
    uk: {
      title: "Умови використання",
      subtitle: "Публічні робочі умови для поточної development-бази 1inow.",
      eyebrow: "Умови",
      updated: "Чинні з: червень 2026",
      notice:
        "Це практична публічна база для розробки і pre-production використання. Фінальні launch terms слід окремо перевірити перед комерційним запуском.",
      sections: [
        {
          h: "1. Прийняття",
          p: "Користуючись 1inow, ви погоджуєтесь діяти законно, захищати акаунт і поважати межі системи поточної фази.",
        },
        {
          h: "2. Статус продукту",
          p: "1inow розвивається як персональна командна система для проєктів, задач, голосового вводу, рішень і майбутньої AI-допомоги.",
        },
        {
          h: "3. Акаунти і доступ",
          p: "Production-модель має розділяти founder, admin, manager, member і viewer доступ. Облікові дані і права потрібно обробляти відповідально.",
        },
        {
          h: "4. Контент користувача",
          p: "Користувач зберігає права на створений контент. Система може зберігати й обробляти його лише для функцій workspace.",
        },
        {
          h: "5. AI-результати",
          p: "AI-функції поки не підключені до production. Майбутні AI-відповіді мають перевірятися користувачем перед важливими рішеннями.",
        },
        {
          h: "6. Зовнішні сервіси",
          p: "Платні зовнішні сервіси не можна додавати без явного approval, окремої задачі і успішної production build validation.",
        },
        {
          h: "7. Доступність",
          p: "Під час розробки продукт може змінюватися. Production availability, support і SLA треба фіналізувати до запуску.",
        },
        {
          h: "8. Контакт",
          p: "Продуктові або legal-питання на поточній фазі: dnainform@gmail.com.",
        },
      ],
    },
    es: {
      title: "Términos de uso",
      subtitle: "Términos públicos para la base actual de desarrollo de 1inow.",
      eyebrow: "Términos",
      updated: "Vigentes desde: junio de 2026",
      notice:
        "Estos términos son una base pública práctica para desarrollo y pre-producción. Los términos finales deben revisarse antes del lanzamiento comercial.",
      sections: [
        {
          h: "1. Aceptación",
          p: "Al usar 1inow, aceptas usar el producto legalmente, proteger tu cuenta y respetar los límites de la fase actual.",
        },
        {
          h: "2. Estado del producto",
          p: "1inow se desarrolla como sistema personal de mando para proyectos, tareas, voz, decisiones y futura asistencia AI.",
        },
        {
          h: "3. Cuentas y acceso",
          p: "El modelo de producción debe separar accesos founder, admin, manager, member y viewer. Credenciales y permisos deben tratarse responsablemente.",
        },
        {
          h: "4. Contenido del usuario",
          p: "Los usuarios conservan derechos sobre el contenido creado. El sistema puede almacenarlo y procesarlo solo para funciones del workspace.",
        },
        {
          h: "5. Salidas AI",
          p: "Las funciones AI aún no están conectadas a producción. Las futuras respuestas AI deben revisarse antes de decisiones importantes.",
        },
        {
          h: "6. Servicios externos",
          p: "Ningún servicio externo pago debe añadirse sin aprobación explícita, tarea acotada y validación de build de producción.",
        },
        {
          h: "7. Disponibilidad",
          p: "Durante desarrollo, el producto puede cambiar. Availability, support y SLA de producción deben finalizarse antes del lanzamiento.",
        },
        {
          h: "8. Contacto",
          p: "Para preguntas de producto o legales en esta fase: dnainform@gmail.com.",
        },
      ],
    },
    de: {
      title: "Nutzungsbedingungen",
      subtitle: "Öffentliche Arbeitsbedingungen für die aktuelle 1inow-Entwicklungsbasis.",
      eyebrow: "Terms",
      updated: "Gültig ab: Juni 2026",
      notice:
        "Diese Bedingungen sind eine praktische öffentliche Basis für Entwicklung und Pre-Production. Finale Launch Terms sollten vor kommerziellem Start geprüft werden.",
      sections: [
        {
          h: "1. Annahme",
          p: "Durch Nutzung von 1inow stimmst du zu, das Produkt rechtmäßig zu nutzen, dein Konto zu schützen und die Grenzen der aktuellen Phase zu respektieren.",
        },
        {
          h: "2. Produktstatus",
          p: "1inow entwickelt sich als persönliches Command System für Projekte, Aufgaben, Voice Capture, Entscheidungen und künftige AI-Unterstützung.",
        },
        {
          h: "3. Konten und Zugriff",
          p: "Das Production-Modell sollte founder, admin, manager, member und viewer Zugriff trennen. Credentials und Rechte müssen verantwortungsvoll behandelt werden.",
        },
        {
          h: "4. Nutzerinhalte",
          p: "Nutzer behalten Rechte an erstellten Inhalten. Das System darf Inhalte nur zur Bereitstellung von Workspace-Funktionen speichern und verarbeiten.",
        },
        {
          h: "5. AI-Ausgaben",
          p: "AI-Funktionen sind noch nicht production-verbunden. Künftige AI-Ausgaben müssen vor wichtigen Entscheidungen geprüft werden.",
        },
        {
          h: "6. Externe Services",
          p: "Kein bezahlter externer Service ohne explizite Freigabe, abgegrenzte Implementierungsaufgabe und erfolgreichen Production Build.",
        },
        {
          h: "7. Verfügbarkeit",
          p: "Während der Entwicklung kann sich das Produkt ändern. Production Availability, Support und SLA sollten vor Launch finalisiert werden.",
        },
        {
          h: "8. Kontakt",
          p: "Produkt- oder Legal-Fragen in dieser Phase: dnainform@gmail.com.",
        },
      ],
    },
  },
};

export function getPublicLegalContent(kind: LegalKind, lang?: string) {
  const normalized = lang === "ru" || lang === "uk" || lang === "es" || lang === "de" ? lang : "en";
  return publicLegalContent[kind][normalized];
}
