import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionHeader } from "@/components/layout";
import { useI18n } from "@/lib/i18n";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/help/faq")({
  component: FaqPage,
});

type QA = { q: string; a: string };
type Pack = { title: string; subtitle: string; items: QA[] };

const CONTENT: Record<string, Pack> = {
  en: {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers about 1inow — accounts, AI, projects and data.",
    items: [
      {
        q: "What is 1inow?",
        a: "A command workspace for projects, decisions, communications, voice capture, and a Sense layer that reasons over memory and context.",
      },
      {
        q: "Can I upload conversations or recorder files?",
        a: "Yes. Use Devices to select meeting recordings, phone calls, transcripts, and recorder files, then review extracted context before sending it into the workspace.",
      },
      {
        q: "How do I switch language?",
        a: "Open the language switcher in the top bar. Your choice is stored on your profile and applies on every device.",
      },
      {
        q: "Where does 1inow get its answers?",
        a: "From your verified data only — projects, tasks, decisions, memory and rules you taught it. It never invents facts and always shows confidence.",
      },
      {
        q: "How do I invite a colleague?",
        a: "Administrators can send invitations from Administration → Invitations. New users get a magic link by email.",
      },
      {
        q: "Can I export my data?",
        a: "Yes. Use Administration → System to request a full export. Personal exports are available from Settings.",
      },
      {
        q: "Is my data private?",
        a: "Row-level security isolates every workspace. See the Privacy Policy for storage, retention and processing details.",
      },
      {
        q: "How do roles and permissions work?",
        a: "Roles are stored separately from profiles and checked via a security definer function. Admins manage them under Administration → Roles.",
      },
      {
        q: "What is the Thinking Engine?",
        a: "A reasoning layer that traces the why behind each 1inow answer — sources, confidence, and counter-signals you can audit.",
      },
      {
        q: "How does memory work?",
        a: "Memory captures facts, decisions and rules. It is project-scoped, versioned, and only used by 1inow when explicitly relevant.",
      },
      {
        q: "Can I use 1inow offline?",
        a: "Reading recent items works in degraded mode; AI features and live data require an internet connection.",
      },
      {
        q: "Which languages are supported?",
        a: "English, Russian, Ukrainian, Spanish and German across all pages — including FAQ, Legal, AI summaries and notifications.",
      },
      {
        q: "Where do I report a bug or request a feature?",
        a: "Use Help → Learning Center → Feedback, or email support. Each report is linked to your workspace for faster triage.",
      },
      {
        q: "How are decisions tracked?",
        a: "Every approval is a first-class record with rationale, voters, and outcome — searchable from the Decisions page.",
      },
      {
        q: "Is two-factor authentication supported?",
        a: "Yes, via your identity provider. Workspace admins can enforce it under Administration → System.",
      },
    ],
  },
  ru: {
    title: "Часто задаваемые вопросы",
    subtitle: "Короткие ответы о 1inow — аккаунты, ИИ, проекты и данные.",
    items: [
      {
        q: "Что такое 1inow?",
        a: "Рабочее пространство для инвест-команд с ИИ: проекты, решения, коммуникации и память, на которой 1inow рассуждает.",
      },
      {
        q: "Можно загружать разговоры или файлы диктофонов?",
        a: "Да. Откройте Devices и выберите записи встреч, звонки, транскрипты или файлы диктофонов. Сейчас файлы остаются локально, AI/STT обработка намеренно отключена.",
      },
      {
        q: "Как сменить язык?",
        a: "Откройте переключатель языков в верхней панели. Выбор сохраняется в профиле и применяется на всех устройствах.",
      },
      {
        q: "Откуда 1inow берёт ответы?",
        a: "Только из ваших проверенных данных — проекты, задачи, решения, память и правила. Он не выдумывает факты и всегда показывает уверенность.",
      },
      {
        q: "Как пригласить коллегу?",
        a: "Администратор отправляет приглашение в разделе Администрирование → Приглашения. Новый пользователь получит magic-link на e-mail.",
      },
      {
        q: "Можно ли выгрузить мои данные?",
        a: "Да. В разделе Администрирование → Система можно запросить полный экспорт. Личный экспорт доступен в Настройках.",
      },
      {
        q: "Мои данные приватны?",
        a: "Row-level security изолирует каждое пространство. Подробности в Политике конфиденциальности.",
      },
      {
        q: "Как работают роли и права?",
        a: "Роли хранятся отдельно от профилей и проверяются через security definer функцию. Управление — в Администрирование → Роли.",
      },
      {
        q: "Что такое Thinking Engine?",
        a: "Слой рассуждений, который показывает, почему 1inow дал такой ответ: источники, уверенность и контр-сигналы.",
      },
      {
        q: "Как устроена память?",
        a: "Память хранит факты, решения и правила в рамках проекта, версионируется и используется только при явной релевантности.",
      },
      {
        q: "Можно ли работать без интернета?",
        a: "Просмотр недавних элементов работает в облегчённом режиме; ИИ и живые данные требуют подключения.",
      },
      {
        q: "Какие языки поддерживаются?",
        a: "Английский, русский, украинский, испанский и немецкий — на всех страницах, включая FAQ, Legal, AI-сводки и уведомления.",
      },
      {
        q: "Куда сообщать об ошибке или идее?",
        a: "Help → Learning Center → Feedback или e-mail в поддержку. Каждое обращение привязывается к вашему пространству.",
      },
      {
        q: "Как фиксируются решения?",
        a: "Каждое утверждение — отдельная запись с обоснованием, голосовавшими и итогом. Поиск — на странице Decisions.",
      },
      {
        q: "Поддерживается ли двухфакторная аутентификация?",
        a: "Да, через провайдера идентификации. Администратор может сделать её обязательной в Администрирование → Система.",
      },
    ],
  },
  uk: {
    title: "Часті питання",
    subtitle: "Короткі відповіді про 1inow — акаунти, ШІ, проєкти і дані.",
    items: [
      {
        q: "Що таке 1inow?",
        a: "Робочий простір для інвест-команд із ШІ: проєкти, рішення, комунікації та пам'ять, на якій міркує 1inow.",
      },
      {
        q: "Чи можна завантажувати розмови або файли диктофонів?",
        a: "Так. Відкрийте Devices і виберіть записи зустрічей, дзвінки, транскрипти або файли диктофонів. Зараз файли залишаються локально, AI/STT обробка навмисно вимкнена.",
      },
      {
        q: "Як змінити мову?",
        a: "Відкрийте перемикач мов у верхній панелі. Вибір зберігається у профілі та застосовується на всіх пристроях.",
      },
      {
        q: "Звідки 1inow бере відповіді?",
        a: "Лише з перевірених ваших даних — проєкти, задачі, рішення, пам'ять та правила. Він не вигадує факти і завжди показує впевненість.",
      },
      {
        q: "Як запросити колегу?",
        a: "Адміністратор надсилає запрошення з Адміністрування → Запрошення. Новий користувач отримає magic-link на e-mail.",
      },
      {
        q: "Чи можна вивантажити дані?",
        a: "Так. В Адмініструванні → Система можна запросити повний експорт. Особистий експорт доступний у Налаштуваннях.",
      },
      {
        q: "Чи приватні мої дані?",
        a: "Row-level security ізолює кожен простір. Деталі — у Політиці конфіденційності.",
      },
      {
        q: "Як працюють ролі та права?",
        a: "Ролі зберігаються окремо від профілів і перевіряються через security definer функцію. Керування — в Адміністрування → Ролі.",
      },
      {
        q: "Що таке Thinking Engine?",
        a: "Шар міркувань, який показує, чому 1inow дав таку відповідь: джерела, впевненість і контр-сигнали.",
      },
      {
        q: "Як влаштована пам'ять?",
        a: "Пам'ять зберігає факти, рішення та правила в межах проєкту, версіонується і використовується лише за явної релевантності.",
      },
      {
        q: "Чи можна працювати офлайн?",
        a: "Перегляд останніх елементів працює у спрощеному режимі; ШІ та живі дані потребують підключення.",
      },
      {
        q: "Які мови підтримуються?",
        a: "Англійська, російська, українська, іспанська та німецька — на всіх сторінках, включно з FAQ, Legal, AI-зведеннями та сповіщеннями.",
      },
      {
        q: "Куди повідомляти про помилку чи ідею?",
        a: "Help → Learning Center → Feedback або e-mail у підтримку. Кожне звернення прив'язане до вашого простору.",
      },
      {
        q: "Як фіксуються рішення?",
        a: "Кожне затвердження — окремий запис із обґрунтуванням, голосуваннями та підсумком. Пошук — на сторінці Decisions.",
      },
      {
        q: "Чи підтримується двофакторна автентифікація?",
        a: "Так, через провайдера ідентичності. Адміністратор може зробити її обов'язковою в Адміністрування → Система.",
      },
    ],
  },
  es: {
    title: "Preguntas frecuentes",
    subtitle: "Respuestas rápidas sobre 1inow: cuentas, IA, proyectos y datos.",
    items: [
      {
        q: "¿Qué es 1inow?",
        a: "Un espacio de trabajo con IA para equipos de inversión: proyectos, decisiones, comunicaciones y una capa de memoria sobre la que razona 1inow.",
      },
      {
        q: "¿Puedo subir conversaciones o archivos de grabadora?",
        a: "Sí. Usa Devices para seleccionar reuniones, llamadas, transcripciones y archivos de grabadoras. En esta fase los archivos quedan locales y AI/STT está desactivado.",
      },
      {
        q: "¿Cómo cambio de idioma?",
        a: "Usa el selector de idioma de la barra superior. Tu elección queda en tu perfil y se aplica en todos los dispositivos.",
      },
      {
        q: "¿De dónde obtiene 1inow sus respuestas?",
        a: "Solo de tus datos verificados: proyectos, tareas, decisiones, memoria y reglas. Nunca inventa y siempre muestra confianza.",
      },
      {
        q: "¿Cómo invito a un compañero?",
        a: "Los administradores envían invitaciones desde Administración → Invitaciones. El usuario recibirá un enlace mágico por correo.",
      },
      {
        q: "¿Puedo exportar mis datos?",
        a: "Sí. En Administración → Sistema puedes solicitar una exportación completa. El export personal está en Ajustes.",
      },
      {
        q: "¿Mis datos son privados?",
        a: "Row-level security aísla cada espacio. Consulta la Política de Privacidad para más detalles.",
      },
      {
        q: "¿Cómo funcionan los roles y permisos?",
        a: "Los roles se guardan aparte de los perfiles y se verifican con una función security definer. Administración → Roles.",
      },
      {
        q: "¿Qué es el Thinking Engine?",
        a: "Una capa de razonamiento que muestra por qué 1inow dio la respuesta: fuentes, confianza y contraindicios.",
      },
      {
        q: "¿Cómo funciona la memoria?",
        a: "La memoria guarda hechos, decisiones y reglas por proyecto, con versiones, y solo se usa cuando es claramente relevante.",
      },
      {
        q: "¿Funciona sin conexión?",
        a: "La lectura de elementos recientes funciona en modo limitado; la IA y los datos en vivo necesitan internet.",
      },
      {
        q: "¿Qué idiomas se admiten?",
        a: "Inglés, ruso, ucraniano, español y alemán en todas las páginas, incluyendo FAQ, Legal, resúmenes de IA y notificaciones.",
      },
      {
        q: "¿Dónde reporto un error o sugerencia?",
        a: "Help → Learning Center → Feedback o correo a soporte. Cada reporte se asocia a tu espacio.",
      },
      {
        q: "¿Cómo se registran las decisiones?",
        a: "Cada aprobación es un registro con justificación, votantes y resultado, buscable desde Decisiones.",
      },
      {
        q: "¿Se admite autenticación de dos factores?",
        a: "Sí, a través del proveedor de identidad. El administrador puede hacerla obligatoria en Administración → Sistema.",
      },
    ],
  },
  de: {
    title: "Häufige Fragen",
    subtitle: "Kurze Antworten zu 1inow — Konten, KI, Projekte und Daten.",
    items: [
      {
        q: "Was ist 1inow?",
        a: "Ein KI-gestützter Arbeitsbereich für Investmentteams: Projekte, Entscheidungen, Kommunikation und eine Memory-Ebene, auf der 1inow argumentiert.",
      },
      {
        q: "Kann ich Gespräche oder Recorder-Dateien hochladen?",
        a: "Ja. Öffne Devices und wähle Meetings, Calls, Transkripte oder Recorder-Dateien. In dieser Phase bleiben Dateien lokal und AI/STT-Verarbeitung ist deaktiviert.",
      },
      {
        q: "Wie wechsle ich die Sprache?",
        a: "Über den Sprachumschalter in der oberen Leiste. Die Auswahl wird im Profil gespeichert und gilt auf allen Geräten.",
      },
      {
        q: "Woher hat 1inow seine Antworten?",
        a: "Ausschließlich aus deinen verifizierten Daten — Projekte, Aufgaben, Entscheidungen, Memory und Regeln. Es erfindet nichts und zeigt stets eine Konfidenz.",
      },
      {
        q: "Wie lade ich Kollegen ein?",
        a: "Administratoren versenden Einladungen unter Administration → Einladungen. Neue Nutzer erhalten einen Magic-Link per E-Mail.",
      },
      {
        q: "Kann ich meine Daten exportieren?",
        a: "Ja. Unter Administration → System kannst du einen vollständigen Export anfordern. Persönliche Exporte gibt es in den Einstellungen.",
      },
      {
        q: "Sind meine Daten privat?",
        a: "Row-Level-Security isoliert jeden Arbeitsbereich. Details in der Datenschutzerklärung.",
      },
      {
        q: "Wie funktionieren Rollen und Rechte?",
        a: "Rollen werden getrennt von Profilen gespeichert und über eine Security-Definer-Funktion geprüft. Verwaltung unter Administration → Rollen.",
      },
      {
        q: "Was ist die Thinking Engine?",
        a: "Eine Argumentationsebene, die zeigt, warum 1inow eine Antwort gegeben hat — Quellen, Konfidenz und Gegensignale.",
      },
      {
        q: "Wie funktioniert Memory?",
        a: "Memory speichert Fakten, Entscheidungen und Regeln pro Projekt, versioniert und nur bei klarer Relevanz genutzt.",
      },
      {
        q: "Funktioniert 1inow offline?",
        a: "Das Lesen aktueller Elemente funktioniert im Light-Modus; KI und Live-Daten benötigen Internet.",
      },
      {
        q: "Welche Sprachen werden unterstützt?",
        a: "Englisch, Russisch, Ukrainisch, Spanisch und Deutsch auf allen Seiten — inklusive FAQ, Legal, KI-Zusammenfassungen und Benachrichtigungen.",
      },
      {
        q: "Wo melde ich Fehler oder Wünsche?",
        a: "Help → Learning Center → Feedback oder per E-Mail an den Support. Jede Meldung wird mit deinem Workspace verknüpft.",
      },
      {
        q: "Wie werden Entscheidungen erfasst?",
        a: "Jede Freigabe ist ein Datensatz mit Begründung, Stimmen und Ergebnis — durchsuchbar auf der Entscheidungen-Seite.",
      },
      {
        q: "Wird Zwei-Faktor-Authentifizierung unterstützt?",
        a: "Ja, über den Identity Provider. Admins können sie unter Administration → System erzwingen.",
      },
    ],
  },
};

function FaqPage() {
  const { lang } = useI18n();
  const c = CONTENT[lang] ?? CONTENT.en;
  return (
    <PageContainer>
      <SectionHeader title={c.title} description={c.subtitle} />
      <Accordion
        type="single"
        collapsible
        defaultValue="faq-0"
        className="rounded-2xl border border-border bg-card/60 backdrop-blur divide-y divide-border overflow-hidden"
      >
        {c.items.map((it, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-5">
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <span className="size-6 shrink-0 rounded-full bg-accent/10 text-accent grid place-items-center text-[11px] font-semibold">
                  {i + 1}
                </span>
                {it.q}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pl-9">
              {it.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </PageContainer>
  );
}
