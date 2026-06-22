import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Inbox,
  Layers3,
  Mic,
  Radar,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandWordmark } from "@/components/icons/compass-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1inow - Personal Command Center" },
      {
        name: "description",
        content:
          "1inow turns scattered projects, tasks, voice notes, decisions, and daily signals into one practical command center.",
      },
      { property: "og:title", content: "1inow - Personal Command Center" },
      {
        property: "og:description",
        content:
          "A practical command center for projects, tasks, voice capture, decisions, and daily execution.",
      },
      { property: "og:url", content: "https://1inow.com/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://1inow.com/icons/icon-512.png" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "1inow - Personal Command Center" },
      {
        name: "twitter:description",
        content: "Projects, tasks, voice capture, decisions, and daily execution in one workspace.",
      },
    ],
    links: [{ rel: "canonical", href: "https://1inow.com/" }],
  }),
  component: LandingPage,
});

const landingCopy = {
  en: {
    navPrinciples: "Principles",
    signIn: "Sign in",
    eyebrow: "Intelligent command center for work and life",
    title: "1inow brings projects, life tasks, voice notes, and decisions into one living system.",
    subtitle:
      "Capture ideas fast, see what matters now, turn scattered signals into clear next actions, and keep momentum without building another heavy task calculator.",
    openWorkspace: "Open workspace",
    seePrinciples: "See principles",
    heroLabel: "Today operating picture",
    live: "live",
    previewTitle: "Personal command flow",
    previewSubtitle: "Voice, projects, tasks, risks, decisions",
    insightTitle: "Intelligence layer",
    insightText:
      "The assistant is prepared to guide the workflow, while external AI stays disabled until production approval.",
    proofTitle: "Built to feel obvious",
    proofText:
      "Every screen should answer three questions: what is happening, what matters, and what should happen next.",
    ctaTitle: "Start with one clear workspace.",
    ctaText:
      "Use 1inow as the center for projects, personal plans, communication, notes, and future AI support.",
    continue: "Continue to app",
    signals: ["Capture by voice", "Review the queue", "Create the next action", "Track risks"],
    metrics: [
      ["Voice captures", "5"],
      ["Open tasks", "14"],
      ["Active projects", "8"],
    ],
    visuals: [
      ["Capture", "Voice thoughts become usable signals."],
      ["Organize", "Projects, tasks, and priorities stay visible."],
      ["Move", "The next useful action is always close."],
    ],
    modules: [
      [
        "Voice first",
        "Capture a thought before it disappears. Process it later into a task, note, reminder, or project signal.",
      ],
      [
        "Project clarity",
        "See active initiatives, owners, milestones, risks, and the next useful move in one place.",
      ],
      [
        "Daily focus",
        "Separate urgent noise from real priorities and keep the day oriented around execution.",
      ],
      [
        "Controlled intelligence",
        "Prepare AI, automation, and voice workflows without connecting paid services too early.",
      ],
    ],
  },
  ru: {
    navPrinciples: "Принципы",
    signIn: "Войти",
    eyebrow: "Умный центр управления работой и жизнью",
    title: "1inow собирает проекты, личные задачи, голосовые мысли и решения в одну живую систему.",
    subtitle:
      "Быстро фиксируйте идеи, видьте главное сейчас, превращайте разрозненные сигналы в ясные действия и держите темп без очередного тяжелого калькулятора задач.",
    openWorkspace: "Открыть систему",
    seePrinciples: "Смотреть принципы",
    heroLabel: "Картина дня",
    live: "live",
    previewTitle: "Персональный поток управления",
    previewSubtitle: "Голос, проекты, задачи, риски, решения",
    insightTitle: "Интеллектуальный слой",
    insightText:
      "Помощник подготовлен для сопровождения процессов, но внешние AI-сервисы отключены до отдельного production-решения.",
    proofTitle: "Система должна быть очевидной",
    proofText:
      "Каждый экран должен отвечать на три вопроса: что происходит, что важно и какое следующее действие.",
    ctaTitle: "Начните с одного понятного пространства.",
    ctaText:
      "Используйте 1inow как центр проектов, личных планов, коммуникаций, заметок и будущей AI-поддержки.",
    continue: "Перейти в приложение",
    signals: ["Записать голосом", "Разобрать входящие", "Создать действие", "Увидеть риски"],
    metrics: [
      ["Голосовые записи", "5"],
      ["Открытые задачи", "14"],
      ["Активные проекты", "8"],
    ],
    visuals: [
      ["Фиксируйте", "Голосовые мысли становятся полезными сигналами."],
      ["Организуйте", "Проекты, задачи и приоритеты остаются на виду."],
      ["Двигайтесь", "Следующее полезное действие всегда рядом."],
    ],
    modules: [
      [
        "Сначала голос",
        "Зафиксируйте мысль до того, как она исчезнет. Потом превратите ее в задачу, заметку, напоминание или сигнал проекта.",
      ],
      [
        "Ясность проектов",
        "Видьте активные инициативы, ответственных, этапы, риски и ближайший полезный шаг в одном месте.",
      ],
      [
        "Фокус дня",
        "Отделяйте срочный шум от настоящих приоритетов и держите день вокруг исполнения.",
      ],
      [
        "Контролируемый интеллект",
        "Готовьте AI, автоматизацию и голосовые сценарии без раннего подключения платных сервисов.",
      ],
    ],
  },
  uk: {
    navPrinciples: "Принципи",
    signIn: "Увійти",
    eyebrow: "Розумний центр керування роботою і життям",
    title: "1inow збирає проєкти, особисті задачі, голосові думки і рішення в одну живу систему.",
    subtitle:
      "Швидко фіксуйте ідеї, бачте головне зараз, перетворюйте розрізнені сигнали на чіткі дії і тримайте темп без ще одного важкого списку задач.",
    openWorkspace: "Відкрити систему",
    seePrinciples: "Дивитися принципи",
    heroLabel: "Картина дня",
    live: "live",
    previewTitle: "Персональний потік керування",
    previewSubtitle: "Голос, проєкти, задачі, ризики, рішення",
    insightTitle: "Інтелектуальний шар",
    insightText:
      "Помічник підготовлений для супроводу процесів, але зовнішні AI-сервіси вимкнені до окремого production-рішення.",
    proofTitle: "Система має бути очевидною",
    proofText:
      "Кожен екран має відповідати на три питання: що відбувається, що важливо і яка наступна дія.",
    ctaTitle: "Почніть з одного зрозумілого простору.",
    ctaText:
      "Використовуйте 1inow як центр проєктів, особистих планів, комунікацій, нотаток і майбутньої AI-підтримки.",
    continue: "Перейти в застосунок",
    signals: ["Записати голосом", "Розібрати вхідні", "Створити дію", "Побачити ризики"],
    metrics: [
      ["Голосові записи", "5"],
      ["Відкриті задачі", "14"],
      ["Активні проєкти", "8"],
    ],
    visuals: [
      ["Фіксуйте", "Голосові думки стають корисними сигналами."],
      ["Організуйте", "Проєкти, задачі і пріоритети залишаються видимими."],
      ["Рухайтесь", "Наступна корисна дія завжди поруч."],
    ],
    modules: [
      [
        "Спочатку голос",
        "Зафіксуйте думку до того, як вона зникне. Потім перетворіть її на задачу, нотатку, нагадування або сигнал проєкту.",
      ],
      [
        "Ясність проєктів",
        "Бачте активні ініціативи, відповідальних, етапи, ризики і найближчий корисний крок в одному місці.",
      ],
      [
        "Фокус дня",
        "Відділяйте терміновий шум від справжніх пріоритетів і тримайте день навколо виконання.",
      ],
      [
        "Контрольований інтелект",
        "Готуйте AI, автоматизацію і голосові сценарії без раннього підключення платних сервісів.",
      ],
    ],
  },
  es: {
    navPrinciples: "Principios",
    signIn: "Entrar",
    eyebrow: "Centro inteligente para trabajo y vida",
    title:
      "1inow reúne proyectos, tareas personales, notas de voz y decisiones en un sistema vivo.",
    subtitle:
      "Captura ideas rápido, mira lo importante ahora, convierte señales dispersas en acciones claras y mantén el impulso sin otro gestor pesado de tareas.",
    openWorkspace: "Abrir espacio",
    seePrinciples: "Ver principios",
    heroLabel: "Vista operativa de hoy",
    live: "live",
    previewTitle: "Flujo personal de mando",
    previewSubtitle: "Voz, proyectos, tareas, riesgos, decisiones",
    insightTitle: "Capa de inteligencia",
    insightText:
      "El asistente está preparado para guiar el flujo, pero los servicios externos de IA siguen desactivados hasta aprobación de producción.",
    proofTitle: "Diseñado para ser evidente",
    proofText:
      "Cada pantalla debe responder: qué ocurre, qué importa y cuál es la siguiente acción.",
    ctaTitle: "Empieza con un espacio claro.",
    ctaText:
      "Usa 1inow como centro de proyectos, planes personales, comunicación, notas y futura ayuda con IA.",
    continue: "Continuar a la app",
    signals: ["Capturar por voz", "Revisar bandeja", "Crear acción", "Seguir riesgos"],
    metrics: [
      ["Capturas de voz", "5"],
      ["Tareas abiertas", "14"],
      ["Proyectos activos", "8"],
    ],
    visuals: [
      ["Captura", "Las ideas de voz se convierten en señales útiles."],
      ["Organiza", "Proyectos, tareas y prioridades siguen visibles."],
      ["Avanza", "La siguiente acción útil siempre está cerca."],
    ],
    modules: [
      [
        "Voz primero",
        "Captura una idea antes de perderla. Luego conviértela en tarea, nota, recordatorio o señal de proyecto.",
      ],
      [
        "Claridad de proyectos",
        "Ve iniciativas activas, responsables, hitos, riesgos y el siguiente paso útil en un solo lugar.",
      ],
      [
        "Foco diario",
        "Separa el ruido urgente de las prioridades reales y orienta el día hacia la ejecución.",
      ],
      [
        "Inteligencia controlada",
        "Prepara IA, automatización y voz sin conectar servicios pagos demasiado pronto.",
      ],
    ],
  },
  de: {
    navPrinciples: "Prinzipien",
    signIn: "Anmelden",
    eyebrow: "Intelligente Steuerzentrale fur Arbeit und Leben",
    title:
      "1inow bringt Projekte, private Aufgaben, Sprachnotizen und Entscheidungen in ein lebendiges System.",
    subtitle:
      "Erfasse Ideen schnell, erkenne was jetzt wichtig ist, verwandle verstreute Signale in klare nachste Schritte und halte Tempo ohne ein weiteres schweres Aufgabenwerkzeug.",
    openWorkspace: "Workspace offnen",
    seePrinciples: "Prinzipien ansehen",
    heroLabel: "Heutiges Lagebild",
    live: "live",
    previewTitle: "Personlicher Command Flow",
    previewSubtitle: "Sprache, Projekte, Aufgaben, Risiken, Entscheidungen",
    insightTitle: "Intelligenzschicht",
    insightText:
      "Der Assistent ist fur Prozessfuhrung vorbereitet, externe KI-Dienste bleiben aber bis zur Produktionsfreigabe deaktiviert.",
    proofTitle: "Gebaut, damit es klar wirkt",
    proofText:
      "Jeder Screen soll drei Fragen beantworten: was passiert, was ist wichtig und was ist der nachste Schritt.",
    ctaTitle: "Beginne mit einem klaren Workspace.",
    ctaText:
      "Nutze 1inow als Zentrum fur Projekte, personliche Plane, Kommunikation, Notizen und kunftige KI-Unterstutzung.",
    continue: "Zur App",
    signals: ["Per Sprache erfassen", "Inbox prufen", "Aktion erstellen", "Risiken sehen"],
    metrics: [
      ["Sprachnotizen", "5"],
      ["Offene Aufgaben", "14"],
      ["Aktive Projekte", "8"],
    ],
    visuals: [
      ["Erfassen", "Sprachgedanken werden zu nutzbaren Signalen."],
      ["Ordnen", "Projekte, Aufgaben und Prioritaten bleiben sichtbar."],
      ["Bewegen", "Der nachste nutzliche Schritt bleibt nah."],
    ],
    modules: [
      [
        "Sprache zuerst",
        "Erfasse einen Gedanken, bevor er verschwindet. Spater wird daraus Aufgabe, Notiz, Erinnerung oder Projektsignal.",
      ],
      [
        "Projektklarheit",
        "Sieh Initiativen, Verantwortliche, Meilensteine, Risiken und den nachsten nutzlichen Schritt an einem Ort.",
      ],
      [
        "Tagesfokus",
        "Trenne dringenden Larm von echten Prioritaten und richte den Tag auf Umsetzung aus.",
      ],
      [
        "Kontrollierte Intelligenz",
        "Bereite KI, Automatisierung und Sprache vor, ohne kostenpflichtige Dienste zu fruh zu verbinden.",
      ],
    ],
  },
};

const moduleIcons = [Mic, FolderKanban, CalendarCheck2, ShieldCheck];

function LandingPage() {
  const { lang } = useI18n();
  const c = landingCopy[lang as keyof typeof landingCopy] ?? landingCopy.en;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf8] text-slate-950 dark:bg-[#061014] dark:text-white">
      <section className="relative min-h-[92vh] bg-[linear-gradient(135deg,#f7faf8_0%,#e8fff6_32%,#eaf4ff_64%,#fff7e7_100%)] dark:bg-[linear-gradient(135deg,#061014_0%,#0d2830_38%,#10203b_72%,#211a0f_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.28),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_68%_78%,rgba(245,158,11,0.2),transparent_34%)]" />
        <div className="pointer-events-none absolute left-[6%] top-28 hidden rotate-[-7deg] rounded-[2rem] border border-white/60 bg-white/45 p-3 shadow-2xl shadow-teal-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] lg:block">
          <img src="/icons/icon-512.png" alt="" className="size-24 rounded-[1.45rem]" />
        </div>
        <div className="pointer-events-none absolute right-[7%] top-28 hidden rotate-[8deg] rounded-[2rem] border border-white/60 bg-white/42 p-3 shadow-2xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] xl:block">
          <img src="/icons/icon-1024.png" alt="" className="size-28 rounded-[1.55rem]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#f7faf8] dark:to-[#061014]" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex flex-col leading-none">
              <BrandWordmark size={34} />
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/55">
                command system
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="sm:hidden">
              <LanguageSwitcher compact />
            </div>
            <ThemeToggle className="rounded-xl bg-white/55 shadow-sm ring-1 ring-slate-900/5 backdrop-blur dark:bg-white/8 dark:ring-white/10" />
            <Link
              to="/principles/strategic-vs-tactical"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-white/68 dark:hover:text-white md:inline-flex"
            >
              {c.navPrinciples}
            </Link>
            <Link
              to="/auth"
              className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 sm:px-4"
            >
              {c.signIn}
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/62 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8 dark:text-white/70">
              <span className="size-2 rounded-full bg-teal-500 shadow-[0_0_18px_rgba(20,184,166,0.75)]" />
              {c.eyebrow}
            </div>
            <h1 className="max-w-5xl text-4xl font-semibold leading-[1.03] tracking-tight text-slate-950 dark:text-white md:text-5xl lg:text-6xl">
              {c.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 dark:text-white/70 md:text-xl">
              {c.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl shadow-slate-950/15 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                {c.openWorkspace}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/principles/strategic-vs-tactical"
                className="inline-flex h-12 items-center rounded-2xl border border-slate-900/10 bg-white/60 px-5 text-sm font-semibold text-slate-800 backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/12"
              >
                {c.seePrinciples}
              </Link>
            </div>
          </div>

          <HeroDashboard copy={c} />
        </div>
      </section>

      <section className="relative bg-[#f7faf8] px-5 pb-8 dark:bg-[#061014] md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-3">
          {c.visuals.map(([title, text], index) => (
            <div
              key={title}
              className="overflow-hidden rounded-3xl border border-slate-900/8 bg-white/72 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.055]"
            >
              <div className="relative h-36 bg-gradient-to-br from-teal-400/18 via-blue-400/12 to-amber-300/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_74%_68%,rgba(20,184,166,0.24),transparent_34%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_74%_68%,rgba(20,184,166,0.22),transparent_34%)]" />
                <img
                  src={
                    ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-1024.png"][index]
                  }
                  alt=""
                  className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-[1.35rem] shadow-2xl"
                />
              </div>
              <div className="p-5">
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/62">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative bg-[#f7faf8] px-5 pb-20 pt-2 dark:bg-[#061014] md:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 md:grid-cols-4">
          {c.modules.map(([title, text], index) => {
            const Icon = moduleIcons[index] ?? Sparkles;
            return (
              <article
                key={title}
                className="group rounded-2xl border border-slate-900/8 bg-white/72 p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/5 dark:border-white/10 dark:bg-white/[0.055] dark:hover:bg-white/[0.08]"
              >
                <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500/16 via-blue-500/12 to-amber-400/16 text-teal-700 dark:text-teal-200">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/62">{text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f7faf8_0%,#edf7f4_100%)] px-5 pb-20 dark:bg-[linear-gradient(180deg,#061014_0%,#0b171b_100%)] md:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-slate-900/8 bg-white/72 p-6 shadow-2xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-white/[0.06] md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-200">
              <Sparkles className="size-3.5" />
              {c.proofTitle}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">
              {c.ctaTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/64 md:text-base">
              {c.ctaText}
            </p>
          </div>
          <Link
            to="/auth"
            className="inline-flex h-12 w-fit items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl shadow-slate-950/15 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
          >
            {c.continue}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-900/8 bg-[#edf7f4] px-5 py-5 text-xs text-slate-500 dark:border-white/10 dark:bg-[#0b171b] dark:text-white/48 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Copyright © {new Date().getFullYear()} 1inow Inc. All rights reserved.</span>
          <span>1inow.com</span>
        </div>
      </footer>
    </main>
  );
}

function HeroDashboard({ copy: c }: { copy: (typeof landingCopy)["en"] }) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-teal-500/20 via-blue-500/14 to-amber-400/18 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-2xl shadow-slate-950/12 backdrop-blur-xl dark:border-white/12 dark:bg-slate-950/48 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-900/8 pb-4 dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/icons/icon-192.png" alt="" className="size-11 rounded-2xl shadow-lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                {c.previewTitle}
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-white/50">
                {c.previewSubtitle}
              </div>
            </div>
          </div>
          <span className="rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-200">
            {c.live}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-900/8 bg-slate-950 p-4 text-white shadow-xl dark:border-white/10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {c.heroLabel}
                  </div>
                  <div className="mt-1 text-lg font-semibold">1inow</div>
                </div>
                <Radar className="size-5 text-teal-300" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["bg-teal-400", "bg-blue-400", "bg-amber-300", "bg-rose-300"].map((color, i) => (
                  <div key={color} className="rounded-2xl bg-white/8 p-2">
                    <div className={`mb-6 size-2 rounded-full ${color}`} />
                    <div className="h-1.5 rounded-full bg-white/30" />
                    <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-white/12" />
                    <div className="mt-3 text-lg font-semibold">{i + 2}</div>
                  </div>
                ))}
              </div>
            </div>

            {c.signals.map((signal, index) => (
              <div
                key={signal}
                className="flex items-center gap-3 rounded-2xl border border-slate-900/8 bg-white/78 p-3 dark:border-white/10 dark:bg-white/[0.055]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-teal-500/18 to-blue-500/14 text-xs font-semibold text-teal-700 dark:text-teal-200">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-white/78">
                  {signal}
                </span>
                <CheckCircle2 className="size-4 shrink-0 text-teal-500" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-900/8 bg-white/78 p-4 dark:border-white/10 dark:bg-white/[0.055]">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                <Workflow className="size-4 text-blue-500" />
                {c.insightTitle}
              </div>
              <p className="text-xs leading-5 text-slate-600 dark:text-white/58">{c.insightText}</p>
              <div className="mt-4 space-y-2">
                {c.metrics.map(([label, value]) => (
                  <Metric key={label} label={label} value={value} />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-900/8 bg-gradient-to-br from-amber-300/24 via-white/72 to-teal-300/18 p-4 dark:border-white/10 dark:from-amber-300/12 dark:via-white/[0.055] dark:to-teal-300/10">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                <Layers3 className="size-4 text-amber-600 dark:text-amber-300" />
                {c.proofTitle}
              </div>
              <p className="text-xs leading-5 text-slate-600 dark:text-white/62">{c.proofText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-900/8 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.055]">
      <span className="inline-flex min-w-0 items-center gap-2 text-xs text-slate-600 dark:text-white/58">
        <Clock3 className="size-3.5 shrink-0 text-teal-500" />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-semibold text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}
